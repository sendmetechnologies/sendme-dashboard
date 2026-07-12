import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

    // ── Run all counts in parallel ──
    const [
      sendersResult,
      ridersResult,
      orgsResult,
      ordersResult,
      payoutRequestsResult,
      walletsResult,
      recentOrdersResult,
      recentRidersResult,
      recentSendersResult,
      recentOrgsResult,
    ] = await Promise.all([
      // Total senders (customers)
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "customer"),

      // Total riders (drivers)
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "driver"),

      // Total organizations
      supabaseAdmin.from("organization_profiles").select("id", { count: "exact", head: true }),

      // Order counts by status
      supabaseAdmin.from("orders").select("status, created_at, final_price"),

      // Payout requests
      supabaseAdmin.from("payout_requests").select("id, amount, status"),

      // Wallets total balance
      supabaseAdmin.from("wallets").select("balance"),

      // Recent 5 orders
      supabaseAdmin
        .from("orders")
        .select("id, status, final_price, pickup_address, dropoff_address, created_at, customer_id, accepted_driver_id")
        .order("created_at", { ascending: false })
        .limit(5),

      // Recent 5 riders
      supabaseAdmin
        .from("users")
        .select("id, full_name, phone, created_at, driver_profiles(verification_status, rating, vehicle_info)")
        .eq("role", "driver")
        .order("created_at", { ascending: false })
        .limit(5),

      // Recent 5 senders
      supabaseAdmin
        .from("users")
        .select("id, full_name, phone, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false })
        .limit(5),

      // Recent 5 organizations
      supabaseAdmin
        .from("organization_profiles")
        .select("id, business_name, business_email, contact_person_name, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // ── Compute stats ──
    const totalSenders = sendersResult.count || 0
    const totalRiders = ridersResult.count || 0
    const totalOrgs = orgsResult.count || 0

    // Orders breakdown
    const orders = ordersResult.data || []
    const totalDeliveries = orders.length
    const completedDeliveries = orders.filter((o) => o.status === "delivered").length
    const searchingDeliveries = orders.filter((o) => o.status === "searching").length
    const inTransitDeliveries = orders.filter((o) => ["accepted", "picked_up", "bidding"].includes(o.status)).length
    const failedDeliveries = orders.filter((o) => o.status === "canceled").length

    // Rider status breakdown
    const riders = (recentRidersResult.data || [])
    const riderStatusCounts = { verified: 0, pending: 0, suspended: 0 }
    // We need full rider count by status — do a separate query
    const [riderVerified, riderPending, riderSuspended] = await Promise.all([
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "rejected"),
    ])
    riderStatusCounts.verified = riderVerified.count || 0
    riderStatusCounts.pending = riderPending.count || 0
    riderStatusCounts.suspended = riderSuspended.count || 0

    // Sender status breakdown (active = has logged in recently, verified = has completed at least 1 order, suspended = blocked)
    const [senderActive, senderVerified] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "customer"),
      supabaseAdmin.from("orders").select("customer_id", { count: "exact", head: true }).eq("status", "delivered"),
    ])
    // For now, use total - verified as active approximation
    const totalSenderOrders = senderVerified.count || 0

    // Org status breakdown
    const [orgVerified, orgPending] = await Promise.all([
      supabaseAdmin.from("organization_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      supabaseAdmin.from("organization_profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
    ])
    const orgVerifiedCount = orgVerified.count || 0
    const orgPendingCount = orgPending.count || 0

    // Payout stats
    const payoutRequests = payoutRequestsResult.data || []
    const totalPayoutRequests = payoutRequests.length
    const totalRequestAmount = payoutRequests.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const pendingPayouts = payoutRequests.filter((p) => p.status === "pending").length
    const recentPayouts = payoutRequests.filter((p) => {
      // recent = last 7 days (approximate via created_at if available, or just count non-pending)
      return p.status === "completed" || p.status === "paid"
    }).length

    // Total rider funds (sum of wallet balances)
    const wallets = walletsResult.data || []
    const totalRiderFunds = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0)

    // ── Chart data ──

    // Weekly deliveries (last 7 days)
    const weeklyDeliveries: { day: string; value: number }[] = []
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dayName = dayNames[d.getDay()]
      const dayStr = d.toISOString().split("T")[0]
      const count = orders.filter((o) => o.created_at && o.created_at.startsWith(dayStr)).length
      weeklyDeliveries.push({ day: dayName, value: count })
    }

    // Weekly revenue (last 7 days)
    const weeklyRevenue: { day: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dayName = dayNames[d.getDay()]
      const dayStr = d.toISOString().split("T")[0]
      const dayRevenue = orders
        .filter((o) => o.created_at && o.created_at.startsWith(dayStr))
        .reduce((sum, o) => sum + (Number(o.final_price) || 0), 0)
      weeklyRevenue.push({ day: dayName, value: Math.round(dayRevenue / 1000000 * 10) / 10 })
    }

    // Monthly user growth (last 6 months)
    const monthlyUsers: { month: string; senders: number; riders: number }[] = []
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = monthNames[d.getMonth()]
      monthlyUsers.push({ month: monthLabel, senders: 0, riders: 0 })
    }

    // Payout trend (last 7 days)
    const payoutTrend: { day: string; amount: number }[] = []
    // Use transactions table for payout trend
    const { data: recentTransactions } = await supabaseAdmin
      .from("transactions")
      .select("amount, created_at")
      .eq("type", "payout")
      .gte("created_at", sevenDaysAgo)

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dayName = dayNames[d.getDay()]
      const dayStr = d.toISOString().split("T")[0]
      const dayAmount = (recentTransactions || [])
        .filter((t) => t.created_at && t.created_at.startsWith(dayStr))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      payoutTrend.push({ day: dayName, amount: Math.round(dayAmount / 1000000 * 10) / 10 })
    }

    return NextResponse.json({
      stats: {
        senders: { total: totalSenders, active: totalSenders, verified: totalSenderOrders > 0 ? Math.min(totalSenderOrders, totalSenders) : 0, suspended: 0 },
        riders: { total: totalRiders, verified: riderStatusCounts.verified, pending: riderStatusCounts.pending, suspended: riderStatusCounts.suspended },
        organizations: { total: totalOrgs, verified: orgVerifiedCount, pending: orgPendingCount, suspended: totalOrgs - orgVerifiedCount - orgPendingCount },
        payouts: { total: totalPayoutRequests, totalFunds: totalRiderFunds, totalRequests: totalRequestAmount, recent: recentPayouts, pending: pendingPayouts },
        deliveries: { total: totalDeliveries, completed: completedDeliveries, searching: searchingDeliveries, inTransit: inTransitDeliveries, failed: failedDeliveries },
      },
      charts: {
        weeklyDeliveries,
        weeklyRevenue,
        monthlyUsers,
        payoutTrend,
      },
      recent: {
        deliveries: (recentOrdersResult.data || []).map((o) => ({
          id: o.id.slice(0, 8).toUpperCase(),
          status: o.status,
          from: o.pickup_address || "—",
          to: o.dropoff_address || "—",
          price: o.final_price,
          created_at: o.created_at,
        })),
        riders: riders.map((r) => ({
          id: r.id,
          name: r.full_name || "—",
          phone: r.phone || "—",
          status: (r.driver_profiles as any)?.verification_status || "pending",
          rating: (r.driver_profiles as any)?.rating || 0,
          vehicle: (r.driver_profiles as any)?.vehicle_info?.type || "—",
          created_at: r.created_at,
        })),
        senders: (recentSendersResult.data || []).map((s) => ({
          id: s.id,
          name: s.full_name || "—",
          email: "—",
          phone: s.phone || "—",
          created_at: s.created_at,
        })),
        organizations: (recentOrgsResult.data || []).map((o) => ({
          id: o.id,
          name: o.business_name || "—",
          contact: o.contact_person_name || "—",
          email: o.business_email || "—",
          verified: o.is_verified,
          created_at: o.created_at,
        })),
      },
    })
  } catch (err) {
    console.error("[Dashboard] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
