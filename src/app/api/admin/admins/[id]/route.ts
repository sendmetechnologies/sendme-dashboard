import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteAdmin, getAdminById } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting yourself
    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const result = await deleteAdmin(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete admin" }, { status: 500 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";

    logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type: "delete_admin",
      action_category: "SYSTEM",
      description: `${session.displayName || session.username} deleted admin account @${admin.username} (${admin.display_name})`,
      target_type: "admin",
      target_id: id,
      target_name: `@${admin.username} (${admin.display_name})`,
      metadata: { deleted_username: admin.username, role: admin.role },
      ip_address: ip,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Admin deleted" });
  } catch (err) {
    console.error("[Admin Delete] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
