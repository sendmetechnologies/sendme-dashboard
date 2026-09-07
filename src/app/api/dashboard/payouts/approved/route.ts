import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) {
      return NextResponse.json({ error: "from and to dates required" }, { status: 400 })
    }

    // Fetch approved driver payouts within time range
    const { data: driverPayouts } = await supabaseAdmin
      .from("payout_requests")
      .select("*, users!payout_requests_driver_id_fkey(id, full_name, phone, role)")
      .eq("status", "paid")
      .gte("processed_at", from)
      .lte("processed_at", to)
      .order("processed_at", { ascending: true })

    // Fetch approved org payouts within time range
    const { data: orgPayouts } = await supabaseAdmin
      .from("organization_payout_requests")
      .select("*, users!organization_payout_requests_organization_id_fkey(id, full_name, phone, role)")
      .eq("status", "paid")
      .gte("processed_at", from)
      .lte("processed_at", to)
      .order("processed_at", { ascending: true })

    // Resolve bank details for driver payouts
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

    const allApproved = [
      ...(driverPayouts || []).map((p: any) => {
        const method = p.payout_method_id ? payoutMethodsMap[p.payout_method_id] : null
        const userRole = p.users?.role || "driver"
        return {
          id: p.id,
          type: userRole === "driver" ? "driver" : userRole === "customer" ? "customer" : "organization",
          user_id: p.driver_id,
          user_name: p.users?.full_name || "—",
          user_phone: p.users?.phone || "—",
          amount: Number(p.amount) || 0,
          bank_name: method?.bank_name || "—",
          account_number: method?.account_number || "—",
          account_name: method?.account_name || "—",
          processed_at: p.processed_at,
        }
      }),
      ...(orgPayouts || []).map((p: any) => ({
        id: p.id,
        type: "organization",
        user_id: p.organization_id,
        user_name: p.users?.full_name || "—",
        user_phone: p.users?.phone || "—",
        amount: Number(p.amount) || 0,
        bank_name: p.bank_name || "—",
        account_number: p.account_number || "—",
        account_name: p.account_name || "—",
        processed_at: p.processed_at,
      })),
    ]

    allApproved.sort((a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime())

    return NextResponse.json({ approved: allApproved })
  } catch (err) {
    console.error("[Approved Payouts API] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
