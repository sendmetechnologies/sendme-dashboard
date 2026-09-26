"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { ReturnLoadDetail } from "@/components/dashboard/return-load-detail"
import { FilterSelect, StateFilter, VehicleFilter, NIGERIAN_STATES } from "@/components/dashboard/filters"
import {
  ArrowLeftRight, Package, CheckCircle, AlertTriangle,
  ChevronDown, Search, Download, Plus, ArrowUpDown,
  Filter, RotateCcw, ChevronLeft, ChevronRight, Loader2
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
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [originState, setOriginState] = useState("")
  const [destState, setDestState] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const pageSize = 10

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (originState) params.set("state", originState)
    if (destState) params.set("destination_state", destState)
    if (vehicleFilter) params.set("vehicle_type", vehicleFilter)
    if (statusFilter) params.set("status", statusFilter)

    fetch(`/api/dashboard/return-load?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRoutes(data.routes || [])
        setStats(data.stats || [])
        setStatusTabs(data.statusTabs || [])
        setError(null)
        setLoading(false)
        if ((data.routes || []).length > 0 && !selectedLoad) {
          setSelectedLoad(data.routes[0].id)
        }
      })
      .catch(() => {
        setError("Failed to load return routes")
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [originState, destState, vehicleFilter, statusFilter])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    setPage(1)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setOriginState("")
    setDestState("")
    setVehicleFilter("")
    setStatusFilter("")
    setActiveTab("All Routes")
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    searchQuery || originState || destState || vehicleFilter || statusFilter || activeTab !== "All Routes"
  )

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Return Load</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage return routes, inter-city legs, and match available loads with drivers.</p>
            </div>
            <button className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors">
              <Plus size={16} /> Create Return Route
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.map((stat) => {
              const Icon = statIcons[stat.icon] || Package
              return (
                <Card key={stat.label} className="p-3.5 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[11px] text-text-muted truncate">{stat.label}</p>
                    <div className="p-1 rounded-lg bg-sendme-50 text-sendme shrink-0">
                      <Icon size={14} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-text-primary mb-0.5 truncate" title={String(stat.value)}>{formatCardValue(stat.value)}</p>
                </Card>
              )
            })}
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-border-default rounded-xl p-3 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
                <Search size={14} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search route, city, driver or load ID..."
                  className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button onClick={() => handleSearch("")} className="text-xs text-text-muted hover:text-text-primary">✕</button>
                )}
              </div>

              {/* Origin State Filter */}
              <FilterSelect
                value={originState}
                onChange={(v) => { setOriginState(v); setPage(1) }}
                placeholder="Origin: All States"
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: `From: ${s === 'FCT' ? 'FCT - Abuja' : s}` }))}
              />

              {/* Destination State Filter */}
              <FilterSelect
                value={destState}
                onChange={(v) => { setDestState(v); setPage(1) }}
                placeholder="Dest: All States"
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: `To: ${s === 'FCT' ? 'FCT - Abuja' : s}` }))}
              />

              {/* Vehicle Filter */}
              <VehicleFilter value={vehicleFilter} onChange={(v) => { setVehicleFilter(v); setPage(1) }} />

              {/* Status Filter */}
              <FilterSelect
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1) }}
                placeholder="All Status"
                options={[
                  { value: "Available", label: "Available" },
                  { value: "Matched", label: "Matched" },
                  { value: "Completed", label: "Completed" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border-light">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-danger font-medium hover:underline px-2 py-1.5"
                  >
                    <RotateCcw size={12} /> Reset Filters
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  const csv = "data:text/csv;charset=utf-8," + ["ID,From,To,Vehicle,Capacity,Driver,Plate,Status,Created", ...filtered.map(r => `"${r.id}","${r.from}","${r.to}","${r.vehicle}","${r.capacity}","${r.driver || ''}","${r.driverPlate || ''}","${r.status}","${r.created}"`)].join("\n")
                  const uri = encodeURI(csv)
                  const link = document.createElement("a")
                  link.setAttribute("href", uri)
                  link.setAttribute("download", `sendme-return-load-${new Date().toISOString().slice(0, 10)}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  link.remove()
                }}
                className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Download size={13} className="text-text-muted" /> Export CSV
              </button>
            </div>
          </div>

          {/* Status Tabs */}
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

          {/* Routes Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : paged.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                  <p className="text-sm font-medium">No return routes found matching your filter criteria</p>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="mt-2 text-xs text-sendme underline font-semibold">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                      <th className="px-4 py-3 font-semibold">Route & Load <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Route Details</th>
                      <th className="px-4 py-3 font-semibold">Vehicle / Capacity</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Match Score</th>
                      <th className="px-4 py-3 font-semibold">Driver / Fleet</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {paged.map((route) => (
                      <tr
                        key={route.id}
                        onClick={() => setSelectedLoad(route.id)}
                        className={`hover:bg-surface-hover cursor-pointer transition-colors ${
                          selectedLoad === route.id ? "bg-sendme-50/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${route.iconBg} text-white font-bold flex items-center justify-center text-xs shrink-0`}>
                              {route.iconLetter}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-text-primary leading-tight">{route.id}</p>
                              <p className="text-[10px] text-text-muted">{route.created}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary">{route.from} → {route.to}</p>
                          <p className="text-[10px] text-text-muted truncate max-w-[200px]">{route.fromState} to {route.toState}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{route.vehicle}</p>
                          <p className="text-[10px] text-text-muted font-mono">{route.capacity}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${route.statusColor}`}>
                            {route.status}
                          </span>
                          <p className="text-[10px] text-text-muted mt-0.5">{route.statusNote}</p>
                        </td>
                        <td className="px-4 py-3">
                          {route.matchScore ? (
                            <span className="text-xs font-bold text-sendme">{route.matchScore}% Match</span>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {route.driver ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-[10px] shrink-0">
                                {route.driverAvatar}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-text-primary leading-tight">{route.driver}</p>
                                <p className="text-[10px] text-text-muted font-mono">{route.driverPlate || '—'}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLoad(route.id)
                            }}
                            className="text-xs font-semibold text-sendme hover:underline"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-light text-xs text-text-muted">
                <p>Showing page {safePage} of {totalPages} ({filtered.length} total routes)</p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Return Load Detail Drawer */}
      {selectedLoad && (
        <ReturnLoadDetail
          loadId={selectedLoad}
          onClose={() => setSelectedLoad(null)}
        />
      )}
    </div>
  )
}