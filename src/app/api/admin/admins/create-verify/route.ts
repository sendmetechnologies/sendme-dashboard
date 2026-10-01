import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminById, verifyOTPCode, activateAdmin } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin-logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { adminId, code } = body;

    if (!adminId || !code) {
      return NextResponse.json({ error: "Missing adminId or code" }, { status: 400 });
    }

    const admin = await getAdminById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.is_active) {
      return NextResponse.json({ error: "Admin is already active" }, { status: 400 });
    }

    const valid = await verifyOTPCode(admin.id, code, "email");
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    const activated = await activateAdmin(admin.id);
    if (!activated) {
      return NextResponse.json({ error: "Failed to activate admin" }, { status: 500 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";

    logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type: "create_admin",
      action_category: "SYSTEM",
      description: `${session.displayName || session.username} created and activated new admin @${admin.username} (${admin.display_name}) with role ${admin.role}`,
      target_type: "admin",
      target_id: admin.id,
      target_name: `@${admin.username} (${admin.display_name})`,
      metadata: { username: admin.username, email: admin.email, role: admin.role },
      ip_address: ip,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Admin account created and activated",
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        display_name: admin.display_name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("[CreateAdmin-Verify] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
