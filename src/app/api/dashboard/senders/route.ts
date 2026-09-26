import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const status = searchParams.get("status") || null
    const state = searchParams.get("state") || null
    const dateRange = searchParams.get("date_range") || null
    const activity = searchParams.get("activity") || null
    const sortBy = searchParams.get("sort_by") || "newest"
    const offset = (page - 1) * limit

    // ── Total count ──
    const { count: totalSenders } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")

    // ── Active senders: customers who have placed at least one order ──
    const { data: activeCustomerIds } = await supabaseAdmin
      .from("orders")
      .select("customer_id")
    const uniqueActiveOrderCustomerIds = new Set((activeCustomerIds || []).map((o) => o.customer_id))

    const { data: allCustomers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "customer")
    const customerIds = new Set((allCustomers || []).map((c) => c.id))
    const uniqueActive = [...uniqueActiveOrderCustomerIds].filter((id) => customerIds.has(id)).length

    // New this month count
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: newThisMonthCount } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", startOfMonth)

    // ── Get marketer profiles to check for removed status ──
    const { data: marketerProfiles } = await supabaseAdmin
      .from("marketer_profiles")
      .select("user_id, status")
      .eq("status", "removed")
    const removedMarketerIds = new Set((marketerProfiles || []).map((p: any) => p.user_id))

    // ── Date range filter calculation ──
    let dateGte: string | null = null
    if (dateRange === "today") {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      dateGte = d.toISOString()
    } else if (dateRange === "yesterday") {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      d.setHours(0, 0, 0, 0)
      dateGte = d.toISOString()
    } else if (dateRange === "week") {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      dateGte = d.toISOString()
    } else if (dateRange === "month" || dateRange === "last_30") {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      dateGte = d.toISOString()
    } else if (dateRange === "year") {
      const d = new Date(now.getFullYear(), 0, 1)
      dateGte = d.toISOString()
    }

    // ── Build query ──
    let senders: any[] | null = null
    let queryError: any = null

    const tryQuery = async (selectCols: string) => {
      let q = supabaseAdmin
        .from("users")
        .select(selectCols)
        .eq("role", "customer")
        .order("created_at", { ascending: sortBy === "oldest" })

      if (search) {
        q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }
      if (state) {
        q = q.eq("state", state)
      }
      if (dateGte) {
        q = q.gte("created_at", dateGte)
      }
      if (status === "suspended") {
        q = q.eq("is_suspended", true)
      } else if (status === "deactivated") {
        q = q.eq("is_deleted", true)
      } else if (status === "active") {
        q = q.not("is_suspended", "is", true).not("is_deleted", "is", true)
      }

      // If activity filter or in-memory sorting is active, fetch a larger batch
      const effectiveLimit = (activity || sortBy === "spent" || sortBy === "orders") ? 200 : limit
      const effectiveOffset = (activity || sortBy === "spent" || sortBy === "orders") ? 0 : offset
      return q.range(effectiveOffset, effectiveOffset + effectiveLimit - 1)
    }

    const full = await tryQuery("id, full_name, phone, email, state, created_at, is_deleted, is_suspended")
    if (full.error) {
      const fallback = await tryQuery("id, full_name, phone, email, state, created_at")
      senders = fallback.data
      queryError = fallback.error
    } else {
      senders = full.data
    }

    if (queryError) {
      console.error("[Senders] Query error:", queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    // ── Get order counts and total spent for each sender ──
    const senderIds = (senders || []).map((s) => s.id)
    const orderCounts: Record<string, number> = {}
    const totalSpent: Record<string, number> = {}
    if (senderIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("customer_id, final_price, status")
        .in("customer_id", senderIds)
      if (orders) {
        for (const o of orders) {
          orderCounts[o.customer_id] = (orderCounts[o.customer_id] || 0) + 1
          if (o.status === "delivered") {
            totalSpent[o.customer_id] = (totalSpent[o.customer_id] || 0) + (Number(o.final_price) || 0)
          }
        }
      }
    }

    let formatted = (senders || []).map((s) => {
      const created = new Date(s.created_at)
      const diffMs = now.getTime() - created.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      let joinedNote = "Just now"
      if (diffDays > 365) joinedNote = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`
      else if (diffDays > 30) joinedNote = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
      else if (diffDays > 0) joinedNote = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

      const isDeleted = s.is_deleted === true
      const isSuspended = s.is_suspended === true
      const isRemovedMarketer = removedMarketerIds.has(s.id)
      let statusLabel = "Active"
      let statusColor = "bg-sendme-50 text-sendme"
      if (isRemovedMarketer) {
        statusLabel = "Removed marketer"
        statusColor = "bg-surface-secondary text-text-muted"
      } else if (isDeleted) {
        statusLabel = "Deactivated"
        statusColor = "bg-surface-secondary text-text-muted"
      } else if (isSuspended) {
        statusLabel = "Suspended"
        statusColor = "bg-warning-light text-warning"
      }

      return {
        id: s.id,
        name: s.full_name || "—",
        phone: s.phone || "—",
        email: s.email || "—",
        state: s.state || "—",
        avatar: (s.full_name || "?")[0],
        orders: orderCounts[s.id] || 0,
        totalSpent: totalSpent[s.id] || 0,
        totalSpentFormatted: totalSpent[s.id] ? `₦${totalSpent[s.id].toLocaleString()}` : "—",
        status: statusLabel,
        statusColor,
        joined: created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        joinedNote,
      }
    })

    // Activity filter
    if (activity === "with_orders") {
      formatted = formatted.filter((s) => s.orders > 0)
    } else if (activity === "zero_orders") {
      formatted = formatted.filter((s) => s.orders === 0)
    }

    // Sort by spent or orders
    if (sortBy === "spent") {
      formatted.sort((a, b) => b.totalSpent - a.totalSpent)
    } else if (sortBy === "orders") {
      formatted.sort((a, b) => b.orders - a.orders)
    }

    const totalCount = (activity || sortBy === "spent" || sortBy === "orders") ? formatted.length : (totalSenders || 0)
    const finalSenders = (activity || sortBy === "spent" || sortBy === "orders") ? formatted.slice(offset, offset + limit) : formatted

    // Total wallet balance across all senders
    let totalBalance = 0
    if (senderIds.length > 0) {
      const { data: wallets } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .in("user_id", senderIds)
      totalBalance = (wallets || []).reduce((sum, w) => sum + (Number(w.balance) || 0), 0)
    }

    return NextResponse.json({
      stats: {
        total: totalSenders || 0,
        active: uniqueActive,
        newThisMonth: newThisMonthCount || 0,
        totalBalance,
        totalBalanceFormatted: `₦${totalBalance.toLocaleString()}`,
      },
      senders: finalSenders,
      pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) || 1 },
    })
  } catch (err) {
    console.error("[Senders] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
