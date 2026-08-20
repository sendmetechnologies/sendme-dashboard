import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 })
    }

    // ── Fetch the order with all details ──
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select(`
        id, customer_id, pickup_address, dropoff_address, pickup_state,
        status, final_price, vehicle_type, distance_km, created_at,
        updated_at, item_details, item_value, item_description,
        urgency, sender_name, sender_phone, receiver_name, receiver_phone,
        commission_amount, driver_earning, accepted_driver_id,
        bids(id, driver_id, amount, eta, status, created_at, updated_at)
      `)
      .eq("id", id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // ── Fetch customer name ──
    let customerName = (order as any).sender_name || "—"
    let customerPhone = (order as any).sender_phone || "—"
    if ((order as any).customer_id) {
      const { data: customer } = await supabaseAdmin
        .from("users")
        .select("full_name, phone, email")
        .eq("id", (order as any).customer_id)
        .single()
      if (customer) {
        customerName = customer.full_name || customerName
        customerPhone = customer.phone || customerPhone
      }
    }

    // ── Fetch driver info for all bidders ──
    const bids = (order as any).bids || []
    const driverIds = [...new Set(bids.map((b: any) => b.driver_id).filter(Boolean))]
    if ((order as any).accepted_driver_id) {
      driverIds.push((order as any).accepted_driver_id)
    }

    let driverMap: Record<string, any> = {}
    if (driverIds.length > 0) {
      const { data: driverUsers } = await supabaseAdmin
        .from("users")
        .select("id, full_name, phone, email")
        .in("id", driverIds)
      const { data: driverProfiles } = await supabaseAdmin
        .from("driver_profiles")
        .select("id, rating, trips_count, vehicle_info, is_online, total_earnings")
        .in("id", driverIds)

      const userMap = new Map((driverUsers || []).map(u => [u.id, u]))
      for (const p of driverProfiles || []) {
        const u = userMap.get(p.id)
        driverMap[p.id] = {
          name: u?.full_name || "Unknown",
          phone: u?.phone || "—",
          email: u?.email || "—",
          rating: p.rating || 0,
          trips: p.trips_count || 0,
          vehicle: p.vehicle_info || null,
          online: p.is_online || false,
          totalEarnings: Number(p.total_earnings) || 0,
        }
      }
    }

    // ── Fetch commission/transaction data ──
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("id, type, amount, status, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true })

    // ── Build formatted response ──
    const itemDetails = (order as any).item_details as any
    const itemType = itemDetails?.type || itemDetails?.category || "Item"
    const itemWeight = itemDetails?.weight || null

    const formattedBids = bids
      .map((b: any) => ({
        id: b.id,
        driverId: b.driver_id,
        driver: driverMap[b.driver_id] || { name: "Unknown" },
        amount: Number(b.amount),
        eta: b.eta,
        status: b.status,
        time: new Date(b.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      }))
      .sort((a: any, b: any) => b.amount - a.amount)

    const acceptedBid = formattedBids.find((b: any) => b.status === "accepted")
    const highestBid = formattedBids[0] || null

    return NextResponse.json({
      order: {
        id: (order as any).id,
        shortId: `SM-${(order as any).id.slice(0, 4).toUpperCase()}`,
        status: (order as any).status,
        route: `${(order as any).pickup_address || "—"} → ${(order as any).dropoff_address || "—"}`,
        pickupAddress: (order as any).pickup_address || "—",
        dropoffAddress: (order as any).dropoff_address || "—",
        pickupState: (order as any).pickup_state || "—",
        vehicleType: (order as any).vehicle_type || "—",
        distance: (order as any).distance_km ? `${Math.round(Number((order as any).distance_km))} km` : "—",
        distanceKm: Number((order as any).distance_km) || 0,
        urgency: (order as any).urgency || "normal",
        customer: { name: customerName, phone: customerPhone },
        senderName: (order as any).sender_name || "—",
        senderPhone: (order as any).sender_phone || "—",
        receiverName: (order as any).receiver_name || "—",
        receiverPhone: (order as any).receiver_phone || "—",
        item: {
          type: itemType,
          description: (order as any).item_description || itemDetails?.description || "—",
          value: (order as any).item_value ? Number((order as any).item_value) : null,
          weight: itemWeight,
          details: itemDetails || null,
        },
        pricing: {
          finalPrice: (order as any).final_price ? Number((order as any).final_price) : null,
          commission: (order as any).commission_amount ? Number((order as any).commission_amount) : null,
          driverEarning: (order as any).driver_earning ? Number((order as any).driver_earning) : null,
          highestBid: highestBid ? highestBid.amount : null,
          winningBid: acceptedBid ? acceptedBid.amount : null,
        },
        winner: acceptedBid ? {
          driverId: acceptedBid.driverId,
          ...acceptedBid.driver,
        } : null,
        created: (order as any).created_at,
        updated: (order as any).updated_at,
      },
      bids: formattedBids,
      transactions: (transactions || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        status: t.status,
        date: new Date(t.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      })),
    })
  } catch (err) {
    console.error("[Bids Detail] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
