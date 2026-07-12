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
    const { action, reason } = body

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
      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "suspended",
          review_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ success: true, message: "Marketer suspended" })
    }

    // ── Reinstate marketer (from suspended) ──
    if (action === "reinstate") {
      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "approved",
          review_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ success: true, message: "Marketer reinstated" })
    }

    // ── Soft delete (deactivate) ──
    if (action === "soft_delete") {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ is_deleted: true })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Marketer deactivated" })
    }

    // ── Hard delete ──
    if (action === "hard_delete") {
      const { data: result, error } = await supabaseAdmin.rpc("admin_hard_delete_user", { p_user_id: id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (result && !result.success) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json({ success: true, message: "Marketer permanently deleted" })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Marketer Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
