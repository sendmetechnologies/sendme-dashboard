import { NextRequest, NextResponse } from "next/server"
import { getOperationalCosts, addOperationalCost, deleteOperationalCost } from "@/lib/costs-store"
import { getSession } from "@/lib/auth"
import { logAdminActivity } from "@/lib/admin-logger"

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const costs = await getOperationalCosts()
    return NextResponse.json(
      { costs },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const adminName = session?.displayName || session?.username || "Admin"
    const adminUsername = session?.username || "admin"
    const adminId = session?.id

    const body = await req.json()
    const { category, title, amount, vendor, date, notes, frequency, nextPaymentDate, nextPaymentAmount, nextPaymentNote } = body

    if (!category || !title || !amount) {
      return NextResponse.json({ error: "category, title, and amount are required" }, { status: 400 })
    }

    const created = await addOperationalCost({
      category,
      title,
      amount: Math.abs(Number(amount)),
      vendor: vendor || "—",
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes || "",
      recordedBy: adminName,
      frequency,
      nextPaymentDate,
      nextPaymentAmount: nextPaymentAmount ? Number(nextPaymentAmount) : undefined,
      nextPaymentNote,
    })

    logAdminActivity({
      admin_id: adminId,
      admin_username: adminUsername,
      admin_display_name: adminName,
      action_type: "add_expense",
      action_category: "EXPENSES",
      description: `${adminName} logged operational cost: ${title} — ₦${Number(amount).toLocaleString()}`,
      target_type: "expense",
      target_id: created.id,
      target_name: vendor || title,
      amount: Number(amount),
      reason: notes || undefined,
      metadata: { category, vendor, frequency, nextPaymentDate },
    }).catch(() => {})

    return NextResponse.json({ success: true, cost: created })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    const adminName = session?.displayName || session?.username || "Admin"
    const adminUsername = session?.username || "admin"
    const adminId = session?.id

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await deleteOperationalCost(id)

    logAdminActivity({
      admin_id: adminId,
      admin_username: adminUsername,
      admin_display_name: adminName,
      action_type: "delete_expense",
      action_category: "EXPENSES",
      description: `${adminName} removed operational expense record #${id}`,
      target_type: "expense",
      target_id: id,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
