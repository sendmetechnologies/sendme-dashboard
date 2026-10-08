import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    const { data: logs, error } = await supabaseAdmin
      .from("order_broadcast_logs")
      .select(`
        id,
        order_id,
        driver_id,
        driver_name,
        driver_phone,
        distance_km,
        status,
        created_at,
        updated_at,
        driver:users!order_broadcast_logs_driver_id_fkey(
          id,
          full_name,
          phone,
          avatar_url,
          driver_profiles(vehicle_info, rating, rating_count)
        )
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })

    if (error) {
      // Fallback if foreign key join is not yet established
      const { data: fallbackLogs, error: fallbackError } = await supabaseAdmin
        .from("order_broadcast_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })

      if (fallbackError) {
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        logs: fallbackLogs || [],
        total: fallbackLogs?.length || 0,
      })
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: logs?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 })
  }
}
