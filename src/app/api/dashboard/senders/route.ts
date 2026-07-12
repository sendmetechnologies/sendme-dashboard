import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const offset = (page - 1) * limit

    // ── Total count ──
    const { count: totalSenders } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")

    // ── Senders who have placed at least one order ──
    const { count: activeSenders } = await supabaseAdmin
      .from("orders")
      .select("customer_id", { count: "exact", head: true })

    // ── Unique active senders ──
    const { data: activeCustomerIds } = await supabaseAdmin
      .from("orders")
      .select("customer_id")
    const uniqueActive = new Set((activeCustomerIds || []).map((o) => o.customer_id)).size

    // ── Build query (try with new columns, fallback without) ──
    let senders: any[] | null = null
    let queryError: any = null

    const tryQuery = async (selectCols: string) => {
      let q = supabaseAdmin
        .from("users")
        .select(selectCols)
        .eq("role", "customer")
        .order("created_at", { ascending: false })
      if (search) {
        q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      return q.range(offset, offset + limit - 1)
    }

    // Try with is_deleted and is_suspended columns first
    const full = await tryQuery("id, full_name, phone, created_at, is_deleted, is_suspended")
    if (full.error) {
      // Columns don't exist yet, fall back
      const fallback = await tryQuery("id, full_name, phone, created_at")
      senders = fallback.data
      queryError = fallback.error
    } else {
      senders = full.data
      // Filter out deactivated if column exists
      senders = (senders || []).filter((s: any) => s.is_deleted !== true)
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

    const formatted = (senders || []).map((s) => {
      const created = new Date(s.created_at)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      let joinedNote = "Just now"
      if (diffDays > 365) joinedNote = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`
      else if (diffDays > 30) joinedNote = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
      else if (diffDays > 0) joinedNote = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

      const isSuspended = s.is_suspended === true
      const statusLabel = isSuspended ? "Suspended" : "Active"
      const statusColor = isSuspended ? "bg-warning-light text-warning" : "bg-sendme-50 text-sendme"

      return {
        id: s.id,
        name: s.full_name || "—",
        phone: s.phone || "—",
        email: "—",
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

    const totalPages = Math.ceil((totalSenders || 0) / limit)

    // ── Total wallet balance across all senders ──
    const senderUserIds = (senders || []).map((s) => s.id)
    let totalBalance = 0
    if (senderUserIds.length > 0) {
      const { data: wallets } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .in("user_id", senderUserIds)
      totalBalance = (wallets || []).reduce((sum, w) => sum + (Number(w.balance) || 0), 0)
    }

    return NextResponse.json({
      stats: {
        total: totalSenders || 0,
        active: uniqueActive,
        newThisMonth: 0,
        totalBalance,
        totalBalanceFormatted: `₦${totalBalance.toLocaleString()}`,
      },
      senders: formatted,
      pagination: { page, limit, total: totalSenders || 0, totalPages },
    })
  } catch (err) {
    console.error("[Senders] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
