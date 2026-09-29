"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { OrderDetail } from "@/components/dashboard/order-detail"
import { OrderForm } from "@/components/dashboard/forms"
import { FilterSelect, StateFilter } from "@/components/dashboard/filters"
import { NearbyRidersModal } from "@/components/dashboard/nearby-riders-modal"
import { DeliveryLiveTrackingModal } from "@/components/dashboard/delivery-live-tracking-modal"
import { PAGE_REFRESH_EVENT } from "@/hooks/use-page-refresh"
import {
  Package, Users, Calendar, Clock, AlertTriangle,
  Search, Download, Plus, MoreHorizontal, ArrowUpDown,
  ChevronLeft, ChevronRight, Loader2, MapPin, Phone, MessageCircle, Navigation
} from "lucide-react"

interface DeliveryOrder {
  id: string
  fullId: string
  time: string
  from: string
  to: string
  fromAddr: string
  customer: string
  customerType: string
  driver: string | null
  driverVehicle: string | null
  driverAvatar: string | null
  type: string
  typeColor: string
  fare: string
  fareSub: string
  status: string
  statusColor: string
  eta: string
  etaStatus: string
  payment: string
  pin: string | null
  created_at: string
}

const tabToStatus: Record<string, string> = {
  "All Orders": "",
  "Active": "Active",
  "Open for Bids": "Open for Bids",
  "Scheduled": "Scheduled",
  "Completed": "Completed",
  "Failed": "Failed",
  "Disputed": "Disputed",
  "Cancelled": "Cancelled",
}

export default function DeliveriesPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All Orders")
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([])
  const [stats, setStats] = useState({ active: 0, unassigned: 0, scheduled: 0, delayed: 0, disputed: 0 })
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [searchQuery, setSearchQuery] = useState("")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [nearbyOrder, setNearbyOrder] = useState<DeliveryOrder | null>(null)
  const [nearbyOrderInfo, setNearbyOrderInfo] = useState<any | null>(null)
  const [nearbyRiders, setNearbyRiders] = useState<any[]>([])
  const [nearbySummary, setNearbySummary] = useState<any | null>(null)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyRadius, setNearbyRadius] = useState(30)
  const [trackingModalOrder, setTrackingModalOrder] = useState<DeliveryOrder | null>(null)

  const fetchNearbyRiders = async (orderId: string, radius: number) => {
    setNearbyLoading(true)
    try {
      const res = await fetch(`/api/dashboard/deliveries/${orderId}/nearby-riders?radius=${radius}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNearbyRiders(data.riders || [])
      setNearbySummary(data.summary || null)
      if (data.order) setNearbyOrderInfo(data.order)
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setNearbyLoading(false)
    }
  }

  const openNearbyRiders = (order: DeliveryOrder) => {
    setNearbyOrder(order)
    setNearbyOrderInfo({
      id: order.fullId,
      pickupAddress: order.fromAddr || order.from,
      dropoffAddress: order.to,
      fare: order.fare,
      vehicleType: order.type,
    })
    setNearbyRadius(30)
    fetchNearbyRiders(order.fullId, 30)
  }

  const fetchData = (
    page: number,
    status: string,
    search: string,
    overrides?: { state?: string; vehicleType?: string; paymentMethod?: string }
  ) => {
    setLoading(true)
    const effectiveState = overrides?.state !== undefined ? overrides.state : stateFilter
    const effectiveVehicle = overrides?.vehicleType !== undefined ? overrides.vehicleType : vehicleTypeFilter
    const effectivePayment = overrides?.paymentMethod !== undefined ? overrides.paymentMethod : paymentMethodFilter

    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (status) params.set("status", status)
    if (search) params.set("search", search)
    if (effectiveVehicle) params.set("vehicle_type", effectiveVehicle)
    if (effectivePayment) params.set("payment_method", effectivePayment)
    if (effectiveState) params.set("state", effectiveState)

    fetch(`/api/dashboard/deliveries?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setDeliveries(data.deliveries || [])
        setStats(data.stats || { active: 0, unassigned: 0, scheduled: 0, delayed: 0, disputed: 0 })
        setTabCounts(data.tabCounts || {})
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(1, "", "")
  }, [])

  useEffect(() => {
    const handleRefresh = () => fetchData(pagination.page, tabToStatus[activeTab] || "", searchQuery)
    window.addEventListener(PAGE_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(PAGE_REFRESH_EVENT, handleRefresh)
  }, [pagination.page, activeTab, searchQuery, stateFilter, vehicleTypeFilter, paymentMethodFilter])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchData(1, tabToStatus[tab] || "", searchQuery)
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, tabToStatus[activeTab] || "", q)
  }

  const handlePageChange = (page: number) => {
    fetchData(page, tabToStatus[activeTab] || "", searchQuery)
  }

  const handleStateChange = (v: string) => {
    setStateFilter(v)
    fetchData(1, tabToStatus[activeTab] || "", searchQuery, { state: v })
  }

  const handleVehicleTypeChange = (v: string) => {
    setVehicleTypeFilter(v)
    fetchData(1, tabToStatus[activeTab] || "", searchQuery, { vehicleType: v })
  }

  const handlePaymentMethodChange = (v: string) => {
    setPaymentMethodFilter(v)
    fetchData(1, tabToStatus[activeTab] || "", searchQuery, { paymentMethod: v })
  }

  const handleExport = () => {
    if (!deliveries.length) {
      alert("No deliveries found to export.")
      return
    }
    const headers = ["Order ID", "Date", "Status", "Customer", "Driver", "Vehicle", "Fare", "Payment", "Pickup Address", "Dropoff Address"]
    const rows = deliveries.map((d) => [
      d.fullId,
      d.created_at,
      d.status,
      `"${(d.customer || "").replace(/"/g, '""')}"`,
      `"${(d.driver || "Unassigned").replace(/"/g, '""')}"`,
      d.type,
      d.fare,
      d.payment,
      `"${(d.fromAddr || d.from || "").replace(/"/g, '""')}"`,
      `"${(d.to || "").replace(/"/g, '""')}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `deliveries-${activeTab.toLowerCase().replace(/\s+/g, "-")}-${stateFilter || "all"}-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const statCards = [
    { label: "Active Orders", value: stats.active, subtitle: "Currently in progress", icon: Package, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Unassigned", value: stats.unassigned, subtitle: "Waiting for driver", icon: Users, color: "text-warning", bg: "bg-warning-light" },
    { label: "Scheduled Today", value: stats.scheduled, subtitle: "Upcoming pickups", icon: Calendar, color: "text-info", bg: "bg-info-light" },
    { label: "Delayed", value: stats.delayed, subtitle: "Past expected time", icon: Clock, color: "text-danger", bg: "bg-danger-light" },
    { label: "Disputed", value: stats.disputed, subtitle: "Requires attention", icon: AlertTriangle, color: "text-warning", bg: "bg-warning-light" },
  ]

  const statusTabNames = ["All Orders", "Active", "Open for Bids", "Scheduled", "Completed", "Failed", "Disputed", "Cancelled"]

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Deliveries</h1>
              <p className="text-sm text-text-muted mt-0.5">Track, manage and resolve every delivery request across SendMe.</p>
            </div>
            <button 
              onClick={() => setIsOrderFormOpen(true)}
              className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"
            >
              <Plus size={16} /> Create Order
            </button>
          </div>

          {/* Top Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <StateFilter value={stateFilter} onChange={handleStateChange} />
            <FilterSelect
              value={vehicleTypeFilter}
              onChange={handleVehicleTypeChange}
              placeholder="All Vehicle Types"
              options={[
                { value: "bicycle", label: "Bicycle" },
                { value: "motorcycle", label: "Motorcycle" },
                { value: "car", label: "Car" },
                { value: "van", label: "Van" },
                { value: "truck", label: "Truck" },
              ]}
            />
            <FilterSelect
              value={paymentMethodFilter}
              onChange={handlePaymentMethodChange}
              placeholder="All Payment Methods"
              options={[
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "wallet", label: "Wallet" },
                { value: "transfer", label: "Transfer" },
              ]}
            />
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search by order ID, customer, driver..."
                className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Download size={14} className="text-text-muted" /> Export
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <p className="text-2xl font-bold text-text-primary mb-0.5 truncate" title={String(stat.value)}>{formatCardValue(stat.value)}</p>
                  <p className="text-[10px] text-text-muted mb-1 truncate">{stat.subtitle}</p>
                </Card>
              )
            })}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-0 border-b border-border-light overflow-x-auto">
            {statusTabNames.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-sendme text-sendme"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab}
                {(tabCounts[tab] || 0) > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {(tabCounts[tab] || 0).toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : deliveries.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-text-muted">No deliveries found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                      <th className="px-4 py-3 font-semibold">Order ID <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Route</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Driver</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Fare / Bid</th>
                      <th className="px-4 py-3 font-semibold">PIN</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">ETA / SLA</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order.fullId)}
                        className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                          selectedOrder === order.fullId ? "bg-sendme-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary">{order.id}</p>
                          <p className="text-[10px] text-text-muted">{order.time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{order.from} → {order.to}</p>
                          <p className="text-[10px] text-text-muted truncate max-w-[140px]">{order.fromAddr}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{order.customer}</p>
                          <p className="text-[10px] text-text-muted">{order.customerType}</p>
                        </td>
                        <td className="px-4 py-3">
                          {order.driver ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold shrink-0">
                                {order.driverAvatar}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">{order.driver}</p>
                                <p className="text-[10px] text-text-muted truncate max-w-[120px]">{order.driverVehicle}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-text-muted italic">No driver assigned</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.typeColor}`}>{order.type}</span>
                          <p className="text-[10px] text-text-muted mt-0.5">{order.payment}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary">{order.fare}</p>
                          <p className="text-[10px] text-text-muted">{order.fareSub}</p>
                        </td>
                        <td className="px-4 py-3">
                          {order.pin ? (
                            <span className="text-xs font-mono font-bold text-text-primary bg-surface-secondary px-2 py-0.5 rounded">{order.pin}</span>
                          ) : (
                            <span className="text-[10px] text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.statusColor}`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{order.eta}</p>
                          <p className="text-[10px] font-medium text-text-muted">{order.etaStatus}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackingModalOrder(order);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sendme bg-sendme-50 rounded-lg hover:bg-sendme hover:text-white transition-all shadow-2xs"
                              title="Track live delivery in dashboard"
                            >
                              <Navigation size={12} />
                              <span>Track</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openNearbyRiders(order) }}
                              className="p-1.5 text-text-muted hover:text-sendme hover:bg-surface-secondary rounded-lg transition-colors"
                              title="Find nearby riders"
                            >
                              <MapPin size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && deliveries.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
                <p className="text-xs text-text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} deliveries
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          p === pagination.page ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  {pagination.totalPages > 5 && <span className="text-text-muted text-xs px-1">...</span>}
                  {pagination.totalPages > 5 && (
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        pagination.totalPages === pagination.page ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"
                      }`}
                    >
                      {pagination.totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Order Detail Sidebar */}
      {selectedOrder && (
        <OrderDetail orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Order Form Modal */}
      <OrderForm isOpen={isOrderFormOpen} onClose={() => setIsOrderFormOpen(false)} />

      {/* Nearby Riders Modal */}
      {nearbyOrder && nearbyOrderInfo && (
        <NearbyRidersModal
          orderInfo={nearbyOrderInfo}
          riders={nearbyRiders}
          summary={nearbySummary}
          loading={nearbyLoading}
          radius={nearbyRadius}
          onRadiusChange={(r) => {
            setNearbyRadius(r)
            fetchNearbyRiders(nearbyOrder.fullId, r)
          }}
          onClose={() => {
            setNearbyOrder(null)
            setNearbyOrderInfo(null)
            setNearbyRiders([])
            setNearbySummary(null)
          }}
          onRefresh={() => fetchNearbyRiders(nearbyOrder.fullId, nearbyRadius)}
        />
      )}

      {/* In-Dashboard Live Tracking Modal */}
      {trackingModalOrder && (
        <DeliveryLiveTrackingModal
          isOpen={Boolean(trackingModalOrder)}
          order={trackingModalOrder}
          onClose={() => setTrackingModalOrder(null)}
        />
      )}
    </div>
  )
}
