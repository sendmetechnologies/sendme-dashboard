import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET: List announcements + notification stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch announcements
    const { data: announcements, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Announcements] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch notification stats from messages table
    const { count: totalMessages } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true });

    const { count: unreadMessages } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("status", "UNREAD");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: sentToday } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    return NextResponse.json({
      announcements: announcements || [],
      stats: {
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        sentToday: sentToday || 0,
      },
    });
  } catch (err) {
    console.error("[Announcements] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create and send announcement to targeted users
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, body: content, type, priority, targetType, targetValue } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    if (!targetType || !["all", "role", "email"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    if (targetType === "role" && !targetValue) {
      return NextResponse.json({ error: "Target value required for role targeting" }, { status: 400 });
    }

    if (targetType === "email" && !targetValue) {
      return NextResponse.json({ error: "Target value required for email targeting" }, { status: 400 });
    }

    // 1. Create announcement record
    const { data: announcement, error: annError } = await supabaseAdmin
      .from("announcements")
      .insert({
        title,
        body: content,
        type: type || "ADMIN",
        priority: priority || "MEDIUM",
        target_type: targetType,
        target_value: targetValue || null,
        created_by: session.id,
        status: "sending",
      })
      .select()
      .single();

    if (annError) {
      console.error("[Announcements] Insert error:", annError);
      return NextResponse.json({ error: annError.message }, { status: 500 });
    }

    // 2. Find target users
    let userQuery = supabaseAdmin.from("users").select("id, email");

    if (targetType === "role") {
      userQuery = userQuery.eq("role", targetValue);
    } else if (targetType === "email") {
      userQuery = userQuery.eq("email", targetValue);
    }

    const { data: targetUsers, error: userError } = await userQuery;

    if (userError || !targetUsers || targetUsers.length === 0) {
      // Update announcement as sent with 0 recipients
      await supabaseAdmin
        .from("announcements")
        .update({ status: "sent", sent_at: new Date().toISOString(), total_count: 0 })
        .eq("id", announcement.id);

      return NextResponse.json({
        announcement,
        sentCount: 0,
        message: targetType === "email" ? "No user found with that email" : "No users found for this target",
      });
    }

    // 3. Insert into messages for each target user
    //    Store related_id = announcement.id so deletion can clean up exactly
    //    the rows this announcement fanned out to.
    const messageRows = targetUsers.map((u) => ({
      user_id: u.id,
      title,
      body: content,
      type: type || "ADMIN",
      priority: priority || "MEDIUM",
      status: "UNREAD",
      channels: JSON.stringify(["in_app"]),
      related_id: announcement.id,
      related_type: "announcement",
    }));

    // Batch insert — Supabase supports up to 1000 rows per insert
    const BATCH_SIZE = 500;
    let insertedCount = 0;
    for (let i = 0; i < messageRows.length; i += BATCH_SIZE) {
      const batch = messageRows.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabaseAdmin
        .from("messages")
        .insert(batch);

      if (insertError) {
        console.error("[Announcements] Messages insert error:", insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    // 4. Update announcement record
    await supabaseAdmin
      .from("announcements")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_count: insertedCount,
      })
      .eq("id", announcement.id);

    return NextResponse.json({
      announcement: { ...announcement, status: "sent", total_count: insertedCount },
      sentCount: insertedCount,
    });
  } catch (err) {
    console.error("[Announcements] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete an announcement AND its fanned-out per-user messages
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing announcement ID" }, { status: 400 });
    }

    // Fetch the announcement so we can remove its per-user messages too.
    const { data: announcement, error: fetchError } = await supabaseAdmin
      .from("announcements")
      .select("id, title, body, type, priority")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete the per-user messages this announcement fanned out to.
    // Preferred: match by related_id (set on new sends). Fallback for legacy
    // sends: match by exact title/body/type/priority.
    if (announcement) {
      const { error: msgError, count } = await supabaseAdmin
        .from("messages")
        .delete({ count: "exact" })
        .eq("related_id", announcement.id)
        .eq("related_type", "announcement");

      if (msgError) {
        console.error("[Announcements] Messages cleanup error:", msgError);
        return NextResponse.json({ error: msgError.message }, { status: 500 });
      }

      // Legacy rows (sent before related_id was added) don't have the link —
      // clean them up by matching the exact title/body/type/priority.
      if (!count || count === 0) {
        await supabaseAdmin
          .from("messages")
          .delete()
          .eq("title", announcement.title)
          .eq("body", announcement.body)
          .eq("type", announcement.type || "ADMIN")
          .eq("priority", announcement.priority || "MEDIUM");
      }
    }

    const { error } = await supabaseAdmin
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Announcements] Delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
