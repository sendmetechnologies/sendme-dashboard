"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { SenderDetail } from "@/components/dashboard/sender-detail"
import {
  Users, Package, DollarSign, ChevronDown,
  Search, Download, MoreHorizontal, ArrowUpDown, Filter,
  ChevronLeft, ChevronRight, Loader2
} from "lucide-react"

interface SenderRow {
  id: string
  name: string
  phone: string
  email: string
  avatar: string
  orders: number
  totalSpent: number
  totalSpentFormatted: string
  joined: string
  joinedNote: string
}

export default function SendersPage() {
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [senders, setSenders] = useState<SenderRow[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, newThisMonth: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = (page: number, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)

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
    fetchData(1, "")
  }, [])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q)
  }

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
              <h1 className="text-xl font-bold text-text-primary">Senders</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage and view all senders across SendMe.</p>
            </div>
          </div>

          {/* Top Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Status <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Cities <ChevronDown size={14} className="text-text-muted" />
            </button>
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search by name, phone or email..."
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
            <div className="flex gap-0">
              <button className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 border-sendme text-sendme">
                All Senders
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sendme-50 text-sendme">
                  {stats.total.toLocaleString()}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <button className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                <Filter size={14} /> Filters
              </button>
              <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
                Newest First <ChevronDown size={14} className="text-text-muted" />
              </button>
            </div>
          </div>

          {/* Senders Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : senders.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-text-muted">No senders found</p>
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
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold shrink-0">
                              {s.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-primary">{s.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-muted">{s.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-muted">{s.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-text-primary">{s.orders}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-text-primary">{s.totalSpentFormatted}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{s.joined}</p>
                          <p className="text-[10px] text-text-muted">{s.joinedNote}</p>
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
            {!loading && senders.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
                <p className="text-xs text-text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} senders
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

      {/* Sender Detail Sidebar */}
      {selectedSender && (
        <SenderDetail senderId={selectedSender} onClose={() => setSelectedSender(null)} />
      )}
    </div>
  )
}
