import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

async function notifyUser(userId: string, title: string, body: string) {
  const { error } = await supabaseAdmin.from("messages").insert({
    user_id: userId,
    title,
    body,
    type: "REWARD",
    status: "UNREAD",
    data: { event: "REWARD_REVIEW" },
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[Notification] messages insert failed:", error.message);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          type: "REWARD",
          channels: { inApp: true, push: true, email: false },
        }),
      });
    }
  } catch (err) {
    console.error("[Notification] push notification failed:", err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, note } = body; // action: "approve" | "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch the submission with its task details
    const { data: userTask, error: fetchError } = await supabaseAdmin
      .from("user_tasks")
      .select("*, task:tasks!user_tasks_task_id_fkey(id, title, points_reward, type)")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !userTask) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (userTask.status !== "pending_review") {
      return NextResponse.json(
        { error: "Submission is not pending review" },
        { status: 400 }
      );
    }

    const userId = userTask.user_id;
    const taskId = userTask.task_id;
    const points = userTask.task?.points_reward || 0;

    if (action === "approve") {
      // Mark completed and award points atomically via RPC
      const { error: updateError } = await supabaseAdmin
        .from("user_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString(), progress: { ...(userTask.progress || {}), admin_note: note || null } })
        .eq("id", id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (points > 0) {
        const { error: awardError } = await supabaseAdmin.rpc("award_points", {
          p_user_id: userId,
          p_points: points,
          p_task_id: taskId,
          p_reason: `Task reward: ${userTask.task?.title || "Submission"}`,
        });
        if (awardError) {
          console.error("[Rewards] award_points RPC failed:", awardError.message);
          // Task is completed but points failed — surface it so admin can retry
          return NextResponse.json({
            error: `Approved but points award failed: ${awardError.message}`,
            status: 500,
          });
        }
      }

      await notifyUser(
        userId,
        "Reward Approved 🎉",
        `Your submission for "${userTask.task?.title}" was approved. +${points} points added!`
      );

      return NextResponse.json({ success: true, message: "Submission approved" });
    }

    // Reject
    const { error: updateError } = await supabaseAdmin
      .from("user_tasks")
      .update({
        status: "rejected",
        progress: { ...(userTask.progress || {}), admin_note: note || null },
      })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await notifyUser(
      userId,
      "Reward Submission Rejected",
      `Your submission for "${userTask.task?.title}" was rejected.${note ? ` Reason: ${note}` : ""}`
    );

    return NextResponse.json({ success: true, message: "Submission rejected" });
  } catch (err: any) {
    console.error("[Rewards] action error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
