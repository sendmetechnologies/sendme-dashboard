"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { MarketerDetail } from "@/components/dashboard/marketer-detail"
import { FilterSelect, StateFilter } from "@/components/dashboard/filters"
import {
  Megaphone, Users, Clock, CheckCircle, Ban,
  Search, Download, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight,
  Loader2, RotateCcw, Filter
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
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [perfFilter, setPerfFilter] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const fetchData = (page: number, search: string, status?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)
    const st = status || activeTab
    if (st && st !== "All") params.set("status", st.toLowerCase())
    if (stateFilter) params.set("state", stateFilter)
    if (perfFilter) params.set("performance", perfFilter)
    if (sortBy) params.set("sort_by", sortBy)

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
    fetchData(1, searchQuery, activeTab)
  }, [activeTab, stateFilter, perfFilter, sortBy])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q, activeTab)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStateFilter("")
    setPerfFilter("")
    setSortBy("newest")
    setActiveTab("All")
  }

  const hasActiveFilters = Boolean(
    searchQuery || stateFilter || perfFilter || sortBy !== "newest" || activeTab !== "All"
  )

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery, activeTab)
  }

  const tabs = ["All", "Pending", "Approved", "Rejected", "Suspended", "Removed"]

  const statCards = [
    { label: "Total Marketers", value: stats.total, icon: Megaphone, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Rejected / Suspended", value: (stats.rejected || 0) + (stats.suspended || 0), icon: Ban, color: "text-danger", bg: "bg-danger-light" },
    { label: "Removed", value: stats.removed || 0, icon: Ban, color: "text-danger", bg: "bg-danger-light" },
  ]

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Growth Partners & Marketers</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage partner tiers, referral networks, commissions and payouts.</p>
            </div>
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
                  placeholder="Search by marketer name, phone, code or ID..."
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

              {/* Performance Filter */}
              <FilterSelect
                value={perfFilter}
                onChange={setPerfFilter}
                placeholder="Referrals: All"
                options={[
                  { value: "10+", label: "10+ Referrals" },
                  { value: "1-10", label: "1 - 10 Referrals" },
                  { value: "zero", label: "0 Referrals" },
                ]}
              />

              {/* Sorting */}
              <FilterSelect
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "newest", label: "Sort: Newest Joined" },
                  { value: "referrals", label: "Sort: Most Referrals" },
                  { value: "earnings", label: "Sort: Highest Earnings" },
                  { value: "oldest", label: "Sort: Oldest First" },
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
                  const csv = "data:text/csv;charset=utf-8," + ["Name,Phone,Email,Code,State,Status,Referrals,Earnings,Joined", ...marketers.map(m => `"${m.name}","${m.phone}","${m.email}","${m.marketerId}","${m.state}","${m.statusLabel}","${m.referrals}","${m.totalEarnings}","${m.joined}"`)].join("\n")
                  const uri = encodeURI(csv)
                  const link = document.createElement("a")
                  link.setAttribute("href", uri)
                  link.setAttribute("download", `sendme-marketers-${new Date().toISOString().slice(0, 10)}.csv`)
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
            {tabs.map((tab) => {
              const count = tab === "All" ? stats.total : (tabCounts[tab.toLowerCase()] ?? 0)
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

          {/* Marketers Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : marketers.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                  <p className="text-sm font-medium">No marketers found matching your filter criteria</p>
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
                      <th className="px-4 py-3 font-semibold">Marketer <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Code / ID</th>
                      <th className="px-4 py-3 font-semibold">State / City</th>
                      <th className="px-4 py-3 font-semibold">Occupation</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Referrals</th>
                      <th className="px-4 py-3 font-semibold">Total Earnings</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
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
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-xs shrink-0">
                              {(m.name || "?")[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-text-primary leading-tight">{m.name}</p>
                              <p className="text-[10px] text-text-muted font-mono">{m.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-sendme">{m.marketerId}</td>
                        <td className="px-4 py-3 text-xs text-text-primary">{m.state} {m.city !== "—" ? `· ${m.city}` : ""}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{m.occupation}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.statusColor}`}>
                            {m.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-text-primary">{m.referrals}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-sendme">{m.totalEarningsFormatted}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-primary">{m.joined}</p>
                          <p className="text-[10px] text-text-muted">{m.joinedNote}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMarketer(m.id)
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
            {!loading && marketers.length > 0 && (
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

      {/* Marketer Detail Drawer */}
      {selectedMarketer && (
        <MarketerDetail
          marketerId={selectedMarketer}
          onClose={() => setSelectedMarketer(null)}
        />
      )}
    </div>
  )
}
