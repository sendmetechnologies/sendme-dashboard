import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { logAdminActivity } from "@/lib/admin-logger"
import { getSession } from "@/lib/auth"

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
    const session = await getSession()
    const adminName = session?.displayName || session?.username || "Admin"
    const adminUsername = session?.username || "admin"
    const adminId = session?.id

    const { id } = await params
    const body = await req.json()
    const { action, amount, note, reason } = body

    // Fetch driver info for logging & notifications
    const { data: driverUser } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, phone")
      .eq("id", id)
      .single()
    const driverName = driverUser?.full_name || driverUser?.phone || "Rider"

    // Verify rider
    if (action === "verify") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "verified", review_reason: null, is_suspended: false }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "verify_driver",
        action_category: "DRIVERS",
        description: `${adminName} verified rider ${driverName} after review`,
        target_type: "rider",
        target_id: id,
        target_name: driverName,
      }).catch(() => {})

      // Send notification to rider
      if (driverUser) {
        // In-app notification
        try {
          await supabaseAdmin.from("messages").insert({
            user_id: driverUser.id,
            title: "Account Verified",
            body: "Your account has been verified. You can now start accepting deliveries.",
            type: "VERIFICATION",
            status: "UNREAD",
            data: { verification_status: "verified" },
            created_at: new Date().toISOString(),
          })
          console.log("[Driver Actions] In-app verification notification sent to", driverUser.id)
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
                userId: driverUser.id,
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
          if (driverUser.email) {
            const { sendEmail, buildReviewNotificationEmail } = await import("@/lib/sendbyte")
            const email = buildReviewNotificationEmail("user", {
              userName: driverUser.full_name || driverUser.email || "Driver",
              userEmail: driverUser.email,
              status: "verified",
            })
            await sendEmail({ to: driverUser.email, subject: email.subject, html: email.html })
            console.log("[Driver Actions] Verification email sent to", driverUser.email)
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

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "reject_driver",
        action_category: "DRIVERS",
        description: `${adminName} rejected verification for rider ${driverName}${reason ? ` — Reason: ${reason}` : ""}`,
        target_type: "rider",
        target_id: id,
        target_name: driverName,
        reason: reason || undefined,
      }).catch(() => {})

      // Send notification to rider
      if (driverUser) {
        const reasonText = reason ? ` Reason: ${reason}` : ""

        // In-app notification
        try {
          await supabaseAdmin.from("messages").insert({
            user_id: driverUser.id,
            title: "Submission Not Approved",
            body: `Your verification was not approved.${reasonText} Please review and resubmit.`,
            type: "VERIFICATION",
            status: "UNREAD",
            data: { verification_status: "rejected", review_reason: reason },
            created_at: new Date().toISOString(),
          })
          console.log("[Driver Actions] In-app rejection notification sent to", driverUser.id)
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
                userId: driverUser.id,
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
          if (driverUser.email) {
            const { sendEmail, buildReviewNotificationEmail } = await import("@/lib/sendbyte")
            const email = buildReviewNotificationEmail("user", {
              userName: driverUser.full_name || driverUser.email || "Driver",
              userEmail: driverUser.email,
              status: "rejected",
              reason: reason || undefined,
            })
            await sendEmail({ to: driverUser.email, subject: email.subject, html: email.html })
            console.log("[Driver Actions] Rejection email sent to", driverUser.email)
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

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "suspend_driver",
        action_category: "DRIVERS",
        description: `${adminName} suspended rider ${driverName}${note ? ` — Reason: ${note}` : ""}`,
        target_type: "rider",
        target_id: id,
        target_name: driverName,
        reason: note || undefined,
      }).catch(() => {})

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

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "credit_wallet",
        action_category: "FINANCE",
        description: `${adminName} credited rider ${driverName} ₦${Number(amount).toLocaleString()}${note ? ` for ${note}` : ""}`,
        target_type: "rider",
        target_id: id,
        target_name: driverName,
        amount: Number(amount),
        reason: note || undefined,
        metadata: {
          previous_balance: wallet ? Number(wallet.balance) : 0,
          new_balance: wallet ? Number(wallet.balance) + Number(amount) : Number(amount),
        },
      }).catch(() => {})

      return NextResponse.json({ success: true, message: `₦${Number(amount).toLocaleString()} credited to wallet` })
    }

    // Soft delete (deactivate)
    if (action === "soft_delete") {
      const { error } = await supabaseAdmin
        .from("driver_profiles")
        .upsert({ id, verification_status: "rejected", is_suspended: false, is_deleted: true, review_reason: "Account deactivated" }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "delete_driver",
        action_category: "DRIVERS",
        description: `${adminName} deactivated rider ${driverName}`,
        target_type: "rider",
        target_id: id,
        target_name: driverName,
      }).catch(() => {})

      return NextResponse.json({ success: true, message: "Driver deactivated" })
    }

    // Hard delete
    if (action === "hard_delete") {
      const { data: result, error } = await supabaseAdmin.rpc("admin_hard_delete_user", { p_user_id: id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (result && !result.success) return NextResponse.json({ error: result.error }, { status: 500 })

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "delete_driver",
        action_category: "DRIVERS",
        description: `${adminName} permanently deleted rider ${driverName}`,
        target_type: "rider",
        target_id: id,
        target_name: driverName,
      }).catch(() => {})

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

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: payout_action === "approve" ? "approve_payout" : "reject_payout",
        action_category: "FINANCE",
        description: `${adminName} ${payout_action === "approve" ? "approved" : "rejected"} payout request #${payout_id.slice(0, 8)} for rider ${driverName}`,
        target_type: "payout",
        target_id: payout_id,
        target_name: driverName,
      }).catch(() => {})

      return NextResponse.json({ success: true, message: `Payout ${newStatus}` })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Driver Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
