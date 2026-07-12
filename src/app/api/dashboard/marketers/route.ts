import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const statusFilter = searchParams.get("status") || null
    const offset = (page - 1) * limit

    // ── Total count ──
    const { count: totalMarketers } = await supabaseAdmin
      .from("marketer_profiles")
      .select("id", { count: "exact", head: true })

    // ── Status counts ──
    const [pendingResult, approvedResult, rejectedResult, suspendedResult] = await Promise.all([
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabaseAdmin.from("marketer_profiles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
    ])

    const tabCounts = {
      pending: pendingResult.count || 0,
      approved: approvedResult.count || 0,
      rejected: rejectedResult.count || 0,
      suspended: suspendedResult.count || 0,
    }

    // ── Build query ──
    let query = supabaseAdmin
      .from("marketer_profiles")
      .select("*, users!inner(id, full_name, email, phone, state, created_at)")
      .order("created_at", { ascending: false })

    if (statusFilter) {
      query = query.eq("status", statusFilter)
    }

    if (search) {
      query = query.or(`phone.ilike.%${search}%,city.ilike.%${search}%,users.full_name.ilike.%${search}%`)
    }

    // Get count for pagination (before range)
    const { count: filteredCount } = await supabaseAdmin
      .from("marketer_profiles")
      .select("id", { count: "exact", head: true })
      .match(statusFilter ? { status: statusFilter } : {})

    const { data: profiles, error: queryError } = await query.range(offset, offset + limit - 1)

    if (queryError) {
      console.error("[Marketers] Query error:", queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    // ── Get referral counts for each marketer ──
    const marketerIds = (profiles || []).map((p: any) => p.marketer_id).filter(Boolean)
    const referralCounts: Record<string, number> = {}

    if (marketerIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("marketer_id")
        .in("marketer_id", marketerIds)

      if (users) {
        for (const u of users) {
          if (u.marketer_id) {
            referralCounts[u.marketer_id] = (referralCounts[u.marketer_id] || 0) + 1
          }
        }
      }
    }

    const formatted = (profiles || []).map((p: any) => {
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
      }

      return {
        id: p.user_id,
        name: user?.full_name || "—",
        phone: p.phone || user?.phone || "—",
        email: user?.email || "—",
        state: p.state || "—",
        city: p.city || "—",
        occupation: p.occupation || "—",
        marketerId: p.marketer_id || "—",
        status: p.status,
        statusLabel: p.status.charAt(0).toUpperCase() + p.status.slice(1),
        statusColor: statusColors[p.status] || "bg-gray-100 text-gray-600",
        referrals: referralCounts[p.marketer_id] || 0,
        totalEarnings: Number(p.total_earnings) || 0,
        totalEarningsFormatted: `₦${(Number(p.total_earnings) || 0).toLocaleString()}`,
        joined: created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        joinedNote,
      }
    })

    const totalPages = Math.ceil((filteredCount || totalMarketers || 0) / limit)

    return NextResponse.json({
      stats: {
        total: totalMarketers || 0,
        pending: tabCounts.pending,
        approved: tabCounts.approved,
        rejected: tabCounts.rejected,
        suspended: tabCounts.suspended,
      },
      tabCounts: {
        "All": totalMarketers || 0,
        "Pending": tabCounts.pending,
        "Approved": tabCounts.approved,
        "Rejected": tabCounts.rejected,
        "Suspended": tabCounts.suspended,
      },
      marketers: formatted,
      pagination: { page, limit, total: filteredCount || totalMarketers || 0, totalPages },
    })
  } catch (err) {
    console.error("[Marketers] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
