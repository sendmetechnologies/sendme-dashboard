import { NextRequest, NextResponse } from "next/server"
import { getAdminActivityLogs, logAdminActivity, ACTION_TYPE_LABELS, CATEGORY_CONFIG } from "@/lib/admin-logger"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const admin = searchParams.get("admin") || undefined
    const actionType = searchParams.get("actionType") || undefined
    const actionCategory = searchParams.get("actionCategory") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const search = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const result = await getAdminActivityLogs({
      admin,
      actionType,
      actionCategory,
      dateFrom,
      dateTo,
      search,
      page,
      limit,
    })

    return NextResponse.json({
      ...result,
      filtersConfig: {
        actionTypes: Object.entries(ACTION_TYPE_LABELS).map(([value, conf]) => ({
          value,
          label: conf.label,
          category: conf.category,
        })),
        categories: Object.entries(CATEGORY_CONFIG).map(([value, conf]) => ({
          value,
          label: conf.label,
          color: conf.color,
        })),
      },
    })
  } catch (err: any) {
    console.error("[AdminLogs API] Error:", err)
    return NextResponse.json({ error: err.message || "Failed to load admin logs" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      action_type,
      action_category,
      description,
      target_type,
      target_id,
      target_name,
      amount,
      reason,
      metadata,
    } = body

    if (!action_type || !action_category || !description) {
      return NextResponse.json(
        { error: "action_type, action_category, and description are required" },
        { status: 400 }
      )
    }

    // IP resolution
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1"

    const created = await logAdminActivity({
      admin_id: session.id,
      admin_username: session.username,
      admin_display_name: session.displayName || session.username,
      action_type,
      action_category,
      description,
      target_type,
      target_id,
      target_name,
      amount: amount !== undefined ? Number(amount) : undefined,
      reason,
      metadata,
      ip_address: ip,
    })

    return NextResponse.json({ success: true, log: created })
  } catch (err: any) {
    console.error("[AdminLogs API] POST Error:", err)
    return NextResponse.json({ error: err.message || "Failed to record log" }, { status: 500 })
  }
}

// IMMUTABILITY ENFORCEMENT: DELETION IS STRICTLY FORBIDDEN
export async function DELETE() {
  return NextResponse.json(
    {
      error: "Immutable Audit Ledger: Activity logs are permanent and cannot be modified or deleted.",
    },
    { status: 405 }
  )
}
