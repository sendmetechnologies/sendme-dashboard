import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminByUsername, getAdminById, storeOTPCode, getAppSetting } from "@/lib/db";
import { sendEmail, buildEmailTemplate } from "@/lib/sendbyte";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `**@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

function buildOTPHTML(name: string, otp: string): string {
  return buildEmailTemplate("Your Verification Code", `
    <p>Hi ${name},</p>
    <p>Your verification code is:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #158A5E; background: #E8F5E9; padding: 12px 24px; border-radius: 12px;">${otp}</span>
    </div>
    <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
  `);
}

async function getOTPFromAddress(): Promise<string | undefined> {
  try {
    const email = await getAppSetting("otp_from_email");
    const name = await getAppSetting("otp_from_name");
    if (email) {
      const senderName = name || "SendMe";
      return `${senderName} <${email}>`;
    }
  } catch {
    // Settings table may not exist yet, fall back to env
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, adminId, resend } = body;

    // ── Resend OTP ──
    if (resend && adminId) {
      const admin = await getAdminById(adminId);
      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }

      const otp = generateOTP();
      const stored = await storeOTPCode(admin.id, otp, "email");
      if (!stored) {
        return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
      }

      const result = await sendEmail({
        to: admin.email,
        subject: "SendMe Admin Verification Code",
        html: buildOTPHTML(admin.display_name, otp),
        from: await getOTPFromAddress(),
      });
      console.log("[Login] Email OTP result:", result);

      return NextResponse.json({
        success: true,
        maskedEmail: maskEmail(admin.email),
      });
    }

    // ── Login: validate username + password ──
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const admin = await getAdminByUsername(username);
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ── Generate & send email OTP ──
    const otp = generateOTP();
    const stored = await storeOTPCode(admin.id, otp, "email");
    if (!stored) {
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    const result = await sendEmail({
      to: admin.email,
      subject: "SendMe Admin Verification Code",
      html: buildOTPHTML(admin.display_name, otp),
      from: await getOTPFromAddress(),
    });
    console.log("[Login] Email OTP result:", result);

    return NextResponse.json({
      success: true,
      adminId: admin.id,
      displayName: admin.display_name,
      maskedEmail: maskEmail(admin.email),
    });
  } catch (err) {
    console.error("[Login] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
