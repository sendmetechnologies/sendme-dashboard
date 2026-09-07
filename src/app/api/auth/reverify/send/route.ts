import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminById, storeOTPCode, getAppSetting } from "@/lib/db";
import { sendEmail, buildEmailTemplate } from "@/lib/sendbyte";

const PURPOSE = "sensitive_view";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `**@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

function buildSensitiveViewOTPHTML(name: string, otp: string): string {
  return buildEmailTemplate("Sensitive Data Access Verification", `
    <p>Hi ${name},</p>
    <p>Someone requested access to sensitive customer KYC data and documents on the SendMe Admin dashboard. Your verification code is:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #158A5E; background: #E8F5E9; padding: 12px 24px; border-radius: 12px;">${otp}</span>
    </div>
    <p style="color: #888; font-size: 13px;">This code expires in 10 minutes and can only be used once. If you did not request this, please ignore this email.</p>
  `);
}

async function getOTPFromAddress(): Promise<string | undefined> {
  try {
    const email = await getAppSetting("otp_from_email");
    const name = await getAppSetting("otp_from_name");
    if (email) {
      return `${name || "SendMe"} <${email}>`;
    }
  } catch {
    // Settings table may not exist yet, fall back to env
  }
  return undefined;
}

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

    const otp = generateOTP();
    const stored = await storeOTPCode(admin.id, otp, "email", PURPOSE);
    if (!stored) {
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    const result = await sendEmail({
      to: admin.email,
      subject: "SendMe Admin Security Verification",
      html: buildSensitiveViewOTPHTML(admin.display_name, otp),
      from: await getOTPFromAddress(),
    });
    console.log("[Reverify-Send] Email OTP result:", result);

    return NextResponse.json({
      success: true,
      maskedEmail: maskEmail(admin.email),
    });
  } catch (err) {
    console.error("[Reverify-Send] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
