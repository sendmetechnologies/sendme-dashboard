import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("marketer_profiles")
      .select("*, users!inner(id, full_name, email, phone, state, created_at, is_deleted, is_suspended)")
      .eq("user_id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 })
    }

    const user = (profile as any).users

    // Referral stats (from the canonical referrals table)
    let referralCount = 0
    let referrals: any[] = []
    let totalEarnings = 0
    let walletBalance = 0
    if (profile.marketer_id) {
      const { data: mk } = await supabaseAdmin
        .from("marketers")
        .select("id, total_earnings")
        .eq("ref_id", profile.marketer_id)
        .single()

      if (mk) {
        totalEarnings = Number(mk.total_earnings) || 0

        const { data: wallet } = await supabaseAdmin
          .from("marketer_wallets")
          .select("balance")
          .eq("marketer_id", mk.id)
          .single()
        walletBalance = Number(wallet?.balance) || 0

        const { data: refData } = await supabaseAdmin
          .from("referrals")
          .select("id, referred_user_id, referred_user_role, status, created_at")
          .eq("marketer_id", mk.id)
          .order("created_at", { ascending: false })
          .limit(20)

        const refs = refData || []
        referralCount = refs.length

        // Enrich referrals with referred user details
        const userIds = refs.map((r: any) => r.referred_user_id).filter(Boolean)
        const userById: Record<string, any> = {}
        if (userIds.length > 0) {
          const { data: users } = await supabaseAdmin
            .from("users")
            .select("id, full_name, email, phone, role")
            .in("id", userIds)
          for (const u of users || []) userById[u.id] = u
        }

        referrals = refs.map((r: any) => {
          const u = userById[r.referred_user_id]
          return {
            id: r.id,
            name: u?.full_name || "—",
            email: u?.email || "—",
            phone: u?.phone || "—",
            role: r.referred_user_role || u?.role || "—",
            status: r.status,
            joined: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          }
        })
      }
    }

    const created = new Date(profile.created_at)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    let memberSince = created.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    let memberDuration = ""
    if (diffDays > 365) memberDuration = `${Math.floor(diffDays / 365)}y`
    else if (diffDays > 30) memberDuration = `${Math.floor(diffDays / 30)}mo`
    else memberDuration = `${diffDays}d`

    const statusColors: Record<string, string> = {
      pending: "bg-warning-light text-warning",
      approved: "bg-sendme-50 text-sendme",
      rejected: "bg-danger-light text-danger",
      suspended: "bg-gray-100 text-gray-600",
    }

    return NextResponse.json({
      marketer: {
        id: profile.user_id,
        name: user?.full_name || "—",
        phone: profile.phone || user?.phone || "—",
        email: user?.email || "—",
        state: profile.state || "—",
        city: profile.city || "—",
        occupation: profile.occupation || "—",
        hasSalesExperience: profile.has_sales_experience,
        experienceDescription: profile.experience_description || "—",
        onboardedTargets: profile.onboarded_targets_30d,
        marketerId: profile.marketer_id || "Pending",
        status: profile.status,
        statusLabel: profile.status.charAt(0).toUpperCase() + profile.status.slice(1),
        statusColor: statusColors[profile.status] || "bg-gray-100 text-gray-600",
        reviewReason: profile.review_reason,
        totalReferrals: referralCount,
        totalEarnings,
        totalEarningsFormatted: `₦${totalEarnings.toLocaleString()}`,
        walletBalance,
        walletBalanceFormatted: `₦${walletBalance.toLocaleString()}`,
        memberSince,
        memberDuration,
        created_at: profile.created_at,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.full_name || "—",
        email: r.email || "—",
        phone: r.phone || "—",
        role: r.role,
        joined: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      })),
    })
  } catch (err) {
    console.error("[Marketer Detail] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
