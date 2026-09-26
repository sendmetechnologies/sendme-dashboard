import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

const MAX_DEPTH = 6

interface TreeNode {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  role: string
  state: string | null
  username: string | null
  referralStatus: string | null
  verificationStatus: string | null
  convertedAt: string | null
  commissionAmount: number
  commissionPaid: boolean
  joinedAt: string
  isMarketer: boolean
  children: TreeNode[]
}

async function buildTree(marketersId: string, visited: Set<string>, depth: number): Promise<TreeNode[]> {
  if (depth >= MAX_DEPTH) return []

  const { data: refs } = await supabaseAdmin
    .from("referrals")
    .select("id, referred_user_id, referred_user_role, status, converted_at, commission_amount, commission_paid, created_at")
    .eq("marketer_id", marketersId)
    .order("created_at", { ascending: false })
    .limit(500)

  const list = refs || []
  if (list.length === 0) return []

  const userIds = list.map((r: any) => r.referred_user_id).filter(Boolean)
  if (userIds.length === 0) return []

  const [usersRes, profilesRes, driversRes, orgsRes] = await Promise.all([
    supabaseAdmin.from("users").select("id, full_name, email, phone, role, state, username").in("id", userIds),
    supabaseAdmin.from("marketer_profiles").select("user_id, marketer_id, status").in("user_id", userIds),
    supabaseAdmin.from("driver_profiles").select("id, verification_status").in("id", userIds),
    supabaseAdmin.from("organization_profiles").select("id, verification_status, is_verified").in("id", userIds),
  ])

  const userById: Record<string, any> = {}
  for (const u of usersRes.data || []) userById[u.id] = u

  const profileByUserId: Record<string, any> = {}
  for (const p of profilesRes.data || []) profileByUserId[p.user_id] = p

  const driverStatusById: Record<string, string> = {}
  for (const d of driversRes.data || []) if (d.verification_status) driverStatusById[d.id] = d.verification_status

  const orgStatusById: Record<string, { status: string | null; verified: boolean }> = {}
  for (const o of orgsRes.data || []) orgStatusById[o.id] = { status: o.verification_status, verified: o.is_verified === true }

  const nodes: TreeNode[] = []
  for (const r of list) {
    const u = userById[r.referred_user_id]
    if (!u) continue
    if (visited.has(u.id)) continue
    visited.add(u.id)

    const role = r.referred_user_role || u.role || "customer"
    const profile = profileByUserId[u.id]
    const isMarketer = !!profile

    let verificationStatus: string | null = null
    if (role === "driver") verificationStatus = driverStatusById[u.id] || null
    else if (role === "organization") {
      const org = orgStatusById[u.id]
      verificationStatus = org ? (org.verified ? "verified" : org.status) : null
    } else if (isMarketer) verificationStatus = profile.status || null

    let children: TreeNode[] = []
    if (isMarketer && profile.marketer_id) {
      const { data: mk } = await supabaseAdmin
        .from("marketers")
        .select("id")
        .eq("ref_id", profile.marketer_id)
        .maybeSingle()
      if (mk) children = await buildTree(mk.id, visited, depth + 1)
    }

    nodes.push({
      id: r.id,
      userId: u.id,
      name: u.full_name || "—",
      email: u.email || "—",
      phone: u.phone || "—",
      role,
      state: u.state || null,
      username: u.username || null,
      referralStatus: r.status || null,
      verificationStatus,
      convertedAt: r.converted_at,
      commissionAmount: Number(r.commission_amount) || 0,
      commissionPaid: r.commission_paid === true,
      joinedAt: r.created_at,
      isMarketer,
      children,
    })
  }

  return nodes
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("marketer_profiles")
      .select("marketer_id, users!inner(full_name)")
      .eq("user_id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 })
    }

    let tree: TreeNode[] = []
    let totalDirect = 0

    if (profile.marketer_id) {
      const { data: mk } = await supabaseAdmin
        .from("marketers")
        .select("id")
        .eq("ref_id", profile.marketer_id)
        .maybeSingle()

      if (mk) {
        const { count } = await supabaseAdmin
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("marketer_id", mk.id)
        totalDirect = count || 0

        tree = await buildTree(mk.id, new Set<string>(), 0)
      }
    }

    const user = (profile as any).users

    return NextResponse.json({
      marketer: {
        id,
        name: user?.full_name || "—",
        marketerId: profile.marketer_id || null,
      },
      totalDirect,
      tree,
    })
  } catch (err) {
    console.error("[Marketer Tree] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
