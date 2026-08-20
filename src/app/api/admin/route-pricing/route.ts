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
      .from("route_pricing")
      .select("*")
      .order("origin_state");

    if (error) {
      console.error("[RoutePricing] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ routes: data || [] });
  } catch (err) {
    console.error("[RoutePricing] Error:", err);
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
    const {
      origin_state, origin_city, destination_state, destination_city,
      route_type, distance_km, estimated_duration, vehicle_pricing,
      is_active, notes
    } = body;

    if (!origin_state || !destination_state || !vehicle_pricing) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("route_pricing")
      .insert({
        origin_state,
        origin_city: origin_city || null,
        destination_state,
        destination_city: destination_city || null,
        route_type: route_type || "interstate",
        distance_km: distance_km || null,
        estimated_duration: estimated_duration || null,
        vehicle_pricing,
        is_active: is_active !== false,
        notes: notes || null,
        created_by: session.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[RoutePricing] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ route: data });
  } catch (err) {
    console.error("[RoutePricing] Error:", err);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("route_pricing")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[RoutePricing] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ route: data });
  } catch (err) {
    console.error("[RoutePricing] Error:", err);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("route_pricing")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[RoutePricing] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RoutePricing] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
