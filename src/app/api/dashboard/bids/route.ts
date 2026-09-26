import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const statusFilter = searchParams.get("status") || "all"
    const state = searchParams.get("state") || null
    const vehicleType = searchParams.get("vehicle_type") || null
    const urgency = searchParams.get("urgency") || null
    const priceRange = searchParams.get("price_range") || null
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
      `, { count: "exact" })
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
    }

    if (state) {
      query = query.or(`pickup_state.ilike.%${state}%,pickup_address.ilike.%${state}%,dropoff_address.ilike.%${state}%`)
    }

    if (vehicleType) {
      query = query.ilike("vehicle_type", `%${vehicleType}%`)
    }

    if (urgency) {
      query = query.eq("urgency", urgency)
    }

    if (priceRange === "under_5k") {
      query = query.lte("final_price", 5000)
    } else if (priceRange === "5k_20k") {
      query = query.gte("final_price", 5000).lte("final_price", 20000)
    } else if (priceRange === "20k_100k") {
      query = query.gte("final_price", 20000).lte("final_price", 100000)
    } else if (priceRange === "100k_plus") {
      query = query.gte("final_price", 100000)
    }

    // Search filter
    if (search) {
      query = query.or(`id.ilike.%${search}%,sender_name.ilike.%${search}%,pickup_address.ilike.%${search}%,dropoff_address.ilike.%${search}%`)
    }

    const { data: orders, count: filteredCount, error } = await query.range(offset, offset + limit - 1)

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

    const formattedBids = (orders || []).map(order => {
      const orderBids = Array.isArray(order.bids) ? order.bids : []
      const bidsCount = orderBids.length
      const highestBid = bidsCount > 0
        ? Math.max(...orderBids.map((b: any) => Number(b.amount) || 0))
        : null
      const highestBidObj = bidsCount > 0
        ? orderBids.find((b: any) => Number(b.amount) === highestBid)
        : null
      const winningBidObj = orderBids.find((b: any) => b.status === "accepted")
      const winningBid = winningBidObj ? Number(winningBidObj.amount) : null

      const fromArea = order.pickup_address ? order.pickup_address.split(",")[0].trim() : "—"
      const toArea = order.dropoff_address ? order.dropoff_address.split(",")[0].trim() : "—"
      const route = `${fromArea} → ${toArea}`

      const customerName = customerMap[order.customer_id] || order.sender_name || "—"
      const winnerName = winningBidObj && driverMap[winningBidObj.driver_id]
        ? driverMap[winningBidObj.driver_id].name
        : order.accepted_driver_id && driverMap[order.accepted_driver_id]
        ? driverMap[order.accepted_driver_id].name
        : "—"
      const highestByName = highestBidObj && driverMap[highestBidObj.driver_id]
        ? driverMap[highestBidObj.driver_id].name
        : "—"

      let status = "Open for Bids"
      let statusColor = "bg-sendme-50 text-sendme"
      let statusNote = `${bidsCount} bids received`

      if (order.status === "accepted" || winningBidObj) {
        status = "Won"
        statusColor = "bg-sendme-50 text-sendme"
        statusNote = winnerName !== "—" ? `Won by ${winnerName}` : "Bid Accepted"
      } else if (order.status === "cancelled" || order.status === "canceled") {
        status = "Cancelled"
        statusColor = "bg-danger-light text-danger"
        statusNote = "Order cancelled"
      } else if (order.status === "delivered") {
        status = "Delivered"
        statusColor = "bg-sendme-50 text-sendme"
        statusNote = "Ride completed"
      } else if (order.status === "picked_up") {
        status = "In Transit"
        statusColor = "bg-info-light text-info"
        statusNote = "Ride in progress"
      }

      const created = new Date(order.created_at)
      const diffMs = Date.now() - created.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      let timeAgo = "Just now"
      if (diffMins < 60) timeAgo = `${diffMins}m ago`
      else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)}h ago`
      else timeAgo = `${Math.floor(diffMins / 1440)}d ago`

      return {
        id: order.id,
        shortId: `ORD-${order.id.slice(0, 5).toUpperCase()}`,
        time: timeAgo,
        route,
        type: order.vehicle_type || "Motorbike",
        distance: order.distance_km ? `${order.distance_km} km` : "—",
        customer: customerName,
        bidsCount,
        highestBid,
        highestBy: highestByName,
        winningBid,
        winner: winnerName,
        status,
        statusColor,
        statusNote,
        urgency: order.urgency || "normal",
        pickup_state: order.pickup_state,
        final_price: order.final_price,
        rawOrder: order,
      }
    })

    const finalCount = filteredCount ?? totalOrders ?? 0

    return NextResponse.json({
      stats,
      bids: formattedBids,
      pagination: {
        page,
        limit,
        total: finalCount,
        totalPages: Math.ceil(finalCount / limit) || 1,
      },
    })
  } catch (err) {
    console.error("[Bids] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
