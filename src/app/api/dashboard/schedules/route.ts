import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const STATUS_META: Record<string, { label: string; color: string }> = {
  completed: { label: "Completed", color: "bg-sendme-50 text-sendme" },
  cancelled: { label: "Cancelled", color: "bg-danger-light text-danger" },
  confirmed: { label: "Confirmed", color: "bg-sendme-50 text-sendme" },
  pending: { label: "Confirmation Pending", color: "bg-warning-light text-warning" },
  unassigned: { label: "Unassigned", color: "bg-surface-secondary text-text-muted" },
}

function fmtTime(time: string | null, fallback = "—"): string {
  if (!time) return fallback
  const [h, m] = time.split(":").map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const d = new Date()
  d.setHours(h, m, 0, 0)
  const ampm = d.getHours() >= 12 ? "PM" : "AM"
  const hour12 = d.getHours() % 12 || 12
  return `${hour12}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`
}

function extractArea(addr: string): string {
  if (!addr) return "—"
  const first = addr.split(",")[0].trim()
  return first || addr
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get("state")?.trim() || ""
    const search = searchParams.get("search")?.trim() || ""
    const vehicleType = searchParams.get("vehicle_type")?.trim() || ""
    const status = searchParams.get("status")?.trim() || ""
    const dateRange = searchParams.get("date")?.trim() || ""

    let query = supabaseAdmin
      .from("orders")
      .select(`
        id, status, item_details, sender_name, receiver_name,
        pickup_address, dropoff_address, pickup_state, payment_method, vehicle_type,
        is_scheduled, scheduled_date, scheduled_time_start, scheduled_time_end,
        accepted_driver_id, created_at,
        driver:users!orders_accepted_driver_id_fkey(full_name, phone)
      `)
      .eq("is_scheduled", true)

    if (state) {
      if (state.toLowerCase().includes("abuja") || state.toLowerCase().includes("fct")) {
        query = query.or(`pickup_state.ilike.%Abuja%,pickup_state.ilike.%FCT%,pickup_address.ilike.%Abuja%,pickup_address.ilike.%FCT%,pickup_address.ilike.%Federal Capital Territory%`)
      } else {
        query = query.or(`pickup_state.ilike.%${state}%,pickup_address.ilike.%${state}%`)
      }
    }

    if (vehicleType) {
      query = query.eq("vehicle_type", vehicleType)
    }

    if (search) {
      query = query.or(`id.ilike.%${search}%,sender_name.ilike.%${search}%,receiver_name.ilike.%${search}%,pickup_address.ilike.%${search}%,dropoff_address.ilike.%${search}%`)
    }

    const { data: orders, error } = await query.order("scheduled_date", { ascending: false })

    if (error) {
      console.error("[Schedules] Query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = orders || []

    // Driver ratings + plates for the accepted carriers
    const driverIds = Array.from(new Set(items.map((o) => o.accepted_driver_id).filter(Boolean)))
    const profileMap: Record<string, { rating: number | null; plate: string | null }> = {}
    if (driverIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("driver_profiles")
        .select("id, rating, vehicle_info")
        .in("id", driverIds)
      ;(profiles || []).forEach((p) => {
        const info = (p.vehicle_info as any) || {}
        profileMap[p.id] = {
          rating: p.rating ?? null,
          plate: info?.plate || null,
        }
      })
    }

    const now = new Date()
    const todayStr = now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startWeek = new Date(now)
    startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const endWeek = new Date(now)
    endWeek.setDate(now.getDate() + (6 - ((now.getDay() + 6) % 7)))

    let todayCount = 0
    let tomorrowCount = 0
    let weekCount = 0
    let confirmed = 0
    let pending = 0
    let unassigned = 0
    let cancelled = 0

    const schedules = (items || []).map((o) => {
      const sDate = o.scheduled_date ? new Date(o.scheduled_date + "T12:00:00") : null
      const isToday = !!sDate && sDate.toDateString() === todayStr
      const isTomorrow = !!sDate && sDate.toDateString() === tomorrow.toDateString()
      const inThisWeek = !!sDate && sDate >= startWeek && sDate <= endWeek

      if (isToday) todayCount++
      if (isTomorrow) tomorrowCount++
      if (inThisWeek) weekCount++

      // Effective schedule status from real order state
      let statusKey: string
      if (o.status === "delivered") statusKey = "completed"
      else if (o.status === "canceled") statusKey = "cancelled"
      else if (o.accepted_driver_id) statusKey = "confirmed"
      else if (o.status === "accepted" || o.status === "picked_up") statusKey = "pending"
      else statusKey = "unassigned"

      if (statusKey === "confirmed" || statusKey === "completed") confirmed++
      else if (statusKey === "pending") pending++
      else if (statusKey === "unassigned") unassigned++
      else cancelled++

      const driver = o.driver as any
      const driverName = driver?.full_name || null
      const itemDetails = o.item_details as any
      const vehicleLabel = o.vehicle_type ? o.vehicle_type.charAt(0).toUpperCase() + o.vehicle_type.slice(1) : null
      const profile = driverName && o.accepted_driver_id ? profileMap[o.accepted_driver_id] : undefined
      const driverRating = profile?.rating != null ? profile.rating.toFixed(1) : null
      const driverPlate = profile?.plate || null

      return {
        id: `SCH-${o.id.slice(0, 5).toUpperCase()}`,
        fullId: o.id,
        scheduledDate: o.scheduled_date,
        date: sDate ? sDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
        window: `${fmtTime(o.scheduled_time_start)} - ${fmtTime(o.scheduled_time_end)}`,
        windowNote: isToday ? "Today" : isTomorrow ? "Tomorrow" : sDate ? sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
        windowColor: isToday ? "text-sendme" : isTomorrow ? "text-info" : "text-text-muted",
        from: extractArea(o.pickup_address),
        to: extractArea(o.dropoff_address),
        fromAddr: o.pickup_address || "—",
        customer: o.sender_name || "—",
        customerType: "Customer",
        driver: driverName,
        driverRating: driverName ? driverRating : null,
        vehicle: vehicleLabel || "Not assigned",
        vehiclePlate: vehicleLabel ? driverPlate : null,
        driverAvatar: driverName ? driverName[0] : null,
        status: STATUS_META[statusKey].label,
        statusKey,
        statusColor: STATUS_META[statusKey].color,
        isToday,
        isTomorrow,
        inThisWeek,
        payment: o.payment_method ? o.payment_method.charAt(0).toUpperCase() + o.payment_method.slice(1) : "—",
        itemType: itemDetails?.size ? `${itemDetails.size.charAt(0).toUpperCase() + itemDetails.size.slice(1)} Item` : itemDetails?.category || "Standard",
        created_at: o.created_at,
      }
    })

    const statusTabs = [
      { name: "All Schedules", count: schedules.length },
      { name: "Today", count: todayCount },
      { name: "Tomorrow", count: tomorrowCount },
      { name: "This Week", count: weekCount },
      { name: "Custom Range", count: 0 },
    ]

    const stats = [
      { label: "Scheduled Today", value: todayCount, icon: "calendar" },
      { label: "Confirmed", value: confirmed, icon: "check" },
      { label: "Confirmation Pending", value: pending, icon: "clock" },
      { label: "Unassigned", value: unassigned, icon: "userx" },
      { label: "Cancelled / At Risk", value: cancelled, icon: "alert" },
    ]

    let filteredSchedules = schedules
    if (status) {
      filteredSchedules = filteredSchedules.filter((s) => s.statusKey.toLowerCase() === status.toLowerCase() || s.status.toLowerCase() === status.toLowerCase())
    }
    if (dateRange === "today") {
      filteredSchedules = filteredSchedules.filter((s) => s.isToday)
    } else if (dateRange === "tomorrow") {
      filteredSchedules = filteredSchedules.filter((s) => s.isTomorrow)
    } else if (dateRange === "this_week") {
      filteredSchedules = filteredSchedules.filter((s) => s.inThisWeek)
    } else if (dateRange === "next_week") {
      const nextWeekStart = new Date(endWeek.getTime() + 864e5)
      const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 864e5)
      filteredSchedules = filteredSchedules.filter((s) => {
        if (!s.scheduledDate) return false
        const d = new Date(s.scheduledDate + "T12:00:00")
        return d >= nextWeekStart && d <= nextWeekEnd
      })
    } else if (dateRange === "this_month") {
      filteredSchedules = filteredSchedules.filter((s) => {
        if (!s.scheduledDate) return false
        const d = new Date(s.scheduledDate + "T12:00:00")
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
    }

    return NextResponse.json({
      stats,
      statusTabs,
      schedules: filteredSchedules,
      total: filteredSchedules.length,
    })
  } catch (err) {
    console.error("[Schedules] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}