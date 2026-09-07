import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminById, verifyOTPCode } from "@/lib/db";

const PURPOSE = "sensitive_view";
const GRANT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await getAdminById(session.id);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const { code } = await req.json();
    if (!code || !/^\d{6}$/.test(String(code))) {
      return NextResponse.json({ error: "Code must be 6 digits" }, { status: 400 });
    }

    const valid = await verifyOTPCode(admin.id, String(code), "email", PURPOSE);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      expiresAt: Date.now() + GRANT_DURATION_MS,
    });
  } catch (err) {
    console.error("[Reverify-Verify] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
