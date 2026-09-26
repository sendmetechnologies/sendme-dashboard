import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { reverseGeocodeArea } from "@/lib/geocode";

// Calculate Great-Circle distance using Haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Detect Nigerian state from address or coordinates
function detectState(address: string, lat?: number | null, lng?: number | null): string {
  const addr = (address || "").toLowerCase();

  // Keyword check from address
  if (
    addr.includes("lagos") ||
    addr.includes("ikeja") ||
    addr.includes("lekki") ||
    addr.includes("surulere") ||
    addr.includes("yaba") ||
    addr.includes("victoria island") ||
    addr.includes("ikoyi") ||
    addr.includes("akowonjo") ||
    addr.includes("mushin") ||
    addr.includes("ikorodu") ||
    addr.includes("epe") ||
    addr.includes("sangotedo")
  ) {
    return "Lagos";
  }

  if (
    addr.includes("abuja") ||
    addr.includes("fct") ||
    addr.includes("garki") ||
    addr.includes("wuse") ||
    addr.includes("maitama") ||
    addr.includes("asokoro") ||
    addr.includes("gwarinpa") ||
    addr.includes("kubwa") ||
    addr.includes("jabi") ||
    addr.includes("utako") ||
    addr.includes("lugbe") ||
    addr.includes("masaka") ||
    addr.includes("karu") ||
    addr.includes("nasarawa")
  ) {
    return "FCT - Abuja";
  }

  if (addr.includes("rivers") || addr.includes("port harcourt") || addr.includes("rumuokoro")) {
    return "Rivers";
  }

  if (addr.includes("oyo") || addr.includes("ibadan") || addr.includes("bodija")) {
    return "Oyo";
  }

  if (addr.includes("kano")) return "Kano";
  if (addr.includes("edo") || addr.includes("benin")) return "Edo";
  if (addr.includes("enugu")) return "Enugu";
  if (addr.includes("ogun") || addr.includes("abeokuta")) return "Ogun";
  if (addr.includes("delta") || addr.includes("warri") || addr.includes("asaba")) return "Delta";

  // Coordinate bounding boxes check
  if (lat != null && lng != null) {
    if (lat >= 6.2 && lat <= 6.85 && lng >= 3.0 && lng <= 4.2) return "Lagos";
    if (lat >= 8.6 && lat <= 9.4 && lng >= 6.9 && lng <= 7.8) return "FCT - Abuja";
    if (lat >= 4.6 && lat <= 5.2 && lng >= 6.8 && lng <= 7.4) return "Rivers";
    if (lat >= 7.1 && lat <= 7.7 && lng >= 3.6 && lng <= 4.2) return "Oyo";
  }

  return "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const radiusParam = parseFloat(searchParams.get("radius") || "30") || 30;

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, pickup_lat, pickup_lng, pickup_address, dropoff_address, final_price, vehicle_type, status")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderLat = order.pickup_lat != null ? Number(order.pickup_lat) : null;
    const orderLng = order.pickup_lng != null ? Number(order.pickup_lng) : null;
    const detectedState = detectState(order.pickup_address || "", orderLat, orderLng);

    // Fetch all active drivers from users + driver_profiles
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        full_name,
        phone,
        email,
        state,
        avatar_url,
        created_at,
        is_suspended,
        is_deleted,
        driver_profiles(
          id,
          vehicle_info,
          is_online,
          current_lat,
          current_lng,
          last_location_at,
          verification_status,
          rating,
          is_suspended,
          is_deleted
        )
      `)
      .eq("role", "driver")
      .neq("is_deleted", true)
      .neq("is_suspended", true);

    if (driversError) {
      console.error("[NearbyRiders] Drivers query error:", driversError.message);
      return NextResponse.json({ error: driversError.message }, { status: 500 });
    }

    const rawList = drivers || [];

    // Map each driver and compute distance / duration / state matching
    const mapped = rawList
      .map((d: any) => {
        const dp = Array.isArray(d.driver_profiles) ? d.driver_profiles[0] : d.driver_profiles;
        if (dp?.is_deleted === true || dp?.is_suspended === true) return null;

        const vp = dp?.vehicle_info as any;
        const vehicleType = vp?.type || vp?.vehicle_type || "Motorcycle";

        const riderLat = dp?.current_lat != null ? Number(dp.current_lat) : null;
        const riderLng = dp?.current_lng != null ? Number(dp.current_lng) : null;

        let distanceKm: number | null = null;
        let durationMin: number | null = null;

        if (orderLat != null && orderLng != null && riderLat != null && riderLng != null) {
          distanceKm = getDistanceKm(orderLat, orderLng, riderLat, riderLng);
          // Urban transit estimate: ~2.5 mins per km, min 3 mins
          durationMin = Math.max(3, Math.round(distanceKm * 2.5));
        }

        const riderState = (d.state || "").trim();
        const isStateMatch =
          detectedState && riderState
            ? riderState.toLowerCase().includes(detectedState.toLowerCase()) ||
              detectedState.toLowerCase().includes(riderState.toLowerCase()) ||
              // Treat Masaka/Nasarawa & Abuja as matching metro areas
              ((detectedState.includes("Abuja") || detectedState.includes("Nasarawa")) &&
                (riderState.includes("Abuja") || riderState.includes("Nasarawa")))
            : false;

        const isCloseby = distanceKm != null && distanceKm <= 15;

        return {
          id: d.id,
          name: d.full_name || "Rider",
          phone: d.phone || null,
          email: d.email || null,
          state: riderState || null,
          avatarUrl: d.avatar_url || null,
          vehicleType,
          rating: dp?.rating ? Number(dp.rating).toFixed(1) : "5.0",
          verificationStatus: dp?.verification_status || "pending",
          isOnline: dp?.is_online === true,
          lastLocationAt: dp?.last_location_at || null,
          lat: riderLat,
          lng: riderLng,
          distanceKm,
          durationMin,
          isCloseby,
          isStateMatch,
          area: null as string | null,
        };
      })
      .filter(Boolean) as any[];

    // Filter candidates:
    // 1. If rider has live GPS distance within radius OR is closeby (<15km)
    // 2. OR if rider's state matches the pickup state
    // 3. Fallback: if no state matched, include all riders up to 100
    let candidates = mapped.filter((r) => {
      if (r.distanceKm != null && r.distanceKm <= radiusParam) return true;
      if (r.isStateMatch) return true;
      return false;
    });

    // If candidate list is empty, expand to all state riders or all online riders
    if (candidates.length === 0) {
      if (detectedState) {
        candidates = mapped.filter(
          (r) =>
            r.state?.toLowerCase().includes(detectedState.toLowerCase()) ||
            detectedState.toLowerCase().includes(r.state?.toLowerCase() || "")
        );
      }
      if (candidates.length === 0) {
        // Return active riders (online first)
        candidates = mapped.slice(0, 50);
      }
    }

    // Try reverse geocoding for riders with live GPS (limit to first 6 to preserve latency)
    const geocodeTargets = candidates.filter((r) => r.lat != null && r.lng != null).slice(0, 6);
    await Promise.all(
      geocodeTargets.map(async (r) => {
        try {
          r.area = await reverseGeocodeArea(r.lat, r.lng);
        } catch {
          r.area = null;
        }
      })
    );

    // Sort riders:
    // 1. Closest GPS distance first
    // 2. Then online riders
    // 3. Then by name
    candidates.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm != null && b.distanceKm == null) return -1;
      if (a.distanceKm == null && b.distanceKm != null) return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    const summary = {
      total: candidates.length,
      onlineCount: candidates.filter((r) => r.isOnline).length,
      offlineCount: candidates.filter((r) => !r.isOnline).length,
      closebyCount: candidates.filter((r) => r.isCloseby).length,
      withCoordsCount: candidates.filter((r) => r.distanceKm != null).length,
      detectedState: detectedState || "All Regions",
    };

    return NextResponse.json({
      order: {
        id: order.id,
        pickupAddress: order.pickup_address,
        dropoffAddress: order.dropoff_address,
        fare: order.final_price,
        vehicleType: order.vehicle_type,
        pickupLat: orderLat,
        pickupLng: orderLng,
        detectedState,
      },
      riders: candidates,
      summary,
      radius: radiusParam,
    });
  } catch (err: any) {
    console.error("[NearbyRiders] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
