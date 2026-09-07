import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id")
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }

    const { data: transactions, error } = await supabaseAdmin
      .from("transactions")
      .select("id, type, amount, status, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single()

    return NextResponse.json({
      transactions: transactions || [],
      walletBalance: Number(wallet?.balance) || 0,
    })
  } catch (err) {
    console.error("[Transactions API] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
