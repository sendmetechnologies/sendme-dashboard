import { supabaseAdmin } from "./supabase";
import bcrypt from "bcryptjs";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: "super_admin" | "admin";
  phone: string;
  is_active: boolean;
  password_hash: string;
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();
  return data;
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function updateLastLogin(adminId: string): Promise<void> {
  await supabaseAdmin
    .from("admin_users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", adminId);
}

export async function storeOTPCode(adminId: string, code: string, channel: "sms" | "email"): Promise<boolean> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin.from("admin_otp_codes").insert({
    admin_id: adminId,
    code,
    channel,
    expires_at: expiresAt,
  });
  return !error;
}

export async function verifyOTPCode(adminId: string, code: string, channel: "sms" | "email"): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_otp_codes")
    .select("*")
    .eq("admin_id", adminId)
    .eq("code", code)
    .eq("channel", channel)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return false;

  await supabaseAdmin
    .from("admin_otp_codes")
    .update({ used: true })
    .eq("id", data.id);

  return true;
}

export async function getAllAdmins() {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, email, display_name, role, phone, is_active, created_at, last_login")
    .order("created_at", { ascending: false });
  return data || [];
}

// ── App Settings ──

export async function getAppSetting(key: string): Promise<any> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function getAppSettings(): Promise<Record<string, any>> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("key, value");
  if (!data) return {};
  const settings: Record<string, any> = {};
  for (const row of data) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function setAppSetting(key: string, value: any): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return !error;
}

// ── Admin Management ──

export async function createAdmin(data: {
  username: string;
  email: string;
  password: string;
  display_name: string;
  role: "super_admin" | "admin";
  phone: string;
}): Promise<{ admin?: any; error?: string }> {
  // Check if username already exists
  const existing = await getAdminByUsername(data.username);
  if (existing) return { error: "Username already taken" };

  // Check if email already exists
  const { data: emailCheck } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("email", data.email.toLowerCase())
    .single();
  if (emailCheck) return { error: "Email already registered" };

  const password_hash = await bcrypt.hash(data.password, 12);
  const { data: admin, error } = await supabaseAdmin
    .from("admin_users")
    .insert({
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      password_hash,
      display_name: data.display_name,
      role: data.role,
      phone: data.phone,
      is_active: false,
    })
    .select("id, username, email, display_name, role, phone, is_active, created_at")
    .single();

  if (error) return { error: error.message };
  return { admin };
}

export async function activateAdmin(adminId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("admin_users")
    .update({ is_active: true })
    .eq("id", adminId);
  return !error;
}

export async function deleteAdmin(adminId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("admin_users")
    .delete()
    .eq("id", adminId);
  return !error;
}
