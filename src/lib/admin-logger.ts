import { supabaseAdmin } from "@/lib/supabase"
import { getSession } from "@/lib/auth"
import {
  ActionCategory,
  ActionType,
  AdminActivityLog,
  ActivityFilterParams,
  ACTION_TYPE_LABELS,
  CATEGORY_CONFIG,
} from "./admin-logger-types"

export * from "./admin-logger-types"

/**
 * Log an administrative activity into PostgreSQL.
 * Note: Admin audit logs are immutable and permanent (NO DELETION ALLOWED).
 */
export async function logAdminActivity(entry: {
  admin_username?: string
  admin_display_name?: string
  admin_id?: string
  action_type: ActionType | string
  action_category: ActionCategory | string
  description: string
  target_type?: string
  target_id?: string
  target_name?: string
  amount?: number
  reason?: string
  metadata?: Record<string, any>
  ip_address?: string
}): Promise<AdminActivityLog | null> {
  try {
    let username = entry.admin_username
    let displayName = entry.admin_display_name
    let adminId = entry.admin_id

    // Fall back to current session if available
    if (!username || !displayName) {
      try {
        const session = await getSession()
        if (session) {
          username = username || session.username || "admin"
          displayName = displayName || session.displayName || "Admin"
          adminId = adminId || session.id
        }
      } catch {
        // Safe ignore
      }
    }

    username = username || "admin"
    displayName = displayName || "Admin"

    const row = {
      admin_id: adminId || null,
      admin_username: username,
      admin_display_name: displayName,
      action_type: entry.action_type,
      action_category: entry.action_category,
      description: entry.description,
      target_type: entry.target_type || null,
      target_id: entry.target_id || null,
      target_name: entry.target_name || null,
      amount: entry.amount !== undefined ? entry.amount : null,
      reason: entry.reason || null,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address || null,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from("admin_activity_logs")
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error("[AdminLogger] DB insert error:", error)
      return null
    }

    return data as AdminActivityLog
  } catch (err) {
    console.error("[AdminLogger] Unexpected error logging activity:", err)
    return null
  }
}

/**
 * Fetch filtered admin activity logs.
 */
export async function getAdminActivityLogs(params: ActivityFilterParams = {}): Promise<{
  logs: AdminActivityLog[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: {
    totalLogs: number
    financialActions: number
    logins: number
    moderationActions: number
    expensesLogged: number
    activeAdmins: string[]
    archivedAdmins: string[]
  }
}> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(10, params.limit || 50))
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from("admin_activity_logs")
    .select("*", { count: "exact" })

  // Admin filter
  if (params.admin && params.admin !== "all") {
    query = query.eq("admin_username", params.admin)
  }

  // Action type filter
  if (params.actionType && params.actionType !== "all") {
    query = query.eq("action_type", params.actionType)
  }

  // Category filter
  if (params.actionCategory && params.actionCategory !== "all") {
    query = query.eq("action_category", params.actionCategory)
  }

  // Date range filter
  if (params.dateFrom) {
    query = query.gte("created_at", new Date(params.dateFrom).toISOString())
  }
  if (params.dateTo) {
    // include full end day
    const toDate = new Date(params.dateTo)
    toDate.setHours(23, 59, 59, 999)
    query = query.lte("created_at", toDate.toISOString())
  }

  // Search filter
  if (params.search && params.search.trim()) {
    const s = params.search.trim()
    query = query.or(
      `description.ilike.%${s}%,admin_username.ilike.%${s}%,target_name.ilike.%${s}%,reason.ilike.%${s}%`
    )
  }

  // Order descending by created_at (newest first)
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error("[AdminLogger] Fetch error:", error)
    return {
      logs: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      stats: {
        totalLogs: 0,
        financialActions: 0,
        logins: 0,
        moderationActions: 0,
        expensesLogged: 0,
        activeAdmins: [],
        archivedAdmins: [],
      },
    }
  }

  // Query DB admin_users to know who is genuinely currently active
  const { data: dbAdmins } = await supabaseAdmin
    .from("admin_users")
    .select("username, is_active")

  const activeAdmins: string[] = []
  const activeSet = new Set<string>()
  if (dbAdmins) {
    for (const adm of dbAdmins) {
      if (adm.is_active && adm.username) {
        activeAdmins.push(adm.username)
        activeSet.add(adm.username)
      }
    }
  }

  // Also query aggregate summary metrics from logs
  const { data: allStatsData } = await supabaseAdmin
    .from("admin_activity_logs")
    .select("action_category, action_type, admin_username")

  let financialActions = 0
  let logins = 0
  let moderationActions = 0
  let expensesLogged = 0
  const archivedAdminsSet = new Set<string>()

  if (allStatsData) {
    for (const item of allStatsData) {
      if (item.admin_username && !activeSet.has(item.admin_username)) {
        archivedAdminsSet.add(item.admin_username)
      }
      if (item.action_category === "FINANCE") financialActions++
      if (item.action_type === "login") logins++
      if (
        ["DRIVERS", "ORGANIZATIONS", "VEHICLES"].includes(item.action_category) ||
        item.action_type.includes("verify") ||
        item.action_type.includes("suspend") ||
        item.action_type.includes("reject")
      ) {
        moderationActions++
      }
      if (item.action_category === "EXPENSES") expensesLogged++
    }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    logs: (data as AdminActivityLog[]) || [],
    total,
    page,
    limit,
    totalPages,
    stats: {
      totalLogs: total,
      financialActions,
      logins,
      moderationActions,
      expensesLogged,
      activeAdmins,
      archivedAdmins: Array.from(archivedAdminsSet),
    },
  }
}
