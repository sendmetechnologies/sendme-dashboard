"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { SenderDetail } from "@/components/dashboard/sender-detail"
import { FilterSelect, StateFilter, DateRangeFilter } from "@/components/dashboard/filters"
import Link from "next/link"
import {
  Users, Package, DollarSign, ChevronDown,
  Search, Download, ArrowUpDown, Filter, RotateCcw,
  ChevronLeft, ChevronRight, Loader2, ShoppingBag, FileSpreadsheet
} from "lucide-react"

interface SenderRow {
  id: string
  name: string
  phone: string
  email: string
  state: string
  avatar: string
  orders: number
  totalSpent: number
  totalSpentFormatted: string
  status: string
  statusColor: string
  joined: string
  joinedNote: string
}

export default function SendersPage() {
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [senders, setSenders] = useState<SenderRow[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, newThisMonth: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [activityFilter, setActivityFilter] = useState("")
  const [dateRangeFilter, setDateRangeFilter] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const fetchData = (page: number, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    if (stateFilter) params.set("state", stateFilter)
    if (activityFilter) params.set("activity", activityFilter)
    if (dateRangeFilter) params.set("date_range", dateRangeFilter)
    if (sortBy) params.set("sort_by", sortBy)

    fetch(`/api/dashboard/senders?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSenders(data.senders || [])
        setStats(data.stats || { total: 0, active: 0, newThisMonth: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(1, searchQuery)
  }, [statusFilter, stateFilter, activityFilter, dateRangeFilter, sortBy])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setStateFilter("")
    setActivityFilter("")
    setDateRangeFilter("")
    setSortBy("newest")
  }

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || stateFilter || activityFilter || dateRangeFilter || sortBy !== "newest"
  )

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery)
  }

  const statCards = [
    { label: "Total Senders", value: stats.total, icon: Users, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Active Senders", value: stats.active, icon: Package, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "New This Month", value: stats.newThisMonth, icon: Users, color: "text-info", bg: "bg-info-light" },
    { label: "Total Balance", value: stats.totalBalanceFormatted, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
  ]

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Senders & Customers</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage, track, and inspect all customer accounts across SendMe.</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-border-default rounded-xl p-3 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
                <Search size={14} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Search sender by name, phone or email..."
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

              {/* Status Filter */}
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                  { value: "deactivated", label: "Deactivated" },
                ]}
              />

              {/* Activity Filter */}
              <FilterSelect
                value={activityFilter}
                onChange={setActivityFilter}
                placeholder="Order Activity: All"
                options={[
                  { value: "with_orders", label: "Has Placed Orders" },
                  { value: "zero_orders", label: "Zero Orders Yet" },
                ]}
              />

              {/* Date Joined Filter */}
              <DateRangeFilter value={dateRangeFilter} onChange={setDateRangeFilter} />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border-light">
              <div className="flex items-center gap-2">
                {/* Sort Filter */}
                <FilterSelect
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: "newest", label: "Sort: Newest First" },
                    { value: "spent", label: "Sort: Highest Spent" },
                    { value: "orders", label: "Sort: Most Orders" },
                    { value: "oldest", label: "Sort: Oldest First" },
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
                <Link
                  href="/dashboard/csv-export?type=senders"
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
                >
                  <FileSpreadsheet size={13} className="text-emerald-600" /> Template CSV Export
                </Link>

                <button
                  onClick={() => {
                    const csv = "data:text/csv;charset=utf-8," + ["Name,Phone,Email,Orders,Total Spent,Status,Joined", ...senders.map(s => `"${s.name}","${s.phone}","${s.email}","${s.orders}","${s.totalSpent}","${s.status}","${s.joined}"`)].join("\n")
                    const uri = encodeURI(csv)
                    const link = document.createElement("a")
                    link.setAttribute("href", uri)
                    link.setAttribute("download", `sendme-senders-${new Date().toISOString().slice(0, 10)}.csv`)
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                </Card>
              )
            })}
          </div>

          {/* Senders Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : senders.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                  <p className="text-sm font-medium">No senders found matching your filter criteria</p>
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
                      <th className="px-4 py-3 font-semibold">Sender <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">Orders</th>
                      <th className="px-4 py-3 font-semibold">Total Spent</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {senders.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedSender(s.id)}
                        className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                          selectedSender === s.id ? "bg-sendme-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-xs shrink-0">
                              {s.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-text-primary leading-tight">{s.name}</p>
                              <p className="text-[10px] text-text-muted">{s.state}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{s.email}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary font-mono">{s.phone}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-text-primary">{s.orders}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-text-primary">{s.totalSpentFormatted}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.statusColor}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-primary">{s.joined}</p>
                          <p className="text-[10px] text-text-muted">{s.joinedNote}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSender(s.id)
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
            {!loading && senders.length > 0 && (
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

      {/* Sender Detail Drawer */}
      {selectedSender && (
        <SenderDetail
          senderId={selectedSender}
          onClose={() => setSelectedSender(null)}
        />
      )}
    </div>
  )
}
