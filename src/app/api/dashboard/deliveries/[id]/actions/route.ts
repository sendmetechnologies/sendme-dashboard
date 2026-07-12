import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason } = body

    if (action === "cancel_order") {
      // Only allow cancellation for non-terminal orders
      const { data: order, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("id", id)
        .single()

      if (fetchError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (["delivered", "canceled"].includes(order.status)) {
        return NextResponse.json({ error: `Cannot cancel order with status "${order.status}"` }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from("orders")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Order cancelled" })
    }

    if (action === "delete_order") {
      // Hard delete an order (admin only)
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Order permanently deleted" })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("[Order Actions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
