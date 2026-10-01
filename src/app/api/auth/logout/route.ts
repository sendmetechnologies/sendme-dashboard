import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { logAdminActivity } from "@/lib/admin-logger";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type: "logout",
      action_category: "AUTH",
      description: `${session.displayName || session.username} logged out of SendMe Admin Dashboard`,
      target_type: "system",
      target_name: "Admin Session",
    }).catch(() => {});
  }

  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true });
}
