import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllAdmins, createAdmin } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await getAllAdmins();
    return NextResponse.json({ admins });
  } catch (err) {
    console.error("[Admins] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { username, email, password, display_name, role, phone } = body;

    if (!username || !email || !password || !display_name || !phone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const result = await createAdmin({
      username,
      email,
      password,
      display_name,
      role: role || "admin",
      phone,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, admin: result.admin });
  } catch (err) {
    console.error("[Admins] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
