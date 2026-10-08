"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, MapPin, Calendar, Users, Building2,
  Car, DollarSign, Wallet, AlertCircle, CheckCircle, BarChart3, Bell,
  Settings, ChevronLeft, ChevronRight, Send, HelpCircle, ArrowLeftRight,
  Megaphone, Trophy, Mail, TrendingUp, ShieldCheck, FileSpreadsheet
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
      { name: "Revenue", href: "/dashboard/revenue", icon: TrendingUp },
      { name: "Bids & Pricing", href: "/dashboard/bids-pricing", icon: DollarSign },
      { name: "Wallets & Payments", href: "/dashboard/wallets-payments", icon: Wallet },
    ],
  },
  {
    title: "RESOLUTION",
    items: [
      { name: "Disputes & Support", href: "/dashboard/disputes", icon: AlertCircle },
      { name: "Approvals", href: "/dashboard/approvals", icon: CheckCircle, badge: 18 },
      { name: "Reward Reviews", href: "/dashboard/rewards", icon: Trophy },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "Reports & Insights", href: "/dashboard/reports", icon: BarChart3 },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { name: "Email Campaigns", href: "/dashboard/email-campaigns", icon: Mail },
      { name: "CSV Data Export", href: "/dashboard/csv-export", icon: FileSpreadsheet },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Admin Logs", href: "/dashboard/admin-logs", icon: ShieldCheck },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function Sidebar({ isMobile = false, onCloseMobile }: { isMobile?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname()
  // collapsed state: user manually clicked toggle to close sidebar
  const [isToggledClosed, setIsToggledClosed] = useState(false)
  // hover state: temporarily expand when cursor enters if toggled closed
  const [isHovered, setIsHovered] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [openComplaints, setOpenComplaints] = useState(0)

  // Load user collapse preference from localStorage on mount (desktop only)
  useEffect(() => {
    if (!isMobile) {
      try {
        const saved = localStorage.getItem("sendme_sidebar_collapsed")
        if (saved !== null) {
          setIsToggledClosed(saved === "true")
        }
      } catch {}
    }
  }, [isMobile])

  // Effective visual state:
  // If on mobile: always expanded full width.
  // If desktop: expanded if NOT toggled closed OR if hovered.
  // When toggled closed and not hovered: collapsed to mini icon rail (w-[68px]).
  const isExpanded = isMobile || !isToggledClosed || isHovered

  const handleToggle = () => {
    setIsToggledClosed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("sendme_sidebar_collapsed", String(next))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.admin?.role === "super_admin") setIsAdmin(true)
      })
      .catch(() => {})

    fetch("/api/dashboard/complaints?status=open&limit=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.tabCounts) setOpenComplaints(data.tabCounts["open"] || 0)
      })
      .catch(() => {})
  }, [])

  const filteredSections = navSections.map((section) => {
    if (section.title === "SYSTEM") {
      return {
        ...section,
        items: isAdmin ? section.items : [],
      }
    }
    if (section.title === "RESOLUTION") {
      return {
        ...section,
        items: section.items.map((item) =>
          item.href === "/dashboard/disputes"
            ? { ...item, badge: openComplaints > 0 ? openComplaints : undefined }
            : item
        ),
      }
    }
    return section
  })

  return (
    <aside
      onMouseEnter={() => {
        if (!isMobile && isToggledClosed) setIsHovered(true)
      }}
      onMouseLeave={() => {
        if (!isMobile && isToggledClosed) setIsHovered(false)
      }}
      className={`relative bg-white border-r border-border-default flex flex-col shrink-0 transition-all duration-300 ease-in-out z-30 select-none ${
        isMobile
          ? "w-64 h-full"
          : isExpanded
          ? "w-64 shadow-lg lg:shadow-none"
          : "w-[68px]"
      } ${!isMobile ? "hidden lg:flex" : "flex"}`}
    >
      {/* ── Brand Header & Toggle ── */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-border-light shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden min-w-0 group"
          onClick={() => isMobile && onCloseMobile?.()}
        >
          <div className="w-9 h-9 bg-gradient-to-tr from-[#158A5E] to-[#1CA470] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#158A5E]/20 transition-transform group-hover:scale-105">
            <Send size={18} className="text-white transform -rotate-12" />
          </div>
          <div
            className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${
              isExpanded ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
            }`}
          >
            <span className="text-base font-extrabold text-neutral-900 tracking-tight block leading-none">
              Send<span className="text-[#158A5E]">Me</span>
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest block mt-0.5">
              Command
            </span>
          </div>
        </Link>

        {/* Toggle Button (Desktop only) */}
        {!isMobile && (
          <button
            type="button"
            onClick={handleToggle}
            className={`w-7 h-7 rounded-lg border border-border-default bg-surface-secondary text-text-muted hover:text-text-primary hover:bg-surface-hover flex items-center justify-center transition-all ${
              isExpanded ? "" : "mx-auto"
            }`}
            title={isToggledClosed ? "Pin Sidebar Open" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isToggledClosed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* ── Nav Links ── */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto overflow-x-hidden space-y-4">
        {filteredSections.map((section) => {
          if (section.items.length === 0) return null
          return (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              <div className="h-5 flex items-center px-2.5">
                {isExpanded ? (
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider transition-opacity duration-200">
                    {section.title}
                  </p>
                ) : (
                  <div className="w-full border-t border-neutral-100 my-auto" />
                )}
              </div>

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.name + item.href}
                      href={item.href}
                      onClick={() => isMobile && onCloseMobile?.()}
                      className={`relative flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all text-xs font-semibold group ${
                        active
                          ? "bg-[#158A5E]/10 text-[#158A5E]"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
                      }`}
                      title={!isExpanded ? item.name : undefined}
                    >
                      {/* Active Left Indicator Pill */}
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#158A5E] rounded-r-full" />
                      )}

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? "text-[#158A5E]"
                            : "text-neutral-500 group-hover:text-neutral-900"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Label & Badge: Only visible when isExpanded */}
                      {isExpanded && (
                        <div className="flex-1 flex items-center justify-between min-w-0 transition-all duration-200 overflow-hidden whitespace-nowrap">
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tooltip on Mini Rail Mode */}
                      {!isExpanded && (
                        <div className="fixed left-[72px] scale-0 group-hover:scale-100 transition-transform origin-left z-50 bg-neutral-900 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Footer Quick Actions ── */}
      <div className="border-t border-border-light p-2.5 space-y-1 shrink-0">
        <Link
          href="/dashboard/settings"
          onClick={() => isMobile && onCloseMobile?.()}
          className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 transition-all text-xs font-medium group ${
            pathname === "/dashboard/settings" ? "bg-[#158A5E]/10 text-[#158A5E] font-semibold" : ""
          }`}
          title={!isExpanded ? "Settings" : undefined}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-neutral-500 group-hover:text-neutral-900">
            <Settings size={18} />
          </div>
          <div
            className={`flex-1 flex items-center justify-between min-w-0 transition-all duration-200 overflow-hidden whitespace-nowrap ${
              isExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
            }`}
          >
            <span className="truncate">Settings & System</span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
