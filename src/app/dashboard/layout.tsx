"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login")
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  if (checking) {
    return (
      <div className="h-screen bg-surface-secondary flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-sendme" />
      </div>
    )
  }

  const fullHeightRoutes = ["/dashboard/orders", "/dashboard/live-tracker", "/dashboard/schedules", "/dashboard/return-load", "/dashboard/drivers", "/dashboard/organizations", "/dashboard/marketers", "/dashboard/vehicles", "/dashboard/wallets-payments", "/dashboard/bids-pricing", "/dashboard/disputes", "/dashboard/approvals", "/dashboard/notifications"]
  const isFullHeight = fullHeightRoutes.includes(pathname)

  return (
    <div className="h-screen flex overflow-hidden bg-surface-secondary">
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-60 bg-white border-r border-border-default flex flex-col animate-in slide-in-from-left duration-200">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className={`flex-1 overflow-hidden ${isFullHeight ? "" : "overflow-y-auto p-4 lg:p-6"}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
