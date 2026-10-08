import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getAppSetting, setAppSetting } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin-logger";
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

// Normalize phone to canonical E.164 (+234...)
function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) {
    return "+234" + cleaned.slice(1);
  }
  if (cleaned.startsWith("234")) {
    return "+" + cleaned;
  }
  return "+" + cleaned;
}

// Generates a unique 9-letter access code in the format XXX - XXX - XXX
// Excludes confusing letters (O, I) for maximum clarity
function generate9LetterAccessCode(existingCodes: Set<string>): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let formatted = "";
  let attempts = 0;

  do {
    let raw = "";
    for (let i = 0; i < 9; i++) {
      const idx = crypto.randomInt(0, letters.length);
      raw += letters[idx];
    }
    formatted = `${raw.slice(0, 3)} - ${raw.slice(3, 6)} - ${raw.slice(6, 9)}`;
    attempts++;
  } while (existingCodes.has(formatted) && attempts < 100);

  return formatted;
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

    // Read from support_team_members table first
    const { data: dbMembers, error: dbErr } = await supabaseAdmin
      .from("support_team_members")
      .select("*")
      .order("created_at", { ascending: false });

    let members: SupportTeamMember[] = [];
    if (!dbErr && dbMembers && dbMembers.length > 0) {
      members = dbMembers.map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        email: m.email,
        role: m.role || "Support Agent",
        access_code: m.access_code,
        permissions: Array.isArray(m.permissions) ? m.permissions : DEFAULT_PERMISSIONS,
        status: m.status as "active" | "suspended",
        created_at: m.created_at,
        last_active: m.last_active,
        resolved_count: m.resolved_count || 0,
      }));
    } else {
      // Fallback to app_settings if table was empty
      const stored = await getAppSetting("support_team_members");
      members = Array.isArray(stored) ? stored : [];
    }

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
      return NextResponse.json({ error: "WhatsApp phone number is required" }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone.trim());

    // Fetch existing codes from both table and settings to guarantee uniqueness
    const { data: existingDb } = await supabaseAdmin
      .from("support_team_members")
      .select("access_code");

    const existingCodes = new Set<string>((existingDb || []).map((m: any) => m.access_code));
    const accessCode = generate9LetterAccessCode(existingCodes);

    const newMember: SupportTeamMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: normalizedPhone,
      email: email?.trim() || null,
      role: role || "Support Agent",
      access_code: accessCode,
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : DEFAULT_PERMISSIONS,
      status: "active",
      created_at: new Date().toISOString(),
      last_active: null,
      resolved_count: 0,
    };

    // Insert into public.support_team_members
    const { error: insErr } = await supabaseAdmin.from("support_team_members").insert({
      id: newMember.id,
      name: newMember.name,
      phone: newMember.phone,
      email: newMember.email,
      role: newMember.role,
      access_code: newMember.access_code,
      permissions: newMember.permissions,
      status: newMember.status,
      created_at: newMember.created_at,
    });

    if (insErr) {
      console.error("[Support Team API] DB insert error:", insErr);
      return NextResponse.json({ error: "Failed to create support member in DB: " + insErr.message }, { status: 500 });
    }

    // Keep app_settings synced
    try {
      const stored = await getAppSetting("support_team_members");
      const list = Array.isArray(stored) ? stored : [];
      list.unshift(newMember);
      await setAppSetting("support_team_members", list);
    } catch (e) {
      console.warn("Failed to sync app_settings:", e);
    }

    logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type: "add_support_member",
      action_category: "SUPPORT",
      description: `${session.displayName || session.username} added WhatsApp support team member ${newMember.name} (${newMember.phone}) and generated 9-digit access code`,
      target_type: "support_member",
      target_id: newMember.id,
      target_name: `${newMember.name} (${newMember.phone})`,
      metadata: { phone: newMember.phone, role: newMember.role, access_code: newMember.access_code },
    }).catch(() => {});

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
    const { id, action, status, name, phone, role, email, permissions } = body;

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const { data: member, error: fetchErr } = await supabaseAdmin
      .from("support_team_members")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let updatedFields: any = { updated_at: new Date().toISOString() };

    if (action === "regenerate_code") {
      const { data: allMembers } = await supabaseAdmin
        .from("support_team_members")
        .select("access_code");
      const existingCodes = new Set<string>((allMembers || []).map((m: any) => m.access_code));
      updatedFields.access_code = generate9LetterAccessCode(existingCodes);
    } else if (action === "toggle_status") {
      updatedFields.status = member.status === "active" ? "suspended" : "active";
    } else {
      if (status !== undefined) updatedFields.status = status;
      if (name !== undefined && name.trim()) updatedFields.name = name.trim();
      if (phone !== undefined && phone.trim()) updatedFields.phone = normalizePhone(phone.trim());
      if (role !== undefined && role.trim()) updatedFields.role = role.trim();
      if (email !== undefined) updatedFields.email = email?.trim() ? email.trim() : null;
      if (permissions !== undefined && Array.isArray(permissions)) updatedFields.permissions = permissions;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("support_team_members")
      .update(updatedFields)
      .eq("id", id)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Sync app_settings
    try {
      const stored = await getAppSetting("support_team_members");
      let list: SupportTeamMember[] = Array.isArray(stored) ? stored : [];
      const idx = list.findIndex((m) => m.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatedFields };
        await setAppSetting("support_team_members", list);
      }
    } catch {}

    logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type: action === "regenerate_code" ? "regenerate_support_code" : action === "toggle_status" ? "toggle_support_status" : "update_support_member",
      action_category: "SUPPORT",
      description: `${session.displayName || session.username} updated support member ${updated.name} (${updated.phone})`,
      target_type: "support_member",
      target_id: updated.id,
      target_name: `${updated.name} (${updated.phone})`,
      metadata: updatedFields,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      member: updated,
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

    await supabaseAdmin.from("support_team_members").delete().eq("id", id);

    // Sync app_settings
    try {
      const stored = await getAppSetting("support_team_members");
      let list: SupportTeamMember[] = Array.isArray(stored) ? stored : [];
      list = list.filter((m) => m.id !== id);
      await setAppSetting("support_team_members", list);
    } catch {}

    logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type: "remove_support_member",
      action_category: "SUPPORT",
      description: `${session.displayName || session.username} removed support team member #${id.slice(0, 8)}`,
      target_type: "support_member",
      target_id: id,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (err: any) {
    console.error("[Support Team API] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
