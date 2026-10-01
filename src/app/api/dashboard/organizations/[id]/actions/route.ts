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
    const { action, amount, note, reason, driver_user_id } = body

    // Fetch org user info for notification & logging
    const { data: orgUser } = await supabaseAdmin
      .from("users")
      .select("id, email, user_metadata")
      .eq("id", id)
      .single()
    const orgName = orgUser?.user_metadata?.full_name || orgUser?.email || "Organization"

    // Verify organization
    if (action === "verify") {
      const { error } = await supabaseAdmin
        .from("organization_profiles")
        .upsert({ id, is_verified: true, verification_status: "verified", review_reason: null }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "verify_org",
        action_category: "ORGANIZATIONS",
        description: `${adminName} verified organization ${orgName}`,
        target_type: "organization",
        target_id: id,
        target_name: orgName,
      }).catch(() => {})

      if (orgUser) {
        // In-app notification
        try {
          const { error: msgError } = await supabaseAdmin.from("messages").insert({
            user_id: orgUser.id,
            title: "Account Verified",
            body: "Your organization has been verified. You can now start receiving orders.",
            type: "VERIFICATION",
            status: "UNREAD",
            data: { verification_status: "verified" },
            created_at: new Date().toISOString(),
          })
          if (msgError) console.error("[Org Actions] In-app notification insert error:", msgError)
          else console.log("[Org Actions] In-app notification sent to", orgUser.id)
        } catch (e) {
          console.error("[Org Actions] Failed to send in-app notification:", e)
        }

        // Email notification
        try {
          if (!orgUser.email) {
            console.warn("[Org Actions] No email for org user", orgUser.id, "- skipping email")
          } else {
            const { sendEmail, buildReviewNotificationEmail } = await import("@/lib/sendbyte")
            const userName = orgUser.user_metadata?.full_name || orgUser.email || "Organization"
            const email = buildReviewNotificationEmail("user", {
              userName,
              userEmail: orgUser.email,
              status: "verified",
            })
            const result = await sendEmail({ to: orgUser.email, subject: email.subject, html: email.html })
            if (result.success) console.log("[Org Actions] Verification email sent to", orgUser.email)
            else console.error("[Org Actions] Email send failed:", result.error)
          }
        } catch (e) {
          console.error("[Org Actions] Failed to send email notification:", e)
        }
      } else {
        console.warn("[Org Actions] No user found for org id:", id)
      }

      return NextResponse.json({ success: true, message: "Organization verified" })
    }

    // Reject organization (with reason)
    if (action === "reject") {
      const { error } = await supabaseAdmin
        .from("organization_profiles")
        .upsert({ id, is_verified: false, verification_status: "rejected", review_reason: reason || null }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "reject_org",
        action_category: "ORGANIZATIONS",
        description: `${adminName} rejected organization ${orgName}${reason ? ` — Reason: ${reason}` : ""}`,
        target_type: "organization",
        target_id: id,
        target_name: orgName,
        reason: reason || undefined,
      }).catch(() => {})

      if (orgUser) {
        // In-app notification
        try {
          const reasonText = reason ? ` Reason: ${reason}` : ""
          const { error: msgError } = await supabaseAdmin.from("messages").insert({
            user_id: orgUser.id,
            title: "Submission Not Approved",
            body: `Your organization verification was not approved.${reasonText} Please review the feedback and resubmit your documents.`,
            type: "VERIFICATION",
            status: "UNREAD",
            data: { verification_status: "rejected", review_reason: reason },
            created_at: new Date().toISOString(),
          })
          if (msgError) console.error("[Org Actions] In-app notification insert error:", msgError)
          else console.log("[Org Actions] In-app rejection notification sent to", orgUser.id)
        } catch (e) {
          console.error("[Org Actions] Failed to send in-app notification:", e)
        }

        // Email notification
        try {
          if (!orgUser.email) {
            console.warn("[Org Actions] No email for org user", orgUser.id, "- skipping email")
          } else {
            const { sendEmail, buildReviewNotificationEmail } = await import("@/lib/sendbyte")
            const userName = orgUser.user_metadata?.full_name || orgUser.email || "Organization"
            const email = buildReviewNotificationEmail("user", {
              userName,
              userEmail: orgUser.email,
              status: "rejected",
              reason,
            })
            const result = await sendEmail({ to: orgUser.email, subject: email.subject, html: email.html })
            if (result.success) console.log("[Org Actions] Rejection email sent to", orgUser.email)
            else console.error("[Org Actions] Email send failed:", result.error)
          }
        } catch (e) {
          console.error("[Org Actions] Failed to send email notification:", e)
        }
      } else {
        console.warn("[Org Actions] No user found for org id:", id)
      }

      return NextResponse.json({ success: true, message: "Organization rejected" })
    }

    // Suspend organization
    if (action === "suspend") {
      const { error } = await supabaseAdmin
        .from("organization_profiles")
        .upsert({ id, is_suspended: true }, { onConflict: "id" })
      if (error) {
        // If is_suspended column doesn't exist yet, fall back to is_verified = false
        if (error.message?.includes("is_suspended")) {
          const { error: fbErr } = await supabaseAdmin
            .from("organization_profiles")
            .upsert({ id, is_verified: false }, { onConflict: "id" })
          if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 })
        } else {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "suspend_org",
        action_category: "ORGANIZATIONS",
        description: `${adminName} suspended organization ${orgName}`,
        target_type: "organization",
        target_id: id,
        target_name: orgName,
      }).catch(() => {})

      return NextResponse.json({ success: true, message: "Organization suspended" })
    }

    // Credit organization wallet
    if (action === "credit") {
      if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })

      const { data: wallet } = await supabaseAdmin
        .from("organization_wallets")
        .select("id, balance")
        .eq("organization_id", id)
        .single()

      if (wallet) {
        const newBalance = Number(wallet.balance) + Number(amount)
        const { error } = await supabaseAdmin
          .from("organization_wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", wallet.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else {
        const { error } = await supabaseAdmin
          .from("organization_wallets")
          .insert({ organization_id: id, balance: amount })
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
        description: `${adminName} credited organization ${orgName} ₦${Number(amount).toLocaleString()}${note ? ` for ${note}` : ""}`,
        target_type: "organization",
        target_id: id,
        target_name: orgName,
        amount: Number(amount),
        reason: note || undefined,
        metadata: {
          previous_balance: wallet ? Number(wallet.balance) : 0,
          new_balance: wallet ? Number(wallet.balance) + Number(amount) : Number(amount),
        },
      }).catch(() => {})

      return NextResponse.json({ success: true, message: `₦${Number(amount).toLocaleString()} credited to wallet` })
    }

    // Soft delete
    if (action === "soft_delete") {
      const { error } = await supabaseAdmin
        .from("organization_profiles")
        .upsert({ id, is_verified: false }, { onConflict: "id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      logAdminActivity({
        admin_id: adminId,
        admin_username: adminUsername,
        admin_display_name: adminName,
        action_type: "delete_org",
        action_category: "ORGANIZATIONS",
        description: `${adminName} deactivated organization ${orgName}`,
        target_type: "organization",
        target_id: id,
        target_name: orgName,
      }).catch(() => {})

      return NextResponse.json({ success: true, message: "Organization deactivated" })
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
        action_type: "delete_org",
        action_category: "ORGANIZATIONS",
        description: `${adminName} permanently deleted organization ${orgName}`,
        target_type: "organization",
        target_id: id,
        target_name: orgName,
      }).catch(() => {})

      return NextResponse.json({ success: true, message: "Organization permanently deleted" })
    }

    // Unlink a rider from this organization
    if (action === "unlink_driver") {
      if (!driver_user_id) return NextResponse.json({ error: "driver_user_id required" }, { status: 400 })

      // Clear linked_org_id on the rider's users row
      const { error: userErr } = await supabaseAdmin
        .from("users")
        .update({ linked_org_id: null })
        .eq("id", driver_user_id)
      if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

      // Clear user_id on organization_drivers
      const { error: odErr } = await supabaseAdmin
        .from("organization_drivers")
        .update({ user_id: null })
        .eq("organization_id", id)
        .eq("user_id", driver_user_id)
      if (odErr) console.error("[Org Actions] org_drivers unlink warning:", odErr)

      return NextResponse.json({ success: true, message: "Rider unlinked from organization" })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Org Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
