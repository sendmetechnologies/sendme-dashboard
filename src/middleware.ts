import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard"];
const authPaths = ["/login", "/otp"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("admin_session")?.value;

  if (authPaths.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/otp"],
};
