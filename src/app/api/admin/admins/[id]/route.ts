import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteAdmin, getAdminById } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting yourself
    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const success = await deleteAdmin(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Admin deleted" });
  } catch (err) {
    console.error("[Admin Delete] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
