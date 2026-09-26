"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { ScheduleDetail } from "@/components/dashboard/schedule-detail"
import { ScheduleForm } from "@/components/dashboard/forms"
import { FilterSelect, StateFilter } from "@/components/dashboard/filters"
import { PAGE_REFRESH_EVENT } from "@/hooks/use-page-refresh"
import {
  Calendar, Clock, AlertTriangle, ChevronDown,
  Search, Download, Plus, MoreHorizontal, ArrowUpDown, Filter,
  ChevronLeft, ChevronRight, CheckCircle, UserX, RefreshCw
} from "lucide-react"

const statIcons: Record<string, any> = {
  calendar: Calendar,
  check: CheckCircle,
  clock: Clock,
  userx: UserX,
  alert: AlertTriangle,
}

interface ScheduleRow {
  id: string
  fullId: string
  scheduledDate: string | null
  date: string
  window: string
  windowNote: string
  windowColor: string
  from: string
  to: string
  fromAddr: string
  customer: string
  customerType: string
  driver: string | null
  driverRating: string | null
  vehicle: string
  vehiclePlate: string | null
  driverAvatar: string | null
  status: string
  statusColor: string
}

function inBucket(dateStr: string | null, bucket: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + "T12:00:00")
  const now = new Date()
  if (bucket === "Today") return d.toDateString() === now.toDateString()
  if (bucket === "Tomorrow") {
    const t = new Date(now)
    t.setDate(t.getDate() + 1)
    return d.toDateString() === t.toDateString()
  }
  if (bucket === "This Week") {
    const start = new Date(now)
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return d >= start && d <= end
  }
  return true // All Schedules + Custom Range
}

export default function SchedulesPage() {
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All Schedules")
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [stats, setStats] = useState<{ label: string; value: number; icon: string }[]>([])
  const [statusTabs, setStatusTabs] = useState<{ name: string; count: number }[]>([])
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")

  const pageSize = 8

  const fetchSchedules = useCallback((overrides?: {
    state?: string
    search?: string
    vehicle?: string
    status?: string
    date?: string
  }) => {
    setLoading(true)
    const effectiveState = overrides?.state !== undefined ? overrides.state : stateFilter
    const effectiveSearch = overrides?.search !== undefined ? overrides.search : searchQuery
    const effectiveVehicle = overrides?.vehicle !== undefined ? overrides.vehicle : vehicleFilter
    const effectiveStatus = overrides?.status !== undefined ? overrides.status : statusFilter
    const effectiveDate = overrides?.date !== undefined ? overrides.date : dateFilter

    const params = new URLSearchParams()
    if (effectiveState) params.set("state", effectiveState)
    if (effectiveSearch) params.set("search", effectiveSearch)
    if (effectiveVehicle) params.set("vehicle_type", effectiveVehicle)
    if (effectiveStatus) params.set("status", effectiveStatus)
    if (effectiveDate) params.set("date", effectiveDate)

    fetch(`/api/dashboard/schedules?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSchedules(data.schedules || [])
        setStats(data.stats || [])
        setStatusTabs(data.statusTabs || [])
        setError(null)
        setLoading(false)
        if ((data.schedules || []).length > 0) setSelectedSchedule(data.schedules[0].id)
      })
      .catch(() => {
        setError("Failed to load schedules")
        setLoading(false)
      })
  }, [stateFilter, searchQuery, vehicleFilter, statusFilter, dateFilter])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    const onRefresh = () => fetchSchedules()
    window.addEventListener(PAGE_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(PAGE_REFRESH_EVENT, onRefresh)
  }, [fetchSchedules])

  const handleStateChange = (v: string) => {
    setStateFilter(v)
    setPage(1)
    fetchSchedules({ state: v })
  }

  const handleDateChange = (v: string) => {
    setDateFilter(v)
    setPage(1)
    fetchSchedules({ date: v })
  }

  const handleStatusChange = (v: string) => {
    setStatusFilter(v)
    setPage(1)
    fetchSchedules({ status: v })
  }

  const handleVehicleChange = (v: string) => {
    setVehicleFilter(v)
    setPage(1)
    fetchSchedules({ vehicle: v })
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    setPage(1)
    fetchSchedules({ search: q })
  }

  const handleExport = () => {
    if (!filtered.length) {
      alert("No schedules found to export.")
      return
    }
    const headers = ["Schedule ID", "Order ID", "Date", "Window", "Status", "Customer", "Driver", "Vehicle", "From", "To"]
    const rows = filtered.map((s) => [
      s.id,
      s.fullId,
      s.date,
      `"${s.window}"`,
      s.status,
      `"${s.customer.replace(/"/g, '""')}"`,
      `"${(s.driver || "Unassigned").replace(/"/g, '""')}"`,
      `"${s.vehicle.replace(/"/g, '""')}"`,
      `"${(s.fromAddr || s.from).replace(/"/g, '""')}"`,
      `"${s.to.replace(/"/g, '""')}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `schedules-${stateFilter || "all"}-${dateFilter || "all"}-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const tabCount = (name: string) => statusTabs.find((t) => t.name === name)?.count ?? 0

  const filtered = schedules.filter((s) => {
    if (!inBucket(s.scheduledDate, activeTab)) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Schedules</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage and monitor all scheduled deliveries and upcoming pickups.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSchedules()}
                className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-hover transition-colors shadow-sm"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-sendme" : ""} /> Refresh
              </button>
              <button
                onClick={() => setIsScheduleFormOpen(true)}
                className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors shadow-sm"
              >
                <Plus size={16} /> Create Schedule
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect
              value={dateFilter}
              onChange={handleDateChange}
              placeholder="All Dates"
              options={[
                { value: "today", label: "Today" },
                { value: "tomorrow", label: "Tomorrow" },
                { value: "this_week", label: "This Week" },
                { value: "next_week", label: "Next Week" },
                { value: "this_month", label: "This Month" },
              ]}
            />
            <StateFilter value={stateFilter} onChange={handleStateChange} />
            <FilterSelect
              value={statusFilter}
              onChange={handleStatusChange}
              placeholder="All Statuses"
              options={[
                { value: "confirmed", label: "Confirmed" },
                { value: "pending", label: "Confirmation Pending" },
                { value: "unassigned", label: "Unassigned" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled / At Risk" },
              ]}
            />
            <FilterSelect
              value={vehicleFilter}
              onChange={handleVehicleChange}
              placeholder="All Vehicles"
              options={[
                { value: "bicycle", label: "Bicycle" },
                { value: "motorcycle", label: "Motorcycle" },
                { value: "car", label: "Car" },
                { value: "van", label: "Van" },
                { value: "truck", label: "Truck" },
              ]}
            />
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 shadow-sm">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by ID, customer, driver, address..."
                className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors shadow-sm"
            >
              <Download size={14} className="text-text-muted" /> Export
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat) => {
              const Icon = statIcons[stat.icon] || Calendar
              return (
                <Card key={stat.label} className="p-4 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted truncate">{stat.label}</p>
                    <div className="p-1.5 rounded-lg bg-sendme-50 text-sendme shrink-0"><Icon size={16} /></div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5 truncate" title={String(stat.value)}>{formatCardValue(stat.value)}</p>
                  <p className="text-[10px] font-medium text-text-muted truncate">from live database</p>
                </Card>
              )
            })}
          </div>

          <div className="flex items-center gap-0 border-b border-border-light overflow-x-auto">
            {statusTabs.map((tab) => (
              <button key={tab.name} onClick={() => { setActiveTab(tab.name); setPage(1) }} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.name ? "border-sendme text-sendme" : "border-transparent text-text-muted hover:text-text-primary"}`}>
                {tab.name}
                {tab.count > 0 && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab === tab.name ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"}`}>{tab.count}</span>}
              </button>
            ))}
          </div>

          {(stateFilter || dateFilter || statusFilter || vehicleFilter || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
              <span className="font-semibold text-text-primary">Active filters:</span>
              {stateFilter && <span className="bg-sendme-50 text-sendme px-2 py-0.5 rounded-full font-medium text-[11px]">State: {stateFilter}</span>}
              {dateFilter && <span className="bg-sendme-50 text-sendme px-2 py-0.5 rounded-full font-medium text-[11px]">Date: {dateFilter}</span>}
              {statusFilter && <span className="bg-sendme-50 text-sendme px-2 py-0.5 rounded-full font-medium text-[11px]">Status: {statusFilter}</span>}
              {vehicleFilter && <span className="bg-sendme-50 text-sendme px-2 py-0.5 rounded-full font-medium text-[11px]">Vehicle: {vehicleFilter}</span>}
              {searchQuery && <span className="bg-sendme-50 text-sendme px-2 py-0.5 rounded-full font-medium text-[11px]">Search: "{searchQuery}"</span>}
              <button
                onClick={() => {
                  setStateFilter("")
                  setDateFilter("")
                  setStatusFilter("")
                  setVehicleFilter("")
                  setSearchQuery("")
                  fetchSchedules({ state: "", search: "", vehicle: "", status: "", date: "" })
                }}
                className="text-danger hover:underline font-semibold text-[11px] ml-1"
              >
                Reset all
              </button>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Schedule ID <ArrowUpDown size={10} className="inline ml-1" /></th>
                    <th className="px-4 py-3 font-semibold">Pickup Window</th>
                    <th className="px-4 py-3 font-semibold">Route</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Driver</th>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="w-6 h-6 border-2 border-sendme border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-text-muted mt-2">Loading schedules...</p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <p className="text-xs text-danger">{error}</p>
                        <p className="text-[10px] text-text-muted mt-1">Try again later or check the API.</p>
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <p className="text-xs text-text-muted">No schedules found{activeTab !== "All Schedules" ? ` under "${activeTab}"` : ""}.</p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((s) => (
                      <tr key={s.id} onClick={() => setSelectedSchedule(s.id)} className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${selectedSchedule === s.id ? "bg-sendme-50/30" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary">{s.id}</p>
                          <p className="text-[10px] text-text-muted">{s.date}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{s.window}</p>
                          <p className={`text-[10px] font-medium ${s.windowColor}`}>{s.windowNote}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{s.from} → {s.to}</p>
                          <p className="text-[10px] text-text-muted truncate max-w-[140px]">{s.fromAddr}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{s.customer}</p>
                          <p className="text-[10px] text-text-muted">{s.customerType}</p>
                        </td>
                        <td className="px-4 py-3">
                          {s.driver ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold shrink-0">{s.driverAvatar}</div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">{s.driver}</p>
                                {s.driverRating && <p className="text-[10px] text-text-muted flex items-center gap-1"><span className="text-warning text-[8px]">★</span> {s.driverRating}</p>}
                              </div>
                            </div>
                          ) : <p className="text-[10px] text-text-muted italic">—</p>}
                        </td>
                        <td className="px-4 py-3">
                          {s.vehiclePlate ? (
                            <div>
                              <p className="text-xs font-medium text-text-primary">{s.vehicle}</p>
                              <p className="text-[10px] text-text-muted">{s.vehiclePlate}</p>
                            </div>
                          ) : <p className="text-[10px] text-text-muted italic">{s.vehicle}</p>}
                        </td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.statusColor}`}>{s.status}</span></td>
                        <td className="px-4 py-3 text-right"><button className="p-1 text-text-muted hover:text-text-primary transition-colors"><MoreHorizontal size={16} /></button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
              <p className="text-xs text-text-muted">
                {loading ? "Loading..." : filtered.length === 0 ? "No schedules" : `Showing ${(safePage - 1) * pageSize + 1} to ${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} schedules`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === safePage ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"}`}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {selectedSchedule && (
        <ScheduleDetail
          scheduleId={selectedSchedule}
          schedule={schedules.find((s) => s.id === selectedSchedule) || null}
          onClose={() => setSelectedSchedule(null)}
        />
      )}

      {/* Schedule Form Modal */}
      <ScheduleForm isOpen={isScheduleFormOpen} onClose={() => setIsScheduleFormOpen(false)} />
    </div>
  )
}