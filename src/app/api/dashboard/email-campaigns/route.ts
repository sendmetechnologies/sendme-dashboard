import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getCampaignRecipients, type TargetAudience, type CampaignRecipient } from "@/lib/email-campaigns";
import { buildCampaignEmailHtml } from "@/lib/sendbyte";

const TARGETS: TargetAudience[] = ["all", "marketers", "senders", "riders", "organizations", "individuals"];

function messageToHtml(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p style="margin: 0 0 16px 0;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: campaigns, error } = await supabaseAdmin
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (err) {
    console.error("[EmailCampaigns] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      message,
      senderName,
      targetAudience,
      subAudience = "all",
      emails,
    } = body;

    if (!name?.trim() || !message?.trim() || !senderName?.trim()) {
      return NextResponse.json({ error: "Name, message and sender name are required" }, { status: 400 });
    }

    if (!TARGETS.includes(targetAudience)) {
      return NextResponse.json({ error: "Invalid target audience" }, { status: 400 });
    }

    let recipients: CampaignRecipient[];
    if (targetAudience === "individuals") {
      if (!emails || !emails.trim()) {
        return NextResponse.json({ error: "At least one email is required for individuals" }, { status: 400 });
      }
      const seen = new Set<string>();
      recipients = emails
        .split(",")
        .map((e: string) => e.trim())
        .filter((e: string) => e)
        .map((email: string) => {
          const key = email.toLowerCase();
          if (seen.has(key)) return null;
          seen.add(key);
          return { user_id: null, email: key, name: "" };
        })
        .filter(Boolean) as CampaignRecipient[];
    } else {
      recipients = await getCampaignRecipients(targetAudience, subAudience || "all");
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found for this audience" }, { status: 400 });
    }

    const subject = name.trim();
    const bodyHtml = buildCampaignEmailHtml(senderName.trim(), messageToHtml(message.trim()));
    const bodyText = message.trim();

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        name: subject,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        sender_name: senderName.trim(),
        target_audience: targetAudience,
        sub_audience: subAudience || "all",
        status: "sending",
        total_recipients: recipients.length,
        sent_count: 0,
        failed_count: 0,
        created_by: session.id,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error("[EmailCampaigns] Insert error:", campaignError);
      return NextResponse.json({ error: campaignError?.message || "Failed to create campaign" }, { status: 500 });
    }

    // Queue all recipients in email_campaign_recipients
    const recipientRows = recipients.map((r) => ({
      campaign_id: campaign.id,
      user_id: r.user_id,
      email: r.email,
      name: r.name,
      status: "queued",
    }));

    const BULK_CHUNK = 500;
    for (let i = 0; i < recipientRows.length; i += BULK_CHUNK) {
      const { error: insErr } = await supabaseAdmin
        .from("email_campaign_recipients")
        .insert(recipientRows.slice(i, i + BULK_CHUNK));
      if (insErr) {
        console.error("[EmailCampaigns] Recipients insert error:", insErr);
      }
    }

    // Build batch distribution breakdown (100 emails per batch)
    const totalRecipients = recipients.length;
    const batchSize = 100;
    const totalBatches = Math.ceil(totalRecipients / batchSize);
    const batches = [];
    for (let i = 0; i < totalBatches; i++) {
      const count = Math.min(batchSize, totalRecipients - i * batchSize);
      batches.push({
        batchIndex: i,
        batchNumber: i + 1,
        count,
        status: "queued" as const,
      });
    }

    return NextResponse.json({
      success: true,
      campaign,
      totalRecipients,
      totalBatches,
      batchSize,
      batches,
    });
  } catch (err) {
    console.error("[EmailCampaigns] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
