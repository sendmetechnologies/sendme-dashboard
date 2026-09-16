import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const { data: campaign, error } = await supabaseAdmin
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("id, email, name, status, sendbyte_id, error, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true });

    if (recipientsError) {
      return NextResponse.json({ error: recipientsError.message }, { status: 500 });
    }

    return NextResponse.json({ campaign, recipients: recipients || [] });
  } catch (err) {
    console.error("[EmailCampaigns] Detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
