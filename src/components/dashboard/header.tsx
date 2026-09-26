"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, X, Bell, LogOut, RefreshCw, ShieldCheck } from "lucide-react"
import { PAGE_REFRESH_EVENT } from "@/hooks/use-page-refresh"
import { clearKycUnlock } from "@/hooks/use-kyc-unlock"

interface AdminInfo {
  displayName: string
  role: string
}

const PAGE_METAS: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Operations Overview", subtitle: "Monitor deliveries, fleet activity, payouts, and operational metrics in one place." },
  "/dashboard/deliveries": { title: "Deliveries & Orders", subtitle: "Track, manage and resolve every delivery request across SendMe." },
  "/dashboard/schedules": { title: "Scheduled Deliveries", subtitle: "Manage and monitor scheduled pickups and upcoming deliveries." },
  "/dashboard/live-tracker": { title: "Live Fleet Tracker", subtitle: "Real-time rider locations and active delivery routes." },
  "/dashboard/return-load": { title: "Return Load Matching", subtitle: "Inter-city route optimization and empty-leg cargo loads." },
  "/dashboard/drivers": { title: "Riders & Drivers", subtitle: "Fleet verification, ratings, document review, and status." },
  "/dashboard/users": { title: "Senders & Customers", subtitle: "Individual customer accounts, transaction histories, and support." },
  "/dashboard/organizations": { title: "Organizations", subtitle: "Corporate accounts, business verification, and team orders." },
  "/dashboard/marketers": { title: "Marketers & Referrals", subtitle: "Affiliate program, referral links, and commission tracking." },
  "/dashboard/vehicles": { title: "Vehicles & Fleet", subtitle: "Registered delivery vehicles, license plates, and inspection." },
  "/dashboard/wallets-payments": { title: "Wallets & Payments", subtitle: "Financial ledger, driver payout approvals, and transaction audit." },
  "/dashboard/bids-pricing": { title: "Bids & Pricing", subtitle: "Bidding corridors, base fares, and distance pricing algorithms." },
  "/dashboard/disputes": { title: "Disputes & Support", subtitle: "Customer disputes, claims resolution, and arbitration." },
  "/dashboard/approvals": { title: "KYC Approvals", subtitle: "Rider identity verification, license checks, and background review." },
  "/dashboard/notifications": { title: "In-App Notifications", subtitle: "Send targeted push and in-app alerts to customers and riders." },
  "/dashboard/email-campaigns": { title: "Email Campaigns", subtitle: "Broadcast marketing and operational emails to selected groups." },
  "/dashboard/settings": { title: "Settings", subtitle: "System configurations, admin privileges, and integration keys." },
}

export function DashboardHeader({ onToggleSidebar, sidebarOpen }: { onToggleSidebar: () => void; sidebarOpen: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const meta = PAGE_METAS[pathname] || {
    title: pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard",
    subtitle: "SendMe Delivery Administration",
  }

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setAdmin(data.admin)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    clearKycUnlock()
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // Tell the currently-mounted page to re-run its data fetch
    window.dispatchEvent(new CustomEvent(PAGE_REFRESH_EVENT))
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <header className="h-16 bg-white border-b border-border-default flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-text-muted hover:text-text-primary transition-colors shrink-0"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-text-primary font-bold text-sm lg:text-base truncate">{meta.title}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sendme animate-pulse" /> Live
            </span>
          </div>
          <p className="text-text-muted text-xs hidden md:block truncate">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className={`p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-secondary ${refreshing ? "animate-spin text-sendme" : ""}`}
          title="Refresh current page"
        >
          <RefreshCw size={18} />
        </button>

        {/* Notification bell */}
        <Link
          href="/dashboard/notifications"
          className="p-2 text-text-muted hover:text-text-primary transition-colors relative rounded-lg hover:bg-surface-secondary"
          title="Notifications & Announcements"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sendme rounded-full ring-2 ring-white" />
        </Link>

        {/* User info */}
        {admin && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border-default ml-1">
            <div className="w-8 h-8 bg-sendme-50 text-sendme rounded-full flex items-center justify-center font-bold text-xs ring-1 ring-sendme/20">
              {admin.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <p className="text-xs font-semibold text-text-primary truncate max-w-[120px]">{admin.displayName}</p>
              <p className="text-[10px] text-text-muted capitalize">{admin.role || "Admin"}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-danger hover:bg-danger-light/30 transition-colors rounded-lg hidden sm:block"
          title="Sign out of Admin"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
