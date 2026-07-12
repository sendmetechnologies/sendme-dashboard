import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sendme-dashboard-jwt-secret-2026";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      displayName: string;
      role: string;
    };

    return NextResponse.json({
      authenticated: true,
      admin: {
        id: decoded.id,
        displayName: decoded.displayName,
        role: decoded.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
