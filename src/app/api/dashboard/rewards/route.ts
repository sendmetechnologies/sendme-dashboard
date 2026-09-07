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
  const status = searchParams.get("status") || "pending_review";
  const search = searchParams.get("search") || "";

  let query = supabaseAdmin
    .from("user_tasks")
    .select(
      `
      *,
      task:tasks!user_tasks_task_id_fkey(id, title, description, type, points_reward, criteria, icon),
      user:users!user_tasks_user_id_fkey(id, full_name, phone, email, role)
    `,
      { count: "exact" }
    );

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `task.title.ilike.%${search}%,user.full_name.ilike.%${search}%,user.phone.ilike.%${search}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order("updated_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Tab counts
  const statuses = ["pending_review", "completed", "rejected"];
  const tabCounts: Record<string, number> = {};
  for (const s of statuses) {
    const { count: c } = await supabaseAdmin
      .from("user_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", s);
    tabCounts[s] = c || 0;
  }

  return NextResponse.json({
    reviews: data || [],
    tabCounts,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
