import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { reverseGeocodeArea } from "@/lib/geocode"

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const statusFilter = searchParams.get("status") || null
    const search = searchParams.get("search") || null
    const state = searchParams.get("state") || null
    const online = searchParams.get("online") || null
    const vehicleTypeFilter = searchParams.get("vehicle_type") || null
    const ratingMin = searchParams.get("rating_min") ? parseFloat(searchParams.get("rating_min")!) : null
    const radiusParam = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : null
    const latParam = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null
    const lngParam = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null

    const statusMap: Record<string, string[]> = {
      "Approved": ["verified"],
      "Pending Review": ["pending", "under_review"],
      "Rejected": ["rejected"],
    }

    // ── Total riders from users table (source of truth) ──
    const { count: totalRiders } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver")

    // ── Get all driver profile statuses in one query ──
    const { data: allProfiles } = await supabaseAdmin
      .from("driver_profiles")
      .select("id, verification_status, is_online, is_suspended, is_deleted")

    const profiles = allProfiles || []
    const verifiedCount = profiles.filter((p) => p.verification_status === "verified").length
    const pendingCount = profiles.filter((p) => p.verification_status === "pending" || p.verification_status === "under_review").length
    const rejectedCount = profiles.filter((p) => p.verification_status === "rejected" && p.is_suspended !== true).length
    const suspendedCount = profiles.filter((p) => p.is_suspended === true).length
    const onlineCount = profiles.filter((p) => p.is_online === true).length

    // Riders WITHOUT a driver_profile row (signed up but not onboarded)
    const ridersWithoutProfile = (totalRiders || 0) - profiles.length

    const tabCounts: Record<string, number> = {
      "All Drivers": totalRiders || 0,
      "Independent": totalRiders || 0,
      "Organization-linked": 0,
      "Online Now": onlineCount,
    }

    // ── Get marketer profiles to check for removed status ──
    const { data: marketerProfiles } = await supabaseAdmin
      .from("marketer_profiles")
      .select("user_id, status")
      .eq("status", "removed")
    const removedMarketerIds = new Set((marketerProfiles || []).map((p: any) => p.user_id))

    // ── Build query on users table (primary) ──
    let query = supabaseAdmin
      .from("users")
      .select(`
        id, full_name, phone, email, state, created_at, is_onboarded,
        driver_profiles(verification_status, rating, vehicle_info, is_online, review_reason, trips_count, id_details, is_suspended, is_deleted, current_lat, current_lng)
      `)
      .eq("role", "driver")
      .order("created_at", { ascending: false })

    if (statusFilter && statusFilter !== "All Drivers" && statusFilter !== "All Status") {
      if (statusFilter === "Suspended") {
        query = query.eq("driver_profiles.is_suspended", true)
      } else if (statusFilter === "Deactivated") {
        query = query.eq("driver_profiles.is_deleted", true)
      } else {
        const dbStatuses = statusMap[statusFilter]
        if (dbStatuses) {
          query = query.in("driver_profiles.verification_status", dbStatuses)
        }
      }
    }

    if (state) {
      query = query.eq("state", state)
    }

    if (online === "online") {
      query = query.eq("driver_profiles.is_online", true)
    } else if (online === "offline") {
      query = query.not("driver_profiles.is_online", "is", true)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,id.ilike.%${search}%`)
    }

    // If radius filtering is requested, we fetch a broader set of drivers to filter and calculate distance in-memory
    const isRadiusActive = radiusParam != null && latParam != null && lngParam != null
    const fetchLimit = isRadiusActive ? 250 : limit
    const fetchOffset = isRadiusActive ? 0 : (page - 1) * limit

    const { data: drivers, error } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1)

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

    let formatted = (drivers || []).map((d) => {
      const profileEmbed = (d as any).driver_profiles
      const profile = Array.isArray(profileEmbed) ? profileEmbed[0] : profileEmbed
      const vp = profile?.vehicle_info as any
      const vehicleType = vp?.type || "—"
      const vehiclePlate = vp?.plate || "—"
      const rating = profile?.rating != null ? Number(profile.rating) : null
      const trips = tripCounts[d.id] || profile?.trips_count || 0
      const verificationStatus = profile?.verification_status || "pending"
      const isOnline = profile?.is_online || false
      const isSuspended = profile?.is_suspended === true
      const isDeleted = profile?.is_deleted === true
      const isHttpUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v)
      const idDetails = (profile?.id_details && typeof profile.id_details === "object" ? profile.id_details : {}) as Record<string, unknown>
      const hasSubmittedDocs = Object.values(idDetails).some(isHttpUrl)
      const isOnboarded = (d as any)?.is_onboarded === true
      const isIncomplete = !hasSubmittedDocs && verificationStatus !== "verified" && verificationStatus !== "rejected" && !isOnboarded

      let statusLabel = "Pending Review"
      let statusColor = "bg-warning-light text-warning"
      const isRemovedMarketer = removedMarketerIds.has(d.id)
      if (isRemovedMarketer) { statusLabel = "Removed marketer"; statusColor = "bg-surface-secondary text-text-muted" }
      else if (isSuspended) { statusLabel = "Suspended"; statusColor = "bg-warning-light text-warning" }
      else if (isDeleted) { statusLabel = "Deactivated"; statusColor = "bg-surface-secondary text-text-muted" }
      else if (verificationStatus === "verified") { statusLabel = "Approved"; statusColor = "bg-sendme-50 text-sendme" }
      else if (verificationStatus === "rejected") { statusLabel = "Rejected"; statusColor = "bg-danger-light text-danger" }
      else if (isIncomplete) { statusLabel = "Incomplete Registration"; statusColor = "bg-surface-secondary text-text-muted" }

      const created = new Date(d.created_at)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      let joinedNote = "Just now"
      if (diffDays > 365) joinedNote = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`
      else if (diffDays > 30) joinedNote = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
      else if (diffDays > 0) joinedNote = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

      const dLat = profile?.current_lat ?? null
      const dLng = profile?.current_lng ?? null
      let distanceKm: number | null = null
      let distanceLabel: string | null = null

      if (latParam != null && lngParam != null && dLat != null && dLng != null) {
        distanceKm = Math.round(haversineDistanceKm(latParam, lngParam, dLat, dLng) * 10) / 10
        distanceLabel = `${distanceKm} km away`
      }

      return {
        id: d.id,
        name: d.full_name || "—",
        phone: d.phone || "—",
        email: d.email || "—",
        avatar: (d.full_name || "?")[0],
        type: "Independent",
        typeColor: "bg-sendme-50 text-sendme",
        vehicle: vehicleType,
        vehiclePlate,
        city: (d as any).state || "—",
        latitude: dLat,
        longitude: dLng,
        distanceKm,
        distanceLabel,
        locationLabel: null as string | null,
        status: statusLabel,
        statusColor,
        online: isOnline,
        rating: rating != null ? String(rating) : "—",
        ratingNum: rating,
        trips,
        joined: created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        joinedNote,
      }
    })

    // Vehicle type filter
    if (vehicleTypeFilter) {
      const vq = vehicleTypeFilter.toLowerCase()
      formatted = formatted.filter((d) => d.vehicle.toLowerCase().includes(vq))
    }

    // Rating filter
    if (ratingMin != null) {
      formatted = formatted.filter((d) => (d.ratingNum != null && d.ratingNum >= ratingMin))
    }

    // Radius filter (if reference hub/coordinates and radius are selected)
    if (isRadiusActive && radiusParam != null) {
      formatted = formatted.filter((d) => d.distanceKm != null && d.distanceKm <= radiusParam)
      // Sort by closest distance first
      formatted.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
    }

    // Reverse-geocode riders with a current location into a short human-readable area
    const located = formatted.filter((d) => d.latitude != null && d.longitude != null).slice(0, 20)
    if (located.length > 0) {
      const geoResults = await Promise.all(
        located.map((d) => reverseGeocodeArea(d.latitude as number, d.longitude as number)),
      )
      located.forEach((d, i) => {
        d.locationLabel = geoResults[i]
      })
    }

    // Paginate in-memory if radius was active
    const totalCount = isRadiusActive ? formatted.length : totalRiders || 0
    const finalDrivers = isRadiusActive ? formatted.slice((page - 1) * limit, page * limit) : formatted

    return NextResponse.json({
      stats: {
        total: totalRiders || 0,
        approved: verifiedCount,
        pending: pendingCount + ridersWithoutProfile,
        suspended: suspendedCount,
        blocked: rejectedCount,
        onlineNow: onlineCount,
        totalBalance,
        totalBalanceFormatted: `₦${totalBalance.toLocaleString()}`,
      },
      tabCounts,
      drivers: finalDrivers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    })
  } catch (err) {
    console.error("[Drivers] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
