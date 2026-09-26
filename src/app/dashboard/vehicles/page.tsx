"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { VehicleDetail } from "@/components/dashboard/vehicle-detail"
import { VehicleForm } from "@/components/dashboard/forms"
import { FilterSelect, StateFilter, VehicleFilter } from "@/components/dashboard/filters"
import {
  Car, CheckCircle, Clock, AlertTriangle, Ban,
  Search, Download, Plus, ArrowUpDown, Filter, RotateCcw,
  ChevronLeft, ChevronRight, Loader2, Bike, Truck
} from "lucide-react"

interface VehicleRow {
  id: string
  driverId: string
  plate: string
  vin: string
  type: string
  model: string
  driver: string
  driverPhone: string
  driverAvatar: string
  status: string
  verified: boolean
  statusColor: string
  statusNote: string
  city: string
  area: string
  docs: number
  added: string
}

export default function VehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("All Vehicles")
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, underReview: 0, blacklisted: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const fetchData = (page: number, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)
    if (vehicleTypeFilter) params.set("type", vehicleTypeFilter)
    if (stateFilter) params.set("state", stateFilter)
    
    const effectiveStatus = activeTab !== "All Vehicles" ? activeTab : statusFilter
    if (effectiveStatus && effectiveStatus !== "All") params.set("status", effectiveStatus)

    fetch(`/api/dashboard/vehicles?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setVehicles(data.vehicles || [])
        setStats(data.stats || { total: 0, active: 0, inactive: 0, underReview: 0, blacklisted: 0 })
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(1, searchQuery)
  }, [activeTab, vehicleTypeFilter, stateFilter, statusFilter])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setVehicleTypeFilter("")
    setStateFilter("")
    setStatusFilter("")
    setActiveTab("All Vehicles")
  }

  const hasActiveFilters = Boolean(
    searchQuery || vehicleTypeFilter || stateFilter || statusFilter || activeTab !== "All Vehicles"
  )

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery)
  }

  const statusTabs = [
    { name: "All Vehicles", count: stats.total },
    { name: "Active", count: stats.active },
    { name: "Inactive", count: stats.inactive },
    { name: "Under Review", count: stats.underReview },
    { name: "Blacklisted", count: stats.blacklisted },
  ]

  const statCards = [
    { label: "Total Fleet", value: stats.total, icon: Car, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Active", value: stats.active, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Inactive", value: stats.inactive, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
    { label: "Under Review", value: stats.underReview, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
    { label: "Blacklisted", value: stats.blacklisted, icon: Ban, color: "text-text-muted", bg: "bg-surface-secondary" },
  ]

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Vehicles & Fleet</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage registered motorbikes, cars, vans, and commercial trucks across SendMe.</p>
            </div>
            <button
              onClick={() => setIsVehicleFormOpen(true)}
              className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"
            >
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted truncate">{stat.label}</p>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5 truncate" title={String(stat.value)}>
                    {formatCardValue(stat.value)}
                  </p>
                </Card>
              )
            })}
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-border-default rounded-xl p-3 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
                <Search size={14} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Search by plate number, driver, model or VIN..."
                  className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => handleSearch("")} className="text-xs text-text-muted hover:text-text-primary">✕</button>
                )}
              </div>

              {/* State Filter */}
              <StateFilter value={stateFilter} onChange={setStateFilter} />

              {/* Vehicle Type Filter */}
              <VehicleFilter value={vehicleTypeFilter} onChange={setVehicleTypeFilter} />

              {/* Status Filter */}
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Under Review", label: "Under Review" },
                  { value: "Blacklisted", label: "Blacklisted" },
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
                  const csv = "data:text/csv;charset=utf-8," + ["Plate,Type,Model,Driver,Phone,State,Status,Added", ...vehicles.map(v => `"${v.plate}","${v.type}","${v.model}","${v.driver}","${v.driverPhone}","${v.city}","${v.status}","${v.added}"`)].join("\n")
                  const uri = encodeURI(csv)
                  const link = document.createElement("a")
                  link.setAttribute("href", uri)
                  link.setAttribute("download", `sendme-vehicles-${new Date().toISOString().slice(0, 10)}.csv`)
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
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.name
                    ? "border-sendme text-sendme"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.name}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.name ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                }`}>
                  {tab.count.toLocaleString()}
                </span>
              </button>
            ))}
          </div>

          {/* Vehicles Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                  <p className="text-sm font-medium">No vehicles found matching your filter criteria</p>
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
                      <th className="px-4 py-3 font-semibold">Vehicle & Plate <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Type & Model</th>
                      <th className="px-4 py-3 font-semibold">Assigned Driver</th>
                      <th className="px-4 py-3 font-semibold">State / Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Added</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVehicle(v.id)}
                        className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                          selectedVehicle === v.id ? "bg-sendme-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sendme-50 text-sendme flex items-center justify-center shrink-0">
                              {v.type.toLowerCase().includes("bike") ? <Bike size={18} /> : v.type.toLowerCase().includes("truck") ? <Truck size={18} /> : <Car size={18} />}
                            </div>
                            <div>
                              <p className="font-mono font-bold text-xs text-text-primary leading-tight">{v.plate}</p>
                              <p className="text-[10px] text-text-muted font-mono truncate max-w-[120px]">{v.vin}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary">{v.type}</p>
                          <p className="text-[10px] text-text-muted">{v.model}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{v.driver}</p>
                          <p className="text-[10px] text-text-muted font-mono">{v.driverPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-primary">{v.city}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.statusColor}`}>
                            {v.status}
                          </span>
                          <p className="text-[10px] text-text-muted mt-0.5">{v.statusNote}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{v.added}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVehicle(v.id)
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
            {!loading && vehicles.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-light text-xs text-text-muted">
                <p>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total.toLocaleString()} total)</p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="p-1 rounded hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
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

      {/* Vehicle Detail Drawer */}
      {selectedVehicle && (
        <VehicleDetail
          vehicleId={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}

      {/* Vehicle Form Modal */}
      {isVehicleFormOpen && (
        <VehicleForm
          isOpen={isVehicleFormOpen}
          onClose={() => {
            setIsVehicleFormOpen(false)
            fetchData(1, "")
          }}
        />
      )}
    </div>
  )
}
