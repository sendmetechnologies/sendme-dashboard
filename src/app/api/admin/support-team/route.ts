import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppSetting, setAppSetting } from "@/lib/db";
import crypto from "crypto";

export interface SupportTeamMember {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  access_code: string;
  permissions: string[];
  status: "active" | "suspended";
  created_at: string;
  last_active?: string | null;
  resolved_count: number;
}

// Generates an 8-character unique alphanumeric code mixed with letters and numbers
// Excludes confusing chars (0, O, 1, I)
function generate8DigitAccessCode(existingCodes: Set<string>): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  let attempts = 0;

  do {
    code = "";
    for (let i = 0; i < 8; i++) {
      const idx = crypto.randomInt(0, chars.length);
      code += chars[idx];
    }
    attempts++;
  } while (existingCodes.has(code) && attempts < 100);

  return code;
}

const DEFAULT_PERMISSIONS = [
  "resolve_disputes",
  "live_chat",
  "internal_notes",
  "telemetry_access",
  "sla_monitoring",
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stored = await getAppSetting("support_team_members");
    const members: SupportTeamMember[] = Array.isArray(stored) ? stored : [];

    const stats = {
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      suspended: members.filter((m) => m.status === "suspended").length,
    };

    return NextResponse.json({ members, stats });
  } catch (err: any) {
    console.error("[Support Team API] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, email, role, permissions } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const stored = await getAppSetting("support_team_members");
    const members: SupportTeamMember[] = Array.isArray(stored) ? stored : [];

    const existingCodes = new Set(members.map((m) => m.access_code));
    const accessCode = generate8DigitAccessCode(existingCodes);

    const newMember: SupportTeamMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      role: role || "Support Agent",
      access_code: accessCode,
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : DEFAULT_PERMISSIONS,
      status: "active",
      created_at: new Date().toISOString(),
      last_active: null,
      resolved_count: 0,
    };

    members.unshift(newMember);
    await setAppSetting("support_team_members", members);

    return NextResponse.json({
      success: true,
      member: newMember,
      message: "Support team member created successfully",
    });
  } catch (err: any) {
    console.error("[Support Team API] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, status, name, phone, role } = body;

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const stored = await getAppSetting("support_team_members");
    let members: SupportTeamMember[] = Array.isArray(stored) ? stored : [];

    const index = members.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (action === "regenerate_code") {
      const existingCodes = new Set(members.map((m) => m.access_code));
      members[index].access_code = generate8DigitAccessCode(existingCodes);
    } else if (action === "toggle_status") {
      members[index].status = members[index].status === "active" ? "suspended" : "active";
    } else {
      if (status) members[index].status = status;
      if (name) members[index].name = name.trim();
      if (phone) members[index].phone = phone.trim();
      if (role) members[index].role = role;
    }

    await setAppSetting("support_team_members", members);

    return NextResponse.json({
      success: true,
      member: members[index],
    });
  } catch (err: any) {
    console.error("[Support Team API] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const stored = await getAppSetting("support_team_members");
    let members: SupportTeamMember[] = Array.isArray(stored) ? stored : [];

    members = members.filter((m) => m.id !== id);
    await setAppSetting("support_team_members", members);

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (err: any) {
    console.error("[Support Team API] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
