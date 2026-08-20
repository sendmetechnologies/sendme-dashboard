import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("state_pricing")
      .select("*")
      .order("state");

    if (error) {
      console.error("[StatePricing] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ states: data || [] });
  } catch (err) {
    console.error("[StatePricing] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { state, label, per_km, base_fare, per_minute, minimum_fare, is_active } = body;

    if (!state || !label) {
      return NextResponse.json({ error: "Missing state or label" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("state_pricing")
      .upsert({
        state,
        label,
        per_km: per_km || { bicycle: 200, motorcycle: 300, car: 500, truck: 1000 },
        base_fare: base_fare ?? null,
        per_minute: per_minute ?? null,
        minimum_fare: minimum_fare ?? null,
        is_active: is_active !== false,
      }, { onConflict: "state" })
      .select()
      .single();

    if (error) {
      console.error("[StatePricing] Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ state: data });
  } catch (err) {
    console.error("[StatePricing] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { state, ...updates } = body;

    if (!state) {
      return NextResponse.json({ error: "Missing state" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("state_pricing")
      .update(updates)
      .eq("state", state)
      .select()
      .single();

    if (error) {
      console.error("[StatePricing] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ state: data });
  } catch (err) {
    console.error("[StatePricing] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json({ error: "Missing state" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("state_pricing")
      .delete()
      .eq("state", state);

    if (error) {
      console.error("[StatePricing] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[StatePricing] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
