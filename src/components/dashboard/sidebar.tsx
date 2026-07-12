"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, MapPin, Calendar, Users, Building2,
  Car, DollarSign, Wallet, AlertCircle, CheckCircle, BarChart3, Bell,
  Settings, ChevronLeft, ChevronRight, Send, HelpCircle, ArrowLeftRight,
  Megaphone
} from "lucide-react"
import { useState, useEffect } from "react"

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "Deliveries", href: "/dashboard/deliveries", icon: Package },
      { name: "Live Tracker", href: "/dashboard/live-tracker", icon: MapPin },
      { name: "Schedules", href: "/dashboard/schedules", icon: Calendar },
      { name: "Return Load", href: "/dashboard/return-load", icon: ArrowLeftRight },
    ],
  },
  {
    title: "NETWORK",
    items: [
      { name: "Drivers", href: "/dashboard/drivers", icon: Users },
      { name: "Senders", href: "/dashboard/users", icon: Users },
      { name: "Organizations", href: "/dashboard/organizations", icon: Building2 },
      { name: "Marketers", href: "/dashboard/marketers", icon: Megaphone },
      { name: "Vehicles", href: "/dashboard/vehicles", icon: Car },
    ],
  },
  {
    title: "COMMERCE",
    items: [
      { name: "Bids & Pricing", href: "/dashboard/bids-pricing", icon: DollarSign },
      { name: "Wallets & Payments", href: "/dashboard/wallets-payments", icon: Wallet },
    ],
  },
  {
    title: "RESOLUTION",
    items: [
      { name: "Disputes & Support", href: "/dashboard/disputes", icon: AlertCircle, badge: 5 },
      { name: "Approvals", href: "/dashboard/approvals", icon: CheckCircle, badge: 18 },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "Reports & Insights", href: "/dashboard/reports", icon: BarChart3 },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.admin?.role === "super_admin") setIsAdmin(true)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const filteredSections = navSections.map((section) => {
    if (section.title === "SYSTEM") {
      return {
        ...section,
        items: isAdmin ? section.items : [],
      }
    }
    return section
  })

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-60"
      } bg-white border-r border-border-default flex flex-col shrink-0 transition-all duration-300 hidden lg:flex`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border-light shrink-0">
        <div className="w-8 h-8 bg-sendme rounded-lg flex items-center justify-center shrink-0">
          <Send size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-text-primary font-bold text-base tracking-tight">
            Send<span className="text-sendme">Me</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-5">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[13px] font-medium ${
                      active
                        ? "bg-sendme-50 text-sendme"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="text-[10px] font-semibold bg-danger-light text-danger px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Help & Support + Collapse */}
      <div className="border-t border-border-light p-3 space-y-1">
        {!collapsed && (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all text-[13px] font-medium"
          >
            <HelpCircle size={18} className="shrink-0" />
            <span className="flex-1">Help & Support</span>
            <ChevronRight size={14} className="shrink-0 text-text-muted" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-[13px] font-medium"
        >
          {collapsed ? <ChevronRight size={16} className="shrink-0" /> : <ChevronLeft size={16} className="shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
