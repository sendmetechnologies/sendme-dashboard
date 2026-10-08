import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Daily 9:00 AM Cron / Webhook:
 * Calculates missed broadcast orders for each driver from yesterday,
 * inserts in-app notification into `messages`, and sends a high-priority
 * Expo push notification so riders receive it whether the app is open,
 * closed, or the device is locked.
 */
export async function GET(req: NextRequest) {
  return handleSummary(req);
}

export async function POST(req: NextRequest) {
  return handleSummary(req);
}

async function handleSummary(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const simulatePhone = searchParams.get("simulate_phone") || searchParams.get("phone");
    const simulateRiderId = searchParams.get("simulate_rider_id") || searchParams.get("rider_id");
    const forceSample = searchParams.get("force_sample") === "true";
    const customMissedCount = searchParams.get("missed_count") ? parseInt(searchParams.get("missed_count")!, 10) : undefined;
    const customMissedAmount = searchParams.get("missed_amount") ? parseInt(searchParams.get("missed_amount")!, 10) : undefined;

    // Calculate "Yesterday" in Africa/Lagos (UTC+1)
    // 9 AM Lagos time runs for the entire 24h window of the previous calendar day
    const now = new Date();
    // Lagos is UTC+1 (add 1 hour to UTC)
    const lagosNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const lagosYesterday = new Date(lagosNow);
    lagosYesterday.setDate(lagosYesterday.getDate() - 1);

    const year = lagosYesterday.getUTCFullYear();
    const month = String(lagosYesterday.getUTCMonth() + 1).padStart(2, "0");
    const day = String(lagosYesterday.getUTCDate()).padStart(2, "0");

    // Start & End of yesterday in Lagos time converted back to UTC ISO
    const startOfYesterdayUTC = new Date(`${year}-${month}-${day}T00:00:00+01:00`).toISOString();
    const endOfYesterdayUTC = new Date(`${year}-${month}-${day}T23:59:59+01:00`).toISOString();

    // If simulating a specific rider
    let targetDriverIds: string[] | null = null;
    if (simulatePhone) {
      const cleanPhone = simulatePhone.replace(/[^\d]/g, "");
      const rawPhone = cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone;
      const { data: userRows } = await supabaseAdmin
        .from("users")
        .select("id")
        .ilike("phone", `%${rawPhone}%`)
        .limit(1);

      const userRow = userRows && userRows[0];

      if (userRow?.id) {
        targetDriverIds = [userRow.id];
      } else {
        return NextResponse.json({ error: `No rider found with phone ${simulatePhone}` }, { status: 404 });
      }
    } else if (simulateRiderId) {
      targetDriverIds = [simulateRiderId];
    }

    // Query broadcast logs from yesterday (or last 48 hours if simulating)
    let query = supabaseAdmin
      .from("order_broadcast_logs")
      .select(`
        id,
        order_id,
        driver_id,
        status,
        created_at,
        orders (
          id,
          final_price,
          accepted_driver_id,
          status,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (targetDriverIds && targetDriverIds.length > 0) {
      query = query.in("driver_id", targetDriverIds);
    } else {
      query = query
        .gte("created_at", startOfYesterdayUTC)
        .lte("created_at", endOfYesterdayUTC);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error("[MissedOrders] Broadcast query error:", logsError);
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // Map by driver_id: track unique missed orders and total potential earnings
    const driverMissedMap = new Map<string, {
      driverId: string;
      missedOrderIds: Set<string>;
      totalAmount: number;
    }>();

    (logs || []).forEach((log: any) => {
      const driverId = log.driver_id;
      if (!driverId) return;

      const order = log.orders;
      // An order was missed if driver didn't win it (i.e. accepted_driver_id !== driverId)
      const wasWon = order && order.accepted_driver_id === driverId && order.status === "completed";

      if (!wasWon) {
        if (!driverMissedMap.has(driverId)) {
          driverMissedMap.set(driverId, {
            driverId,
            missedOrderIds: new Set<string>(),
            totalAmount: 0,
          });
        }

        const entry = driverMissedMap.get(driverId)!;
        if (!entry.missedOrderIds.has(log.order_id)) {
          entry.missedOrderIds.add(log.order_id);
          const price = Number(order?.final_price || 0) || 3000; // fallback to ₦3,000 if not set
          entry.totalAmount += price;
        }
      }
    });

    // If simulation requested and driver had 0 recorded broadcast logs yesterday,
    // inject simulated sample data as requested: 3 orders worth ₦9,000
    if (targetDriverIds && targetDriverIds.length > 0) {
      const driverId = targetDriverIds[0];
      if (!driverMissedMap.has(driverId) || forceSample) {
        const count = customMissedCount || 3;
        const amount = customMissedAmount || 9000;
        const mockSet = new Set<string>();
        for (let i = 0; i < count; i++) mockSet.add(`mock-order-${i + 1}`);

        driverMissedMap.set(driverId, {
          driverId,
          missedOrderIds: mockSet,
          totalAmount: amount,
        });
      }
    }

    const notificationResults = [];

    // Process each driver that missed orders
    for (const [driverId, data] of driverMissedMap.entries()) {
      const missedCount = data.missedOrderIds.size;
      const totalMissedEarnings = data.totalAmount;

      if (missedCount <= 0) continue;

      const title = "📦 Missed Orders Yesterday 💰";
      const body = `You missed ${missedCount} order${missedCount > 1 ? "s" : ""} yesterday and could have made ₦${totalMissedEarnings.toLocaleString()}. Open SendMe to check today's orders!`;

      // 1. In-App Notification (messages table)
      const { error: msgError } = await supabaseAdmin.from("messages").insert({
        user_id: driverId,
        title,
        body,
        type: "ORDER",
        status: "UNREAD",
        data: {
          event: "MISSED_ORDERS_DAILY_SUMMARY",
          url: "/(driver-tabs)",
          missedCount,
          totalMissedEarnings,
        },
        created_at: new Date().toISOString(),
      });

      if (msgError) {
        console.error(`[MissedOrders] In-app message error for ${driverId}:`, msgError);
      }

      // 2. Fetch Driver's Push Tokens
      const { data: tokens } = await supabaseAdmin
        .from("user_push_tokens")
        .select("token")
        .eq("user_id", driverId)
        .eq("is_active", true);

      const uniqueTokens = Array.from(
        new Set((tokens || []).map((t: any) => t.token).filter(Boolean))
      );

      let pushSentCount = 0;

      // 3. Send High-Priority Push Notification via Expo
      if (uniqueTokens.length > 0) {
        const messages = uniqueTokens.map((to) => ({
          to,
          sound: "default",
          title,
          body,
          data: {
            url: "/(driver-tabs)",
            event: "MISSED_ORDERS_DAILY_SUMMARY",
            missedCount,
            totalMissedEarnings,
          },
          priority: "high",
          channelId: "new-order",
          categoryId: "missed-orders-actions",
        }));

        try {
          const pushRes = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
          });

          const pushData = await pushRes.json();
          pushSentCount = uniqueTokens.length;
          console.log(`[MissedOrders] Push sent to driver ${driverId}:`, pushData);
        } catch (pushErr) {
          console.error(`[MissedOrders] Expo push delivery error for ${driverId}:`, pushErr);
        }
      }

      notificationResults.push({
        driverId,
        missedCount,
        totalMissedEarnings,
        inAppCreated: !msgError,
        pushTokensCount: uniqueTokens.length,
        pushSentCount,
      });
    }

    return NextResponse.json({
      success: true,
      window: {
        yesterdayStart: startOfYesterdayUTC,
        yesterdayEnd: endOfYesterdayUTC,
      },
      driversNotified: notificationResults.length,
      results: notificationResults,
    });
  } catch (err: any) {
    console.error("[MissedOrders] Unexpected handler error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
