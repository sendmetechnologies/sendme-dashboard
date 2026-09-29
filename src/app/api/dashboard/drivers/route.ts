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

function matchesState(
  driverCity: string,
  filterState: string,
  lat?: number | null,
  lng?: number | null
): boolean {
  if (!filterState || filterState === "All" || filterState === "All States") return true
  const f = filterState.toLowerCase().trim()
  const d = (driverCity || "").toLowerCase().trim()

  // Special handling for FCT / Abuja (covers "FCT", "Abuja", "FCT - Abuja", "Federal Capital Territory")
  if (f === "fct" || f === "abuja" || f.includes("abuja") || f.includes("fct")) {
    if (d.includes("abuja") || d.includes("fct") || d.includes("federal capital")) return true
    if (lat != null && lng != null && lat >= 8.2 && lat <= 9.5 && lng >= 6.7 && lng <= 7.8) return true
    return false
  }

  // Lagos check (covers "Lagos", "Lagos State", coordinates in Lagos)
  if (f === "lagos" || f.includes("lagos")) {
    if (d.includes("lagos")) return true
    if (lat != null && lng != null && lat >= 6.2 && lat <= 6.8 && lng >= 2.6 && lng <= 4.4) return true
    return false
  }

  // General clean alphanumeric match for other Nigerian states (e.g. Akwa Ibom, Cross River, etc.)
  const cleanF = f.replace(/[^a-z0-9]/g, "")
  const cleanD = d.replace(/[^a-z0-9]/g, "")
  if (cleanD.includes(cleanF) || cleanF.includes(cleanD)) return true

  return false
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    
    // Parent filters
    const search = searchParams.get("search")?.trim().toLowerCase() || null
    const state = searchParams.get("state")?.trim() || null
    const vehicleTypeFilter = searchParams.get("vehicle_type")?.trim().toLowerCase() || null
    const ratingMin = searchParams.get("rating_min") ? parseFloat(searchParams.get("rating_min")!) : null
    const radiusParam = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : null
    const latParam = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null
    const lngParam = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null
    
    // Child filter tab & dropdown overrides
    const tab = searchParams.get("tab") || "All Drivers"
    const statusFilter = searchParams.get("status") || null
    const onlineFilter = searchParams.get("online") || null

    // ── Concurrently fetch all driver records, org relations, removed marketers, wallets, and orders ──
    const [driversRes, orgDriversRes, marketerProfilesRes, walletsRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select(`
          id, full_name, phone, email, state, created_at, is_onboarded, linked_org_id, is_suspended, is_deleted,
          driver_profiles(verification_status, rating, vehicle_info, is_online, review_reason, trips_count, id_details, is_suspended, is_deleted, current_lat, current_lng)
        `)
        .eq("role", "driver")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("organization_drivers")
        .select("user_id, phone, organization_id"),
      supabaseAdmin
        .from("marketer_profiles")
        .select("user_id")
        .eq("status", "removed"),
      supabaseAdmin
        .from("wallets")
        .select("user_id, balance"),
      supabaseAdmin
        .from("orders")
        .select("accepted_driver_id")
        .eq("status", "delivered")
        .not("accepted_driver_id", "is", null),
    ])

    if (driversRes.error) {
      console.error("[Drivers API] Fetch drivers error:", driversRes.error.message)
      return NextResponse.json({ error: driversRes.error.message }, { status: 500 })
    }

    const rawDrivers = driversRes.data || []
    
    // Index organization drivers by user_id and normalized phone
    const orgDriverUserIds = new Set<string>()
    const orgDriverPhones = new Set<string>()
    for (const od of orgDriversRes.data || []) {
      if (od.user_id) orgDriverUserIds.add(od.user_id)
      if (od.phone) {
        const clean = od.phone.replace(/\D/g, "")
        if (clean) orgDriverPhones.add(clean)
      }
    }

    // Index removed marketers
    const removedMarketerIds = new Set((marketerProfilesRes.data || []).map((m: any) => m.user_id))

    // Index wallets
    const walletMap = new Map<string, number>()
    for (const w of walletsRes.data || []) {
      walletMap.set(w.user_id, Number(w.balance) || 0)
    }

    // Index trip counts from delivered orders
    const tripCountMap = new Map<string, number>()
    for (const o of ordersRes.data || []) {
      if (o.accepted_driver_id) {
        tripCountMap.set(o.accepted_driver_id, (tripCountMap.get(o.accepted_driver_id) || 0) + 1)
      }
    }

    const isHttpUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v)

    // Map all raw drivers into structured DriverRow objects
    const allFormattedDrivers = rawDrivers.map((d) => {
      const profileEmbed = (d as any).driver_profiles
      const profile = Array.isArray(profileEmbed) ? profileEmbed[0] : profileEmbed
      const vp = profile?.vehicle_info as any
      const vehicleType = vp?.type || "—"
      const vehiclePlate = vp?.plate || "—"
      const rating = profile?.rating != null ? Number(profile.rating) : null
      const trips = tripCountMap.get(d.id) ?? profile?.trips_count ?? 0
      const verificationStatus = profile?.verification_status || "pending"
      const isOnline = profile?.is_online === true
      const isSuspended = profile?.is_suspended === true || (d as any).is_suspended === true
      const isDeleted = profile?.is_deleted === true || (d as any).is_deleted === true
      
      const idDetails = (profile?.id_details && typeof profile.id_details === "object" ? profile.id_details : {}) as Record<string, unknown>
      const hasSubmittedDocs = Object.values(idDetails).some(isHttpUrl)
      const isOnboarded = (d as any)?.is_onboarded === true
      const isIncomplete = !hasSubmittedDocs && verificationStatus !== "verified" && verificationStatus !== "rejected" && !isOnboarded

      let statusLabel = "Pending Review"
      let statusColor = "bg-warning-light text-warning"
      const isRemovedMarketer = removedMarketerIds.has(d.id)
      if (isRemovedMarketer) { 
        statusLabel = "Removed marketer"
        statusColor = "bg-surface-secondary text-text-muted" 
      } else if (isSuspended) { 
        statusLabel = "Suspended"
        statusColor = "bg-warning-light text-warning" 
      } else if (isDeleted) { 
        statusLabel = "Deactivated"
        statusColor = "bg-surface-secondary text-text-muted" 
      } else if (verificationStatus === "verified") { 
        statusLabel = "Approved"
        statusColor = "bg-sendme-50 text-sendme" 
      } else if (verificationStatus === "rejected") { 
        statusLabel = "Rejected"
        statusColor = "bg-danger-light text-danger" 
      } else if (isIncomplete) { 
        statusLabel = "Incomplete Registration"
        statusColor = "bg-surface-secondary text-text-muted" 
      }

      // Check organization linkage
      const phoneClean = (d.phone || "").replace(/\D/g, "")
      const isOrgLinked = Boolean(
        d.linked_org_id ||
        orgDriverUserIds.has(d.id) ||
        (phoneClean && orgDriverPhones.has(phoneClean))
      )
      const driverType = isOrgLinked ? "Organization-linked" : "Independent"
      const typeColor = isOrgLinked ? "bg-purple-50 text-purple-700" : "bg-sendme-50 text-sendme"

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
        type: driverType,
        typeColor,
        isOrgLinked,
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

    // ── STEP 1: APPLY PARENT FILTERS ──
    // Parent filters narrow down the candidate pool of drivers
    let parentFiltered = allFormattedDrivers

    // State filter
    if (state && state !== "All" && state !== "All States") {
      parentFiltered = parentFiltered.filter((d) => matchesState(d.city, state, d.latitude, d.longitude))
    }

    // Free text search (name, phone, email, plate, vehicle, ID)
    if (search) {
      parentFiltered = parentFiltered.filter((d) => 
        d.name.toLowerCase().includes(search) ||
        d.phone.toLowerCase().includes(search) ||
        d.email.toLowerCase().includes(search) ||
        d.vehiclePlate.toLowerCase().includes(search) ||
        d.vehicle.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search)
      )
    }

    // Vehicle type filter
    if (vehicleTypeFilter && vehicleTypeFilter !== "all" && vehicleTypeFilter !== "all vehicles") {
      parentFiltered = parentFiltered.filter((d) => d.vehicle.toLowerCase().includes(vehicleTypeFilter))
    }

    // Rating filter
    if (ratingMin != null) {
      parentFiltered = parentFiltered.filter((d) => d.ratingNum != null && d.ratingNum >= ratingMin)
    }

    // Radius & Coordinate Hub filter
    const isRadiusActive = radiusParam != null && latParam != null && lngParam != null
    if (isRadiusActive && radiusParam != null) {
      parentFiltered = parentFiltered.filter((d) => d.distanceKm != null && d.distanceKm <= radiusParam)
      // Sort by distance (closest first)
      parentFiltered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
    }

    // If dropdown filters are also explicitly set from the top filter bar
    if (statusFilter && statusFilter !== "All Status" && statusFilter !== "All Drivers") {
      parentFiltered = parentFiltered.filter((d) => d.status === statusFilter)
    }
    if (onlineFilter === "online") {
      parentFiltered = parentFiltered.filter((d) => d.online)
    } else if (onlineFilter === "offline") {
      parentFiltered = parentFiltered.filter((d) => !d.online)
    }

    // ── STEP 2: DYNAMICALLY COMPUTE CHILD TAB COUNTS & STATS ──
    // Tab badges MUST strictly sync with the parent-filtered set!
    const tabCounts: Record<string, number> = {
      "All Drivers": parentFiltered.length,
      "Online Now": parentFiltered.filter((d) => d.online).length,
      "Approved": parentFiltered.filter((d) => d.status === "Approved").length,
      "Pending Review": parentFiltered.filter((d) => d.status === "Pending Review" || d.status === "Incomplete Registration").length,
      "Suspended": parentFiltered.filter((d) => d.status === "Suspended").length,
      "Independent": parentFiltered.filter((d) => !d.isOrgLinked).length,
      "Organization-linked": parentFiltered.filter((d) => d.isOrgLinked).length,
    }

    const totalBalance = parentFiltered.reduce((sum, d) => sum + (walletMap.get(d.id) || 0), 0)

    const stats = {
      total: parentFiltered.length,
      approved: tabCounts["Approved"],
      pending: tabCounts["Pending Review"],
      suspended: tabCounts["Suspended"],
      blocked: parentFiltered.filter((d) => d.status === "Rejected").length,
      onlineNow: tabCounts["Online Now"],
      totalBalance,
      totalBalanceFormatted: `₦${totalBalance.toLocaleString()}`,
    }

    // ── STEP 3: APPLY CHILD FILTER TAB ──
    let tabFiltered = parentFiltered
    if (tab === "Online Now") {
      tabFiltered = tabFiltered.filter((d) => d.online)
    } else if (tab === "Approved") {
      tabFiltered = tabFiltered.filter((d) => d.status === "Approved")
    } else if (tab === "Pending Review") {
      tabFiltered = tabFiltered.filter((d) => d.status === "Pending Review" || d.status === "Incomplete Registration")
    } else if (tab === "Suspended") {
      tabFiltered = tabFiltered.filter((d) => d.status === "Suspended")
    } else if (tab === "Independent") {
      tabFiltered = tabFiltered.filter((d) => !d.isOrgLinked)
    } else if (tab === "Organization-linked") {
      tabFiltered = tabFiltered.filter((d) => d.isOrgLinked)
    }

    // ── STEP 4: PAGINATION & GEOCODING ──
    const totalCount = tabFiltered.length
    const paginatedDrivers = tabFiltered.slice((page - 1) * limit, page * limit)

    // Reverse-geocode drivers with locations on the current page slice
    const located = paginatedDrivers.filter((d) => d.latitude != null && d.longitude != null).slice(0, 20)
    if (located.length > 0) {
      const geoResults = await Promise.all(
        located.map((d) => reverseGeocodeArea(d.latitude as number, d.longitude as number)),
      )
      located.forEach((d, i) => {
        d.locationLabel = geoResults[i]
      })
    }

    return NextResponse.json({
      stats,
      tabCounts,
      drivers: paginatedDrivers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    })
  } catch (err) {
    console.error("[Drivers API] Internal error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
