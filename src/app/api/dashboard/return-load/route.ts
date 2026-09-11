import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function fmtCreated(iso: string): string {
  const d = new Date(iso)
  return `Created ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  searching: "Searching for driver",
  bidding: "Open for bids",
  accepted: "Driver Assigned",
  picked_up: "In Transit",
  delivered: "Delivered",
  canceled: "Cancelled",
}

export async function GET() {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from("return_load_plans")
      .select(`
        id, driver_id, current_city, current_address, current_lat, current_lng,
        destination_city, destination_address, destination_lat, destination_lng,
        return_date, return_time_start, return_time_end, available_for_load,
        vehicle_type, max_weight_kg, created_at, updated_at,
        driver:users!return_load_plans_driver_id_fkey(full_name, phone)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Return Load] Plans query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = plans || []
    const planIds = list.map((p) => p.id)
    const driverIds = Array.from(new Set(list.map((p) => p.driver_id)))

    // Matched loads per plan (orders booked onto a return route)
    const matchedByPlan: Record<string, any[]> = {}
    if (planIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id, status, final_price, created_at, return_load_plan_id")
        .eq("is_return_load", true)
        .in("return_load_plan_id", planIds)
      ;(orders || []).forEach((o) => {
        ;(matchedByPlan[o.return_load_plan_id] = matchedByPlan[o.return_load_plan_id] || []).push(o)
      })
    }

    // Driver vehicle plates
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

    let availableCount = 0
    let matchedCount = 0
    let completedCount = 0

    const routes = list.map((p) => {
      const matchOrders = matchedByPlan[p.id] || []
      const activeMatch = matchOrders.find((o) => o.status !== "delivered" && o.status !== "canceled")
      const deliveredCount = matchOrders.filter((o) => o.status === "delivered").length
      const canceledCount = matchOrders.filter((o) => o.status === "canceled").length

      let status: string
      let statusNote: string
      let statusColor: string
      let matchScore: string | null

      if (activeMatch) {
        status = "Matched"
        statusNote = ORDER_STATUS_LABEL[activeMatch.status] || "Driver Assigned"
        statusColor = "bg-sendme-50 text-sendme"
        matchScore = "100"
      } else if (deliveredCount > 0) {
        status = "Completed"
        statusNote = `${deliveredCount} load${deliveredCount > 1 ? "s" : ""} delivered`
        statusColor = "bg-sendme-50 text-sendme"
        matchScore = "100"
      } else if (canceledCount > 0) {
        status = "Cancelled"
        statusNote = "No driver found"
        statusColor = "bg-danger-light text-danger"
        matchScore = null
      } else if (p.available_for_load) {
        status = "Available"
        statusNote = "Open for match"
        statusColor = "bg-info-light text-info"
        matchScore = null
      } else {
        status = "Unavailable"
        statusNote = "Not accepting loads"
        statusColor = "bg-surface-secondary text-text-muted"
        matchScore = null
      }

      if (status === "Available") availableCount++
      else if (status === "Matched") matchedCount++
      else if (status === "Completed") completedCount++

      const driver = p.driver as any
      const driverName = driver?.full_name || null
      const capacity = p.max_weight_kg != null ? `${p.max_weight_kg} kg` : "—"

      return {
        id: `RL-${p.id.slice(0, 5).toUpperCase()}`,
        fullId: p.id,
        created: fmtCreated(p.created_at),
        iconBg: status === "Available" ? "bg-info" : status === "Completed" ? "bg-sendme" : status === "Cancelled" ? "bg-danger" : "bg-warning",
        iconLetter: "RL",
        from: p.current_city || "—",
        fromState: p.current_address || (p.current_city ? `${p.current_city}${p.current_lat ? " · coordinates available" : ""}` : "—"),
        to: p.destination_city || "—",
        toState: p.destination_address || (p.destination_city ? `${p.destination_city}` : "—"),
        vehicle: p.vehicle_type || "—",
        capacity,
        status,
        statusNote,
        statusColor,
        matchScore,
        driver: driverName,
        driverPlate: driverName ? (plateMap[p.driver_id] || null) : null,
        driverAvatar: driverName ? driverName[0] : null,
        returnDate: p.return_date,
        created_at: p.created_at,
      }
    })

    const statusTabs = [
      { name: "All Routes", count: routes.length },
      { name: "Available Loads", count: availableCount },
      { name: "Matched", count: matchedCount },
      { name: "Completed", count: completedCount },
    ]

    const stats = [
      { label: "Active Return Routes", value: routes.length, icon: "routes" },
      { label: "Available Loads", value: availableCount, icon: "package" },
      { label: "Matched (In Progress)", value: matchedCount, icon: "check" },
      { label: "Completed Loads", value: completedCount, icon: "done" },
      { label: "Unmatched Loads", value: routes.filter((r) => r.status === "Available" || r.status === "Unavailable").length, icon: "alert" },
    ]

    return NextResponse.json({
      stats,
      statusTabs,
      routes,
      total: routes.length,
    })
  } catch (err) {
    console.error("[Return Load] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}