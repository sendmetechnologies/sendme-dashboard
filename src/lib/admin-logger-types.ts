export type ActionCategory =
  | "AUTH"
  | "FINANCE"
  | "DRIVERS"
  | "ORGANIZATIONS"
  | "VEHICLES"
  | "DISPUTES"
  | "EXPENSES"
  | "SUPPORT"
  | "SYSTEM"

export type ActionType =
  | "login"
  | "logout"
  | "credit_wallet"
  | "debit_wallet"
  | "approve_payout"
  | "reject_payout"
  | "verify_driver"
  | "reject_driver"
  | "suspend_driver"
  | "delete_driver"
  | "verify_org"
  | "reject_org"
  | "suspend_org"
  | "delete_org"
  | "verify_vehicle"
  | "reject_vehicle"
  | "delete_vehicle"
  | "resolve_dispute"
  | "add_expense"
  | "delete_expense"
  | "add_support_member"
  | "remove_support_member"
  | "update_settings"
  | "send_broadcast"
  | "other"

export interface AdminActivityLog {
  id: string
  admin_id?: string | null
  admin_username: string
  admin_display_name: string
  action_type: ActionType | string
  action_category: ActionCategory | string
  description: string
  target_type?: string | null
  target_id?: string | null
  target_name?: string | null
  amount?: number | null
  reason?: string | null
  metadata?: Record<string, any>
  ip_address?: string | null
  created_at: string
}

export interface ActivityFilterParams {
  admin?: string
  actionType?: string
  actionCategory?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

export const ACTION_TYPE_LABELS: Record<string, { label: string; category: ActionCategory }> = {
  login: { label: "Admin Login", category: "AUTH" },
  logout: { label: "Admin Logout", category: "AUTH" },
  credit_wallet: { label: "Wallet Credit (Override)", category: "FINANCE" },
  debit_wallet: { label: "Wallet Debit (Deduction)", category: "FINANCE" },
  approve_payout: { label: "Payout Request Approved", category: "FINANCE" },
  reject_payout: { label: "Payout Request Rejected", category: "FINANCE" },
  verify_driver: { label: "Driver KYC Approved", category: "DRIVERS" },
  reject_driver: { label: "Driver Verification Rejected", category: "DRIVERS" },
  suspend_driver: { label: "Driver Suspended", category: "DRIVERS" },
  delete_driver: { label: "Driver Deactivated / Deleted", category: "DRIVERS" },
  verify_org: { label: "Organization Verified", category: "ORGANIZATIONS" },
  reject_org: { label: "Organization Rejected", category: "ORGANIZATIONS" },
  suspend_org: { label: "Organization Suspended", category: "ORGANIZATIONS" },
  delete_org: { label: "Organization Deactivated", category: "ORGANIZATIONS" },
  verify_vehicle: { label: "Vehicle Approved", category: "VEHICLES" },
  reject_vehicle: { label: "Vehicle Rejected", category: "VEHICLES" },
  delete_vehicle: { label: "Vehicle Deactivated", category: "VEHICLES" },
  resolve_dispute: { label: "Dispute Resolved", category: "DISPUTES" },
  add_expense: { label: "Operational Cost Recorded", category: "EXPENSES" },
  delete_expense: { label: "Operational Cost Removed", category: "EXPENSES" },
  add_support_member: { label: "Support Team Code Generated", category: "SUPPORT" },
  remove_support_member: { label: "Support Member Revoked", category: "SUPPORT" },
  update_settings: { label: "Platform Setting Modified", category: "SYSTEM" },
  send_broadcast: { label: "Email / In-App Broadcast Sent", category: "SYSTEM" },
  other: { label: "System Operation", category: "SYSTEM" },
}

export const CATEGORY_CONFIG: Record<
  ActionCategory,
  { label: string; color: string; badgeBg: string; textColor: string; icon: string }
> = {
  AUTH: {
    label: "Authentication & Security",
    color: "#6366F1",
    badgeBg: "bg-indigo-50",
    textColor: "text-indigo-700",
    icon: "Key",
  },
  FINANCE: {
    label: "Financial & Wallet Overrides",
    color: "#158A5E",
    badgeBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    icon: "Wallet",
  },
  DRIVERS: {
    label: "Drivers & Riders",
    color: "#0284C7",
    badgeBg: "bg-sky-50",
    textColor: "text-sky-700",
    icon: "Users",
  },
  ORGANIZATIONS: {
    label: "Organizations",
    color: "#8B5CF6",
    badgeBg: "bg-purple-50",
    textColor: "text-purple-700",
    icon: "Building2",
  },
  VEHICLES: {
    label: "Vehicles & Fleet",
    color: "#0D9488",
    badgeBg: "bg-teal-50",
    textColor: "text-teal-700",
    icon: "Car",
  },
  DISPUTES: {
    label: "Disputes & Support Tickets",
    color: "#F59E0B",
    badgeBg: "bg-amber-50",
    textColor: "text-amber-700",
    icon: "AlertCircle",
  },
  EXPENSES: {
    label: "Operational Expenses",
    color: "#E11D48",
    badgeBg: "bg-rose-50",
    textColor: "text-rose-700",
    icon: "Receipt",
  },
  SUPPORT: {
    label: "Support Agents & WhatsApp",
    color: "#059669",
    badgeBg: "bg-emerald-50",
    textColor: "text-emerald-800",
    icon: "Headphones",
  },
  SYSTEM: {
    label: "System & Settings",
    color: "#64748B",
    badgeBg: "bg-slate-100",
    textColor: "text-slate-700",
    icon: "Settings",
  },
}
