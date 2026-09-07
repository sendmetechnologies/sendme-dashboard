import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Keys the mobile app reads from platform_settings (NOT app_settings).
// Admin edits to these MUST land here for the app to see them.
const PLATFORM_KEYS = [
  "commission_rate",
  "marketer_commission_rate",
  "insurance_rate",
  "pricing_config",
  "vehicle_speed_kmh",
  "eta_buffers",
] as const;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("key, value")
      .in("key", [...PLATFORM_KEYS]);

    if (error) {
      console.error("[PlatformSettings] Fetch error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[PlatformSettings] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value } = await req.json();
    if (!key || !PLATFORM_KEYS.includes(key as any)) {
      return NextResponse.json({ error: "Invalid or missing key" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("platform_settings").upsert(
      {
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("[PlatformSettings] Upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PlatformSettings] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
