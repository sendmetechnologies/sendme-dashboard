import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sendme-dashboard-jwt-secret-2026";
const authPaths = ["/login", "/otp"];

interface DecodedSession {
  id: string;
  role: string;
}

function getSession(request: NextRequest): DecodedSession | null {
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedSession;
    return decoded;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);

  if (authPaths.includes(pathname)) {
    if (session) {
      if (session.role === "marketing") {
        return NextResponse.redirect(new URL("/marketing", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect administrative API endpoints from unauthenticated requests and marketing role
  if (
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/cron")
  ) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role === "marketing") {
      return NextResponse.json(
        { error: "Forbidden: Marketing accounts cannot access internal administrative APIs." },
        { status: 403 }
      );
    }
  }

  // Marketing routes require authentication
  if (pathname.startsWith("/marketing")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Marketing API routes require authentication
  if (pathname.startsWith("/api/marketing")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Dashboard admin routes require authentication and forbid marketing-only users
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role === "marketing") {
      // Marketing users CANNOT access administrative dashboard
      return NextResponse.redirect(new URL("/marketing", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/marketing/:path*",
    "/login",
    "/otp",
    "/api/dashboard/:path*",
    "/api/admin/:path*",
    "/api/cron/:path*",
    "/api/marketing/:path*",
  ],
};
