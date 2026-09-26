import { NextRequest, NextResponse } from "next/server"
import { getOperationalCosts, addOperationalCost, deleteOperationalCost } from "@/lib/costs-store"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const costs = await getOperationalCosts()
    return NextResponse.json({ costs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { category, title, amount, vendor, date, notes } = body

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
      recordedBy: session?.displayName || session?.username || "Admin",
    })

    return NextResponse.json({ success: true, cost: created })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await deleteOperationalCost(id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
