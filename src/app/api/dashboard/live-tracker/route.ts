import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const ACTIVE_STATUSES = ["searching", "bidding", "accepted", "picked_up"] as const

function extractArea(addr: string): string {
  if (!addr) return "—"
  const first = addr.split(",")[0].trim()
  return first || addr
}

function shortId(id: string): string {
  return `SM-${id.slice(0, 5).toUpperCase()}`
}

export async function GET() {
  try {
    const [counts, online, orders, tracking] = await Promise.all([
      Promise.all(
        ACTIVE_STATUSES.map((s) =>
          supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("status", s)
        )
      ),
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("is_online", true),
      supabaseAdmin
        .from("orders")
        .select(`
          id, status, pickup_address, dropoff_address, vehicle_type, created_at, updated_at,
          accepted_driver_id, sender_name, sender_phone, final_price, payment_method, item_details,
          driver:users!orders_accepted_driver_id_fkey(full_name, phone)
        `)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("order_tracking")
        .select("order_id, tracking_stage, is_active, current_lat, current_lng, updated_at"),
    ])

    if (orders.error) {
      console.error("[Live Tracker] Orders query error:", orders.error)
      return NextResponse.json({ error: orders.error.message }, { status: 500 })
    }

    const driverIds = Array.from(new Set((orders.data || []).map((o) => o.accepted_driver_id).filter(Boolean)))
    const plateMap: Record<string, string | null> = {}
    if (driverIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("driver_profiles")
        .select("id, vehicle_info")
        .in("id", driverIds)
      ;(profiles || []).forEach((p) => {
        const info = (p.vehicle_info as any) || {}
        plateMap[p.id] = info?.plate || null
      })
    }

    const trackingByOrder: Record<string, any> = {}
    ;(tracking.data || []).forEach((t) => {
      trackingByOrder[t.order_id] = t
    })

    const statusCounts: Record<string, number> = {}
    ACTIVE_STATUSES.forEach((s, i) => {
      statusCounts[s] = counts[i].count || 0
    })

    const activeTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0)
    const driversOnline = online.count || 0
    const inTransit = statusCounts.accepted + statusCounts.bidding + statusCounts.searching
    const pickedUp = statusCounts.picked_up
    const withTracking = (orders.data || []).filter((o) => trackingByOrder[o.id]).length
    const onTimePct = activeTotal > 0 ? Math.round((withTracking / activeTotal) * 100) : 0

    const activeDeliveries = (orders.data || []).map((o) => {
      const tr = trackingByOrder[o.id]
      const driver = o.driver as any
      const driverName = driver?.full_name || null

      let status: string
      let statusColor: string
      if (o.status === "searching" || o.status === "bidding") {
        status = o.status === "bidding" ? "Open for Bids" : "Searching"
        statusColor = "bg-warning-light text-warning"
      } else if (o.status === "picked_up") {
        status = "Picked Up"
        statusColor = "bg-info-light text-info"
      } else {
        status = tr?.tracking_stage === "heading_dropoff" ? "En Route to Dropoff" : "In Transit"
        statusColor = "bg-sendme-50 text-sendme"
      }

      const createdAt = new Date(o.created_at)
      const lastActivity = tr?.updated_at ? new Date(tr.updated_at) : createdAt
      const itemDetails = o.item_details as any

      return {
        id: shortId(o.id),
        fullId: o.id,
        status,
        statusColor,
        from: extractArea(o.pickup_address),
        to: extractArea(o.dropoff_address),
        fromAddr: o.pickup_address,
        toAddr: o.dropoff_address,
        customer: o.sender_name || null,
        customerPhone: o.sender_phone || null,
        fare: o.final_price ? `₦${Number(o.final_price).toLocaleString()}` : "—",
        payment: o.payment_method ? o.payment_method.charAt(0).toUpperCase() + o.payment_method.slice(1) : "—",
        itemType: itemDetails?.size ? `${itemDetails.size.charAt(0).toUpperCase() + itemDetails.size.slice(1)} Item` : itemDetails?.category || "Standard",
        driver: driverName || "Unassigned",
        vehicle: o.vehicle_type ? o.vehicle_type.charAt(0).toUpperCase() + o.vehicle_type.slice(1) : plateMap[o.accepted_driver_id] || "—",
        plate: driverName ? plateMap[o.accepted_driver_id] || null : null,
        eta: tr?.is_active ? "Active now" : "—",
        time: lastActivity.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        lat: tr?.current_lat ?? null,
        lng: tr?.current_lng ?? null,
        trackingStage: tr?.tracking_stage || null,
        isTracking: !!tr,
      }
    })

    const deliveryTabs = [
      { name: "In Transit", count: inTransit },
      { name: "Arrived", count: 0 },
      { name: "Picked Up", count: pickedUp },
      { name: "At Risk", count: 0 },
    ]

    const stats = [
      { label: "Active Deliveries", value: activeTotal, icon: "truck", change: "", up: true },
      { label: "Drivers Online", value: driversOnline, icon: "users", change: "", up: true },
      { label: "Vehicles Active", value: driversOnline, icon: "car", change: "", up: true },
      { label: "On Time", value: `${onTimePct}%`, icon: "check", change: `${withTracking} with live tracking`, up: true },
      { label: "Delayed", value: 0, icon: "alert", change: "", up: false },
    ]

    return NextResponse.json({
      stats,
      viewOptions: [
        { label: "All Active", count: activeTotal },
        { label: "Deliveries", count: activeTotal },
        { label: "Drivers", count: driversOnline },
        { label: "Vehicles", count: driversOnline },
      ],
      deliveryTabs,
      activeDeliveries,
      total: activeTotal,
    })
  } catch (err) {
    console.error("[Live Tracker] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}