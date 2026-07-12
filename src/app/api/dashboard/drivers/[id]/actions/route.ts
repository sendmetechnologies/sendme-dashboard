import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, amount, note, reason } = body

    // Verify rider
    if (action === "verify") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "verified", review_reason: null }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Driver verified" })
    }

    // Reject rider (with reason)
    if (action === "reject") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", review_reason: reason || null }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Driver rejected" })
    }

    // Suspend rider
    if (action === "suspend") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", review_reason: note || "Suspended by admin" }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Driver suspended" })
    }

    // Credit rider wallet
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

    // Soft delete
    if (action === "soft_delete") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", review_reason: "Account deactivated" }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Driver deactivated" })
    }

    // Hard delete
    if (action === "hard_delete") {
      const { data: result, error } = await supabaseAdmin.rpc("admin_hard_delete_user", { p_user_id: id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (result && !result.success) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json({ success: true, message: "Driver permanently deleted" })
    }

    // Process payout
    if (action === "process_payout") {
      const { payout_id, payout_action } = body
      if (!payout_id) return NextResponse.json({ error: "Missing payout_id" }, { status: 400 })

      const newStatus = payout_action === "approve" ? "paid" : "failed"
      const { error } = await supabaseAdmin
        .from("payout_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", payout_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: `Payout ${newStatus}` })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Driver Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
