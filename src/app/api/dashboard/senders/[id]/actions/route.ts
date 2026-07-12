import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, amount, note } = body

    // Credit sender wallet
    if (action === "credit") {
      if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })

      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", id)
        .single()

      if (wallet) {
        const newBalance = Number(wallet.balance) + Number(amount)
        const { error } = await supabaseAdmin
          .from("wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", wallet.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else {
        const { error } = await supabaseAdmin
          .from("wallets")
          .insert({ user_id: id, balance: amount })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabaseAdmin.from("transactions").insert({
        user_id: id,
        type: "deposit",
        amount: amount,
      })

      return NextResponse.json({ success: true, message: `₦${Number(amount).toLocaleString()} credited to wallet` })
    }

    // Suspend sender
    if (action === "suspend") {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ is_suspended: true })
        .eq("id", id)
      if (error) {
        // If column doesn't exist yet, return helpful message
        if (error.message?.includes("is_suspended")) {
          return NextResponse.json({ error: "Run supabase_migration_suspend.sql first to enable suspend" }, { status: 500 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: "Sender suspended" })
    }

    // Soft delete (deactivate)
    if (action === "soft_delete") {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ is_deleted: true })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Sender deactivated" })
    }

    // Hard delete
    if (action === "hard_delete") {
      const { data: result, error } = await supabaseAdmin.rpc("admin_hard_delete_user", { p_user_id: id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (result && !result.success) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json({ success: true, message: "Sender permanently deleted" })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Sender Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
