import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const role = searchParams.get("role") || "";
  const search = searchParams.get("search") || "";
  const dateRange = searchParams.get("date_range") || "";
  const sort = searchParams.get("sort") || "newest";

  // Auto-close old complaints
  try {
    await supabaseAdmin.rpc("auto_close_complaints");
  } catch {
    // Ignore RPC missing in local test env
  }

  let query = supabaseAdmin
    .from("complaints")
    .select(
      `
      *,
      user:users!complaints_user_id_fkey(id, full_name, phone, email, avatar_url)
    `,
      { count: "exact" }
    );

  if (status) {
    query = query.eq("status", status);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (role) {
    query = query.eq("user_role", role);
  }

  if (dateRange === "today") {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    query = query.gte("created_at", d.toISOString())
  } else if (dateRange === "week") {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    query = query.gte("created_at", d.toISOString())
  } else if (dateRange === "month" || dateRange === "last_30") {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    query = query.gte("created_at", d.toISOString())
  }

  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,description.ilike.%${search}%,assigned_admin_name.ilike.%${search}%,id.ilike.%${search}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order("created_at", { ascending: sort === "oldest" });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get stats
  const { data: allComplaints } = await supabaseAdmin
    .from("complaints")
    .select("status, category, user_role");

  const list = allComplaints || [];
  const stats = {
    total: list.length,
    open: list.filter((c) => c.status === "open").length,
    in_progress: list.filter((c) => c.status === "in_progress").length,
    resolved: list.filter((c) => c.status === "resolved").length,
    closed: list.filter((c) => c.status === "closed").length,
    by_role: {
      customer: list.filter((c) => c.user_role === "customer").length,
      driver: list.filter((c) => c.user_role === "driver").length,
      organization: list.filter((c) => c.user_role === "organization").length,
    },
    by_category: {
      order: list.filter((c) => c.category === "order").length,
      payment: list.filter((c) => c.category === "payment").length,
      driver: list.filter((c) => c.category === "driver").length,
      app: list.filter((c) => c.category === "app").length,
      other: list.filter((c) => c.category === "other").length,
    },
  };

  const tabCounts: Record<string, number> = {
    all: stats.total,
    open: stats.open,
    in_progress: stats.in_progress,
    resolved: stats.resolved,
    closed: stats.closed,
  };

  return NextResponse.json({
    complaints: data || [],
    stats,
    tabCounts,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
    },
  });
}
