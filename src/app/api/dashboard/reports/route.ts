import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const tab = searchParams.get("tab") || "overview";

  const now = new Date();
  let startDate = new Date();
  if (range === "7d") startDate.setDate(now.getDate() - 7);
  else if (range === "30d") startDate.setDate(now.getDate() - 30);
  else if (range === "90d") startDate.setDate(now.getDate() - 90);
  else if (range === "365d") startDate.setFullYear(now.getFullYear() - 1);
  else startDate.setDate(now.getDate() - 30);

  const startISO = startDate.toISOString();
  const prevStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString();

  // ── Always fetch core overview data ──────────────────
  const [
    totalOrdersResult,
    completedOrdersResult,
    cancelledOrdersResult,
    inProgressOrdersResult,
    activeDriversResult,
    totalDriversResult,
    disputesResult,
    revenueResult,
    prevRevenueResult,
    prevCompletedResult,
    topRoutesResult,
    topDriversResult,
    ordersByDayResult,
    revenueByDayResult,
    ordersByStatusResult,
    totalUsersResult,
    newUsersResult,
    orgCountResult,
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startISO),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startISO).eq("status", "delivered"),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startISO).in("status", ["canceled", "cancelled"]),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).in("status", ["searching", "bidding", "accepted", "picked_up"]),
    supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("is_online", true),
    supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("complaints").select("id", { count: "exact", head: true }).gte("created_at", startISO),
    supabaseAdmin.from("transactions").select("amount").eq("type", "earning").eq("status", "completed").gte("created_at", startISO),
    supabaseAdmin.from("transactions").select("amount").eq("type", "earning").eq("status", "completed").gte("created_at", prevStart).lt("created_at", startISO),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", startISO).eq("status", "delivered"),
    supabaseAdmin.from("orders").select("pickup_address, dropoff_address, final_price, distance_km").eq("status", "delivered").gte("created_at", startISO).not("final_price", "is", null).limit(500),
    supabaseAdmin.from("driver_profiles").select("id, rating, trips_count, vehicle_info").order("trips_count", { ascending: false }).limit(10),
    supabaseAdmin.from("orders").select("created_at, status").gte("created_at", new Date(now.getTime() - 14 * 86400000).toISOString()),
    supabaseAdmin.from("transactions").select("created_at, amount").eq("type", "earning").eq("status", "completed").gte("created_at", new Date(now.getTime() - 14 * 86400000).toISOString()),
    supabaseAdmin.from("orders").select("status").gte("created_at", startISO),
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }).gte("created_at", startISO),
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "organization"),
  ]);

  const totalOrders = totalOrdersResult.count || 0;
  const completedOrders = completedOrdersResult.count || 0;
  const cancelledOrders = cancelledOrdersResult.count || 0;
  const inProgressOrders = inProgressOrdersResult.count || 0;
  const activeDrivers = activeDriversResult.count || 0;
  const totalDrivers = totalDriversResult.count || 0;
  const disputes = disputesResult.count || 0;
  const totalUsers = totalUsersResult.count || 0;
  const newUsers = newUsersResult.count || 0;
  const orgCount = orgCountResult.count || 0;

  const revenue = (revenueResult.data || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const prevRevenue = (prevRevenueResult.data || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const prevCompleted = prevCompletedResult.count || 0;

  const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const completedChange = prevCompleted > 0 ? ((completedOrders - prevCompleted) / prevCompleted) * 100 : 0;

  // ── Top routes ────────────────────────────────────────
  const routeMap = new Map<string, { orders: number; revenue: number; totalDistance: number }>();
  for (const o of topRoutesResult.data || []) {
    const key = `${o.pickup_address || "?"} → ${o.dropoff_address || "?"}`;
    const existing = routeMap.get(key) || { orders: 0, revenue: 0, totalDistance: 0 };
    existing.orders += 1;
    existing.revenue += Number(o.final_price) || 0;
    existing.totalDistance += Number(o.distance_km) || 0;
    routeMap.set(key, existing);
  }
  const topRoutes = Array.from(routeMap.entries())
    .map(([route, data]) => ({
      route,
      orders: data.orders,
      revenue: data.revenue,
      avgDistance: data.orders > 0 ? (data.totalDistance / data.orders).toFixed(1) : "0",
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  // ── Top drivers ───────────────────────────────────────
  const driverIds = (topDriversResult.data || []).map((d) => d.id);
  const { data: driverUsers } = driverIds.length > 0
    ? await supabaseAdmin.from("users").select("id, full_name, phone, email").in("id", driverIds)
    : { data: [] };
  const driverUserMap = new Map((driverUsers || []).map((u) => [u.id, u]));

  const topDrivers = (topDriversResult.data || []).map((d) => {
    const user = driverUserMap.get(d.id);
    return {
      id: d.id,
      name: user?.full_name || "Unknown",
      phone: user?.phone || "—",
      email: user?.email || "—",
      rating: d.rating || 0,
      trips: d.trips_count || 0,
      vehicle: d.vehicle_info || null,
    };
  });

  // ── Chart data: orders by day ────────────────────────
  const dayMap = new Map<string, { total: number; delivered: number; cancelled: number }>();
  for (const o of ordersByDayResult.data || []) {
    const day = o.created_at.slice(0, 10);
    const existing = dayMap.get(day) || { total: 0, delivered: 0, cancelled: 0 };
    existing.total += 1;
    if (o.status === "delivered") existing.delivered += 1;
    if (o.status === "canceled" || o.status === "cancelled") existing.cancelled += 1;
    dayMap.set(day, existing);
  }
  const ordersByDay = Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }));

  // ── Chart data: revenue by day ────────────────────────
  const revDayMap = new Map<string, number>();
  for (const t of revenueByDayResult.data || []) {
    const day = t.created_at.slice(0, 10);
    revDayMap.set(day, (revDayMap.get(day) || 0) + (Number(t.amount) || 0));
  }
  const revenueByDay = Array.from(revDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));

  // ── Orders by status ──────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const o of ordersByStatusResult.data || []) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  const overview = {
    stats: {
      revenue,
      revenueChange: revenueChange.toFixed(1),
      totalOrders,
      completedOrders,
      completedChange: completedChange.toFixed(1),
      cancelledOrders,
      inProgressOrders,
      activeDrivers,
      totalDrivers,
      disputes,
      totalUsers,
      newUsers,
      orgCount,
    },
    charts: { ordersByDay, revenueByDay, ordersByStatus: statusCounts },
    topRoutes,
    topDrivers,
  };

  // ── Tab-specific data ────────────────────────────────
  let tabData: any = {};

  if (tab === "orders") {
    const [{ data: recentOrders }, vehicleTypeResult, ordersTrendResult] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, created_at, status, pickup_address, dropoff_address, final_price, vehicle_type, distance_km, pickup_state")
        .gte("created_at", startISO)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("orders")
        .select("vehicle_type")
        .gte("created_at", startISO),
      supabaseAdmin
        .from("orders")
        .select("created_at, status")
        .gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString()),
    ]);

    const vehicleCounts: Record<string, number> = {};
    for (const o of vehicleTypeResult.data || []) {
      const vt = o.vehicle_type || "Unknown";
      vehicleCounts[vt] = (vehicleCounts[vt] || 0) + 1;
    }

    const ordersTrendMap = new Map<string, { total: number; delivered: number }>();
    for (const o of ordersTrendResult.data || []) {
      const day = o.created_at.slice(0, 10);
      const e = ordersTrendMap.get(day) || { total: 0, delivered: 0 };
      e.total += 1;
      if (o.status === "delivered") e.delivered += 1;
      ordersTrendMap.set(day, e);
    }

    tabData = {
      recentOrders: (recentOrders || []).map((o: any) => ({
        id: o.id,
        shortId: `SM-${o.id.slice(0, 4).toUpperCase()}`,
        date: new Date(o.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        route: `${o.pickup_address || "—"} → ${o.dropoff_address || "—"}`,
        status: o.status,
        amount: o.final_price ? Number(o.final_price) : null,
        vehicle: o.vehicle_type || "—",
        distance: o.distance_km ? `${Math.round(Number(o.distance_km))} km` : "—",
        state: o.pickup_state || "—",
      })),
      vehicleBreakdown: Object.entries(vehicleCounts)
        .map(([type, count]) => ({ type, count, pct: totalOrders > 0 ? Math.round((count / totalOrders) * 1000) / 10 : 0 }))
        .sort((a, b) => b.count - a.count),
      ordersTrend: Array.from(ordersTrendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({ date, ...d })),
    };
  }

  if (tab === "financials") {
    const [transResult, commissionsResult, avgOrderResult] = await Promise.all([
      supabaseAdmin
        .from("transactions")
        .select("id, type, status, amount, created_at")
        .gte("created_at", startISO)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("transactions")
        .select("amount, type")
        .eq("type", "earning")
        .eq("status", "completed")
        .gte("created_at", startISO),
      supabaseAdmin
        .from("orders")
        .select("final_price")
        .eq("status", "delivered")
        .gte("created_at", startISO)
        .not("final_price", "is", null),
    ]);

    const allTrans = transResult.data || [];
    const typeCounts: Record<string, number> = {};
    const typeAmounts: Record<string, number> = {};
    for (const t of allTrans) {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
      typeAmounts[t.type] = (typeAmounts[t.type] || 0) + (Number(t.amount) || 0);
    }

    const avgOrderValue = avgOrderResult.data && avgOrderResult.data.length > 0
      ? avgOrderResult.data.reduce((s, o) => s + (Number(o.final_price) || 0), 0) / avgOrderResult.data.length
      : 0;

    tabData = {
      transactions: allTrans.map((t: any) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: Number(t.amount) || 0,
        date: new Date(t.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
      })),
      breakdown: Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
        amount: typeAmounts[type] || 0,
      })).sort((a, b) => b.amount - a.amount),
      avgOrderValue: Math.round(avgOrderValue),
      totalCommissions: commissionsResult.data?.reduce((s, t) => s + (Number(t.amount) || 0), 0) || 0,
    };
  }

  if (tab === "drivers") {
    const [{ data: allDrivers }, onlineResult, { data: recentDriverTrans }] = await Promise.all([
      supabaseAdmin
        .from("driver_profiles")
        .select("id, rating, trips_count, is_online, vehicle_info, total_earnings")
        .order("trips_count", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("driver_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_online", true),
      supabaseAdmin
        .from("transactions")
        .select("driver_id, amount")
        .eq("type", "earning")
        .eq("status", "completed")
        .gte("created_at", startISO)
        .not("driver_id", "is", null)
        .limit(200),
    ]);

    const driverIds2 = (allDrivers || []).map(d => d.id);
    const { data: driverUsers2 } = driverIds2.length > 0
      ? await supabaseAdmin.from("users").select("id, full_name, phone").in("id", driverIds2)
      : { data: [] };
    const dMap = new Map((driverUsers2 || []).map(u => [u.id, u]));

    const earningsByDriver: Record<string, number> = {};
    for (const t of recentDriverTrans || []) {
      earningsByDriver[t.driver_id] = (earningsByDriver[t.driver_id] || 0) + (Number(t.amount) || 0);
    }

    tabData = {
      drivers: (allDrivers || []).map((d: any) => {
        const u = dMap.get(d.id);
        return {
          id: d.id,
          name: u?.full_name || "Unknown",
          phone: u?.phone || "—",
          rating: d.rating || 0,
          trips: d.trips_count || 0,
          online: d.is_online || false,
          vehicle: d.vehicle_info || null,
          totalEarnings: Number(d.total_earnings) || 0,
          periodEarnings: earningsByDriver[d.id] || 0,
        };
      }),
      onlineDrivers: onlineResult.count || 0,
    };
  }

  if (tab === "customers") {
    const [{ data: users }, usersByRole, usersByDay] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("users")
        .select("role"),
      supabaseAdmin
        .from("users")
        .select("created_at")
        .gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString()),
    ]);

    const roleCounts: Record<string, number> = {};
    for (const u of usersByRole.data || []) {
      roleCounts[u.role || "unknown"] = (roleCounts[u.role || "unknown"] || 0) + 1;
    }

    const userGrowth: Record<string, number> = {};
    for (const u of usersByDay.data || []) {
      const day = u.created_at.slice(0, 10);
      userGrowth[day] = (userGrowth[day] || 0) + 1;
    }

    tabData = {
      users: (users || []).map((u: any) => ({
        id: u.id,
        name: u.full_name || "Unknown",
        role: u.role || "—",
        joined: new Date(u.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      })),
      roleBreakdown: Object.entries(roleCounts).map(([role, count]) => ({ role, count })),
      userGrowthTrend: Object.entries(userGrowth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count })),
    };
  }

  if (tab === "performance") {
    const [deliveredOrders, allBidsResult] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, created_at, updated_at, final_price")
        .eq("status", "delivered")
        .gte("created_at", startISO)
        .not("final_price", "is", null)
        .limit(200),
      supabaseAdmin
        .from("bids")
        .select("status")
        .gte("created_at", startISO),
    ]);

    const avgDeliveryTime = deliveredOrders.data && deliveredOrders.data.length > 0
      ? deliveredOrders.data.reduce((sum, o) => {
          const diff = new Date(o.updated_at).getTime() - new Date(o.created_at).getTime();
          return sum + diff;
        }, 0) / deliveredOrders.data.length / 60000
      : 0;

    const totalBidsCount = allBidsResult.data?.length || 0;
    const acceptedBids = allBidsResult.data?.filter(b => b.status === "accepted").length || 0;
    const bidAcceptanceRate = totalBidsCount > 0 ? (acceptedBids / totalBidsCount) * 100 : 0;

    const avgDeliveryMinutes = Math.round(avgDeliveryTime);
    const hours = Math.floor(avgDeliveryMinutes / 60);
    const mins = avgDeliveryMinutes % 60;

    tabData = {
      avgDeliveryTime: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      bidAcceptanceRate: Math.round(bidAcceptanceRate * 10) / 10,
      totalBids: totalBidsCount,
      acceptedBids,
      deliveredCount: deliveredOrders.data?.length || 0,
      avgOrderValue: overview.stats.totalOrders > 0
        ? Math.round(overview.stats.revenue / completedOrders) || 0
        : 0,
    };
  }

  return NextResponse.json({ ...overview, tabData });
}
