import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAudienceCounts } from "@/lib/email-campaigns";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const audiences = await getAudienceCounts();
    return NextResponse.json({ audiences });
  } catch (err) {
    console.error("[EmailCampaigns] Audiences error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
