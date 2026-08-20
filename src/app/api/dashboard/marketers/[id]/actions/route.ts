import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function generateMarketerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "MKT-"
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason, target_role } = body

    // ── Approve marketer ──
    if (action === "approve") {
      // Generate a unique marketer ID
      let marketerId = generateMarketerId()
      let attempts = 0
      while (attempts < 10) {
        const { data: existing } = await supabaseAdmin
          .from("marketer_profiles")
          .select("id")
          .eq("marketer_id", marketerId)
          .single()
        if (!existing) break
        marketerId = generateMarketerId()
        attempts++
      }

      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "approved",
          marketer_id: marketerId,
          review_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Create the canonical marketer record + wallet so the marketer's public
      // dashboard (marketers / marketer_wallets tables) has data to read.
      try {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id, full_name, email, phone")
          .eq("id", id)
          .single()
        const { data: profile } = await supabaseAdmin
          .from("marketer_profiles")
          .select("phone")
          .eq("user_id", id)
          .single()

        const { data: rateSetting } = await supabaseAdmin
          .from("platform_settings")
          .select("value")
          .eq("key", "marketer_commission_rate")
          .single()
        const commissionRate = rateSetting?.value != null ? Number(rateSetting.value) : 0.02

        const { data: marketerRow, error: mkError } = await supabaseAdmin
          .from("marketers")
          .insert({
            ref_id: marketerId,
            name: user?.full_name || null,
            email: user?.email || null,
            phone: profile?.phone || user?.phone || null,
            commission_rate: commissionRate,
            is_active: true,
            total_referrals: 0,
            total_earnings: 0,
          })
          .select("id")
          .single()

        if (mkError) {
          console.error("[Marketer Actions] Failed to create marketers row:", mkError)
        } else if (marketerRow) {
          await supabaseAdmin
            .from("marketer_wallets")
            .insert({ marketer_id: marketerRow.id, balance: 0 })
        }
      } catch (e) {
        console.error("[Marketer Actions] Failed to sync canonical marketer row:", e)
      }

      // Send in-app notification
      try {
        await supabaseAdmin.from("messages").insert({
          user_id: id,
          title: "Application Approved!",
          body: `Congratulations! Your Growth Partner application has been approved. Your Marketer ID is ${marketerId}. Start sharing it to earn commissions.`,
          type: "SYSTEM",
          status: "UNREAD",
          data: { marketer_id: marketerId, event: "MARKETER_APPROVED" },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("[Marketer Actions] Failed to send in-app notification:", e)
      }

      return NextResponse.json({ success: true, message: `Marketer approved with ID: ${marketerId}`, marketerId })
    }

    // ── Reject marketer ──
    if (action === "reject") {
      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "rejected",
          review_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Send in-app notification
      try {
        const reasonText = reason ? ` Reason: ${reason}` : ""
        await supabaseAdmin.from("messages").insert({
          user_id: id,
          title: "Application Not Approved",
          body: `Your Growth Partner application was not approved.${reasonText} Please review the feedback and contact support if you have questions.`,
          type: "SYSTEM",
          status: "UNREAD",
          data: { review_reason: reason, event: "MARKETER_REJECTED" },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("[Marketer Actions] Failed to send in-app notification:", e)
      }

      return NextResponse.json({ success: true, message: "Marketer rejected" })
    }

    // ── Suspend marketer ──
    if (action === "suspend") {
      const { data: profile } = await supabaseAdmin
        .from("marketer_profiles")
        .select("marketer_id")
        .eq("user_id", id)
        .single()

      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "suspended",
          review_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Deactivate the marketer code so referrals stop being accepted
      if (profile?.marketer_id) {
        await supabaseAdmin
          .from("marketers")
          .update({ is_active: false })
          .eq("ref_id", profile.marketer_id)
      }

      return NextResponse.json({ success: true, message: "Marketer suspended" })
    }

    // ── Reinstate marketer (from suspended) ──
    if (action === "reinstate") {
      const { data: profile } = await supabaseAdmin
        .from("marketer_profiles")
        .select("marketer_id")
        .eq("user_id", id)
        .single()

      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "approved",
          review_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Re-activate the marketer code
      if (profile?.marketer_id) {
        await supabaseAdmin
          .from("marketers")
          .update({ is_active: true })
          .eq("ref_id", profile.marketer_id)
      }

      return NextResponse.json({ success: true, message: "Marketer reinstated" })
    }

    // ── Soft delete (deactivate) ──
    if (action === "soft_delete") {
      const { data: profile } = await supabaseAdmin
        .from("marketer_profiles")
        .select("marketer_id")
        .eq("user_id", id)
        .single()

      const { error } = await supabaseAdmin
        .from("users")
        .update({ is_deleted: true })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Deactivate the marketer code too
      if (profile?.marketer_id) {
        await supabaseAdmin
          .from("marketers")
          .update({ is_active: false })
          .eq("ref_id", profile.marketer_id)
      }

      return NextResponse.json({ success: true, message: "Marketer deactivated" })
    }

    // ── Hard delete (marketer ONLY — does NOT delete the underlying user account) ──
    if (action === "hard_delete") {
      const { data: profile } = await supabaseAdmin
        .from("marketer_profiles")
        .select("marketer_id")
        .eq("user_id", id)
        .single()

      // Remove canonical marketer row + wallet
      if (profile?.marketer_id) {
        const { data: mkRow } = await supabaseAdmin
          .from("marketers")
          .select("id")
          .eq("ref_id", profile.marketer_id)
          .single()
        if (mkRow?.id) {
          await supabaseAdmin.from("marketer_wallets").delete().eq("marketer_id", mkRow.id)
          await supabaseAdmin.from("marketer_wallet_transactions").delete().eq("marketer_id", mkRow.id)
        }
        await supabaseAdmin.from("marketers").delete().eq("ref_id", profile.marketer_id)
      }

      // Remove the marketer_profiles row (applied/application record)
      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .delete()
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Deactivate their user account instead of deleting it — their sender/org/rider account stays
      await supabaseAdmin
        .from("users")
        .update({ is_deleted: true })
        .eq("id", id)

      return NextResponse.json({ success: true, message: "Marketer deleted. User account deactivated but preserved." })
    }

    // ── Assign base role to a marketer-only user ──
    if (action === "assign_role") {
      const validRoles = ["customer", "driver", "organization"]
      if (!target_role || !validRoles.includes(target_role)) {
        return NextResponse.json({ error: `target_role must be one of: ${validRoles.join(", ")}` }, { status: 400 })
      }

      const { data: user, error: fetchErr } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", id)
        .single()
      if (fetchErr || !user) return NextResponse.json({ error: "User not found" }, { status: 404 })

      if (user.role !== "marketer") {
        return NextResponse.json({ error: `User already has base role "${user.role}". Only marketer-only users (role=marketer) can be assigned a base role.` }, { status: 400 })
      }

      const { error: updateErr } = await supabaseAdmin
        .from("users")
        .update({ role: target_role })
        .eq("id", id)
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

      return NextResponse.json({ success: true, message: `Marketer assigned base role: ${target_role}` })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Marketer Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
