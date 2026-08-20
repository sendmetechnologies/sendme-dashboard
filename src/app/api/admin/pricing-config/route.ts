import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Matches the app's FALLBACK_PRICING in lib/pricing-config.ts so the form
// always shows sensible values even before any config is saved.
const DEFAULT_PRICING = {
  baseFare: 400,
  perKm: { bicycle: 200, motorcycle: 400, car: 600, truck: 1200 },
  perMinute: { bicycle: 10, motorcycle: 18, car: 28, truck: 42 },
  urgencyMultiplier: { normal: 1.0, fast: 1.2, immediate: 1.4, express: 1.7 },
  minimumFare: { bicycle: 500, motorcycle: 800, car: 1200, truck: 2400 },
  vehicleSpeedKmh: { bicycle: 12, motorcycle: 25, car: 20, truck: 16 },
  pickupBufferMin: 4,
  dropoffBufferMin: 4,
};

const VEHICLES = ["bicycle", "motorcycle", "car", "truck"] as const;
const URGENCIES = ["normal", "fast", "immediate", "express"] as const;

function isValidConfig(cfg: any): boolean {
  if (!cfg || typeof cfg !== "object") return false;
  if (typeof cfg.baseFare !== "number" || cfg.baseFare < 0) return false;
  for (const v of VEHICLES) {
    if (typeof cfg.perKm?.[v] !== "number" || cfg.perKm[v] < 0) return false;
    if (typeof cfg.perMinute?.[v] !== "number" || cfg.perMinute[v] < 0) return false;
    if (typeof cfg.minimumFare?.[v] !== "number" || cfg.minimumFare[v] < 0) return false;
    // Optional: vehicle speeds (km/h) — positive only
    if (cfg.vehicleSpeedKmh?.[v] !== undefined && (typeof cfg.vehicleSpeedKmh[v] !== "number" || cfg.vehicleSpeedKmh[v] <= 0)) return false;
  }
  for (const u of URGENCIES) {
    if (typeof cfg.urgencyMultiplier?.[u] !== "number" || cfg.urgencyMultiplier[u] <= 0) return false;
  }
  // Optional: ETA buffers (minutes) — non-negative
  if (cfg.pickupBufferMin !== undefined && (typeof cfg.pickupBufferMin !== "number" || cfg.pickupBufferMin < 0)) return false;
  if (cfg.dropoffBufferMin !== undefined && (typeof cfg.dropoffBufferMin !== "number" || cfg.dropoffBufferMin < 0)) return false;
  return true;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "pricing_config")
      .maybeSingle();

    if (error) {
      console.error("[PricingConfig] Fetch error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let config = DEFAULT_PRICING;
    if (data?.value) {
      try {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        if (isValidConfig(parsed)) config = parsed;
      } catch {
        // fall back to defaults if the stored JSON is corrupt
      }
    }

    return NextResponse.json({ config, isDefault: !data?.value });
  } catch (err) {
    console.error("[PricingConfig] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { config } = await req.json();
    if (!isValidConfig(config)) {
      return NextResponse.json({ error: "Invalid pricing config shape" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("platform_settings").upsert(
      {
        key: "pricing_config",
        value: JSON.stringify(config),
        description: "General (fallback) delivery pricing: base fare, per-km, per-minute, minimum fare, urgency multipliers",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("[PricingConfig] Upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (err) {
    console.error("[PricingConfig] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
