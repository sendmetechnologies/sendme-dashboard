import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("pricing_overrides")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PricingOverrides] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ overrides: data || [] });
  } catch (err) {
    console.error("[PricingOverrides] Error:", err);
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
      override_name, state, city, vehicle_type,
      adjustment_type, adjustment_value, applies_to,
      start_date, end_date, is_active, reason
    } = body;

    if (!override_name || !adjustment_type || adjustment_value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("pricing_overrides")
      .insert({
        override_name,
        state: state || null,
        city: city || null,
        vehicle_type: vehicle_type || null,
        adjustment_type,
        adjustment_value,
        applies_to: applies_to || ["base_fare", "per_km"],
        start_date: start_date || new Date().toISOString(),
        end_date: end_date || null,
        is_active: is_active !== false,
        reason: reason || null,
        created_by: session.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[PricingOverrides] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ override: data });
  } catch (err) {
    console.error("[PricingOverrides] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("pricing_overrides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PricingOverrides] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ override: data });
  } catch (err) {
    console.error("[PricingOverrides] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("pricing_overrides")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[PricingOverrides] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PricingOverrides] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
