import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const statusFilter = searchParams.get("status") || "all"
    const offset = (page - 1) * limit

    // ── Stats: aggregate from orders + bids ──
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const [
      { count: totalOrders },
      { data: todayOrders },
      { data: allBids },
      { count: totalBids },
      { data: openOrders },
      { data: wonBids },
      { data: cancelledOrders },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id, final_price, status, created_at").gte("created_at", todayISO),
      supabaseAdmin.from("bids").select("id, driver_id, order_id, amount, status, created_at"),
      supabaseAdmin.from("bids").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id").in("status", ["searching", "bidding"]),
      supabaseAdmin.from("bids").select("amount, order_id").eq("status", "accepted"),
      supabaseAdmin.from("orders").select("id").in("status", ["cancelled", "canceled"]),
    ])

    const todayBidCount = (allBids || []).filter(b => new Date(b.created_at) >= today).length
    const openForBids = (openOrders || []).length
    const wonCount = (wonBids || []).length
    const totalBidCount = totalBids || 0
    const avgWinningBid = wonBids && wonBids.length > 0
      ? wonBids.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) / wonBids.length
      : 0
    const completedOrders = (allBids || []).filter(b => b.status === "accepted").length
    const bidSuccessRate = totalBidCount > 0 ? (completedOrders / totalBidCount * 100) : 0

    // ── Tab counts by order status ──
    const allBidOrders = (allBids || []).length
    const openBids = openForBids
    const lostCount = totalBidCount - wonCount - (allBids || []).filter(b => b.status === "pending").length
    const cancelledCount = (cancelledOrders || []).length

    const stats = {
      totalBidsToday: todayBidCount,
      openForBids,
      avgWinningBid: Math.round(avgWinningBid),
      bidSuccessRate: Math.round(bidSuccessRate * 10) / 10,
      totalBids: totalBidCount,
      totalOrders: totalOrders || 0,
      tabCounts: {
        all: totalBidCount,
        open: openBids,
        won: wonCount,
        lost: Math.max(0, lostCount),
        cancelled: cancelledCount,
      },
    }

    // ── Main query: orders with their bids ──
    let query = supabaseAdmin
      .from("orders")
      .select(`
        id, customer_id, pickup_address, dropoff_address, pickup_state,
        status, final_price, vehicle_type, distance_km, created_at,
        updated_at, item_details, item_value, item_description,
        urgency, sender_name, sender_phone, receiver_name, receiver_phone,
        commission_amount, driver_earning,
        accepted_driver_id,
        bids(id, driver_id, amount, eta, status, created_at)
      `)
      .order("created_at", { ascending: false })

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "open") {
        query = query.in("status", ["searching", "bidding"])
      } else if (statusFilter === "won") {
        query = query.eq("status", "accepted")
      } else if (statusFilter === "cancelled") {
        query = query.in("status", ["cancelled", "canceled"])
      }
      // "lost" is harder to compute at DB level — orders that had bids but weren't won
      // We'll handle it client-side after fetch
    }

    // Search filter
    if (search) {
      query = query.or(`id.ilike.%${search}%,sender_name.ilike.%${search}%,pickup_address.ilike.%${search}%,dropoff_address.ilike.%${search}%`)
    }

    const { data: orders, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[Bids] Query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Get customer names for orders ──
    const customerIds = [...new Set((orders || []).map(o => o.customer_id).filter(Boolean))]
    let customerMap: Record<string, string> = {}
    if (customerIds.length > 0) {
      const { data: customers } = await supabaseAdmin
        .from("users")
        .select("id, full_name, role")
        .in("id", customerIds)
      if (customers) {
        for (const c of customers) {
          customerMap[c.id] = c.full_name || "—"
        }
      }
    }

    // ── Get driver names for won bids ──
    const driverIds = [...new Set((orders || []).map(o => o.accepted_driver_id).filter(Boolean))]
    const allBidDriverIds = (allBids || []).map(b => b.driver_id).filter(Boolean)
    const combinedDriverIds = [...new Set([...driverIds, ...allBidDriverIds])]
    let driverMap: Record<string, { name: string, vehicle: string }> = {}
    if (combinedDriverIds.length > 0) {
      const { data: drivers } = await supabaseAdmin
        .from("users")
        .select("id, full_name, driver_profiles(vehicle_info)")
        .in("id", combinedDriverIds)
      if (drivers) {
        for (const d of drivers) {
          const profile = Array.isArray((d as any).driver_profiles)
            ? (d as any).driver_profiles[0]
            : (d as any).driver_profiles
          const vehicle = profile?.vehicle_info as any
          driverMap[d.id] = {
            name: d.full_name || "—",
            vehicle: vehicle?.type || "—",
          }
        }
      }
    }

    // ── Format orders with bid info ──
    const formatted = (orders || []).map(order => {
      const bids = (order as any).bids || []
      const highestBid = bids.length > 0
        ? bids.reduce((max: any, b: any) => Number(b.amount) > Number(max.amount) ? b : max, bids[0])
        : null
      const wonBid = bids.find((b: any) => b.status === "accepted")
      const customerName = customerMap[order.customer_id] || (order as any).sender_name || "—"
      const winnerDriver = wonBid ? driverMap[wonBid.driver_id] : null
      const highestDriver = highestBid ? driverMap[highestBid.driver_id] : null

      const status = order.status
      let statusLabel = "Open"
      let statusColor = "bg-warning-light text-warning"
      let statusNote = `${bids.length} bid${bids.length !== 1 ? "s" : ""}`

      if (status === "accepted" || status === "picked_up" || status === "in_transit") {
        statusLabel = "Won"
        statusColor = "bg-sendme-50 text-sendme"
        statusNote = "Driver assigned"
      } else if (status === "delivered") {
        statusLabel = "Completed"
        statusColor = "bg-sendme-50 text-sendme"
        statusNote = "Delivered"
      } else if (status === "cancelled" || status === "canceled") {
        statusLabel = "Cancelled"
        statusColor = "bg-surface-secondary text-text-muted"
        statusNote = "Cancelled"
      } else if (bids.length === 0) {
        statusLabel = "Searching"
        statusColor = "bg-info-light text-info"
        statusNote = "No bids yet"
      }

      const itemDetails = (order as any).item_details as any
      const itemType = itemDetails?.type || itemDetails?.category || "Item"

      return {
        id: order.id,
        shortId: `SM-${order.id.slice(0, 4).toUpperCase()}`,
        time: new Date(order.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        route: `${order.pickup_address || "—"} → ${order.dropoff_address || "—"}`,
        type: `${itemType} • ${order.vehicle_type || "—"}`,
        customer: customerName,
        customerType: "—",
        highestBid: highestBid ? Number(highestBid.amount) : null,
        highestBy: highestDriver?.name || "—",
        winningBid: wonBid ? Number(wonBid.amount) : null,
        winner: winnerDriver?.name || "—",
        winnerVehicle: winnerDriver?.vehicle || "—",
        bidsCount: bids.length,
        status: statusLabel,
        statusNote,
        statusColor,
        distance: order.distance_km ? `${Math.round(order.distance_km)} km` : "—",
        finalPrice: order.final_price ? Number(order.final_price) : null,
        commission: order.commission_amount ? Number(order.commission_amount) : null,
        driverEarning: order.driver_earning ? Number(order.driver_earning) : null,
        urgency: order.urgency || "normal",
        orderStatus: status,
        pickupState: order.pickup_state || "—",
        createdAt: order.created_at,
        bids: bids.map((b: any) => ({
          id: b.id,
          driverId: b.driver_id,
          driverName: driverMap[b.driver_id]?.name || "—",
          amount: Number(b.amount),
          eta: b.eta,
          status: b.status,
          time: new Date(b.created_at).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" }),
        })).sort((a: any, b: any) => b.amount - a.amount),
      }
    })

    // Filter "lost" orders client-side: orders that had bids but no accepted bid and aren't cancelled
    let result = formatted
    if (statusFilter === "lost") {
      result = formatted.filter(o => o.orderStatus !== "cancelled" && o.orderStatus !== "canceled" && o.orderStatus !== "accepted" && o.bidsCount > 0)
    }

    const totalPages = Math.ceil((totalBidCount || 0) / limit)

    return NextResponse.json({
      stats,
      bids: result,
      pagination: { page, limit, total: totalBidCount || 0, totalPages },
    })
  } catch (err) {
    console.error("[Bids] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
