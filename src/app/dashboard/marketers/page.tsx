"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { MarketerDetail } from "@/components/dashboard/marketer-detail"
import {
  Megaphone, Users, Clock, CheckCircle, Ban,
  Search, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, Loader2
} from "lucide-react"

interface MarketerRow {
  id: string
  name: string
  phone: string
  email: string
  state: string
  city: string
  occupation: string
  marketerId: string
  status: string
  statusLabel: string
  statusColor: string
  referrals: number
  totalEarnings: number
  totalEarningsFormatted: string
  joined: string
  joinedNote: string
}

export default function MarketersPage() {
  const [selectedMarketer, setSelectedMarketer] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [loading, setLoading] = useState(true)
  const [marketers, setMarketers] = useState<MarketerRow[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0, removed: 0 })
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = (page: number, search: string, status?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)
    if (status && status !== "All") params.set("status", status.toLowerCase())

    fetch(`/api/dashboard/marketers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setMarketers(data.marketers || [])
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0, removed: 0 })
        setTabCounts(data.tabCounts || {})
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(1, "")
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchData(1, searchQuery, tab)
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q, activeTab)
  }

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery, activeTab)
  }

  const tabs = ["All", "Pending", "Approved", "Rejected", "Suspended", "Removed"]

  const statCards = [
    { label: "Total Marketers", value: stats.total, icon: Megaphone, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Rejected / Suspended", value: stats.rejected + stats.suspended, icon: Ban, color: "text-danger", bg: "bg-danger-light" },
    { label: "Removed", value: stats.removed, icon: Ban, color: "text-danger", bg: "bg-danger-light" },
  ]

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Marketers</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage Growth Partner applications and accounts.</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search by name, phone, city..."
                className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
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
                </Card>
              )
            })}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center justify-between border-b border-border-light">
            <div className="flex gap-0 overflow-x-auto">
              {tabs.map((tab) => {
                const count = tab === "All" ? stats.total : (tabCounts[tab] || 0)
                return (
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
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                    }`}>
                      {count.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Marketers Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : marketers.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-text-muted">No marketers found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                      <th className="px-4 py-3 font-semibold">Marketer <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Referrals</th>
                      <th className="px-4 py-3 font-semibold">Earnings</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketers.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMarketer(m.id)}
                        className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                          selectedMarketer === m.id ? "bg-sendme-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold shrink-0">
                              {(m.name || "?")[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-primary">{m.name}</p>
                              <p className="text-[10px] text-text-muted">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-mono text-text-muted">{m.marketerId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-muted">{m.city}, {m.state}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${m.statusColor}`}>
                            {m.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-text-primary">{m.referrals}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-text-primary">{m.totalEarningsFormatted}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{m.joined}</p>
                          <p className="text-[10px] text-text-muted">{m.joinedNote}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && marketers.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
                <p className="text-xs text-text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} marketers
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

      {/* Marketer Detail Sidebar */}
      {selectedMarketer && (
        <MarketerDetail marketerId={selectedMarketer} onClose={() => setSelectedMarketer(null)} />
      )}
    </div>
  )
}
