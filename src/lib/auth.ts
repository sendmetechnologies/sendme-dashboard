import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sendme-dashboard-jwt-secret-2026";
const SESSION_DURATION_HOURS = parseInt(process.env.SESSION_DURATION_HOURS || "9");

export interface AdminSession {
  id: string;
  username: string;
  displayName: string;
  role: "super_admin" | "admin";
  phone: string;
}

export function createSessionToken(admin: AdminSession): string {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
      phone: admin.phone,
    },
    JWT_SECRET,
    { expiresIn: `${SESSION_DURATION_HOURS}h` }
  );
}

export function verifySessionToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSession;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  };
}
