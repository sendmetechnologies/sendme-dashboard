import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppSettings, setAppSetting } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[Settings] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const success = await setAppSetting(key, value);
    if (!success) {
      return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Settings] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
