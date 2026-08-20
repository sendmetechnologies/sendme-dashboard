"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { PayoutDetail } from "@/components/dashboard/payout-detail"
import {
  DollarSign, TrendingUp, TrendingDown, Search, ChevronDown, ChevronLeft, ChevronRight,
  MoreHorizontal, Filter, Loader2, CheckCircle, XCircle, Clock, Building2, User
} from "lucide-react"

interface PayoutRow {
  id: string
  type: "driver" | "organization"
  user_id: string
  user_name: string
  user_phone: string
  amount: number
  status: string
  bank_name: string
  account_number: string
  account_name: string
  note: string
  created_at: string
  updated_at?: string
  processed_at?: string
}

interface PayoutStats {
  total: number
  totalAmount: number
  pending: number
  pendingAmount: number
  completed: number
  completedAmount: number
  failed: number
}

interface WalletStats {
  totalBalance: number
  driverBalance: number
  orgBalance: number
  totalUsers: number
}

const statusTabs = ["All", "Pending", "Processing", "Paid", "Failed"]
const typeFilters = ["All Types", "Drivers", "Organizations"]

export default function WalletsPaymentsPage() {
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [activeType, setActiveType] = useState("All Types")
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [stats, setStats] = useState<PayoutStats>({ total: 0, totalAmount: 0, pending: 0, pendingAmount: 0, completed: 0, completedAmount: 0, failed: 0 })
  const [walletStats, setWalletStats] = useState<WalletStats>({ totalBalance: 0, driverBalance: 0, orgBalance: 0, totalUsers: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(async (page: number = 1, search: string = "", status: string = "", type: string = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (status && status !== "All") params.set("status", status.toLowerCase())
      if (type === "Drivers") params.set("type", "driver")
      else if (type === "Organizations") params.set("type", "org")

      const res = await fetch(`/api/dashboard/payouts?${params.toString()}`)
      const data = await res.json()

      setPayouts(data.payouts || [])
      setStats(data.stats || { total: 0, totalAmount: 0, pending: 0, pendingAmount: 0, completed: 0, completedAmount: 0, failed: 0 })
      setWalletStats(data.wallets || { totalBalance: 0, driverBalance: 0, orgBalance: 0, totalUsers: 0 })
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch (err) {
      console.error("Failed to fetch payouts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q, activeTab, activeType)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchData(1, searchQuery, tab, activeType)
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    fetchData(1, searchQuery, activeTab, type)
  }

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery, activeTab, activeType)
  }

  const handleActionComplete = () => {
    fetchData(pagination.page, searchQuery, activeTab, activeType)
  }

  const statCards = [
    { label: "Total Wallet Balance", value: `₦${walletStats.totalBalance.toLocaleString()}`, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50", sub: `${walletStats.totalUsers} wallet accounts` },
    { label: "Pending Payouts", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning-light", sub: `₦${stats.pendingAmount.toLocaleString()}` },
    { label: "Completed Payouts", value: stats.completed, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50", sub: `₦${stats.completedAmount.toLocaleString()}` },
    { label: "Failed Payouts", value: stats.failed, icon: XCircle, color: "text-danger", bg: "bg-danger-light" },
    { label: "Total Payout Amount", value: `₦${stats.totalAmount.toLocaleString()}`, icon: TrendingUp, color: "text-sendme", bg: "bg-sendme-50" },
  ]

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      pending: { color: "text-warning", bg: "bg-warning-light", label: "Pending" },
      processing: { color: "text-info", bg: "bg-info-light", label: "Processing" },
      paid: { color: "text-sendme", bg: "bg-sendme-50", label: "Paid" },
      completed: { color: "text-sendme", bg: "bg-sendme-50", label: "Completed" },
      failed: { color: "text-danger", bg: "bg-danger-light", label: "Failed" },
    }
    const s = map[status] || map.pending
    return (
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.color} ${s.bg}`}>
        {s.label}
      </span>
    )
  }

  const formatDate = (d: string) => {
    try {
      const date = new Date(d)
      return { date: date.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }), time: date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) }
    } catch { return { date: "—", time: "" } }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Wallets & Payments</h1>
              <p className="text-sm text-text-muted mt-0.5">Review and process payout requests from all users. Total wallet balance across all accounts shown below.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map((s) => {
              const I = s.icon
              return (
                <Card key={s.label} className="p-3 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[10px] text-text-muted truncate">{s.label}</p>
                    <div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14} /></div>
                  </div>
                  <p className="text-base lg:text-lg font-bold text-text-primary truncate">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                  {"sub" in s && s.sub && <p className="text-[9px] font-medium text-text-muted truncate">{s.sub}</p>}
                </Card>
              )
            })}
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5">
              <Search size={12} className="text-text-muted" />
              <input
                placeholder="Search by name, reference..."
                className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                onClick={() => {
                  const idx = typeFilters.indexOf(activeType)
                  handleTypeChange(typeFilters[(idx + 1) % typeFilters.length])
                }}
              >
                {activeType} <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center justify-between border-b border-border-light">
            <div className="flex gap-0">
              {statusTabs.map((tab) => {
                const count = tab === "All" ? stats.total
                  : tab === "Pending" ? stats.pending
                   : tab === "Processing" ? stats.processing
                  : tab === "Paid" ? stats.completed
                  : tab === "Failed" ? stats.failed
                  : 0
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                      activeTab === tab ? "border-sendme text-sendme" : "border-transparent text-text-muted"
                    }`}
                  >
                    {tab}
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : payouts.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-text-muted">No payout requests found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
                      <th className="px-3 py-2">Requester</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Bank</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => {
                      const fd = formatDate(p.created_at)
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPayout(p)}
                          className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer transition-colors ${
                            selectedPayout?.id === p.id ? "bg-sendme-50/30" : ""
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${p.type === "driver" ? "bg-sendme-50 text-sendme" : "bg-blue-50 text-blue-600"}`}>
                                {p.type === "driver" ? <User size={12} /> : <Building2 size={12} />}
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-text-primary">{p.user_name}</p>
                                <p className="text-[9px] text-text-muted">{p.user_phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              p.type === "driver" ? "bg-sendme-50 text-sendme" : "bg-blue-50 text-blue-600"
                            }`}>
                              {p.type === "driver" ? "Driver" : "Org"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-[11px] font-semibold text-text-primary">₦{p.amount.toLocaleString()}</p>
                          </td>
                          <td className="px-3 py-2.5">{statusBadge(p.status)}</td>
                          <td className="px-3 py-2.5">
                            <p className="text-[10px] font-medium text-text-primary">{p.bank_name}</p>
                            <p className="text-[9px] text-text-muted font-mono">{p.account_number}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-[10px] font-medium text-text-primary">{fd.date}</p>
                            <p className="text-[9px] text-text-muted">{fd.time}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {p.status === "pending" ? (
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedPayout(p) }}
                                  className="p-1 text-sendme hover:bg-sendme-50 rounded transition-colors"
                                  title="Review & Approve"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              </div>
                            ) : (
                              <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                                <MoreHorizontal size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && payouts.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border-light">
                <p className="text-[10px] text-text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1 text-text-muted disabled:opacity-30"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-6 h-6 rounded text-[10px] font-medium ${p === pagination.page ? "bg-sendme text-white" : "text-text-muted"}`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1 text-text-muted disabled:opacity-30"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Payout Detail Sidebar */}
      {selectedPayout && (
        <PayoutDetail
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
          onActionComplete={handleActionComplete}
        />
      )}
    </div>
  )
}
