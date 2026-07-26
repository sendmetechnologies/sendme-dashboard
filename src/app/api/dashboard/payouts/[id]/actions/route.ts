import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendEmail, buildPayoutApprovedEmail, buildPayoutRejectedEmail } from "@/lib/sendbyte"

async function sendUserNotification(
  userId: string,
  title: string,
  body: string,
  type: string = "PAYMENT"
) {
  // Insert into messages table (in-app notification)
  const { error } = await supabaseAdmin.from("messages").insert({
    user_id: userId,
    title,
    body,
    type,
    status: "UNREAD",
    data: { event: "PAYOUT_STATUS" },
    created_at: new Date().toISOString(),
  })
  if (error) console.error("[Notification] messages insert failed:", error.message)

  // Also try to send push notification via send-message edge function
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          type,
          channels: { inApp: true, push: true, email: false },
        }),
      })
    }
  } catch (err) {
    console.error("[Notification] push notification failed:", err)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason } = body // action: "approve" | "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Try driver payout_requests first
    let payout: any = null
    let table = ""

    const { data: driverPayout } = await supabaseAdmin
      .from("payout_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (driverPayout) {
      payout = driverPayout
      table = "payout_requests"
    } else {
      const { data: orgPayout } = await supabaseAdmin
        .from("organization_payout_requests")
        .select("*")
        .eq("id", id)
        .single()

      if (orgPayout) {
        payout = orgPayout
        table = "organization_payout_requests"
      }
    }

    if (!payout) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 })
    }

    if (payout.status !== "pending") {
      return NextResponse.json({ error: `Payout already ${payout.status}` }, { status: 400 })
    }

    const userId = table === "payout_requests" ? payout.driver_id : payout.organization_id

    if (action === "reject") {
      // Build update fields based on table schema
      const updateFields: any = { status: "failed", processed_at: new Date().toISOString() }

      const { error } = await supabaseAdmin
        .from(table)
        .update(updateFields)
        .eq("id", id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Find the specific transaction for this payout request (match by amount, not all pending)
      const { data: specificTx } = await supabaseAdmin
        .from("transactions")
        .select("id, created_at")
        .eq("user_id", userId)
        .eq("type", "payout")
        .eq("status", "pending")
        .eq("amount", -Number(payout.amount))
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (specificTx) {
        await supabaseAdmin
          .from("transactions")
          .update({ status: "failed" })
          .eq("id", specificTx.id)
      }

      // Find and void any associated withdrawal fee transaction
      let feeAmount = 0
      if (specificTx) {
        const { data: feeTx } = await supabaseAdmin
          .from("transactions")
          .select("id, amount")
          .eq("user_id", userId)
          .eq("type", "debit")
          .eq("status", "completed")
          .eq("note", "Withdrawal fee")
          .gte("created_at", new Date(new Date(specificTx.created_at || payout.created_at).getTime() - 5 * 60 * 1000).toISOString())
          .lte("created_at", new Date(new Date(specificTx.created_at || payout.created_at).getTime() + 5 * 60 * 1000).toISOString())
          .limit(1)
          .single()

        if (feeTx) {
          feeAmount = Math.abs(Number(feeTx.amount))
          await supabaseAdmin
            .from("transactions")
            .update({ status: "failed" })
            .eq("id", feeTx.id)
        }
      }

      // Refund wallet (amount + any fee)
      const refundTotal = Number(payout.amount) + feeAmount

      if (table === "payout_requests") {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .single()

        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({ balance: Number(wallet.balance) + refundTotal, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
        }
      } else {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .single()

        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({ balance: Number(wallet.balance) + refundTotal, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
        }
      }

      const rejectionNote = reason ? ` Reason: ${reason}` : ""
      const feeNote = feeAmount > 0 ? ` Your ₦${feeAmount.toLocaleString()} withdrawal fee has also been refunded.` : ""
      await sendUserNotification(
        userId,
        "Payout Rejected",
        `Your payout of ₦${Number(payout.amount).toLocaleString()} was not approved.${rejectionNote}${feeNote} Your wallet has been refunded.`
      )

      // Send rejection email to user
      try {
        const { data: userData } = await supabaseAdmin
          .from("users")
          .select("email, full_name")
          .eq("id", userId)
          .single()
        if (userData?.email) {
          await sendEmail({
            to: userData.email,
            ...buildPayoutRejectedEmail({
              userName: userData.full_name || userData.email,
              amount: Number(payout.amount),
              reason: reason || undefined,
              feeRefunded: feeAmount > 0 ? feeAmount : undefined,
            }),
          })
        }
      } catch (e) {
        console.error("[Payout Actions] Failed to send rejection email:", e)
      }

      return NextResponse.json({ success: true, message: "Payout rejected. User wallet has been refunded." })
    }

    // ─── APPROVE ──────────────────────────────────────────────────────
    // Approves the payout request and marks it as paid.
    // Admin makes the actual bank transfer; user gets notified.

    const updateFields: any = { status: "paid", processed_at: new Date().toISOString() }

    const { error } = await supabaseAdmin
      .from(table)
      .update(updateFields)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Find the specific transaction for this payout request (match by amount, not all pending)
    const { data: specificTx } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "payout")
      .eq("status", "pending")
      .eq("amount", -Number(payout.amount))
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (specificTx) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", specificTx.id)
    }

    // Send success notification to user
    let bankName = "your bank account"
    if (table === "payout_requests" && payout.payout_method_id) {
      const { data: method } = await supabaseAdmin
        .from("payout_methods")
        .select("bank_name")
        .eq("id", payout.payout_method_id)
        .single()
      if (method?.bank_name) bankName = method.bank_name
    } else if (payout.bank_name) {
      bankName = payout.bank_name
    }

    await sendUserNotification(
      userId,
      "Payout Paid",
      `Your payout of ₦${Number(payout.amount).toLocaleString()} to ${bankName} has been paid and will be credited shortly.`
    )

    // Send approval email to user
    try {
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("email, full_name")
        .eq("id", userId)
        .single()
      if (userData?.email) {
        await sendEmail({
          to: userData.email,
          ...buildPayoutApprovedEmail({
            userName: userData.full_name || userData.email,
            amount: Number(payout.amount),
            bankName,
          }),
        })
      }
    } catch (e) {
      console.error("[Payout Actions] Failed to send approval email:", e)
    }

    return NextResponse.json({ success: true, message: "Payout approved and marked as paid. User has been notified." })
  } catch (err) {
    console.error("[Payout Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
