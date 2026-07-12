import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id, status, final_price, pickup_address, dropoff_address,
        pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        payment_method, payment_status, vehicle_type, created_at, updated_at,
        sender_name, sender_phone, receiver_name, receiver_phone,
        pickup_building, pickup_floor, pickup_note, pickup_instruction,
        dropoff_building, dropoff_floor, dropoff_note, dropoff_instruction,
        item_details, item_value, pin_enabled,
        commission_amount, driver_earning,
        is_scheduled, scheduled_date, scheduled_time_start, scheduled_time_end,
        customer_id, accepted_driver_id,
        customer:users!orders_customer_id_fkey(id, full_name, email, phone),
        driver:users!orders_accepted_driver_id_fkey(id, full_name, phone)
      `)
      .eq("id", id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const customer = order.customer as any
    const driver = order.driver as any
    const itemDetails = order.item_details as any

    // Status display
    const statusMap: Record<string, { label: string; color: string }> = {
      searching: { label: "Searching", color: "bg-warning-light text-warning" },
      bidding: { label: "Open for Bids", color: "bg-warning-light text-warning" },
      accepted: { label: "Accepted", color: "bg-sendme-50 text-sendme" },
      picked_up: { label: "Picked Up", color: "bg-sendme-50 text-sendme" },
      delivered: { label: "Delivered", color: "bg-sendme-50 text-sendme" },
      canceled: { label: "Cancelled", color: "bg-danger-light text-danger" },
      scheduled: { label: "Scheduled", color: "bg-info-light text-info" },
    }
    const statusInfo = statusMap[order.status] || { label: order.status, color: "bg-surface-secondary text-text-muted" }

    // Payment status
    const paymentStatusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Pending", color: "text-warning" },
      paid: { label: "Paid", color: "text-sendme" },
      completed: { label: "Completed", color: "text-sendme" },
      cash_on_delivery: { label: "Cash on Delivery", color: "text-info" },
      refunded: { label: "Refunded", color: "text-danger" },
      failed: { label: "Failed", color: "text-danger" },
    }
    const paymentStatusInfo = paymentStatusMap[order.payment_status || "pending"] || { label: order.payment_status || "Pending", color: "text-text-muted" }

    // Item type label
    let typeLabel = "Standard"
    let typeColor = "bg-surface-secondary text-text-muted"
    if (itemDetails?.size) {
      const size = itemDetails.size.toLowerCase()
      if (size === "small") { typeLabel = "Small Item"; typeColor = "bg-sendme-50 text-sendme" }
      else if (size === "medium") { typeLabel = "Medium Item"; typeColor = "bg-info-light text-info" }
      else if (size === "bulk") { typeLabel = "Bulk"; typeColor = "bg-purple-50 text-purple-600" }
    } else if (itemDetails?.category) {
      typeLabel = itemDetails.category
      typeColor = "bg-purple-50 text-purple-600"
    }

    // Vehicle type label
    const vehicleLabel = order.vehicle_type
      ? order.vehicle_type.charAt(0).toUpperCase() + order.vehicle_type.slice(1)
      : "Any"

    // Fare
    const fare = order.final_price ? Number(order.final_price) : 0
    const commission = order.commission_amount ? Number(order.commission_amount) : Math.round(fare * 0.15)
    const driverEarning = order.driver_earning ? Number(order.driver_earning) : fare - commission

    // Timestamps
    const created = new Date(order.created_at)
    const updated = new Date(order.updated_at)
    const createdTime = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const updatedTime = updated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

    // Build activity log from status
    const activityLog: { time: string; title: string; desc: string; icon: string; color: string }[] = []
    activityLog.push({ time: createdTime, title: "Order created", desc: `Delivery request from ${order.pickup_address}`, icon: "📦", color: "bg-sendme-50 text-sendme" })

    if (order.status !== "searching") {
      activityLog.push({ time: createdTime, title: "Bid submitted", desc: `Fare: ₦${fare.toLocaleString()}`, icon: "💰", color: "bg-sendme-50 text-sendme" })
    }
    if (["accepted", "picked_up", "delivered"].includes(order.status) && driver) {
      activityLog.push({ time: createdTime, title: "Driver assigned", desc: `${driver.full_name} accepted the request`, icon: "👤", color: "bg-sendme-50 text-sendme" })
    }
    if (["picked_up", "delivered"].includes(order.status)) {
      activityLog.push({ time: updatedTime, title: "Pickup confirmed", desc: `Parcel picked up at ${order.pickup_address}`, icon: "✅", color: "bg-sendme-50 text-sendme" })
    }
    if (order.status === "delivered") {
      activityLog.push({ time: updatedTime, title: "Delivered", desc: `Package delivered to ${order.dropoff_address}`, icon: "🎉", color: "bg-sendme-50 text-sendme" })
    }
    if (order.status === "canceled") {
      activityLog.push({ time: updatedTime, title: "Order cancelled", desc: "Delivery request was cancelled", icon: "❌", color: "bg-danger-light text-danger" })
    }
    if (order.payment_status === "paid" || order.payment_status === "completed") {
      activityLog.push({ time: updatedTime, title: "Payment confirmed", desc: `₦${fare.toLocaleString()} paid via ${order.payment_method || "unknown"}`, icon: "💳", color: "bg-sendme-50 text-sendme" })
    }

    return NextResponse.json({
      order: {
        id: order.id.slice(0, 8).toUpperCase(),
        fullId: order.id,
        status: statusInfo.label,
        statusColor: statusInfo.color,
        statusRaw: order.status,
        pickupAddress: order.pickup_address,
        dropoffAddress: order.dropoff_address,
        pickupLat: order.pickup_lat,
        pickupLng: order.pickup_lng,
        dropoffLat: order.dropoff_lat,
        dropoffLng: order.dropoff_lng,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      customer: customer ? {
        id: customer.id,
        name: customer.full_name || "—",
        email: customer.email || "—",
        phone: customer.phone || "—",
      } : {
        id: null,
        name: order.sender_name || "—",
        email: "—",
        phone: order.sender_phone || "—",
      },
      driver: driver ? {
        id: driver.id,
        name: driver.full_name || "—",
        phone: driver.phone || "—",
        vehicle: vehicleLabel,
      } : null,
      item: {
        type: typeLabel,
        typeColor,
        category: itemDetails?.category || "—",
        size: itemDetails?.size || "—",
        handling: itemDetails?.handling || null,
        value: order.item_value || "—",
        instructions: order.pickup_instruction || order.dropoff_instruction || null,
      },
      pricing: {
        fare,
        fareFormatted: fare ? `₦${fare.toLocaleString()}` : "—",
        commission,
        commissionFormatted: commission ? `₦${commission.toLocaleString()}` : "—",
        driverEarning,
        driverEarningFormatted: driverEarning ? `₦${driverEarning.toLocaleString()}` : "—",
        paymentMethod: order.payment_method ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1) : "—",
        paymentStatus: paymentStatusInfo.label,
        paymentStatusColor: paymentStatusInfo.color,
      },
      contacts: {
        senderName: order.sender_name || customer?.full_name || "—",
        senderPhone: order.sender_phone || customer?.phone || "—",
        receiverName: order.receiver_name || "—",
        receiverPhone: order.receiver_phone || "—",
      },
      pickup: {
        address: order.pickup_address,
        building: order.pickup_building || null,
        floor: order.pickup_floor || null,
        note: order.pickup_note || null,
      },
      dropoff: {
        address: order.dropoff_address,
        building: order.dropoff_building || null,
        floor: order.dropoff_floor || null,
        note: order.dropoff_note || null,
      },
      schedule: order.is_scheduled ? {
        date: order.scheduled_date,
        startTime: order.scheduled_time_start,
        endTime: order.scheduled_time_end,
      } : null,
      activityLog,
    })
  } catch (err) {
    console.error("[Deliveries Detail] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
