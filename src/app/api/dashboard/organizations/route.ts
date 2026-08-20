import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const statusFilter = searchParams.get("status") || null
    const search = searchParams.get("search") || null
    const offset = (page - 1) * limit

    // ── Total orgs from users table ──
    const { count: totalOrgs } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "organization")

    // ── Get all org profile statuses (try with is_suspended, fallback without) ──
    let profiles: any[] = []
    const profilesFull = await supabaseAdmin
      .from("organization_profiles")
      .select("id, is_verified, is_suspended")
    if (profilesFull.error) {
      const profilesFallback = await supabaseAdmin
        .from("organization_profiles")
        .select("id, is_verified")
      profiles = profilesFallback.data || []
    } else {
      profiles = profilesFull.data || []
    }
    const verifiedCount = profiles.filter((p) => p.is_verified === true).length
    const unverifiedCount = profiles.filter((p) => p.is_verified === false && p.is_suspended !== true).length
    const suspendedCount = profiles.filter((p) => p.is_suspended === true).length

    // Orgs WITHOUT a profile row (signed up but not onboarded)
    const orgsWithoutProfile = (totalOrgs || 0) - profiles.length

    const tabCounts: Record<string, number> = {
      "All Organizations": totalOrgs || 0,
      "Verified": verifiedCount,
      "Unverified": unverifiedCount + orgsWithoutProfile,
      "Suspended": suspendedCount,
    }

    // ── Get marketer profiles to check for removed status ──
    const { data: marketerProfiles } = await supabaseAdmin
      .from("marketer_profiles")
      .select("user_id, status")
      .eq("status", "removed")
    const removedMarketerIds = new Set((marketerProfiles || []).map((p: any) => p.user_id))

    // ── Build query on users table (try with is_suspended, fallback without) ──
    const tryOrgQuery = async (profileCols: string) => {
      let q = supabaseAdmin
        .from("users")
        .select(`
          id, full_name, phone, email, state, created_at,
          organization_profiles(${profileCols})
        `)
        .eq("role", "organization")
        .order("created_at", { ascending: false })
      if (statusFilter && statusFilter !== "All Organizations") {
        if (statusFilter === "Verified") {
          q = q.eq("organization_profiles.is_verified", true)
        } else if (statusFilter === "Unverified") {
          q = q.or("organization_profiles.is_verified.eq.false,organization_profiles.is_verified.is.null")
        }
      }
      if (search) {
        q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }
      return q.range(offset, offset + limit - 1)
    }

    let orgs: any[] | null = null
    let queryError: any = null

    const full = await tryOrgQuery("business_name, business_address, contact_person_name, contact_person_phone, business_email, industry, is_verified, is_suspended, logo_url")
    if (full.error) {
      const fallback = await tryOrgQuery("business_name, business_address, contact_person_name, contact_person_phone, business_email, industry, is_verified, logo_url")
      orgs = fallback.data
      queryError = fallback.error
    } else {
      orgs = full.data
    }

    if (queryError) {
      console.error("[Organizations] Query error:", queryError.message)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    // ── Get order counts + total spend for each org ──
    const orgIds = (orgs || []).map((o) => o.id)
    const orderCounts: Record<string, number> = {}
    const totalSpend: Record<string, number> = {}
    if (orgIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("customer_id, final_price, status")
        .in("customer_id", orgIds)
      if (orders) {
        for (const o of orders) {
          orderCounts[o.customer_id] = (orderCounts[o.customer_id] || 0) + 1
          if (o.status === "delivered") {
            totalSpend[o.customer_id] = (totalSpend[o.customer_id] || 0) + (Number(o.final_price) || 0)
          }
        }
      }
    }

    // ── Get driver counts per org ──
    const driverCounts: Record<string, number> = {}
    if (orgIds.length > 0) {
      try {
        const { data: orgDrivers } = await supabaseAdmin
          .from("organization_drivers")
          .select("organization_id")
          .in("organization_id", orgIds)
        if (orgDrivers) {
          for (const d of orgDrivers) {
            driverCounts[d.organization_id] = (driverCounts[d.organization_id] || 0) + 1
          }
        }
      } catch {
        // organization_drivers table may not exist yet
      }
    }

    // ── Get wallet balances from organization_wallets ──
    let totalBalance = 0
    try {
      const { data: allWallets } = await supabaseAdmin
        .from("organization_wallets")
        .select("balance")
        .in("organization_id", orgIds)
      if (allWallets && allWallets.length > 0) {
        totalBalance = allWallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0)
      }
    } catch {
      // organization_wallets table may not exist yet
    }

    const formatted = (orgs || []).map((o) => {
      const profileEmbed = (o as any).organization_profiles
      const profile = Array.isArray(profileEmbed) ? profileEmbed[0] : profileEmbed
      const isVerified = profile?.is_verified === true
      const industry = profile?.industry || "—"
      const businessName = profile?.business_name || o.full_name || "—"
      const contactName = profile?.contact_person_name || "—"
      const contactPhone = profile?.contact_person_phone || o.phone || "—"
      const businessEmail = profile?.business_email || o.email || "—"
      const address = profile?.business_address || "—"
      const city = (o as any).state || "—"
      const logoUrl = profile?.logo_url || null

      let statusLabel = "Pending"
      let statusColor = "bg-warning-light text-warning"
      const isRemovedMarketer = removedMarketerIds.has(o.id)
      if (isRemovedMarketer) { statusLabel = "Removed marketer"; statusColor = "bg-surface-secondary text-text-muted" }
      else if (isVerified && profile?.is_suspended !== true) { statusLabel = "Active"; statusColor = "bg-sendme-50 text-sendme" }
      else if (profile?.is_suspended === true) { statusLabel = "Suspended"; statusColor = "bg-warning-light text-warning" }

      const created = new Date(o.created_at)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      let joinedNote = "Just now"
      if (diffDays > 365) joinedNote = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`
      else if (diffDays > 30) joinedNote = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
      else if (diffDays > 0) joinedNote = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

      const initials = businessName.split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase()

      return {
        id: o.id,
        shortId: o.id.slice(0, 8).toUpperCase(),
        name: businessName,
        initials,
        industry,
        industryColor: "bg-sendme-50 text-sendme",
        city,
        address,
        contactName,
        contactPhone,
        contactEmail: businessEmail,
        contactAvatar: (contactName || "?")[0],
        status: statusLabel,
        statusColor,
        verified: isVerified,
        orders: orderCounts[o.id] || 0,
        totalSpend: totalSpend[o.id] || 0,
        totalSpendFormatted: totalSpend[o.id] ? `₦${totalSpend[o.id].toLocaleString()}` : "—",
        drivers: driverCounts[o.id] || 0,
        joined: created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        joinedNote,
        logoUrl,
      }
    })

    const totalPages = Math.ceil((totalOrgs || 0) / limit)

    return NextResponse.json({
      stats: {
        total: totalOrgs || 0,
        verified: verifiedCount,
        pending: unverifiedCount + orgsWithoutProfile,
        suspended: suspendedCount,
        totalBalance,
        totalBalanceFormatted: `₦${totalBalance.toLocaleString()}`,
      },
      tabCounts,
      organizations: formatted,
      pagination: { page, limit, total: totalOrgs || 0, totalPages },
    })
  } catch (err) {
    console.error("[Organizations] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
