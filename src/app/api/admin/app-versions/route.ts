import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_versions")
    .select("*")
    .order("platform", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: data || [] });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, latest_version, minimum_version, release_notes, store_url, is_mandatory, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (latest_version !== undefined) updates.latest_version = latest_version.trim();
  if (minimum_version !== undefined) updates.minimum_version = minimum_version.trim();
  if (release_notes !== undefined) updates.release_notes = release_notes.trim();
  if (store_url !== undefined) updates.store_url = store_url.trim();
  if (is_mandatory !== undefined) updates.is_mandatory = Boolean(is_mandatory);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const { data, error } = await supabaseAdmin
    .from("app_versions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: data });
}
