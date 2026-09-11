"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { ReturnLoadDetail } from "@/components/dashboard/return-load-detail"
import {
  ArrowLeftRight, Package, CheckCircle, AlertTriangle,
  ChevronDown, Search, Download, Plus, MoreHorizontal, ArrowUpDown,
  Filter, ChevronLeft, ChevronRight
} from "lucide-react"

const statIcons: Record<string, any> = {
  routes: ArrowLeftRight,
  package: Package,
  check: CheckCircle,
  done: CheckCircle,
  alert: AlertTriangle,
}

interface RouteRow {
  id: string
  fullId: string
  created: string
  iconBg: string
  iconLetter: string
  from: string
  fromState: string
  to: string
  toState: string
  vehicle: string
  capacity: string
  status: string
  statusNote: string
  statusColor: string
  matchScore: string | null
  driver: string | null
  driverPlate: string | null
  driverAvatar: string | null
  returnDate: string | null
}

export default function ReturnLoadPage() {
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All Routes")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [stats, setStats] = useState<{ label: string; value: number; icon: string }[]>([])
  const [statusTabs, setStatusTabs] = useState<{ name: string; count: number }[]>([])
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const pageSize = 8

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/dashboard/return-load")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setRoutes(data.routes || [])
        setStats(data.stats || [])
        setStatusTabs(data.statusTabs || [])
        setError(null)
        setLoading(false)
        if ((data.routes || []).length > 0) setSelectedLoad(data.routes[0].id)
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load return routes")
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tabKey = (name: string) => {
    if (name === "Available Loads") return "Available"
    if (name === "Matched") return "Matched"
    if (name === "Completed") return "Completed"
    return null
  }

  const activeStatus = tabKey(activeTab)

  const filtered = routes.filter((r) => {
    if (activeStatus && r.status !== activeStatus) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.id.toLowerCase().includes(q) ||
      r.from.toLowerCase().includes(q) ||
      r.to.toLowerCase().includes(q) ||
      (r.driver || "").toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Return Load</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage return routes and match available loads with drivers.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary">
                <span className="w-2 h-2 rounded-full bg-sendme" /> All Locations <ChevronDown size={14} className="text-text-muted" />
              </div>
              <button className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors">
                <Plus size={16} /> Create Return Route
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat) => {
              const Icon = statIcons[stat.icon] || Package
              return (
                <Card key={stat.label} className="p-4 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted truncate">{stat.label}</p>
                    <div className="p-1.5 rounded-lg bg-sendme-50 text-sendme shrink-0">
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5 truncate" title={String(stat.value)}>{formatCardValue(stat.value)}</p>
                  <p className="text-[10px] font-medium text-text-muted truncate">from live database</p>
                </Card>
              )
            })}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Search by route, location, driver or load ID..."
                className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
              />
            </div>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Status <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Vehicle Types <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Route Types <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Filter size={14} className="text-text-muted" /> Filters
            </button>
          </div>

          <div className="flex items-center gap-0 border-b border-border-light overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); setPage(1) }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.name
                    ? "border-sendme text-sendme"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.name ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Route & Load <ArrowUpDown size={10} className="inline ml-1" /></th>
                    <th className="px-4 py-3 font-semibold">Route Details</th>
                    <th className="px-4 py-3 font-semibold">Vehicle / Capacity</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Match Score</th>
                    <th className="px-4 py-3 font-semibold">Driver / Organization</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <div className="w-6 h-6 border-2 border-sendme border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-text-muted mt-2">Loading return routes...</p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <p className="text-xs text-danger">{error}</p>
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <p className="text-xs text-text-muted">No return routes found{activeTab !== "All Routes" ? ` under "${activeTab}"` : ""}.</p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedLoad(r.id)}
                        className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                          selectedLoad === r.id ? "bg-sendme-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${r.iconBg} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                              {r.iconLetter}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-primary">{r.id}</p>
                              <p className="text-[10px] text-text-muted">{r.created}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{r.from} → {r.to}</p>
                          <p className="text-[10px] text-text-muted">{r.fromState}</p>
                          <p className="text-[10px] text-text-muted">{r.toState}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{r.vehicle}</p>
                          <p className="text-[10px] text-text-muted">{r.capacity}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.statusColor}`}>{r.status}</span>
                          <p className="text-[10px] text-text-muted mt-0.5">{r.statusNote}</p>
                        </td>
                        <td className="px-4 py-3">
                          {r.matchScore ? (
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    parseInt(r.matchScore) >= 80 ? "bg-sendme" : parseInt(r.matchScore) >= 60 ? "bg-warning" : "bg-danger"
                                  }`}
                                  style={{ width: `${r.matchScore}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-text-primary">{r.matchScore}%</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.driver ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold shrink-0">
                                {r.driverAvatar}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">{r.driver}</p>
                                <p className="text-[10px] text-text-muted">{r.driverPlate}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
              <p className="text-xs text-text-muted">
                {loading ? "Loading..." : filtered.length === 0 ? "No routes" : `Showing ${(safePage - 1) * pageSize + 1} to ${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} routes`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === safePage ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"}`}
                  >
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {selectedLoad && (
        <ReturnLoadDetail
          loadId={selectedLoad}
          load={routes.find((r) => r.id === selectedLoad) || null}
          onClose={() => setSelectedLoad(null)}
        />
      )}
    </div>
  )
}