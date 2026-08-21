import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendEmail, buildMarketerApprovalEmail, buildMarketerRejectionEmail } from "@/lib/sendbyte";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, reason } = body as { action: "approve" | "reject"; reason?: string };

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Determine type from prefix
  if (id.startsWith("DRV-")) {
    // Driver verification
    const realId = id.replace("DRV-", "").toLowerCase();
    // We need to find the driver profile by matching the short ID prefix
    const { data: profile } = await supabaseAdmin
      .from("driver_profiles")
      .select("id")
      .like("id", `${realId}%`)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "verified" : "rejected";
    const { error } = await supabaseAdmin
      .from("driver_profiles")
      .update({
        verification_status: newStatus,
        review_reason: reason || null,
      })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  }

  if (id.startsWith("ORG-")) {
    const realId = id.replace("ORG-", "").toLowerCase();
    const { data: profile } = await supabaseAdmin
      .from("organization_profiles")
      .select("id")
      .like("id", `${realId}%`)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "verified" : "rejected";
    const { error } = await supabaseAdmin
      .from("organization_profiles")
      .update({
        verification_status: newStatus,
        is_verified: action === "approve",
        review_reason: reason || null,
      })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  }

  if (id.startsWith("PAYOUT-")) {
    const realId = id.replace("PAYOUT-", "").toLowerCase();
    const { data: payout } = await supabaseAdmin
      .from("organization_payout_requests")
      .select("id, organization_id, amount")
      .like("id", `${realId}%`)
      .single();

    if (!payout) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "completed" : "failed";
    const { error } = await supabaseAdmin
      .from("organization_payout_requests")
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If rejected, refund the organization wallet
    if (action === "reject") {
      await supabaseAdmin.rpc("increment_wallet_balance", {
        p_user_id: payout.organization_id,
        p_amount: payout.amount,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  }

  if (id.startsWith("MRK-")) {
    const realId = id.replace("MRK-", "").toLowerCase();
    const { data: profile } = await supabaseAdmin
      .from("marketer_profiles")
      .select("id, user_id, marketer_id")
      .like("id", `${realId}%`)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Generate a unique marketer ID if not assigned
      let marketerId = profile.marketer_id;
      if (!marketerId) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let attempts = 0;
        while (attempts < 10) {
          marketerId = "MKT-";
          for (let i = 0; i < 6; i++) marketerId += chars.charAt(Math.floor(Math.random() * chars.length));
          const { data: existing } = await supabaseAdmin
            .from("marketer_profiles")
            .select("id")
            .eq("marketer_id", marketerId)
            .single();
          if (!existing) break;
          attempts++;
        }
      }

      const { error } = await supabaseAdmin
        .from("marketer_profiles")
        .update({
          status: "approved",
          marketer_id: marketerId,
          review_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Create canonical marketer row + wallet
      try {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("full_name, email, phone")
          .eq("id", profile.user_id)
          .single();
        const { data: userProfile } = await supabaseAdmin
          .from("marketer_profiles")
          .select("phone")
          .eq("user_id", profile.user_id)
          .single();
        const { data: rateSetting } = await supabaseAdmin
          .from("platform_settings")
          .select("value")
          .eq("key", "marketer_commission_rate")
          .single();
        const commissionRate = rateSetting?.value != null ? Number(rateSetting.value) : 0.02;

        const { data: mkRow } = await supabaseAdmin
          .from("marketers")
          .insert({
            ref_id: marketerId,
            name: user?.full_name || null,
            email: user?.email || null,
            phone: userProfile?.phone || user?.phone || null,
            commission_rate: commissionRate,
            is_active: true,
            total_referrals: 0,
            total_earnings: 0,
          })
          .select("id")
          .single();

        if (mkRow) {
          await supabaseAdmin.from("marketer_wallets").insert({ marketer_id: mkRow.id, balance: 0 });
        }
      } catch (e) {
        console.error("[Approvals] Failed to create canonical marketer row:", e);
      }

      // Send approval email with marketer ID
      try {
        if (user?.email) {
          const userName = user.full_name || "Marketer";
          const { subject, html } = buildMarketerApprovalEmail({ userName, marketerId: marketerId! });
          await sendEmail({ to: user.email, subject, html });
        }
      } catch (e) {
        console.error("[Approvals] Failed to send marketer approval email:", e);
      }

      return NextResponse.json({ success: true, status: "approved" });
    }

    // Reject
    const { error } = await supabaseAdmin
      .from("marketer_profiles")
      .update({
        status: "rejected",
        review_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send rejection email
    try {
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("full_name, email")
        .eq("id", profile.user_id)
        .single();
      if (userData?.email) {
        const { subject, html } = buildMarketerRejectionEmail({ userName: userData.full_name || "Marketer", reason });
        await sendEmail({ to: userData.email, subject, html });
      }
    } catch (e) {
      console.error("[Approvals] Failed to send marketer rejection email:", e);
    }

    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Unknown approval type" }, { status: 400 });
}
