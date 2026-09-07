import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface OrgStorageDoc {
  folder: string
  url: string
  name: string
}

// Folders in the org_documents bucket that hold org verification uploads
const ORG_STORAGE_FOLDERS = ["business_registration", "tax_certificate"]

async function listOrgStorageDocs(orgId: string): Promise<OrgStorageDoc[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return []

    const docs: OrgStorageDoc[] = []
    for (const folder of ORG_STORAGE_FOLDERS) {
      const prefix = `${orgId}/${folder}/`
      const res = await fetch(`${url}/storage/v1/object/list/org_documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ prefix, limit: 100, offset: 0 }),
      })
      if (!res.ok) continue
      const items = (await res.json()) as { name: string }[]
      if (!Array.isArray(items)) continue
      for (const item of items) {
        if (!item.name) continue
        docs.push({
          folder,
          url: `${url}/storage/v1/object/public/org_documents/${prefix}${encodeURIComponent(item.name)}`,
          name: item.name,
        })
      }
    }
    return docs
  } catch (err) {
    console.error("[Org Detail] Storage scan error:", err)
    return []
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try with is_suspended, fallback without
    let org: any = null
    const full = await supabaseAdmin
      .from("users")
      .select(`
        id, full_name, phone, email, state, created_at, is_onboarded,
        organization_profiles(business_name, business_address, business_lat, business_lng, contact_person_name, contact_person_phone, business_email, business_registration_number, tax_id, industry, website, logo_url, is_verified, is_suspended, verification_documents, verification_status, review_reason, city, state)
      `)
      .eq("id", id)
      .single()

    if (full.error) {
      const fallback = await supabaseAdmin
        .from("users")
        .select(`
          id, full_name, phone, email, state, created_at, is_onboarded,
          organization_profiles(business_name, business_address, business_lat, business_lng, contact_person_name, contact_person_phone, business_email, business_registration_number, tax_id, industry, website, logo_url, is_verified, verification_documents, verification_status, review_reason, city, state)
        `)
        .eq("id", id)
        .single()
      org = fallback.data
      if (fallback.error || !org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }
    } else {
      org = full.data
    }

    const profileEmbed = (org as any).organization_profiles
    const profile = Array.isArray(profileEmbed) ? profileEmbed[0] : profileEmbed
    const isVerified = profile?.is_verified === true

    const isHttpUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v)
    const verificationDocs = (profile?.verification_documents && typeof profile.verification_documents === "object" ? profile.verification_documents : {}) as Record<string, unknown>
    const hasSubmittedDocs = Object.values(verificationDocs).some(isHttpUrl)
    const isOnboarded = (org as any)?.is_onboarded === true
    const isIncomplete = !hasSubmittedDocs && !isVerified && (org as any)?.is_suspended !== true && !isOnboarded

    // Order stats
    const [totalResult, completedResult, cancelledResult] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("status", "delivered"),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("status", "canceled"),
    ])

    // Total spend
    const { data: spendData } = await supabaseAdmin
      .from("orders")
      .select("final_price")
      .eq("customer_id", id)
      .eq("status", "delivered")

    const totalSpend = (spendData || []).reduce((sum, o) => sum + (Number(o.final_price) || 0), 0)

    // Wallet balance (organizations use organization_wallets table)
    let wallet = null
    try {
      const { data: w } = await supabaseAdmin
        .from("organization_wallets")
        .select("balance")
        .eq("organization_id", id)
        .single()
      wallet = w
    } catch {
      // organization_wallets table may not exist yet
    }

    // Drivers in this org
    let driverCount = 0
    try {
      const result = await supabaseAdmin
        .from("organization_drivers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", id)
      driverCount = result.count || 0
    } catch {
      // organization_drivers table may not exist yet
    }

    // Recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from("orders")
      .select("id, pickup_address, dropoff_address, final_price, status, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Status
    const verificationStatus = profile?.verification_status || (isVerified ? "verified" : "pending")
    let statusLabel = "Pending Review"
    let statusColor = "bg-warning-light text-warning"
    if (isVerified && profile?.is_suspended !== true) { statusLabel = "Active"; statusColor = "bg-sendme-50 text-sendme" }
    else if (profile?.is_suspended === true) { statusLabel = "Suspended"; statusColor = "bg-warning-light text-warning" }
    else if (verificationStatus === "rejected") { statusLabel = "Rejected"; statusColor = "bg-danger-light text-danger" }
    else if (isIncomplete) { statusLabel = "Incomplete Registration"; statusColor = "bg-surface-secondary text-text-muted" }
    const submissionStatus: "incomplete" | "submitted" = isIncomplete ? "incomplete" : "submitted"

    const created = new Date(org.created_at)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    let memberSince = created.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    let memberDuration = ""
    if (diffDays > 365) memberDuration = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""}`
    else if (diffDays > 30) memberDuration = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""}`
    else memberDuration = `${diffDays} day${diffDays > 1 ? "s" : ""}`

    // Orphaned uploads in storage not referenced from verification_documents
    const storageDocs = await listOrgStorageDocs(id)
    const referenced = new Set<string>()
    for (const v of Object.values(verificationDocs)) {
      if (typeof v === "string" && /^https?:/.test(v)) referenced.add(v)
    }
    const extraStorageDocs = storageDocs.filter((d) => !referenced.has(d.url))

    return NextResponse.json({
      organization: {
        id: org.id,
        shortId: org.id.slice(0, 8).toUpperCase(),
        name: profile?.business_name || org.full_name || "—",
        initials: (profile?.business_name || org.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase(),
        industry: profile?.industry || "—",
        address: profile?.business_address || "—",
        city: profile?.city || (org as any).state || "—",
        state: profile?.state || (org as any).state || "—",
        businessLat: profile?.business_lat ?? null,
        businessLng: profile?.business_lng ?? null,
        contactName: profile?.contact_person_name || "—",
        contactPhone: profile?.contact_person_phone || org.phone || "—",
        contactEmail: profile?.business_email || org.email || "—",
        website: profile?.website || "—",
        registrationNumber: profile?.business_registration_number || "—",
        taxId: profile?.tax_id || "—",
        logoUrl: profile?.logo_url || null,
        status: statusLabel,
        statusColor,
        statusRaw: profile?.is_suspended ? "suspended" : isVerified ? "verified" : verificationStatus,
        submissionStatus,
        reviewReason: profile?.review_reason || null,
        verificationDocuments: profile?.verification_documents || null,
        verificationStatus,
        memberSince,
        memberDuration,
        created_at: org.created_at,
      },
      stats: {
        totalOrders: totalResult.count || 0,
        completedOrders: completedResult.count || 0,
        cancelledOrders: cancelledResult.count || 0,
        totalSpend,
        totalSpendFormatted: totalSpend ? `₦${totalSpend.toLocaleString()}` : "—",
        driverCount: driverCount || 0,
      },
      storageDocs: extraStorageDocs,
      wallet: wallet ? {
        balance: Number(wallet.balance) || 0,
        balanceFormatted: `₦${(Number(wallet.balance) || 0).toLocaleString()}`,
      } : null,
      recentOrders: (recentOrders || []).map((o) => {
        const extractArea = (addr: string) => {
          if (!addr) return "—"
          return addr.split(",").map((p) => p.trim())[0] || addr
        }
        return {
          id: o.id.slice(0, 8).toUpperCase(),
          route: `${extractArea(o.pickup_address)} → ${extractArea(o.dropoff_address)}`,
          date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          fare: o.final_price ? `₦${Number(o.final_price).toLocaleString()}` : "—",
          status: o.status === "delivered" ? "Delivered" : o.status === "canceled" ? "Cancelled" : o.status,
          statusColor: o.status === "delivered" ? "bg-sendme-50 text-sendme" : o.status === "canceled" ? "bg-danger-light text-danger" : "bg-surface-secondary text-text-muted",
        }
      }),
    })
  } catch (err) {
    console.error("[Org Detail] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
