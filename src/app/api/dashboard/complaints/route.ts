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
  const sort = searchParams.get("sort") || "newest";

  // Auto-close old complaints
  await supabaseAdmin.rpc("auto_close_complaints");

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
  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,description.ilike.%${search}%,assigned_admin_name.ilike.%${search}%`
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
  const { data: stats } = await supabaseAdmin.rpc("get_complaint_stats");

  // Get tab counts
  const tabCounts: Record<string, number> = { "All Tickets": count || 0 };
  if (!status) {
    const statuses = ["open", "in_progress", "resolved", "closed"];
    for (const s of statuses) {
      const { count: c } = await supabaseAdmin
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      tabCounts[s] = c || 0;
    }
  }

  return NextResponse.json({
    complaints: data || [],
    stats: stats || {},
    tabCounts,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
