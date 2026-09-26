import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getOperationalCosts } from "@/lib/costs-store"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get("state") || null
    const dateRange = searchParams.get("date_range") || "all"
    const stream = searchParams.get("stream") || "all"
    const search = searchParams.get("search") || null

    const now = new Date()
    let dateGte: string | null = null

    if (dateRange === "today") {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      dateGte = d.toISOString()
    } else if (dateRange === "yesterday") {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      d.setHours(0, 0, 0, 0)
      dateGte = d.toISOString()
    } else if (dateRange === "week") {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      dateGte = d.toISOString()
    } else if (dateRange === "month" || dateRange === "last_30") {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      dateGte = d.toISOString()
    } else if (dateRange === "year") {
      const d = new Date(now.getFullYear(), 0, 1)
      dateGte = d.toISOString()
    }

    // ── 1. Query Orders (Rides) ──
    let ordersQuery = supabaseAdmin
      .from("orders")
      .select(`
        id, status, final_price, commission_amount, driver_earning,
        pickup_state, pickup_address, dropoff_address, payment_method,
        vehicle_type, created_at, customer_id, accepted_driver_id,
        sender_name, sender_phone
      `)
      .order("created_at", { ascending: false })

    if (state) {
      ordersQuery = ordersQuery.or(`pickup_state.ilike.%${state}%,pickup_address.ilike.%${state}%`)
    }
    if (dateGte) {
      ordersQuery = ordersQuery.gte("created_at", dateGte)
    }

    // ── 2. Query Payout Requests ──
    const driverPayoutQuery = supabaseAdmin
      .from("payout_requests")
      .select("id, amount, status, note, created_at, driver_id, payout_method_id, users!payout_requests_driver_id_fkey(full_name, phone)")
      .order("created_at", { ascending: false })

    const orgPayoutQuery = supabaseAdmin
      .from("organization_payout_requests")
      .select("id, amount, status, note, created_at, organization_id, users!organization_payout_requests_organization_id_fkey(full_name, phone)")
      .order("created_at", { ascending: false })

    // ── 3. Query Wallet Funding Transactions ──
    const fundingQuery = supabaseAdmin
      .from("transactions")
      .select("id, user_id, type, amount, status, note, created_at")
      .in("type", ["credit", "deposit", "wallet_funding"])
      .order("created_at", { ascending: false })
      .limit(100)

    const [
      { data: rawOrders, error: ordersError },
      { data: driverPayouts },
      { data: orgPayouts },
      { data: rawFunding },
      operationalCosts,
    ] = await Promise.all([
      ordersQuery,
      driverPayoutQuery,
      orgPayoutQuery,
      fundingQuery,
      getOperationalCosts(),
    ])

    if (ordersError) {
      console.error("[Revenue API] Orders query error:", ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    const orders = rawOrders || []

    // Fetch user details for ride ledger
    const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))]
    const driverIds = [...new Set(orders.map((o) => o.accepted_driver_id).filter(Boolean))]
    const allUserIds = [...new Set([...customerIds, ...driverIds])]

    let userMap: Record<string, string> = {}
    if (allUserIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, full_name")
        .in("id", allUserIds)
      if (users) {
        for (const u of users) {
          userMap[u.id] = u.full_name || "—"
        }
      }
    }

    // ── Compute Ride Financials ──
    let totalGrossGMV = 0
    let totalPlatformCommission = 0
    let totalDriverEarnings = 0
    let deliveredOrdersCount = 0

    const ridesLedger = orders.map((o) => {
      const fare = Number(o.final_price) || 0
      const isDelivered = o.status === "delivered"
      
      // SendMe standard commission is 15% if not explicitly calculated in DB
      let commission = Number(o.commission_amount) || 0
      let driverEarning = Number(o.driver_earning) || 0

      if (fare > 0 && commission === 0 && driverEarning === 0) {
        commission = Math.round(fare * 0.15)
        driverEarning = fare - commission
      }

      if (isDelivered) {
        totalGrossGMV += fare
        totalPlatformCommission += commission
        totalDriverEarnings += driverEarning
        deliveredOrdersCount++
      }

      const commissionRate = fare > 0 ? Math.round((commission / fare) * 100) : 15
      const fromArea = o.pickup_address ? o.pickup_address.split(",")[0].trim() : "Pickup"
      const toArea = o.dropoff_address ? o.dropoff_address.split(",")[0].trim() : "Dropoff"

      return {
        id: o.id,
        shortId: `ORD-${o.id.slice(0, 5).toUpperCase()}`,
        date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date(o.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        customer: userMap[o.customer_id] || o.sender_name || "Customer",
        driver: userMap[o.accepted_driver_id] || "Driver Assigned",
        route: `${fromArea} → ${toArea}`,
        state: o.pickup_state || "Lagos",
        vehicle: o.vehicle_type || "Motorbike",
        fare,
        fareFormatted: `₦${fare.toLocaleString()}`,
        commission,
        commissionFormatted: `₦${commission.toLocaleString()}`,
        commissionRate: `${commissionRate}%`,
        driverEarning,
        driverEarningFormatted: `₦${driverEarning.toLocaleString()}`,
        paymentMethod: o.payment_method || "Wallet / Card",
        status: o.status,
        statusColor: isDelivered ? "bg-sendme-50 text-sendme" : o.status === "cancelled" ? "bg-danger-light text-danger" : "bg-warning-light text-warning",
      }
    })

    // ── Compute Novac Funding Inflow & Fee Deductions ──
    let totalFundingInflow = 0
    let totalNovacFeesCollected = 0 // ₦50 platform transaction charge on each wallet funding

    const fundingRecords = (rawFunding || []).map((f) => {
      const amount = Number(f.amount) || 0
      const fee = 50 // Standard Novac ₦50 debit fee
      const netCredited = Math.max(0, amount - fee)
      totalFundingInflow += amount
      totalNovacFeesCollected += fee

      return {
        id: f.id,
        ref: `NOV-${f.id.slice(0, 6).toUpperCase()}`,
        date: new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        grossAmount: amount,
        feeDeducted: fee,
        netCredited,
        grossFormatted: `₦${amount.toLocaleString()}`,
        feeFormatted: `₦${fee.toLocaleString()}`,
        netFormatted: `₦${netCredited.toLocaleString()}`,
        status: f.status || "completed",
        note: f.note || "Novac / Card Deposit",
      }
    })

    // ── Compute Payouts (Driver & Org Withdrawals) ──
    const allPayoutsList: any[] = []
    let totalPayoutsDisbursed = 0
    let totalPayoutsPending = 0

    const processPayout = (p: any, role: "Driver" | "Organization") => {
      const amount = Number(p.amount) || 0
      const isPaid = p.status === "approved" || p.status === "paid" || p.status === "completed"
      const isPending = p.status === "pending"

      if (isPaid) totalPayoutsDisbursed += amount
      if (isPending) totalPayoutsPending += amount

      const user = p.users as any

      allPayoutsList.push({
        id: p.id,
        shortId: `PO-${p.id.slice(0, 5).toUpperCase()}`,
        type: role,
        name: user?.full_name || "Account Holder",
        phone: user?.phone || "—",
        amount,
        amountFormatted: `₦${amount.toLocaleString()}`,
        status: p.status || "pending",
        statusColor: isPaid ? "bg-sendme-50 text-sendme" : isPending ? "bg-warning-light text-warning" : "bg-danger-light text-danger",
        date: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        note: p.note || `${role} Wallet Withdrawal`,
      })
    }

    for (const dp of driverPayouts || []) processPayout(dp, "Driver")
    for (const op of orgPayouts || []) processPayout(op, "Organization")

    // Filter costs by date range if applicable
    let filteredCosts = operationalCosts
    if (dateGte) {
      filteredCosts = operationalCosts.filter((c) => c.date >= dateGte!.slice(0, 10))
    }
    const totalOperationalCosts = filteredCosts.reduce((sum, c) => sum + c.amount, 0)

    // ── Platform Net Revenue & Profit (EBITDA) ──
    const totalPlatformRevenue = totalPlatformCommission + totalNovacFeesCollected
    const netOperatingProfit = totalPlatformRevenue - totalOperationalCosts
    const netProfitMargin = totalPlatformRevenue > 0 ? Math.round((netOperatingProfit / totalPlatformRevenue) * 100) : 0

    // Filter list according to stream and search
    let filteredRides = ridesLedger
    if (search) {
      const q = search.toLowerCase()
      filteredRides = filteredRides.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.driver.toLowerCase().includes(q) ||
          r.route.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({
      summary: {
        totalGrossGMV,
        totalGrossGMVFormatted: `₦${totalGrossGMV.toLocaleString()}`,
        totalPlatformRevenue,
        totalPlatformRevenueFormatted: `₦${totalPlatformRevenue.toLocaleString()}`,
        totalPlatformCommission,
        totalPlatformCommissionFormatted: `₦${totalPlatformCommission.toLocaleString()}`,
        totalNovacFeesCollected,
        totalNovacFeesCollectedFormatted: `₦${totalNovacFeesCollected.toLocaleString()}`,
        totalDriverEarnings,
        totalDriverEarningsFormatted: `₦${totalDriverEarnings.toLocaleString()}`,
        totalPayoutsDisbursed,
        totalPayoutsDisbursedFormatted: `₦${totalPayoutsDisbursed.toLocaleString()}`,
        totalPayoutsPending,
        totalPayoutsPendingFormatted: `₦${totalPayoutsPending.toLocaleString()}`,
        totalOperationalCosts,
        totalOperationalCostsFormatted: `₦${totalOperationalCosts.toLocaleString()}`,
        netOperatingProfit,
        netOperatingProfitFormatted: `₦${netOperatingProfit.toLocaleString()}`,
        netProfitMargin,
        deliveredOrdersCount,
        totalOrdersCount: orders.length,
      },
      ridesLedger: filteredRides.slice(0, 100),
      fundingRecords: fundingRecords.slice(0, 50),
      payouts: allPayoutsList.slice(0, 50),
      operationalCosts: filteredCosts,
    })
  } catch (err) {
    console.error("[Revenue API] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
