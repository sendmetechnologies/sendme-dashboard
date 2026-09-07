import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, assigned_admin_id, assigned_admin_name } = body;

  const updates: Record<string, any> = {};

  if (status) {
    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
  }

  if (assigned_admin_id !== undefined) {
    updates.assigned_admin_id = assigned_admin_id || null;
    updates.assigned_admin_name = assigned_admin_name || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("complaints")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the status change as a system message
  if (status) {
    const statusLabels: Record<string, string> = {
      open: "reopened",
      in_progress: "marked as in progress",
      resolved: "resolved",
      closed: "closed",
    };

    await supabaseAdmin.from("complaint_messages").insert({
      complaint_id: id,
      sender_id: session.id,
      sender_type: "admin",
      sender_name: "System",
      message: `Ticket ${statusLabels[status] || status} by ${session.displayName}`,
    });
  }

  return NextResponse.json({ complaint: data });
}
