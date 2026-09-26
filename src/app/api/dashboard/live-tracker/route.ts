import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const ALL_TRACKABLE_STATUSES = ["searching", "bidding", "accepted", "picked_up", "delivered"] as const

function extractArea(addr: string): string {
  if (!addr) return "—"
  const first = addr.split(",")[0].trim()
  return first || addr
}

function shortId(id: string): string {
  return `SM-${id.slice(0, 5).toUpperCase()}`
}

function fallbackCoordinates(address: string): { lat: number; lng: number } {
  const a = (address || "").toLowerCase()
  if (a.includes("ikeja")) return { lat: 6.6018, lng: 3.3515 }
  if (a.includes("lekki") || a.includes("victoria island") || a.includes("vi")) return { lat: 6.4698, lng: 3.5852 }
  if (a.includes("yaba")) return { lat: 6.5095, lng: 3.3711 }
  if (a.includes("surulere")) return { lat: 6.4969, lng: 3.3578 }
  if (a.includes("mushin") || a.includes("ilupeju")) return { lat: 6.5355, lng: 3.3533 }
  if (a.includes("ikorodu")) return { lat: 6.6194, lng: 3.5105 }
  if (a.includes("lagos") || a.includes("maryland")) return { lat: 6.5244, lng: 3.3792 }
  if (a.includes("wuse")) return { lat: 9.0600, lng: 7.4700 }
  if (a.includes("garki")) return { lat: 9.0300, lng: 7.4900 }
  if (a.includes("maitama")) return { lat: 9.0882, lng: 7.4934 }
  if (a.includes("gwarinpa")) return { lat: 9.1120, lng: 7.3980 }
  if (a.includes("abuja") || a.includes("fct")) return { lat: 9.0765, lng: 7.3986 }
  if (a.includes("port harcourt") || a.includes("rivers")) return { lat: 4.8156, lng: 7.0498 }
  if (a.includes("ibadan") || a.includes("oyo")) return { lat: 7.3775, lng: 3.9470 }
  if (a.includes("kano")) return { lat: 12.0022, lng: 8.5919 }
  if (a.includes("benin") || a.includes("edo")) return { lat: 6.3350, lng: 5.6037 }
  if (a.includes("enugu")) return { lat: 6.4584, lng: 7.5464 }
  return { lat: 6.5244, lng: 3.3792 }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get("state")?.trim() || ""
    const statusParam = searchParams.get("status")?.trim() || ""
    const vehicleType = searchParams.get("vehicle_type")?.trim() || ""
    const search = searchParams.get("search")?.trim() || ""
    const view = searchParams.get("view")?.trim() || "all"

    // 1. Build Orders query
    let ordersQuery = supabaseAdmin
      .from("orders")
      .select(`
        id, status, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        vehicle_type, created_at, updated_at, pickup_state,
        accepted_driver_id, sender_name, sender_phone, receiver_name, receiver_phone,
        final_price, payment_method, item_details,
        driver:users!orders_accepted_driver_id_fkey(
          id, full_name, phone, email,
          driver_profiles(id, vehicle_info, is_online, current_lat, current_lng, last_location_at, rating)
        )
      `)
      .order("created_at", { ascending: false })

    if (statusParam) {
      if (statusParam.toLowerCase() === "in_transit" || statusParam === "In Transit") {
        ordersQuery = ordersQuery.in("status", ["accepted", "picked_up"])
      } else if (statusParam.toLowerCase() === "picked_up" || statusParam === "Picked Up") {
        ordersQuery = ordersQuery.eq("status", "picked_up")
      } else if (statusParam.toLowerCase() === "delivered" || statusParam === "Delivered") {
        ordersQuery = ordersQuery.eq("status", "delivered")
      } else if (statusParam.toLowerCase() === "searching" || statusParam === "Searching") {
        ordersQuery = ordersQuery.in("status", ["searching", "bidding"])
      } else if (statusParam.toLowerCase() !== "all") {
        ordersQuery = ordersQuery.eq("status", statusParam)
      } else {
        ordersQuery = ordersQuery.in("status", ALL_TRACKABLE_STATUSES)
      }
    } else {
      ordersQuery = ordersQuery.in("status", ALL_TRACKABLE_STATUSES)
    }

    if (state) {
      if (state.toLowerCase().includes("abuja") || state.toLowerCase().includes("fct")) {
        ordersQuery = ordersQuery.or(`pickup_state.ilike.%Abuja%,pickup_state.ilike.%FCT%,pickup_address.ilike.%Abuja%,pickup_address.ilike.%FCT%,pickup_address.ilike.%Federal Capital Territory%`)
      } else {
        ordersQuery = ordersQuery.or(`pickup_state.ilike.%${state}%,pickup_address.ilike.%${state}%`)
      }
    }

    if (vehicleType) {
      ordersQuery = ordersQuery.eq("vehicle_type", vehicleType)
    }

    if (search) {
      ordersQuery = ordersQuery.or(`id.ilike.%${search}%,sender_name.ilike.%${search}%,sender_phone.ilike.%${search}%,receiver_name.ilike.%${search}%,pickup_address.ilike.%${search}%,dropoff_address.ilike.%${search}%`)
    }

    // 2. Query orders, driver fleet, and order_tracking concurrently
    const [ordersRes, driversRes, trackingRes] = await Promise.all([
      ordersQuery.limit(100),
      supabaseAdmin
        .from("users")
        .select(`
          id, full_name, phone, email, state,
          driver_profiles(id, vehicle_info, is_online, current_lat, current_lng, last_location_at, rating, verification_status)
        `)
        .eq("role", "driver")
        .neq("is_deleted", true)
        .limit(200),
      supabaseAdmin
        .from("order_tracking")
        .select("order_id, tracking_stage, is_active, current_lat, current_lng, updated_at"),
    ])

    if (ordersRes.error) {
      console.error("[Live Tracker] Orders error:", ordersRes.error)
      return NextResponse.json({ error: ordersRes.error.message }, { status: 500 })
    }

    const rawOrders: any[] = ordersRes.data || []
    const rawDrivers: any[] = driversRes.data || []
    const trackingByOrder: Record<string, any> = {}
    ;(trackingRes.data || []).forEach((t: any) => {
      trackingByOrder[t.order_id] = t
    })

    // Process all drivers for security tracking & fleet mode
    const onlineDrivers = rawDrivers
      .map((u: any) => {
        const dp = Array.isArray(u.driver_profiles) ? u.driver_profiles[0] : u.driver_profiles
        if (!dp) return null
        const vInfo = (dp.vehicle_info as any) || {}
        return {
          id: u.id,
          name: u.full_name || "Driver",
          phone: u.phone || "—",
          email: u.email || "—",
          state: u.state || "—",
          isOnline: !!dp.is_online,
          lat: dp.current_lat != null ? Number(dp.current_lat) : null,
          lng: dp.current_lng != null ? Number(dp.current_lng) : null,
          lastOnline: dp.last_location_at || null,
          rating: dp.rating || 5.0,
          vehicle: vInfo.type || "Motorcycle",
          plate: vInfo.plate || null,
          verificationStatus: dp.verification_status || "verified",
        }
      })
      .filter((d: any) => d !== null)

    const onlineDriversCount = onlineDrivers.filter((d: any) => d.isOnline).length

    // Map deliveries with complete target coordinates and security rider dossier
    const activeDeliveries = rawOrders.map((o: any) => {
      const tr = trackingByOrder[o.id]
      const driver = o.driver as any
      const driverProfile = Array.isArray(driver?.driver_profiles) ? driver.driver_profiles[0] : driver?.driver_profiles
      const vInfo = (driverProfile?.vehicle_info as any) || {}

      let status = "In Transit"
      let statusKey = "in_transit"
      let statusColor = "bg-sendme-50 text-sendme"

      if (o.status === "searching" || o.status === "bidding") {
        status = o.status === "bidding" ? "Open for Bids" : "Searching"
        statusKey = "searching"
        statusColor = "bg-warning-light text-warning"
      } else if (o.status === "picked_up") {
        status = "Picked Up"
        statusKey = "picked_up"
        statusColor = "bg-info-light text-info"
      } else if (o.status === "delivered") {
        status = "Delivered"
        statusKey = "delivered"
        statusColor = "bg-sendme-50 text-sendme"
      } else if (o.status === "accepted") {
        status = tr?.tracking_stage === "heading_dropoff" ? "En Route to Dropoff" : "In Transit"
        statusKey = "in_transit"
        statusColor = "bg-sendme-50 text-sendme"
      }

      // Calculate coordinates with robust fallbacks
      const fallback = fallbackCoordinates(o.pickup_address || "")
      const pickupLat = o.pickup_lat != null ? Number(o.pickup_lat) : fallback.lat
      const pickupLng = o.pickup_lng != null ? Number(o.pickup_lng) : fallback.lng

      const dropoffFallback = fallbackCoordinates(o.dropoff_address || "")
      const dropoffLat = o.dropoff_lat != null ? Number(o.dropoff_lat) : (o.dropoff_address ? dropoffFallback.lat : null)
      const dropoffLng = o.dropoff_lng != null ? Number(o.dropoff_lng) : (o.dropoff_address ? dropoffFallback.lng : null)

      // Rider coordinates: prioritize order_tracking, then driver_profiles live GPS
      const riderLat = tr?.current_lat != null
        ? Number(tr.current_lat)
        : (driverProfile?.current_lat != null ? Number(driverProfile.current_lat) : null)
      const riderLng = tr?.current_lng != null
        ? Number(tr.current_lng)
        : (driverProfile?.current_lng != null ? Number(driverProfile.current_lng) : null)

      // Primary tracking target:
      // If order is active/in transit with an assigned driver, target is the Assigned Rider!
      // If order is not in transit or searching, target is the Pickup location!
      const isAssigned = !!o.accepted_driver_id && !!driver
      const hasRiderCoords = riderLat != null && riderLng != null
      const targetIsRider = isAssigned && (statusKey === "in_transit" || statusKey === "picked_up") && hasRiderCoords
      const targetLat = targetIsRider ? riderLat : pickupLat
      const targetLng = targetIsRider ? riderLng : pickupLng

      const createdAt = new Date(o.created_at)
      const lastActivity = tr?.updated_at ? new Date(tr.updated_at) : (driverProfile?.last_location_at ? new Date(driverProfile.last_location_at) : createdAt)
      const itemDetails = o.item_details as any

      return {
        id: shortId(o.id),
        fullId: o.id,
        status,
        statusKey,
        statusColor,
        from: extractArea(o.pickup_address),
        to: extractArea(o.dropoff_address),
        fromAddr: o.pickup_address || "—",
        toAddr: o.dropoff_address || "—",
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        customer: o.sender_name || "Customer",
        customerPhone: o.sender_phone || null,
        receiver: o.receiver_name || "Recipient",
        receiverPhone: o.receiver_phone || null,
        fare: o.final_price ? `₦${Number(o.final_price).toLocaleString()}` : "—",
        payment: o.payment_method ? o.payment_method.charAt(0).toUpperCase() + o.payment_method.slice(1) : "—",
        itemType: itemDetails?.size ? `${itemDetails.size.charAt(0).toUpperCase() + itemDetails.size.slice(1)} Item` : itemDetails?.category || "Standard Delivery",
        vehicleType: o.vehicle_type || "motorcycle",
        vehicle: o.vehicle_type ? o.vehicle_type.charAt(0).toUpperCase() + o.vehicle_type.slice(1) : (vInfo?.type || "Motorcycle"),
        plate: vInfo?.plate || null,
        driverId: o.accepted_driver_id || null,
        driver: driver?.full_name || null,
        driverPhone: driver?.phone || null,
        driverEmail: driver?.email || null,
        driverAvatar: driver?.full_name ? driver.full_name[0] : null,
        driverRating: driverProfile?.rating || null,
        driverOnline: !!driverProfile?.is_online,
        driverLat: riderLat,
        driverLng: riderLng,
        driverLastOnline: driverProfile?.last_location_at || null,
        targetIsRider,
        targetLat,
        targetLng,
        lat: targetLat,
        lng: targetLng,
        eta: statusKey === "delivered" ? "Delivered" : tr?.is_active ? "Active now" : (statusKey === "picked_up" ? "En route" : "In transit"),
        time: lastActivity.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        trackingStage: tr?.tracking_stage || null,
        isTracking: !!tr || hasRiderCoords,
        created_at: o.created_at,
      }
    })

    // Compute status counts across filtered dataset
    const inTransitCount = activeDeliveries.filter((d: any) => d.statusKey === "in_transit").length
    const pickedUpCount = activeDeliveries.filter((d: any) => d.statusKey === "picked_up").length
    const deliveredCount = activeDeliveries.filter((d: any) => d.statusKey === "delivered").length
    const searchingCount = activeDeliveries.filter((d: any) => d.statusKey === "searching").length
    const activeTotal = activeDeliveries.length

    const deliveryTabs = [
      { name: "In Transit", count: inTransitCount },
      { name: "Picked Up", count: pickedUpCount },
      { name: "Delivered", count: deliveredCount },
      { name: "Searching", count: searchingCount },
      { name: "All Deliveries", count: activeTotal },
    ]

    const stats = [
      { label: "Trackable Orders", value: activeTotal, icon: "truck", color: "text-sendme", change: "In view" },
      { label: "In Transit", value: inTransitCount, icon: "car", color: "text-sendme", change: "Live moving" },
      { label: "Picked Up", value: pickedUpCount, icon: "check", color: "text-info", change: "Goods secured" },
      { label: "Riders Online", value: onlineDriversCount, icon: "users", color: "text-warning", change: `${onlineDrivers.length} registered` },
      { label: "Delivered", value: deliveredCount, icon: "check", color: "text-sendme", change: "Completed" },
    ]

    return NextResponse.json({
      stats,
      viewOptions: [
        { label: "All Active", count: activeTotal + onlineDriversCount },
        { label: "Deliveries", count: activeTotal },
        { label: "Drivers (Live Fleet)", count: onlineDriversCount },
      ],
      deliveryTabs,
      activeDeliveries,
      onlineDrivers,
      total: activeTotal,
    })
  } catch (err: any) {
    console.error("[Live Tracker] Error:", err)
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}