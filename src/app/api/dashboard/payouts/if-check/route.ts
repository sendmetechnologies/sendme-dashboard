import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface IFResult {
  id: string
  type: "driver" | "customer" | "organization"
  user_id: string
  user_name: string
  user_phone: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  created_at: string
  passed: boolean
  reason: string
  checks: {
    has_completed_delivery: boolean
    delivery_amount_matches: boolean
    wallet_balance_positive: boolean
    no_duplicate_pending: boolean
    financial_track_consistent: boolean
    not_recently_created: boolean
  }
}

async function validateDriverPayout(payout: any, method: any): Promise<IFResult> {
  const userId = payout.driver_id
  const amount = Number(payout.amount)
  const checks = {
    has_completed_delivery: false,
    delivery_amount_matches: false,
    wallet_balance_positive: false,
    no_duplicate_pending: true,
    financial_track_consistent: false,
    not_recently_created: false,
  }
  const reasons: string[] = []

  const { data: completedOrders } = await supabaseAdmin
    .from("orders")
    .select("id, final_price, status")
    .eq("accepted_driver_id", userId)
    .eq("status", "delivered")

  const completedCount = completedOrders?.length || 0
  checks.has_completed_delivery = completedCount > 0
  if (!checks.has_completed_delivery) {
    reasons.push("No completed deliveries found")
  }

  const totalEarnings = (completedOrders || []).reduce(
    (sum: number, o: any) => sum + (Number(o.final_price) || 0), 0
  )
  checks.delivery_amount_matches = amount <= totalEarnings
  if (!checks.delivery_amount_matches) {
    reasons.push(`Requested ₦${amount.toLocaleString()} exceeds total earnings of ₦${totalEarnings.toLocaleString()}`)
  }

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single()

  const walletBalance = Number(wallet?.balance) || 0
  checks.wallet_balance_positive = walletBalance >= amount
  if (!checks.wallet_balance_positive) {
    reasons.push(`Wallet balance ₦${walletBalance.toLocaleString()} insufficient for ₦${amount.toLocaleString()} request`)
  }

  const { count: pendingCount } = await supabaseAdmin
    .from("payout_requests")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", userId)
    .eq("status", "pending")

  checks.no_duplicate_pending = (pendingCount || 0) <= 1
  if (!checks.no_duplicate_pending) {
    reasons.push(`${pendingCount} pending payout requests found`)
  }

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("type, amount, status")
    .eq("user_id", userId)
    .eq("status", "completed")

  const totalCredits = (transactions || [])
    .filter((t: any) => ["deposit", "earning", "credit"].includes(t.type))
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0)
  const totalDebits = (transactions || [])
    .filter((t: any) => ["payout", "debit", "withdrawal"].includes(t.type))
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0)
  const netBalance = totalCredits - totalDebits

  checks.financial_track_consistent = Math.abs(netBalance - walletBalance) < 100
  if (!checks.financial_track_consistent) {
    reasons.push(`Financial track mismatch: calculated ₦${netBalance.toLocaleString()} vs wallet ₦${walletBalance.toLocaleString()}`)
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .single()

  if (user?.created_at) {
    const accountAge = Date.now() - new Date(user.created_at).getTime()
    checks.not_recently_created = accountAge > 24 * 60 * 60 * 1000
    if (!checks.not_recently_created) {
      reasons.push("Account created less than 24 hours ago")
    }
  } else {
    checks.not_recently_created = true
  }

  const passed = Object.values(checks).every(Boolean)

  return {
    id: payout.id,
    type: "driver",
    user_id: userId,
    user_name: payout.users?.full_name || "—",
    user_phone: payout.users?.phone || "—",
    amount,
    bank_name: method?.bank_name || "—",
    account_number: method?.account_number || "—",
    account_name: method?.account_name || "—",
    created_at: payout.created_at,
    passed,
    reason: passed ? "All checks passed" : reasons.join("; "),
    checks,
  }
}

async function validateCustomerPayout(payout: any, method: any): Promise<IFResult> {
  const userId = payout.driver_id
  const amount = Number(payout.amount)
  const checks = {
    has_completed_delivery: false,
    delivery_amount_matches: false,
    wallet_balance_positive: false,
    no_duplicate_pending: true,
    financial_track_consistent: false,
    not_recently_created: false,
  }
  const reasons: string[] = []

  // For customers: check if they have placed orders (as sender/customer)
  const { data: customerOrders } = await supabaseAdmin
    .from("orders")
    .select("id, final_price, status")
    .eq("customer_id", userId)
    .eq("status", "delivered")

  const completedCount = customerOrders?.length || 0
  checks.has_completed_delivery = completedCount > 0
  if (!checks.has_completed_delivery) {
    reasons.push("No completed orders found for this customer")
  }

  // For customers: check if their wallet balance covers the request
  // Customers earn credits from referrals, rewards, or admin credits - not from delivery earnings
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single()

  const walletBalance = Number(wallet?.balance) || 0
  checks.wallet_balance_positive = walletBalance >= amount
  if (!checks.wallet_balance_positive) {
    reasons.push(`Wallet balance ₦${walletBalance.toLocaleString()} insufficient for ₦${amount.toLocaleString()} request`)
  }

  // Customers don't earn from deliveries, so skip delivery amount matching
  // Instead verify the wallet has sufficient funds (already checked above)
  checks.delivery_amount_matches = true

  const { count: pendingCount } = await supabaseAdmin
    .from("payout_requests")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", userId)
    .eq("status", "pending")

  checks.no_duplicate_pending = (pendingCount || 0) <= 1
  if (!checks.no_duplicate_pending) {
    reasons.push(`${pendingCount} pending payout requests found`)
  }

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("type, amount, status")
    .eq("user_id", userId)
    .eq("status", "completed")

  const totalCredits = (transactions || [])
    .filter((t: any) => ["deposit", "earning", "credit"].includes(t.type))
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0)
  const totalDebits = (transactions || [])
    .filter((t: any) => ["payout", "debit", "withdrawal"].includes(t.type))
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0)
  const netBalance = totalCredits - totalDebits

  checks.financial_track_consistent = Math.abs(netBalance - walletBalance) < 100
  if (!checks.financial_track_consistent) {
    reasons.push(`Financial track mismatch: calculated ₦${netBalance.toLocaleString()} vs wallet ₦${walletBalance.toLocaleString()}`)
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .single()

  if (user?.created_at) {
    const accountAge = Date.now() - new Date(user.created_at).getTime()
    checks.not_recently_created = accountAge > 24 * 60 * 60 * 1000
    if (!checks.not_recently_created) {
      reasons.push("Account created less than 24 hours ago")
    }
  } else {
    checks.not_recently_created = true
  }

  const passed = Object.values(checks).every(Boolean)

  return {
    id: payout.id,
    type: "customer",
    user_id: userId,
    user_name: payout.users?.full_name || "—",
    user_phone: payout.users?.phone || "—",
    amount,
    bank_name: method?.bank_name || "—",
    account_number: method?.account_number || "—",
    account_name: method?.account_name || "—",
    created_at: payout.created_at,
    passed,
    reason: passed ? "All checks passed" : reasons.join("; "),
    checks,
  }
}

async function validateOrgPayout(payout: any): Promise<IFResult> {
  const orgId = payout.organization_id
  const amount = Number(payout.amount)
  const checks = {
    has_completed_delivery: false,
    delivery_amount_matches: false,
    wallet_balance_positive: false,
    no_duplicate_pending: true,
    financial_track_consistent: false,
    not_recently_created: false,
  }
  const reasons: string[] = []

  const { data: orgDrivers } = await supabaseAdmin
    .from("organization_drivers")
    .select("driver_id")
    .eq("organization_id", orgId)

  const driverIds = (orgDrivers || []).map((d: any) => d.driver_id)
  let completedCount = 0
  let totalEarnings = 0

  if (driverIds.length > 0) {
    const { data: orgOrders } = await supabaseAdmin
      .from("orders")
      .select("id, final_price")
      .in("accepted_driver_id", driverIds)
      .eq("status", "delivered")

    completedCount = orgOrders?.length || 0
    totalEarnings = (orgOrders || []).reduce(
      (sum: number, o: any) => sum + (Number(o.final_price) || 0), 0
    )
  }

  checks.has_completed_delivery = completedCount > 0
  if (!checks.has_completed_delivery) {
    reasons.push("No completed deliveries found for organization drivers")
  }

  checks.delivery_amount_matches = amount <= totalEarnings
  if (!checks.delivery_amount_matches) {
    reasons.push(`Requested ₦${amount.toLocaleString()} exceeds total earnings of ₦${totalEarnings.toLocaleString()}`)
  }

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", orgId)
    .single()

  const walletBalance = Number(wallet?.balance) || 0
  checks.wallet_balance_positive = walletBalance >= amount
  if (!checks.wallet_balance_positive) {
    reasons.push(`Wallet balance ₦${walletBalance.toLocaleString()} insufficient for ₦${amount.toLocaleString()} request`)
  }

  const { count: pendingCount } = await supabaseAdmin
    .from("organization_payout_requests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "pending")

  checks.no_duplicate_pending = (pendingCount || 0) <= 1
  if (!checks.no_duplicate_pending) {
    reasons.push(`${pendingCount} pending payout requests found for this organization`)
  }

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("type, amount, status")
    .eq("user_id", orgId)
    .eq("status", "completed")

  const totalCredits = (transactions || [])
    .filter((t: any) => ["deposit", "earning", "credit"].includes(t.type))
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0)
  const totalDebits = (transactions || [])
    .filter((t: any) => ["payout", "debit", "withdrawal"].includes(t.type))
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0)
  const netBalance = totalCredits - totalDebits

  checks.financial_track_consistent = Math.abs(netBalance - walletBalance) < 100
  if (!checks.financial_track_consistent) {
    reasons.push(`Financial track mismatch: calculated ₦${netBalance.toLocaleString()} vs wallet ₦${walletBalance.toLocaleString()}`)
  }

  const { data: orgProfile } = await supabaseAdmin
    .from("organization_profiles")
    .select("created_at")
    .eq("id", orgId)
    .single()

  if (orgProfile?.created_at) {
    const accountAge = Date.now() - new Date(orgProfile.created_at).getTime()
    checks.not_recently_created = accountAge > 24 * 60 * 60 * 1000
    if (!checks.not_recently_created) {
      reasons.push("Organization created less than 24 hours ago")
    }
  } else {
    checks.not_recently_created = true
  }

  const passed = Object.values(checks).every(Boolean)

  return {
    id: payout.id,
    type: "organization",
    user_id: orgId,
    user_name: payout.users?.full_name || "—",
    user_phone: payout.users?.phone || "—",
    amount,
    bank_name: payout.bank_name || "—",
    account_number: payout.account_number || "—",
    account_name: payout.account_name || "—",
    created_at: payout.created_at,
    passed,
    reason: passed ? "All checks passed" : reasons.join("; "),
    checks,
  }
}

export async function GET() {
  try {
    // Fetch all pending payout requests with user role info
    const { data: driverPayouts } = await supabaseAdmin
      .from("payout_requests")
      .select("*, users!payout_requests_driver_id_fkey(id, full_name, phone, role)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    // Fetch all pending org payout requests
    const { data: orgPayouts } = await supabaseAdmin
      .from("organization_payout_requests")
      .select("*, users!organization_payout_requests_organization_id_fkey(id, full_name, phone, role)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    // Resolve driver bank details from payout_methods
    const driverMethodIds = (driverPayouts || [])
      .filter((p: any) => p.payout_method_id)
      .map((p: any) => p.payout_method_id)

    let payoutMethodsMap: Record<string, any> = {}
    if (driverMethodIds.length > 0) {
      const { data: methods } = await supabaseAdmin
        .from("payout_methods")
        .select("id, bank_name, account_number, account_name")
        .in("id", driverMethodIds)
      if (methods) {
        payoutMethodsMap = Object.fromEntries(methods.map((m: any) => [m.id, m]))
      }
    }

    // Validate each payout request based on ACTUAL user role (not table name)
    const driverResults: IFResult[] = []

    for (const p of driverPayouts || []) {
      const method = p.payout_method_id ? payoutMethodsMap[p.payout_method_id] : null
      const userRole = p.users?.role || "driver"

      if (userRole === "driver") {
        driverResults.push(await validateDriverPayout(p, method))
      } else if (userRole === "customer") {
        driverResults.push(await validateCustomerPayout(p, method))
      } else {
        // Fallback for any other role in payout_requests
        driverResults.push(await validateCustomerPayout(p, method))
      }
    }

    const orgResults = await Promise.all(
      (orgPayouts || []).map((p: any) => validateOrgPayout(p))
    )

    const allResults = [...driverResults, ...orgResults]

    const passed = allResults.filter((r) => r.passed)
    const failed = allResults.filter((r) => !r.passed)

    const passedByType = {
      drivers: passed.filter((r) => r.type === "driver").length,
      customers: passed.filter((r) => r.type === "customer").length,
      organizations: passed.filter((r) => r.type === "organization").length,
    }
    const failedByType = {
      drivers: failed.filter((r) => r.type === "driver").length,
      customers: failed.filter((r) => r.type === "customer").length,
      organizations: failed.filter((r) => r.type === "organization").length,
    }

    return NextResponse.json({
      total: allResults.length,
      passedCount: passed.length,
      failedCount: failed.length,
      passedByType,
      failedByType,
      results: allResults,
    })
  } catch (err) {
    console.error("[IF Check] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
