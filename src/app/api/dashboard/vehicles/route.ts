import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || null
    const vehicleType = searchParams.get("type") || null
    const state = searchParams.get("state") || null
    const statusFilter = searchParams.get("status") || null
    const offset = (page - 1) * limit

    const { data: driversWithProfiles, error } = await supabaseAdmin
      .from("users")
      .select(`
        id, full_name, phone, email, state, created_at,
        driver_profiles(
          id, verification_status, vehicle_info, is_online, is_suspended, is_deleted, rating, trips_count
        )
      `)
      .eq("role", "driver")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Vehicles API] Query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let activeCount = 0
    let inactiveCount = 0
    let underReviewCount = 0
    let blacklistedCount = 0

    const vehicleList: any[] = []

    for (const d of driversWithProfiles || []) {
      const profile = Array.isArray(d.driver_profiles) ? d.driver_profiles[0] : d.driver_profiles
      const vInfo = (profile?.vehicle_info as any) || {}
      const vType = vInfo?.type || "Motorbike"
      const vPlate = vInfo?.plate || "—"
      const vModel = vInfo?.model || vInfo?.make || (vType.toLowerCase().includes("bike") ? "Bajaj Boxer BM150" : "Commercial Vehicle")
      const vVin = vInfo?.vin || "—"

      const isSuspended = profile?.is_suspended === true
      const isDeleted = profile?.is_deleted === true
      const isVerified = profile?.verification_status === "verified"
      const isPending = profile?.verification_status === "pending" || profile?.verification_status === "under_review"

      let status = "Active"
      let statusColor = "bg-sendme-50 text-sendme"
      let statusNote = "Active"

      if (isSuspended || isDeleted) {
        status = "Blacklisted"
        statusColor = "bg-danger-light text-danger"
        statusNote = isDeleted ? "Deactivated" : "Suspended"
        blacklistedCount++
      } else if (isPending) {
        status = "Under Review"
        statusColor = "bg-warning-light text-warning"
        statusNote = "Pending inspection"
        underReviewCount++
      } else if (profile?.is_online) {
        status = "Active"
        statusColor = "bg-sendme-50 text-sendme"
        statusNote = "On duty (online)"
        activeCount++
      } else {
        status = "Inactive"
        statusColor = "bg-surface-secondary text-text-muted"
        statusNote = "Offline"
        inactiveCount++
      }

      vehicleList.push({
        id: profile?.id || d.id,
        driverId: d.id,
        plate: vPlate,
        vin: vVin,
        type: vType,
        model: vModel,
        driver: d.full_name || "Unassigned",
        driverPhone: d.phone || "—",
        driverAvatar: (d.full_name || "?")[0],
        status,
        verified: isVerified,
        statusColor,
        statusNote,
        city: d.state || "Lagos",
        area: d.state || "—",
        docs: isVerified ? 3 : 1,
        added: new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      })
    }

    let filtered = vehicleList

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.plate.toLowerCase().includes(q) ||
          v.driver.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q)
      )
    }

    if (vehicleType) {
      const vt = vehicleType.toLowerCase()
      filtered = filtered.filter((v) => v.type.toLowerCase().includes(vt))
    }

    if (state) {
      filtered = filtered.filter((v) => v.city.toLowerCase() === state.toLowerCase())
    }

    if (statusFilter && statusFilter !== "All" && statusFilter !== "All Vehicles") {
      filtered = filtered.filter((v) => v.status.toLowerCase() === statusFilter.toLowerCase())
    }

    const total = filtered.length
    const paged = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      stats: {
        total: vehicleList.length,
        active: activeCount,
        inactive: inactiveCount,
        underReview: underReviewCount,
        blacklisted: blacklistedCount,
      },
      vehicles: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error("[Vehicles API] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
