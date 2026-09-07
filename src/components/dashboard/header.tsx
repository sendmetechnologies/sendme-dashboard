"use client"

import { useEffect, useState } from "react"
import { Menu, X, Bell, Search, Download, ChevronDown, LogOut, RefreshCw } from "lucide-react"
import { PAGE_REFRESH_EVENT } from "@/hooks/use-page-refresh"
import { clearKycUnlock } from "@/hooks/use-kyc-unlock"

interface AdminInfo {
  displayName: string
  role: string
}

export function DashboardHeader({ onToggleSidebar, sidebarOpen }: { onToggleSidebar: () => void; sidebarOpen: boolean }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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
    <header className="h-16 bg-white border-b border-border-default flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-text-muted hover:text-text-primary transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <h1 className="text-text-primary font-semibold text-base">Operations Overview</h1>
          <p className="text-text-muted text-xs hidden sm:block">Monitor deliveries, fleet activity, payouts, and operational issues in one place.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-1.5 text-text-muted text-sm">
          <Search size={14} />
          <span className="text-xs">Search anything...</span>
          <kbd className="text-[10px] bg-white border border-border-default rounded px-1.5 py-0.5 ml-4 font-medium">⌘K</kbd>
        </div>

        {/* Date filter */}
        <button className="hidden sm:flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-text-secondary text-xs font-medium hover:bg-surface-hover transition-colors">
          Today <ChevronDown size={14} />
        </button>

        {/* Location filter */}
        <button className="hidden sm:flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-text-secondary text-xs font-medium hover:bg-surface-hover transition-colors">
          <span className="text-sendme">●</span> Lagos <ChevronDown size={14} />
        </button>

        {/* Export */}
        <button className="hidden sm:flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-text-secondary text-xs font-medium hover:bg-surface-hover transition-colors">
          <Download size={14} /> Export
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className={`p-2 text-text-muted hover:text-text-primary transition-colors ${refreshing ? "animate-spin" : ""}`}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

        {/* Notification bell */}
        <button className="p-2 text-text-muted hover:text-text-primary transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-sendme rounded-full" />
        </button>

        {/* User info */}
        {admin && (
          <div className="hidden md:flex items-center gap-2 ml-2">
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme font-bold text-xs">
              {admin.displayName.charAt(0)}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-danger transition-colors hidden md:block"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
