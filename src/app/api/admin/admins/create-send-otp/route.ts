import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminById, storeOTPCode } from "@/lib/db";
import { sendEmail, buildEmailTemplate } from "@/lib/sendbyte";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOTPHTML(name: string, otp: string): string {
  return buildEmailTemplate("New Admin Account Verification", `
    <p>Hi ${name},</p>
    <p>A new admin account is being created. Your verification code is:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #158A5E; background: #E8F5E9; padding: 12px 24px; border-radius: 12px;">${otp}</span>
    </div>
    <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
  `);
}

async function getOTPFromAddress(): Promise<string | undefined> {
  try {
    const { getAppSetting } = await import("@/lib/db");
    const email = await getAppSetting("otp_from_email");
    const name = await getAppSetting("otp_from_name");
    if (email) {
      return `${name || "SendMe"} <${email}>`;
    }
  } catch {
    // fall back to env
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: "Missing adminId" }, { status: 400 });
    }

    const admin = await getAdminById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.is_active) {
      return NextResponse.json({ error: "Admin is already active" }, { status: 400 });
    }

    const otp = generateOTP();
    const stored = await storeOTPCode(admin.id, otp, "email");
    if (!stored) {
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    const result = await sendEmail({
      to: admin.email,
      subject: "SendMe Admin Account Verification",
      html: buildOTPHTML(admin.display_name, otp),
      from: await getOTPFromAddress(),
    });
    console.log("[CreateAdmin-SendOTP] Email result:", result);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${admin.email}`,
    });
  } catch (err) {
    console.error("[CreateAdmin-SendOTP] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
