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

    // ── Status tab counts ──
    // "scheduled" is not an orders.status value — scheduled orders are marked
    // by is_scheduled = true (scheduled_status holds the confirmation state).
    const allStatuses = ["searching", "bidding", "accepted", "picked_up", "delivered", "canceled"] as const

    const statusCountResults = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("is_scheduled", true),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      ...allStatuses.map((s) =>
        supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("status", s)
      ),
    ])

    const [scheduledCount, totalCountQuery, ...statusCountQueries] = statusCountResults

    const statusCounts: Record<string, number> = {}
    statusCountQueries.forEach((result, i) => {
      statusCounts[allStatuses[i]] = result.count || 0
    })
    statusCounts.scheduled = scheduledCount.count || 0

    const totalCount = totalCountQuery.count || 0

    // ── Stat card values ──
    const activeOrders = statusCounts.searching + statusCounts.bidding + statusCounts.accepted + statusCounts.picked_up
    const unassigned = statusCounts.searching + statusCounts.bidding
    const scheduledToday = statusCounts.scheduled // approximate — filtered by date if needed
    const completed = statusCounts.delivered
    const failed = statusCounts.canceled
    const cancelled = statusCounts.canceled

    // ── Tab count map (match existing tab labels) ──
    const tabCounts: Record<string, number> = {
      "All Orders": totalCount,
      "Active": activeOrders,
      "Open for Bids": statusCounts.searching + statusCounts.bidding,
      "Scheduled": scheduledToday,
      "Completed": completed,
      "Failed": failed,
      "Disputed": 0,
      "Cancelled": cancelled,
    }

    // ── Status filter mapping (tab name → DB statuses) ──
    const tabToStatuses: Record<string, string[]> = {
      "Active": ["searching", "bidding", "accepted", "picked_up"],
      "Open for Bids": ["searching", "bidding"],
      "Scheduled": ["scheduled"],
      "Completed": ["delivered"],
      "Failed": ["canceled"],
      "Cancelled": ["canceled"],
      "Disputed": [],
    }

    // ── Build query ──
    let query = supabaseAdmin
      .from("orders")
      .select(`
        id, status, final_price, pickup_address, dropoff_address,
        payment_method, vehicle_type, created_at, updated_at,
        customer_id, accepted_driver_id, pin_enabled,
        sender_name, sender_phone, receiver_name, receiver_phone,
        item_details, item_value, is_scheduled, scheduled_date,
        customer:users!orders_customer_id_fkey(full_name, email, phone),
        driver:users!orders_accepted_driver_id_fkey(full_name, phone)
      `)
      .order("created_at", { ascending: false })

    // Apply status filter from tab
    if (statusFilter === "Scheduled") {
      query = query.eq("is_scheduled", true)
    } else if (statusFilter && tabToStatuses[statusFilter]) {
      const statuses = tabToStatuses[statusFilter]
      if (statuses.length > 0) {
        query = query.in("status", statuses)
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`id.ilike.%${search}%,sender_name.ilike.%${search}%,receiver_name.ilike.%${search}%,pickup_address.ilike.%${search}%,dropoff_address.ilike.%${search}%`)
    }

    // Count for pagination
    const { count: filteredCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })

    // Fetch page
    const { data: orders, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[Deliveries] Query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Fetch delivery PINs (pin_code lives in order_pins, not orders) ──
    const pinMap: Record<string, string> = {}
    const pinEnabledIds = (orders || []).filter((o) => o.pin_enabled).map((o) => o.id)
    if (pinEnabledIds.length > 0) {
      const { data: pins } = await supabaseAdmin
        .from("order_pins")
        .select("order_id, pin_code")
        .in("order_id", pinEnabledIds)
      ;(pins || []).forEach((p) => {
        if (p.pin_code) pinMap[p.order_id] = p.pin_code
      })
    }

    // ── Format response ──
    const deliveries = (orders || []).map((o) => {
      const customer = o.customer as any
      const driver = o.driver as any
      const itemDetails = o.item_details as any

      // Determine item type label from item_details or vehicle_type
      let typeLabel = "Standard"
      let typeColor = "bg-surface-secondary text-text-muted"
      if (itemDetails?.size) {
        const size = itemDetails.size.toLowerCase()
        if (size === "small") { typeLabel = "Small Item"; typeColor = "bg-sendme-50 text-sendme" }
        else if (size === "medium") { typeLabel = "Medium Item"; typeColor = "bg-info-light text-info" }
        else if (size === "bulk") { typeLabel = "Bulk"; typeColor = "bg-purple-50 text-purple-600" }
      } else if (itemDetails?.category) {
        typeLabel = itemDetails.category
        typeColor = "bg-purple-50 text-purple-600"
      }

      // Status display
      const statusMap: Record<string, { label: string; color: string }> = {
        searching: { label: "Searching", color: "bg-warning-light text-warning" },
        bidding: { label: "Open for Bids", color: "bg-warning-light text-warning" },
        accepted: { label: "Accepted", color: "bg-sendme-50 text-sendme" },
        picked_up: { label: "Picked Up", color: "bg-sendme-50 text-sendme" },
        delivered: { label: "Delivered", color: "bg-sendme-50 text-sendme" },
        canceled: { label: "Failed", color: "bg-danger-light text-danger" },
        scheduled: { label: "Scheduled", color: "bg-info-light text-info" },
      }
      const statusInfo = statusMap[o.status] || { label: o.status, color: "bg-surface-secondary text-text-muted" }

      // Fare formatting
      const fare = o.final_price ? `₦${Number(o.final_price).toLocaleString()}` : "—"
      const fareSub = o.payment_method === "cash" ? "Cash on Delivery"
        : o.payment_method === "card" ? "Card"
        : o.payment_method === "transfer" ? "Transfer"
        : "—"

      // Time formatting
      const created = new Date(o.created_at)
      const now = new Date()
      const isToday = created.toDateString() === now.toDateString()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const isYesterday = created.toDateString() === yesterday.toDateString()
      let timeLabel = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      if (!isToday) {
        timeLabel = `${isYesterday ? "Yesterday" : created.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeLabel}`
      }

      // Route short names (extract area from address)
      const extractArea = (addr: string) => {
        if (!addr) return "—"
        const parts = addr.split(",").map((p) => p.trim())
        return parts[0] || addr
      }

      // Customer type
      const customerType = customer?.email ? "Individual" : "Individual"

      // Driver info
      const driverName = driver?.full_name || null
      const driverVehicle = o.vehicle_type || "—"
      const driverAvatar = driverName ? driverName[0] : null

      return {
        id: o.id.slice(0, 8).toUpperCase(),
        fullId: o.id,
        time: timeLabel,
        from: extractArea(o.pickup_address),
        to: extractArea(o.dropoff_address),
        fromAddr: o.pickup_address || "—",
        customer: customer?.full_name || o.sender_name || "—",
        customerType,
        customerPhone: customer?.phone || o.sender_phone || null,
        driver: driverName,
        driverVehicle: driverVehicle !== "—" ? `${driverVehicle.charAt(0).toUpperCase() + driverVehicle.slice(1)} • ${driverName || ""}` : null,
        driverAvatar,
        driverPhone: driver?.phone || null,
        type: typeLabel,
        typeColor,
        fare,
        fareSub,
        status: statusInfo.label,
        statusColor: statusInfo.color,
        eta: "—",
        etaStatus: "—",
        payment: o.payment_method ? o.payment_method.charAt(0).toUpperCase() + o.payment_method.slice(1) : "—",
        pin: pinMap[o.id] || null,
        created_at: o.created_at,
      }
    })

    const totalPages = Math.ceil((filteredCount || totalCount) / limit)

    return NextResponse.json({
      stats: {
        active: activeOrders,
        unassigned,
        scheduled: scheduledToday,
        delayed: 0,
        disputed: 0,
      },
      tabCounts,
      deliveries,
      pagination: {
        page,
        limit,
        total: filteredCount || totalCount,
        totalPages,
      },
    })
  } catch (err) {
    console.error("[Deliveries] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
