"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { DriverDetail } from "@/components/dashboard/driver-detail"
import { DriverForm } from "@/components/dashboard/forms"
import {
  FilterSelect, StateFilter, VehicleFilter, RadiusFilter, LocationHubFilter
} from "@/components/dashboard/filters"
import { OtpUnlockModal } from "@/components/ui/otp-unlock-modal"
import { useKycUnlock } from "@/hooks/use-kyc-unlock"
import { usePageRefresh } from "@/hooks/use-page-refresh"
import {
  Users, CheckCircle, Clock, AlertTriangle, Ban, Wifi, ChevronDown,
  Search, Download, Plus, ArrowUpDown, Filter, RotateCcw,
  ChevronLeft, ChevronRight, Star, Loader2, DollarSign, MapPin, Navigation
} from "lucide-react"

interface DriverRow {
  id: string
  name: string
  phone: string
  email: string
  avatar: string
  type: string
  typeColor: string
  vehicle: string
  vehiclePlate: string
  city: string
  latitude: number | null
  longitude: number | null
  distanceKm?: number | null
  distanceLabel?: string | null
  locationLabel: string | null
  status: string
  statusColor: string
  online: boolean
  rating: string
  trips: number
  joined: string
  joinedNote: string
}

export default function DriversPage() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All Drivers")
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, suspended: 0, blocked: 0, onlineNow: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [onlineFilter, setOnlineFilter] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [hubCoords, setHubCoords] = useState("")
  const [radiusFilter, setRadiusFilter] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  
  const kyc = useKycUnlock()

  const fetchData = (page: number, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    if (stateFilter) params.set("state", stateFilter)
    if (vehicleFilter) params.set("vehicle_type", vehicleFilter)
    if (ratingFilter) params.set("rating_min", ratingFilter)
    if (onlineFilter) params.set("online", onlineFilter)
    if (activeTab && activeTab !== "All Drivers") params.set("tab", activeTab)

    if (hubCoords && radiusFilter) {
      const [lat, lng] = hubCoords.split(",")
      if (lat && lng) {
        params.set("lat", lat.trim())
        params.set("lng", lng.trim())
        params.set("radius", radiusFilter)
      }
    }

    fetch(`/api/dashboard/drivers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setDrivers(data.drivers || [])
        setStats(data.stats || { total: 0, approved: 0, pending: 0, suspended: 0, blocked: 0, onlineNow: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
        setTabCounts(data.tabCounts || {})
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(1, searchQuery)
  }, [statusFilter, stateFilter, onlineFilter, vehicleFilter, hubCoords, radiusFilter, ratingFilter, activeTab])

  usePageRefresh(() => fetchData(pagination.page, searchQuery))

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setStateFilter("")
    setOnlineFilter("")
    setVehicleFilter("")
    setHubCoords("")
    setRadiusFilter("")
    setRatingFilter("")
    setActiveTab("All Drivers")
  }

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || stateFilter || onlineFilter || vehicleFilter || hubCoords || radiusFilter || ratingFilter || activeTab !== "All Drivers"
  )

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery)
  }

  const statCards = [
    { label: "Total Drivers", value: stats.total, icon: Users, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
    { label: "Suspended", value: stats.suspended, icon: AlertTriangle, color: "text-warning", bg: "bg-warning-light" },
    { label: "Rejected", value: stats.blocked, icon: Ban, color: "text-danger", bg: "bg-danger-light" },
    { label: "Online Now", value: stats.onlineNow, icon: Wifi, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Total Balance", value: stats.totalBalanceFormatted, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
  ]

  const statusTabNames = [
    "All Drivers",
    "Online Now",
    "Approved",
    "Pending Review",
    "Suspended",
    "Independent",
    "Organization-linked",
  ]

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Drivers & Riders</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage, track, and verify riders with precision location & radius filtering.</p>
            </div>
            <button 
              onClick={() => setIsDriverFormOpen(true)}
              className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"
            >
              <Plus size={16} /> Add Driver
            </button>
          </div>

          {/* Comprehensive Filters Bar */}
          <div className="space-y-2.5 bg-white border border-border-default rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
                <Search size={14} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Search rider name, phone, plate, ID..."
                  className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => handleSearch("")} className="text-xs text-text-muted hover:text-text-primary">✕</button>
                )}
              </div>

              {/* State Filter */}
              <StateFilter value={stateFilter} onChange={(v) => { setStateFilter(v); setHubCoords("") }} />

              {/* Reference Hub / Area */}
              <LocationHubFilter
                value={hubCoords}
                onChange={(v) => setHubCoords(v)}
                stateFilter={stateFilter}
              />

              {/* Radius Filter */}
              <RadiusFilter
                value={radiusFilter}
                onChange={(v) => setRadiusFilter(v)}
                disabled={!hubCoords}
              />

              {/* Online / Offline Filter */}
              <FilterSelect
                value={onlineFilter}
                onChange={(v) => setOnlineFilter(v)}
                placeholder="Live Status: All"
                options={[
                  { value: "online", label: "Online Now (Live)" },
                  { value: "offline", label: "Offline" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border-light">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Vehicle Filter */}
                <VehicleFilter value={vehicleFilter} onChange={(v) => setVehicleFilter(v)} />

                {/* Status Filter */}
                <FilterSelect
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v)}
                  placeholder="All Status"
                  options={[
                    { value: "Approved", label: "Approved" },
                    { value: "Pending Review", label: "Pending Review" },
                    { value: "Rejected", label: "Rejected" },
                    { value: "Suspended", label: "Suspended" },
                    { value: "Deactivated", label: "Deactivated" },
                  ]}
                />

                {/* Rating Filter */}
                <FilterSelect
                  value={ratingFilter}
                  onChange={(v) => setRatingFilter(v)}
                  placeholder="Rating: Any"
                  options={[
                    { value: "4.5", label: "★ 4.5 & Above" },
                    { value: "4.0", label: "★ 4.0 & Above" },
                    { value: "3.0", label: "★ 3.0 & Above" },
                  ]}
                />

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-danger font-medium hover:underline px-2 py-1.5"
                  >
                    <RotateCcw size={12} /> Reset Filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {radiusFilter && hubCoords && (
                  <div className="flex items-center gap-1.5 bg-sendme-50 text-sendme border border-sendme/20 text-xs px-2.5 py-1 rounded-full font-medium">
                    <Navigation size={12} />
                    <span>Filtering within {radiusFilter} km of selected hub</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    const csv = "data:text/csv;charset=utf-8," + ["Name,Phone,Type,Vehicle,Plate,State,Status,Online,Rating,Trips", ...drivers.map(d => `"${d.name}","${d.phone}","${d.type}","${d.vehicle}","${d.vehiclePlate}","${d.city}","${d.status}","${d.online ? 'Online' : 'Offline'}","${d.rating}","${d.trips}"`)].join("\n")
                    const uri = encodeURI(csv)
                    const link = document.createElement("a")
                    link.setAttribute("href", uri)
                    link.setAttribute("download", `sendme-riders-${new Date().toISOString().slice(0, 10)}.csv`)
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
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-3.5 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[11px] text-text-muted truncate">{stat.label}</p>
                    <div className={`p-1 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                      <Icon size={14} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-text-primary truncate" title={String(stat.value)}>{formatCardValue(stat.value)}</p>
                </Card>
              )
            })}
          </div>

          {/* Child Filter Tabs */}
          <div className="flex items-center justify-between border-b border-border-light overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 min-w-max">
              {statusTabNames.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-sendme text-sendme font-semibold"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                    activeTab === tab ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {(tabCounts[tab] ?? 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Drivers Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : drivers.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                  <p className="text-sm font-medium">No drivers found matching your filter criteria</p>
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
                      <th className="px-4 py-3 font-semibold">Driver <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Live Telemetry</th>
                      <th className="px-4 py-3 font-semibold">Vehicle</th>
                      <th className="px-4 py-3 font-semibold">State / Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Rating</th>
                      <th className="px-4 py-3 font-semibold">Trips</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {drivers.map((driver) => (
                      <tr
                        key={driver.id}
                        onClick={() => setSelectedDriver(driver.id)}
                        className={`hover:bg-surface-hover cursor-pointer transition-colors ${
                          selectedDriver === driver.id ? "bg-sendme-50/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-xs">
                                {driver.avatar}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  driver.online ? "bg-sendme" : "bg-text-muted"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-xs text-text-primary leading-tight">{driver.name}</p>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${driver.typeColor}`}>
                                  {driver.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted font-mono">{driver.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              driver.online ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${driver.online ? "bg-sendme animate-ping" : "bg-text-muted"}`} />
                              {driver.online ? "Online Now" : "Offline"}
                            </span>
                            {driver.distanceLabel && (
                              <p className="text-[10px] font-semibold text-sendme flex items-center gap-1">
                                <Navigation size={9} /> {driver.distanceLabel}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{driver.vehicle}</p>
                          <p className="text-[10px] text-text-muted font-mono">{driver.vehiclePlate}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-primary flex items-center gap-1">
                            <MapPin size={11} className="text-text-muted shrink-0" />
                            {driver.city}
                          </p>
                          {driver.locationLabel && (
                            <p className="text-[10px] text-text-muted truncate max-w-[140px]">{driver.locationLabel}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${driver.statusColor}`}>
                            {driver.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs font-semibold text-text-primary">
                            <Star size={12} className="text-warning fill-warning" />
                            {driver.rating}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-text-primary">{driver.trips}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-primary">{driver.joined}</p>
                          <p className="text-[10px] text-text-muted">{driver.joinedNote}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDriver(driver.id)
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
            {!loading && drivers.length > 0 && (
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

      {/* Driver Detail Drawer */}
      {selectedDriver && (
        <DriverDetail
          driverId={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          kycLocked={!kyc.isUnlocked}
          onRequestUnlock={kyc.requestUnlock}
        />
      )}

      {/* Driver Form Modal */}
      {isDriverFormOpen && (
        <DriverForm
          isOpen={isDriverFormOpen}
          onClose={() => {
            setIsDriverFormOpen(false)
            fetchData(1, "")
          }}
        />
      )}

      {/* KYC Unlock Modal */}
      {kyc.otpOpen && (
        <OtpUnlockModal
          isOpen={kyc.otpOpen}
          onClose={kyc.closeOtp}
          onUnlocked={kyc.handleUnlocked}
        />
      )}
    </div>
  )
}
