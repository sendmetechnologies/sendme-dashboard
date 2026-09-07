import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

async function sendUserNotification(userId: string, title: string, body: string, type: string = "PAYMENT") {
  await supabaseAdmin.from("messages").insert({
    user_id: userId, title, body, type, status: "UNREAD",
    data: { event: "WALLET_CREDIT" }, created_at: new Date().toISOString(),
  })
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ userId, title, body, type, channels: { inApp: true, push: true, email: false } }),
      })
    }
  } catch {}
}

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
        .upsert({ id, verification_status: "verified", review_reason: null, is_suspended: false }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Send notification to rider
      const { data: riderUser } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name")
        .eq("id", id)
        .single()

      if (riderUser) {
        // In-app notification
        try {
          await supabaseAdmin.from("messages").insert({
            user_id: riderUser.id,
            title: "Account Verified",
            body: "Your account has been verified. You can now start accepting deliveries.",
            type: "VERIFICATION",
            status: "UNREAD",
            data: { verification_status: "verified" },
            created_at: new Date().toISOString(),
          })
          console.log("[Driver Actions] In-app verification notification sent to", riderUser.id)
        } catch (e) {
          console.error("[Driver Actions] Failed to send in-app notification:", e)
        }

        // Push notification via edge function
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceKey) {
            await fetch(`${supabaseUrl}/functions/v1/send-message`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
              body: JSON.stringify({
                userId: riderUser.id,
                title: "Account Verified",
                body: "Your account has been verified. You can now start accepting deliveries.",
                type: "VERIFICATION",
                channels: { inApp: true, push: true, email: false },
              }),
            })
          }
        } catch (e) {
          console.error("[Driver Actions] Failed to send push notification:", e)
        }

        // Email notification
        try {
          if (riderUser.email) {
            const { sendEmail, buildReviewNotificationEmail } = await import("@/lib/sendbyte")
            const email = buildReviewNotificationEmail("user", {
              userName: riderUser.full_name || riderUser.email || "Driver",
              userEmail: riderUser.email,
              status: "verified",
            })
            await sendEmail({ to: riderUser.email, subject: email.subject, html: email.html })
            console.log("[Driver Actions] Verification email sent to", riderUser.email)
          }
        } catch (e) {
          console.error("[Driver Actions] Failed to send email:", e)
        }
      }

      return NextResponse.json({ success: true, message: "Driver verified" })
    }

    // Reject rider (with reason)
    if (action === "reject") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", is_suspended: false, review_reason: reason || null }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Send notification to rider
      const { data: riderUser } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name")
        .eq("id", id)
        .single()

      if (riderUser) {
        const reasonText = reason ? ` Reason: ${reason}` : ""

        // In-app notification
        try {
          await supabaseAdmin.from("messages").insert({
            user_id: riderUser.id,
            title: "Submission Not Approved",
            body: `Your verification was not approved.${reasonText} Please review and resubmit.`,
            type: "VERIFICATION",
            status: "UNREAD",
            data: { verification_status: "rejected", review_reason: reason },
            created_at: new Date().toISOString(),
          })
          console.log("[Driver Actions] In-app rejection notification sent to", riderUser.id)
        } catch (e) {
          console.error("[Driver Actions] Failed to send in-app notification:", e)
        }

        // Push notification via edge function
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceKey) {
            await fetch(`${supabaseUrl}/functions/v1/send-message`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
              body: JSON.stringify({
                userId: riderUser.id,
                title: "Submission Not Approved",
                body: `Your verification was not approved.${reasonText} Please review and resubmit.`,
                type: "VERIFICATION",
                channels: { inApp: true, push: true, email: false },
              }),
            })
          }
        } catch (e) {
          console.error("[Driver Actions] Failed to send push notification:", e)
        }

        // Email notification
        try {
          if (riderUser.email) {
            const { sendEmail, buildReviewNotificationEmail } = await import("@/lib/sendbyte")
            const email = buildReviewNotificationEmail("user", {
              userName: riderUser.full_name || riderUser.email || "Driver",
              userEmail: riderUser.email,
              status: "rejected",
              reason: reason || undefined,
            })
            await sendEmail({ to: riderUser.email, subject: email.subject, html: email.html })
            console.log("[Driver Actions] Rejection email sent to", riderUser.email)
          }
        } catch (e) {
          console.error("[Driver Actions] Failed to send email:", e)
        }
      }

      return NextResponse.json({ success: true, message: "Driver rejected" })
    }

    // Suspend rider
    if (action === "suspend") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", is_suspended: true, review_reason: note || "Suspended by admin" }, { onConflict: "id" })
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

      await sendUserNotification(id, "Wallet Credited", `₦${Number(amount).toLocaleString()} has been added to your wallet by admin.`, "PAYMENT")

      return NextResponse.json({ success: true, message: `₦${Number(amount).toLocaleString()} credited to wallet` })
    }

    // Soft delete (deactivate)
    if (action === "soft_delete") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", is_suspended: false, is_deleted: true, review_reason: "Account deactivated" }, { onConflict: "id" })
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
