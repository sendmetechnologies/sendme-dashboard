"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { OrderDetail } from "@/components/dashboard/order-detail"
import { OrderForm } from "@/components/dashboard/forms"
import {
  Package, Users, Calendar, Clock, AlertTriangle, ChevronDown,
  Search, Download, Plus, MoreHorizontal, ArrowUpDown, Filter,
  ChevronLeft, ChevronRight, Loader2
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

  const fetchData = (page: number, status: string, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (status) params.set("status", status)
    if (search) params.set("search", search)

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

  const statCards = [
    { label: "Active Orders", value: stats.active, subtitle: "Currently in progress", icon: Package, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Unassigned", value: stats.unassigned, subtitle: "Waiting for driver", icon: Users, color: "text-warning", bg: "bg-warning-light" },
    { label: "Scheduled Today", value: stats.scheduled, subtitle: "Upcoming pickups", icon: Calendar, color: "text-info", bg: "bg-info-light" },
    { label: "Delayed", value: stats.delayed, subtitle: "Past expected time", icon: Clock, color: "text-danger", bg: "bg-danger-light" },
    { label: "Disputed", value: stats.disputed, subtitle: "Requires attention", icon: AlertTriangle, color: "text-warning", bg: "bg-warning-light" },
  ]

  const statusTabNames = ["All Orders", "Active", "Open for Bids", "Scheduled", "Completed", "Failed", "Disputed", "Cancelled"]

  const filters = ["Status", "Vehicle Type", "Payment Method", "Customer Type", "Delivery Type"]

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
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Calendar size={14} className="text-text-muted" /> Today <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <span className="w-2 h-2 rounded-full bg-sendme" /> All Cities <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Delivery Types <ChevronDown size={14} className="text-text-muted" />
            </button>
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
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Download size={14} className="text-text-muted" /> Export
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted">{stat.label}</p>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5">{stat.value.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted mb-1">{stat.subtitle}</p>
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

          {/* Filter Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
              <button key={f} className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors">
                {f} <ChevronDown size={12} className="text-text-muted" />
              </button>
            ))}
            <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors">
              <Filter size={12} className="text-text-muted" /> More Filters
            </button>
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
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.statusColor}`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{order.eta}</p>
                          <p className="text-[10px] font-medium text-text-muted">{order.etaStatus}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
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
    </div>
  )
}
