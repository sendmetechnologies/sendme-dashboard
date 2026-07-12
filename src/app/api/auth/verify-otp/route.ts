import { NextRequest, NextResponse } from "next/server";
import { getAdminById, verifyOTPCode, updateLastLogin } from "@/lib/db";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { adminId, code } = await req.json();

    if (!adminId || !code) {
      return NextResponse.json({ error: "Admin ID and code required" }, { status: 400 });
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Code must be 6 digits" }, { status: 400 });
    }

    // ── Look up admin ──
    const admin = await getAdminById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    // ── Verify email OTP ──
    const valid = await verifyOTPCode(admin.id, code, "email");
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    // ── Create session ──
    const token = createSessionToken({
      id: admin.id,
      username: admin.username,
      displayName: admin.display_name,
      role: admin.role,
      phone: admin.phone,
    });

    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        displayName: admin.display_name,
        role: admin.role,
      },
    });

    response.cookies.set("admin_session", token, cookieOptions);

    // ── Update last login (fire and forget) ──
    updateLastLogin(admin.id);

    return response;
  } catch (err) {
    console.error("[VerifyOTP] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
