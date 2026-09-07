import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: complaint, error } = await supabaseAdmin
    .from("complaints")
    .select(
      `
      *,
      user:users!complaints_user_id_fkey(id, full_name, phone, email, avatar_url, role)
    `
    )
    .eq("id", id)
    .single();

  if (error || !complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  // Fetch messages
  const { data: messages } = await supabaseAdmin
    .from("complaint_messages")
    .select("*")
    .eq("complaint_id", id)
    .order("created_at", { ascending: true });

  // Fetch admin notes
  const { data: notes } = await supabaseAdmin
    .from("complaint_admin_notes")
    .select("*")
    .eq("complaint_id", id)
    .order("created_at", { ascending: false });

  // Mark user messages as read by admin
  await supabaseAdmin.rpc("mark_complaint_messages_read", {
    p_complaint_id: id,
    p_reader_type: "admin",
  });

  return NextResponse.json({
    complaint,
    messages: messages || [],
    notes: notes || [],
  });
}
