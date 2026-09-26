import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const body = await req.json();
    const { driverIds, title, message } = body;

    if (!Array.isArray(driverIds) || driverIds.length === 0) {
      return NextResponse.json({ error: "No drivers selected" }, { status: 400 });
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, pickup_address, dropoff_address, final_price, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const notifTitle = title?.trim() || "📦 New Delivery Request Nearby!";
    const notifBody =
      message?.trim() ||
      `New order #${order.id.slice(0, 8)} available for pickup at ${order.pickup_address || "nearby"}. Earn ₦${Number(order.final_price || 0).toLocaleString()}. Open app to view!`;

    const inserts = driverIds.map((driverId: string) => ({
      user_id: driverId,
      title: notifTitle,
      body: notifBody,
      type: "ORDER",
      priority: "HIGH",
      channels: JSON.stringify({ in_app: true, push: true, email: false }),
      status: "UNREAD",
      related_id: order.id,
      related_type: "order",
      data: {
        orderId: order.id,
        order_id: order.id,
        pickup_address: order.pickup_address,
        dropoff_address: order.dropoff_address,
        final_price: order.final_price,
        event: "NEW_ORDER",
        type: "manual_dispatch",
      },
      in_app_sent: true,
      push_sent: true,
      created_at: new Date().toISOString(),
    }));

    // Insert into messages table
    const { error: insertError } = await supabaseAdmin.from("messages").insert(inserts);

    if (insertError) {
      console.error("[SendNotification] Insert messages error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Also record in notification_logs if table exists
    try {
      const logs = driverIds.map((driverId: string) => ({
        user_id: driverId,
        title: notifTitle,
        body: notifBody,
        data: { order_id: order.id, event: "MANUAL_DISPATCH" },
      }));
      await supabaseAdmin.from("notification_logs").insert(logs);
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      sentCount: driverIds.length,
      orderId: order.id,
    });
  } catch (err: any) {
    console.error("[SendNotification] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
