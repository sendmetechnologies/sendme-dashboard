import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || ""
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || "" // "driver", "org", or "" for all
    const offset = (page - 1) * limit

    // Fetch driver payout requests with bank details
    const driverQuery = supabaseAdmin
      .from("payout_requests")
      .select("*, users!payout_requests_driver_id_fkey(id, full_name, phone, role)", { count: "exact" })
      .order("created_at", { ascending: false })

    if (status) driverQuery.eq("status", status)
    if (search) {
      driverQuery.or(`note.ilike.%${search}%,users.full_name.ilike.%${search}%`)
    }

    // Fetch org payout requests
    const orgQuery = supabaseAdmin
      .from("organization_payout_requests")
      .select("*, users!organization_payout_requests_organization_id_fkey(id, full_name, phone, role)", { count: "exact" })
      .order("created_at", { ascending: false })

    if (status) orgQuery.eq("status", status)

    // Fetch all wallet balances (all users including orgs)
    const walletsQuery = supabaseAdmin
      .from("wallets")
      .select("balance")

    const [driverResult, orgResult, walletsResult] = await Promise.all([
      driverQuery, orgQuery, walletsQuery
    ])

    // Resolve driver bank details from payout_methods table
    const driverPayoutMethodIds = (driverResult.data || [])
      .filter((p: any) => p.payout_method_id)
      .map((p: any) => p.payout_method_id)

    let payoutMethodsMap: Record<string, any> = {}
    if (driverPayoutMethodIds.length > 0) {
      const { data: methods } = await supabaseAdmin
        .from("payout_methods")
        .select("id, bank_name, account_number, account_name")
        .in("id", driverPayoutMethodIds)
      if (methods) {
        payoutMethodsMap = Object.fromEntries(methods.map((m: any) => [m.id, m]))
      }
    }

    // Normalize and merge both into a unified list
    const driverPayouts = (driverResult.data || []).map((p: any) => {
      const method = p.payout_method_id ? payoutMethodsMap[p.payout_method_id] : null
      return {
        id: p.id,
        type: "driver" as const,
        user_id: p.driver_id,
        user_name: p.users?.full_name || "—",
        user_phone: p.users?.phone || "—",
        amount: Number(p.amount) || 0,
        status: p.status,
        bank_name: method?.bank_name || "—",
        account_number: method?.account_number || "—",
        account_name: method?.account_name || "—",
        note: p.note || "",
        created_at: p.created_at,
      }
    })

    const orgPayouts = (orgResult.data || []).map((p: any) => ({
      id: p.id,
      type: "organization" as const,
      user_id: p.organization_id,
      user_name: p.users?.full_name || "—",
      user_phone: p.users?.phone || "—",
      amount: Number(p.amount) || 0,
      status: p.status,
      bank_name: p.bank_name || "—",
      account_number: p.account_number || "—",
      account_name: p.account_name || "—",
      note: "",
      created_at: p.created_at,
      processed_at: p.processed_at,
    }))

    let allPayouts = [...driverPayouts, ...orgPayouts]

    // Filter by type
    if (type === "driver") allPayouts = allPayouts.filter((p) => p.type === "driver")
    else if (type === "org") allPayouts = allPayouts.filter((p) => p.type === "organization")

    // Sort by created_at descending
    allPayouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const total = allPayouts.length
    const paginated = allPayouts.slice(offset, offset + limit)

    // Compute stats
    const allCombined = [...driverPayouts, ...orgPayouts]
    const totalAmount = allCombined.reduce((s, p) => s + p.amount, 0)
    const pendingPayouts = allCombined.filter((p) => p.status === "pending")
    const pendingAmount = pendingPayouts.reduce((s, p) => s + p.amount, 0)
    const completedPayouts = allCombined.filter((p) => p.status === "paid" || p.status === "completed")
    const completedAmount = completedPayouts.reduce((s, p) => s + p.amount, 0)
    const processingPayouts = allCombined.filter((p) => p.status === "processing")
    const failedPayouts = allCombined.filter((p) => p.status === "failed")

    // Compute total wallet balances (unified wallets table includes orgs)
    const totalWalletBalance = (walletsResult.data || []).reduce(
      (sum, w) => sum + (Number(w.balance) || 0), 0
    )
    const totalWalletUsers = walletsResult.data?.length || 0

    return NextResponse.json({
      payouts: paginated,
      stats: {
        total: allCombined.length,
        totalAmount,
        pending: pendingPayouts.length,
        pendingAmount,
        processing: processingPayouts.length,
        processingAmount: processingPayouts.reduce((s, p) => s + p.amount, 0),
        completed: completedPayouts.length,
        completedAmount,
        failed: failedPayouts.length,
      },
      wallets: {
        totalBalance: totalWalletBalance,
        totalUsers: totalWalletUsers,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("[Payouts API] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
