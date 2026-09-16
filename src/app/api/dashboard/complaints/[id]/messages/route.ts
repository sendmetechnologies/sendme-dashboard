import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { message } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Verify complaint exists and get user info for push notification
  const { data: complaint, error: fetchError } = await supabaseAdmin
    .from("complaints")
    .select("id, status, user_id, subject")
    .eq("id", id)
    .single();

  if (fetchError || !complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  if (complaint.status === "closed") {
    return NextResponse.json(
      { error: "Cannot send messages to a closed complaint" },
      { status: 400 }
    );
  }

  // Insert message
  const { data: msgData, error: msgError } = await supabaseAdmin
    .from("complaint_messages")
    .insert({
      complaint_id: id,
      sender_id: session.id,
      sender_type: "admin",
      sender_name: session.displayName,
      message: message.trim(),
    })
    .select()
    .single();

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  // Increment unread count and update status for user
  const { data: current } = await supabaseAdmin
    .from("complaints")
    .select("unread_count_user")
    .eq("id", id)
    .single();

  await supabaseAdmin
    .from("complaints")
    .update({
      unread_count_user: (current?.unread_count_user || 0) + 1,
      last_message_at: new Date().toISOString(),
      ...(complaint.status === "open" ? { status: "in_progress" } : {}),
    })
    .eq("id", id);

  // Send push notification to the user (in-app row is created by a DB trigger)
  try {
    // 1. Look up user's active push token
    const { data: tokenRow } = await supabaseAdmin
      .from("user_push_tokens")
      .select("token")
      .eq("user_id", complaint.user_id)
      .eq("is_active", true)
      .order("last_used_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Send push notification if token exists
    // (The DB trigger on complaint_messages creates the in-app notification.)
    const pushTitle = `Admin: ${complaint.subject}`;
    const pushBody = message.trim();

    if (tokenRow?.token) {
      const pushRes = await supabaseAdmin.functions.invoke("send-push-notification", {
        body: {
          token: tokenRow.token,
          title: pushTitle,
          body: pushBody,
          data: { type: "ADMIN", deepLink: "/profile/complaints", relatedId: id, relatedType: "complaint" },
        },
      });
      if (pushRes.error) {
        console.warn("Push notification failed:", pushRes.error);
      }
    } else {
      console.warn("No active push token for user", complaint.user_id);
    }
  } catch (err) {
    console.error("Failed to send notification to user:", err);
  }

  return NextResponse.json({ message: msgData });
}
