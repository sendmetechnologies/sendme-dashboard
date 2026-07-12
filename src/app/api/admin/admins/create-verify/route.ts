import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminById, verifyOTPCode, activateAdmin } from "@/lib/db";

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
