import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: driver, error } = await supabaseAdmin
      .from("users")
      .select(`
        id, full_name, phone, email, state, created_at,
        driver_profiles(verification_status, rating, vehicle_info, is_online, id_details, review_reason, trips_count)
      `)
      .eq("id", id)
      .single()

    if (error || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    const profileEmbed = (driver as any).driver_profiles
    const profile = Array.isArray(profileEmbed) ? profileEmbed[0] : profileEmbed
    const vp = profile?.vehicle_info as any
    const verificationStatus = profile?.verification_status || "pending"

    // Trip stats
    const [completedResult, cancelledResult, totalResult] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("accepted_driver_id", id).eq("status", "delivered"),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("accepted_driver_id", id).eq("status", "canceled"),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("accepted_driver_id", id),
    ])

    const tripCount = completedResult.count || 0
    const cancelCount = cancelledResult.count || 0
    const totalTrips = totalResult.count || 0
    const cancelRate = totalTrips > 0 ? ((cancelCount / totalTrips) * 100).toFixed(1) + "%" : "0%"
    const acceptanceRate = totalTrips > 0 ? `${Math.round(((totalTrips - cancelCount) / totalTrips) * 100)}%` : "—"

    // Earnings
    const { data: earningsData } = await supabaseAdmin
      .from("orders")
      .select("driver_earning")
      .eq("accepted_driver_id", id)
      .eq("status", "delivered")

    const totalEarnings = (earningsData || []).reduce((sum, e) => sum + (Number(e.driver_earning) || 0), 0)

    // Wallet
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance, outstanding_balance")
      .eq("user_id", id)
      .single()

    // Payout requests
    const { data: payouts } = await supabaseAdmin
      .from("payout_requests")
      .select("id, amount, status, created_at")
      .eq("driver_id", id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Recent trips
    const { data: recentTrips } = await supabaseAdmin
      .from("orders")
      .select("id, pickup_address, dropoff_address, final_price, status, created_at")
      .eq("accepted_driver_id", id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Status label
    let statusLabel = "Pending Review"
    let statusColor = "bg-warning-light text-warning"
    if (verificationStatus === "verified") { statusLabel = "Approved"; statusColor = "bg-sendme-50 text-sendme" }
    else if (verificationStatus === "rejected") { statusLabel = "Suspended"; statusColor = "bg-danger-light text-danger" }
    else if (verificationStatus === "under_review") { statusLabel = "Under Review"; statusColor = "bg-info-light text-info" }

    const created = new Date(driver.created_at)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    let memberSince = created.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    let memberDuration = ""
    if (diffDays > 365) memberDuration = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""}`
    else if (diffDays > 30) memberDuration = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""}`
    else memberDuration = `${diffDays} day${diffDays > 1 ? "s" : ""}`

    return NextResponse.json({
      driver: {
        id: driver.id,
        name: driver.full_name || "—",
        phone: driver.phone || "—",
        email: driver.email || "—",
        avatar: (driver.full_name || "?")[0],
        status: statusLabel,
        statusColor,
        statusRaw: verificationStatus,
        reviewReason: profile?.review_reason || null,
        type: "Independent Driver",
        city: (driver as any).state || "—",
        memberSince,
        memberDuration,
        created_at: driver.created_at,
      },
      stats: {
        tripsCompleted: tripCount,
        cancellationRate: cancelRate,
        acceptanceRate,
        rating: profile?.rating || null,
        ratingCount: 0,
        totalEarnings,
        totalEarningsFormatted: totalEarnings ? `₦${totalEarnings.toLocaleString()}` : "—",
      },
      wallet: wallet ? {
        balance: Number(wallet.balance) || 0,
        balanceFormatted: `₦${(Number(wallet.balance) || 0).toLocaleString()}`,
        outstandingBalance: Number(wallet.outstanding_balance) || 0,
        outstandingFormatted: `₦${(Number(wallet.outstanding_balance) || 0).toLocaleString()}`,
      } : null,
      vehicle: vp ? {
        type: vp.type || "—",
        capacity: vp.capacity || "—",
        makeModel: vp.make || vp.model || "—",
        ownership: vp.ownership || "—",
        plateNumber: vp.plate || "—",
        fuelType: vp.fuel_type || "—",
        color: vp.color || "—",
        transmission: vp.transmission || "—",
        year: vp.year || "—",
        seatingCapacity: vp.seating_capacity || "—",
      } : null,
      recentPayouts: (payouts || []).map((p) => ({
        id: p.id,
        shortId: p.id.slice(0, 8).toUpperCase(),
        amount: Number(p.amount),
        amountFormatted: `₦${Number(p.amount).toLocaleString()}`,
        status: p.status,
        statusColor: p.status === "paid" ? "bg-sendme-50 text-sendme" : p.status === "pending" ? "bg-warning-light text-warning" : p.status === "failed" ? "bg-danger-light text-danger" : "bg-surface-secondary text-text-muted",
        created_at: p.created_at,
      })),
      recentTrips: (recentTrips || []).map((t) => {
        const extractArea = (addr: string) => {
          if (!addr) return "—"
          return addr.split(",").map((p) => p.trim())[0] || addr
        }
        return {
          id: t.id.slice(0, 8).toUpperCase(),
          route: `${extractArea(t.pickup_address)} → ${extractArea(t.dropoff_address)}`,
          date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          fare: t.final_price ? `₦${Number(t.final_price).toLocaleString()}` : "—",
          status: t.status === "delivered" ? "Completed" : t.status === "canceled" ? "Cancelled" : t.status,
          statusColor: t.status === "delivered" ? "bg-sendme-50 text-sendme" : t.status === "canceled" ? "bg-danger-light text-danger" : "bg-surface-secondary text-text-muted",
        }
      }),
    })
  } catch (err) {
    console.error("[Driver Detail] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
