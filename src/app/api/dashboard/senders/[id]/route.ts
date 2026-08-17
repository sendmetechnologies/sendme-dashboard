import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try with new columns, fallback without
    let sender: any = null
    const full = await supabaseAdmin
      .from("users")
      .select("id, full_name, phone, email, state, created_at, is_deleted, is_suspended")
      .eq("id", id)
      .single()

    if (full.error) {
      const fallback = await supabaseAdmin
        .from("users")
        .select("id, full_name, phone, email, state, created_at")
        .eq("id", id)
        .single()
      sender = fallback.data
      if (fallback.error || !sender) {
        return NextResponse.json({ error: "Sender not found" }, { status: 404 })
      }
    } else {
      sender = full.data
    }

    // Order stats
    const [totalResult, completedResult, cancelledResult] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("status", "delivered"),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("status", "canceled"),
    ])

    // Total spent
    const { data: spentData } = await supabaseAdmin
      .from("orders")
      .select("final_price")
      .eq("customer_id", id)
      .eq("status", "delivered")

    const totalSpent = (spentData || []).reduce((sum, o) => sum + (Number(o.final_price) || 0), 0)

    // Wallet balance
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance, outstanding_balance")
      .eq("user_id", id)
      .single()

    // Recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from("orders")
      .select("id, pickup_address, dropoff_address, final_price, status, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(5)

    const created = new Date(sender.created_at)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    let memberSince = created.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    let memberDuration = ""
    if (diffDays > 365) memberDuration = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""}`
    else if (diffDays > 30) memberDuration = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""}`
    else memberDuration = `${diffDays} day${diffDays > 1 ? "s" : ""}`

    return NextResponse.json({
      sender: {
        id: sender.id,
        name: sender.full_name || "—",
        phone: sender.phone || "—",
        email: sender.email || "—",
        avatar: (sender.full_name || "?")[0],
        status: (sender as any).is_suspended ? "Suspended" : "Active",
        statusColor: (sender as any).is_suspended ? "bg-warning-light text-warning" : "bg-sendme-50 text-sendme",
        memberSince,
        memberDuration,
        created_at: sender.created_at,
      },
      stats: {
        totalOrders: totalResult.count || 0,
        completedOrders: completedResult.count || 0,
        cancelledOrders: cancelledResult.count || 0,
        totalSpent,
        totalSpentFormatted: totalSpent ? `₦${totalSpent.toLocaleString()}` : "—",
      },
      wallet: wallet ? {
        balance: Number(wallet.balance) || 0,
        balanceFormatted: `₦${(Number(wallet.balance) || 0).toLocaleString()}`,
      } : null,
      recentOrders: (recentOrders || []).map((o) => {
        const extractArea = (addr: string) => {
          if (!addr) return "—"
          return addr.split(",").map((p) => p.trim())[0] || addr
        }
        return {
          id: o.id.slice(0, 8).toUpperCase(),
          route: `${extractArea(o.pickup_address)} → ${extractArea(o.dropoff_address)}`,
          date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          fare: o.final_price ? `₦${Number(o.final_price).toLocaleString()}` : "—",
          status: o.status === "delivered" ? "Delivered" : o.status === "canceled" ? "Cancelled" : o.status,
          statusColor: o.status === "delivered" ? "bg-sendme-50 text-sendme" : o.status === "canceled" ? "bg-danger-light text-danger" : "bg-surface-secondary text-text-muted",
        }
      }),
    })
  } catch (err) {
    console.error("[Sender Detail] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
