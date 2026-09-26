import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const statusFilter = searchParams.get("status") || null
    const state = searchParams.get("state") || null
    const performance = searchParams.get("performance") || null
    const sortBy = searchParams.get("sort_by") || "newest"
    const offset = (page - 1) * limit

    // ── Total count ──
    const { count: totalMarketers } = await supabaseAdmin
      .from("marketer_profiles")
      .select("id", { count: "exact", head: true })

    // ── Status counts ──
    const [pendingResult, approvedResult, rejectedResult, suspendedResult, removedResult] = await Promise.all([
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "removed"),
    ])

    const tabCounts = {
      pending: pendingResult.count || 0,
      approved: approvedResult.count || 0,
      rejected: rejectedResult.count || 0,
      suspended: suspendedResult.count || 0,
      removed: removedResult.count || 0,
    }

    // ── Build query ──
    let query = supabaseAdmin
      .from("marketer_profiles")
      .select("*, users!inner(id, full_name, email, phone, state, role, created_at)")
      .order("created_at", { ascending: sortBy === "oldest" })

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    if (state) {
      query = query.or(`state.ilike.%${state}%,city.ilike.%${state}%`)
    }

    if (search) {
      query = query.or(`phone.ilike.%${search}%,city.ilike.%${search}%,marketer_id.ilike.%${search}%,users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`)
    }

    const effectiveLimit = (performance || sortBy === "referrals" || sortBy === "earnings") ? 200 : limit
    const effectiveOffset = (performance || sortBy === "referrals" || sortBy === "earnings") ? 0 : offset

    const { data: profiles, error: queryError } = await query.range(effectiveOffset, effectiveOffset + effectiveLimit - 1)

    if (queryError) {
      console.error("[Marketers] Query error:", queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    // ── Get referral/earnings data for each marketer (canonical tables) ──
    const marketerIds = (profiles || []).map((p: any) => p.marketer_id).filter(Boolean)
    const referralCounts: Record<string, number> = {}
    const earningsByRef: Record<string, number> = {}
    const walletByRef: Record<string, number> = {}

    if (marketerIds.length > 0) {
      const { data: mkRows } = await supabaseAdmin
        .from("marketers")
        .select("id, ref_id, total_earnings")
        .in("ref_id", marketerIds)

      const ids = (mkRows || []).map((m: any) => m.id)
      const refById: Record<string, string> = {}
      for (const m of mkRows || []) {
        refById[m.id] = m.ref_id
        earningsByRef[m.ref_id] = Number(m.total_earnings) || 0
      }

      if (ids.length > 0) {
        const [{ data: walletRows }, { data: referralRows }] = await Promise.all([
          supabaseAdmin.from("marketer_wallets").select("marketer_id, balance").in("marketer_id", ids),
          supabaseAdmin.from("referrals").select("marketer_id").in("marketer_id", ids),
        ])

        for (const w of walletRows || []) {
          const refId = refById[w.marketer_id]
          if (refId) walletByRef[refId] = Number(w.balance) || 0
        }
        for (const r of referralRows || []) {
          const refId = refById[r.marketer_id]
          if (refId) referralCounts[refId] = (referralCounts[refId] || 0) + 1
        }
      }
    }

    let formatted = (profiles || []).map((p: any) => {
      const user = p.users
      const created = new Date(p.created_at)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      let joinedNote = "Just now"
      if (diffDays > 365) joinedNote = `${Math.floor(diffDays / 365)}y ago`
      else if (diffDays > 30) joinedNote = `${Math.floor(diffDays / 30)}mo ago`
      else if (diffDays > 0) joinedNote = `${diffDays}d ago`

      const statusColors: Record<string, string> = {
        pending: "bg-warning-light text-warning",
        approved: "bg-sendme-50 text-sendme",
        rejected: "bg-danger-light text-danger",
        suspended: "bg-gray-100 text-gray-600",
        removed: "bg-danger-light text-danger",
      }

      const refs = referralCounts[p.marketer_id] || 0
      const earnings = earningsByRef[p.marketer_id] || walletByRef[p.marketer_id] || 0

      return {
        id: p.user_id,
        name: user?.full_name || "—",
        phone: p.phone || user?.phone || "—",
        email: user?.email || "—",
        role: user?.role || "—",
        state: p.state || user?.state || "—",
        city: p.city || "—",
        occupation: p.occupation || "—",
        marketerId: p.marketer_id || "—",
        status: p.status,
        statusLabel: p.status.charAt(0).toUpperCase() + p.status.slice(1),
        statusColor: statusColors[p.status] || "bg-gray-100 text-gray-600",
        referrals: refs,
        totalEarnings: earnings,
        totalEarningsFormatted: `₦${earnings.toLocaleString()}`,
        joined: created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        joinedNote,
      }
    })

    // Filter by performance
    if (performance === "zero") {
      formatted = formatted.filter((m) => m.referrals === 0)
    } else if (performance === "1-10") {
      formatted = formatted.filter((m) => m.referrals >= 1 && m.referrals <= 10)
    } else if (performance === "10+") {
      formatted = formatted.filter((m) => m.referrals > 10)
    }

    // Sort
    if (sortBy === "referrals") {
      formatted.sort((a, b) => b.referrals - a.referrals)
    } else if (sortBy === "earnings") {
      formatted.sort((a, b) => b.totalEarnings - a.totalEarnings)
    }

    const totalCount = (performance || sortBy === "referrals" || sortBy === "earnings") ? formatted.length : (totalMarketers || 0)
    const finalMarketers = (performance || sortBy === "referrals" || sortBy === "earnings") ? formatted.slice(offset, offset + limit) : formatted

    return NextResponse.json({
      stats: {
        total: totalMarketers || 0,
        pending: tabCounts.pending,
        approved: tabCounts.approved,
        rejected: tabCounts.rejected,
        suspended: tabCounts.suspended,
        removed: tabCounts.removed,
      },
      tabCounts,
      marketers: finalMarketers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    })
  } catch (err) {
    console.error("[Marketers] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
