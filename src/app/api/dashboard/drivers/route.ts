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

    // ── Total riders from users table (source of truth) ──
    const { count: totalRiders } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver")

    // ── Get all driver profile statuses in one query ──
    const { data: allProfiles } = await supabaseAdmin
      .from("driver_profiles")
      .select("id, verification_status, is_online")

    const profiles = allProfiles || []
    const verifiedCount = profiles.filter((p) => p.verification_status === "verified").length
    const pendingCount = profiles.filter((p) => p.verification_status === "pending" || p.verification_status === "under_review").length
    const rejectedCount = profiles.filter((p) => p.verification_status === "rejected").length
    const onlineCount = profiles.filter((p) => p.is_online === true).length

    // Riders WITHOUT a driver_profile row (signed up but not onboarded)
    const ridersWithoutProfile = (totalRiders || 0) - profiles.length

    const tabCounts: Record<string, number> = {
      "All Drivers": totalRiders || 0,
      "Independent": totalRiders || 0,
      "Organization-linked": 0,
    }

    // ── Build query on users table (primary) ──
    let query = supabaseAdmin
      .from("users")
      .select(`
        id, full_name, phone, email, state, created_at,
        driver_profiles(verification_status, rating, vehicle_info, is_online, review_reason, trips_count)
      `)
      .eq("role", "driver")
      .order("created_at", { ascending: false })

    if (statusFilter && statusFilter !== "All Drivers") {
      const statusMap: Record<string, string[]> = {
        "Approved": ["verified"],
        "Pending Review": ["pending", "under_review"],
        "Suspended": ["rejected"],
        "Blocked": ["rejected"],
      }
      const dbStatuses = statusMap[statusFilter]
      if (dbStatuses) {
        query = query.in("driver_profiles.verification_status", dbStatuses)
      }
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: drivers, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[Drivers] Query error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Get trip counts for each driver ──
    const driverIds = (drivers || []).map((d) => d.id)
    const tripCounts: Record<string, number> = {}
    if (driverIds.length > 0) {
      const { data: trips } = await supabaseAdmin
        .from("orders")
        .select("accepted_driver_id")
        .in("accepted_driver_id", driverIds)
        .eq("status", "delivered")
      if (trips) {
        for (const t of trips) {
          tripCounts[t.accepted_driver_id] = (tripCounts[t.accepted_driver_id] || 0) + 1
        }
      }
    }

    // ── Get total wallet balance for these drivers ──
    let totalBalance = 0
    if (driverIds.length > 0) {
      const { data: walletData } = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .in("user_id", driverIds)
      totalBalance = (walletData || []).reduce((sum, w) => sum + (Number(w.balance) || 0), 0)
    }

    const formatted = (drivers || []).map((d) => {
      const profileEmbed = (d as any).driver_profiles
      const profile = Array.isArray(profileEmbed) ? profileEmbed[0] : profileEmbed
      const vp = profile?.vehicle_info as any
      const vehicleType = vp?.type || "—"
      const vehiclePlate = vp?.plate || "—"
      const rating = profile?.rating || null
      const trips = tripCounts[d.id] || profile?.trips_count || 0
      const verificationStatus = profile?.verification_status || "pending"
      const isOnline = profile?.is_online || false

      let statusLabel = "Pending Review"
      let statusColor = "bg-warning-light text-warning"
      if (verificationStatus === "verified") { statusLabel = "Approved"; statusColor = "bg-sendme-50 text-sendme" }
      else if (verificationStatus === "rejected") { statusLabel = "Suspended"; statusColor = "bg-danger-light text-danger" }
      else if (verificationStatus === "under_review") { statusLabel = "Under Review"; statusColor = "bg-info-light text-info" }

      const created = new Date(d.created_at)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      let joinedNote = "Just now"
      if (diffDays > 365) joinedNote = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`
      else if (diffDays > 30) joinedNote = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
      else if (diffDays > 0) joinedNote = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

      return {
        id: d.id,
        name: d.full_name || "—",
        phone: d.phone || "—",
        avatar: (d.full_name || "?")[0],
        type: "Independent",
        typeColor: "bg-sendme-50 text-sendme",
        vehicle: vehicleType,
        vehiclePlate,
        city: (d as any).state || "—",
        area: "—",
        status: statusLabel,
        statusColor,
        online: isOnline,
        rating: rating ? String(rating) : "—",
        trips,
        joined: created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        joinedNote,
      }
    })

    const totalPages = Math.ceil((totalRiders || 0) / limit)

    return NextResponse.json({
      stats: {
        total: totalRiders || 0,
        approved: verifiedCount,
        pending: pendingCount + ridersWithoutProfile,
        suspended: rejectedCount,
        blocked: 0,
        onlineNow: onlineCount,
        totalBalance,
        totalBalanceFormatted: `₦${totalBalance.toLocaleString()}`,
      },
      tabCounts,
      drivers: formatted,
      pagination: { page, limit, total: totalRiders || 0, totalPages },
    })
  } catch (err) {
    console.error("[Drivers] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
