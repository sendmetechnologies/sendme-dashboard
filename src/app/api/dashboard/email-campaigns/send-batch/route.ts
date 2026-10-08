import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getCampaignFromAddress } from "@/lib/sendbyte";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { campaignId, batchIndex = 0, batchSize = 100, retryFailed = false } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    // 1. Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // If retryFailed is requested, reset failed recipients to queued first
    if (retryFailed) {
      await supabaseAdmin
        .from("email_campaign_recipients")
        .update({ status: "queued", error: null, updated_at: new Date().toISOString() })
        .eq("campaign_id", campaignId)
        .eq("status", "failed");
    }

    // 2. Fetch up to batchSize recipients for this campaign that are queued
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("id, email, name, user_id, status")
      .eq("campaign_id", campaignId)
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (recipientsError) {
      return NextResponse.json({ error: recipientsError.message }, { status: 500 });
    }

    if (!recipients || recipients.length === 0) {
      // Check remaining queued
      const { count: remainingCount } = await supabaseAdmin
        .from("email_campaign_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("status", "queued");

      const isComplete = (remainingCount || 0) === 0;
      if (isComplete && campaign.status !== "sent") {
        await supabaseAdmin
          .from("email_campaigns")
          .update({ status: (campaign.sent_count || 0) > 0 ? "sent" : "failed", updated_at: new Date().toISOString() })
          .eq("id", campaignId);
      }

      return NextResponse.json({
        success: true,
        batchIndex,
        batchNumber: batchIndex + 1,
        batchCount: 0,
        sentCount: 0,
        failedCount: 0,
        remainingQueued: remainingCount || 0,
        isComplete: true,
        message: "No queued recipients remaining",
        campaign,
      });
    }

    // 3. Dispatch batch to SendByte with smart concurrency and rate-limit backoff
    const from = getCampaignFromAddress(campaign.sender_name);
    const subject = campaign.subject;
    const bodyHtml = campaign.body_html;
    const bodyText = campaign.body_text;

    let batchSent = 0;
    let batchFailed = 0;

    // Concurrency 4 with 250ms spacing to comfortably stay under SendByte per-minute rate limit
    const SUB_CONCURRENCY = 4;
    for (let i = 0; i < recipients.length; i += SUB_CONCURRENCY) {
      const chunk = recipients.slice(i, i + SUB_CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (recipient) => {
          let res = await sendEmail({
            to: recipient.email,
            subject,
            html: bodyHtml,
            text: bodyText,
            from,
          });

          // If rate limited (429 or 'Too many requests' or 'limit'), pause 2.5s and retry once
          const isRateLimit = res.error && (
            res.error.includes("429") ||
            res.error.toLowerCase().includes("rate") ||
            res.error.toLowerCase().includes("limit") ||
            res.error.toLowerCase().includes("too many")
          );

          if (!res.success && isRateLimit) {
            await new Promise((r) => setTimeout(r, 2500));
            res = await sendEmail({
              to: recipient.email,
              subject,
              html: bodyHtml,
              text: bodyText,
              from,
            });
          }

          return {
            id: recipient.id,
            status: res.success ? "sent" : "failed",
            sendbyte_id: res.id || null,
            error: res.success ? null : res.error || "Send failed",
          };
        })
      );

      for (const res of results) {
        if (res.status === "sent") batchSent++;
        else batchFailed++;

        await supabaseAdmin
          .from("email_campaign_recipients")
          .update({
            status: res.status,
            sendbyte_id: res.sendbyte_id,
            error: res.error,
            updated_at: new Date().toISOString(),
          })
          .eq("id", res.id);
      }

      if (i + SUB_CONCURRENCY < recipients.length) {
        // 250ms breathing delay between sub-chunks
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    // 4. Update campaign totals
    const newSent = (campaign.sent_count || 0) + batchSent;
    const newFailed = (campaign.failed_count || 0) + batchFailed;

    const { count: remainingQueued } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "queued");

    const isComplete = (remainingQueued || 0) === 0;

    const { data: updatedCampaign } = await supabaseAdmin
      .from("email_campaigns")
      .update({
        sent_count: newSent,
        failed_count: newFailed,
        status: isComplete ? (newSent > 0 ? "sent" : "failed") : "sending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      batchIndex,
      batchNumber: batchIndex + 1,
      batchCount: recipients.length,
      sentCount: batchSent,
      failedCount: batchFailed,
      remainingQueued: remainingQueued || 0,
      isComplete,
      campaign: updatedCampaign || campaign,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[EmailCampaigns] send-batch error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
