import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const moduleFilter = searchParams.get("module");
    const actionFilter = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabaseAdmin
      .from("pricing_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (moduleFilter) {
      query = query.eq("module", moduleFilter);
    }
    if (actionFilter) {
      query = query.eq("action", actionFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[PricingLogs] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count: totalCount } = await supabaseAdmin
      .from("pricing_logs")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ logs: data || [], total: totalCount || 0 });
  } catch (err) {
    console.error("[PricingLogs] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
