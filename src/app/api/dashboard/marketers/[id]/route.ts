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

    // Referral stats
    let referralCount = 0
    let referrals: any[] = []
    if (profile.marketer_id) {
      const { data: refData } = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, phone, role, created_at")
        .eq("marketer_id", profile.marketer_id)
        .order("created_at", { ascending: false })
        .limit(20)

      referrals = refData || []
      referralCount = referrals.length
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
        totalEarnings: Number(profile.total_earnings) || 0,
        totalEarningsFormatted: `₦${(Number(profile.total_earnings) || 0).toLocaleString()}`,
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
