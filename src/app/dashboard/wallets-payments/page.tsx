"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { PayoutDetail } from "@/components/dashboard/payout-detail"
import {
  DollarSign, TrendingUp, TrendingDown, Search, ChevronDown, ChevronLeft, ChevronRight,
  MoreHorizontal, Loader2, CheckCircle, XCircle, Clock, Building2, User,
  ShieldCheck, Download, AlertTriangle, Eye, ChevronRight as ChevronRightIcon
} from "lucide-react"

interface PayoutRow {
  id: string
  type: "driver" | "customer" | "organization"
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
  processing: number
  processingAmount: number
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

interface IFCheckResult {
  id: string
  type: "driver" | "customer" | "organization"
  user_id: string
  user_name: string
  user_phone: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  created_at: string
  passed: boolean
  reason: string
  checks: {
    has_completed_delivery: boolean
    delivery_amount_matches: boolean
    wallet_balance_positive: boolean
    no_duplicate_pending: boolean
    financial_track_consistent: boolean
    not_recently_created: boolean
  }
}

interface IFCheckResponse {
  total: number
  passedCount: number
  failedCount: number
  passedByType: { drivers: number; customers: number; organizations: number }
  failedByType: { drivers: number; customers: number; organizations: number }
  results: IFCheckResult[]
}

const statusTabs = ["All", "Pending", "Processing", "Paid", "Failed"]
const typeFilters = ["All Types", "Drivers", "Customers", "Organizations"]

const checkLabels: Record<string, string> = {
  has_completed_delivery: "Completed deliveries",
  delivery_amount_matches: "Amount matches earnings",
  wallet_balance_positive: "Sufficient wallet balance",
  no_duplicate_pending: "No duplicate pending requests",
  financial_track_consistent: "Financial track consistent",
  not_recently_created: "Account age > 24h",
}

export default function WalletsPaymentsPage() {
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [activeType, setActiveType] = useState("All Types")
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [stats, setStats] = useState<PayoutStats>({ total: 0, totalAmount: 0, pending: 0, pendingAmount: 0, processing: 0, processingAmount: 0, completed: 0, completedAmount: 0, failed: 0 })
  const [walletStats, setWalletStats] = useState<WalletStats>({ totalBalance: 0, driverBalance: 0, orgBalance: 0, totalUsers: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [searchQuery, setSearchQuery] = useState("")

  const [ifModalOpen, setIfModalOpen] = useState(false)
  const [ifScanning, setIfScanning] = useState(false)
  const [ifProgress, setIfProgress] = useState(0)
  const [ifScanStep, setIfScanStep] = useState("")
  const [ifResult, setIfResult] = useState<IFCheckResponse | null>(null)
  const [ifResultView, setIfResultView] = useState<"summary" | "passed" | "failed">("summary")

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFrom, setExportFrom] = useState("")
  const [exportTo, setExportTo] = useState("")
  const [exportRangeStart, setExportRangeStart] = useState("1")
  const [exportRangeEnd, setExportRangeEnd] = useState("10")
  const [exportApproved, setExportApproved] = useState<any[]>([])
  const [exportFiltered, setExportFiltered] = useState<any[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [exportSearched, setExportSearched] = useState(false)

  const fetchData = useCallback(async (page: number = 1, search: string = "", status: string = "", type: string = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (status && status !== "All") params.set("status", status.toLowerCase())
      if (type === "Drivers") params.set("type", "driver")
      else if (type === "Customers") params.set("type", "customer")
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

  const runIFCheck = async () => {
    setIfModalOpen(true)
    setIfScanning(true)
    setIfProgress(0)
    setIfResult(null)
    setIfScanStep("Initializing integrity scan...")
    setIfResultView("summary")

    const steps = [
      { pct: 10, text: "Fetching pending withdrawal requests..." },
      { pct: 20, text: "Resolving user roles and bank details..." },
      { pct: 35, text: "Validating driver delivery history..." },
      { pct: 50, text: "Checking customer wallet sources..." },
      { pct: 60, text: "Checking organization transaction records..." },
      { pct: 75, text: "Verifying wallet balances..." },
      { pct: 85, text: "Running financial consistency checks..." },
      { pct: 95, text: "Compiling integrity report..." },
    ]

    let stepIdx = 0
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        setIfProgress(steps[stepIdx].pct)
        setIfScanStep(steps[stepIdx].text)
        stepIdx++
      }
    }, 400)

    try {
      const res = await fetch("/api/dashboard/payouts/if-check")
      const data: IFCheckResponse = await res.json()

      clearInterval(stepInterval)
      setIfProgress(100)
      setIfScanStep("Scan complete!")

      setTimeout(() => {
        setIfResult(data)
        setIfScanning(false)
      }, 500)
    } catch (err) {
      clearInterval(stepInterval)
      setIfScanStep("Scan failed. Please try again.")
      setIfScanning(false)
    }
  }

  const exportPassedAsCSV = () => {
    if (!ifResult) return
    const passed = ifResult.results.filter((r) => r.passed)
    if (passed.length === 0) return

    const headers = ["Name", "Type", "Requested Amount", "Bank Name", "Account Number", "Account Holder"]
    const rows = passed.map((r) => [
      r.user_name,
      r.type === "driver" ? "Driver" : r.type === "customer" ? "Customer" : "Organization",
      r.amount,
      r.bank_name,
      r.account_number,
      r.account_name,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `if-check-passed-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getExportedIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem("sendme_exported_payout_ids") || "[]")
    } catch { return [] }
  }

  const markExported = (ids: string[]) => {
    const existing = getExportedIds()
    const merged = [...new Set([...existing, ...ids])]
    localStorage.setItem("sendme_exported_payout_ids", JSON.stringify(merged))
  }

  const handleExportFilter = async () => {
    if (!exportFrom || !exportTo) return
    setExportLoading(true)
    setExportSearched(true)
    try {
      const res = await fetch(`/api/dashboard/payouts/approved?from=${exportFrom}&to=${exportTo}`)
      const data = await res.json()
      const all = data.approved || []
      setExportApproved(all)

      const start = Math.max(0, parseInt(exportRangeStart) - 1)
      const end = parseInt(exportRangeEnd)
      const sliced = all.slice(start, end)

      const exportedIds = getExportedIds()
      const withDuplicates = sliced.map((item: any) => ({
        ...item,
        alreadyExported: exportedIds.includes(item.id),
      }))
      setExportFiltered(withDuplicates)
    } catch {
      setExportApproved([])
      setExportFiltered([])
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (exportFiltered.length === 0) return
    const headers = ["#", "Name", "Type", "Amount (₦)", "Bank Name", "Account Number", "Account Holder", "Approved At", "Status"]
    const rows = exportFiltered.map((item, i) => [
      i + 1,
      item.user_name,
      item.type === "driver" ? "Driver" : item.type === "customer" ? "Customer" : "Organization",
      item.amount,
      item.bank_name,
      item.account_number,
      item.account_name,
      item.processed_at ? new Date(item.processed_at).toLocaleString("en-NG") : "—",
      item.alreadyExported ? "DUPLICATE" : "NEW",
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `approved-payouts-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    const newIds = exportFiltered.filter((item) => !item.alreadyExported).map((item) => item.id)
    if (newIds.length > 0) markExported(newIds)
  }

  const openExportModal = () => {
    setExportModalOpen(true)
    setExportFrom("")
    setExportTo("")
    setExportRangeStart("1")
    setExportRangeEnd("10")
    setExportApproved([])
    setExportFiltered([])
    setExportSearched(false)
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

  const formatCurrency = (v: number) => `₦${v.toLocaleString()}`

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Wallets & Payments</h1>
              <p className="text-sm text-text-muted mt-0.5">Review and process payout requests from all users.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openExportModal}
                className="flex items-center gap-2 bg-white border border-border-default text-text-primary px-4 py-2 rounded-lg text-[11px] font-semibold hover:bg-surface-secondary transition-colors shadow-sm"
              >
                <Download size={14} />
                Export Approved
              </button>
              <button
                onClick={runIFCheck}
                disabled={stats.pending === 0}
                className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-[11px] font-semibold hover:bg-sendme/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ShieldCheck size={14} />
                IF Check
              </button>
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
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                                p.type === "driver" ? "bg-sendme-50 text-sendme" :
                                p.type === "customer" ? "bg-purple-50 text-purple-600" :
                                "bg-blue-50 text-blue-600"
                              }`}>
                                {p.type === "driver" ? <User size={12} /> : p.type === "customer" ? <User size={12} /> : <Building2 size={12} />}
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-text-primary">{p.user_name}</p>
                                <p className="text-[9px] text-text-muted">{p.user_phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              p.type === "driver" ? "bg-sendme-50 text-sendme" :
                              p.type === "customer" ? "bg-purple-50 text-purple-600" :
                              "bg-blue-50 text-blue-600"
                            }`}>
                              {p.type === "driver" ? "Driver" : p.type === "customer" ? "Customer" : "Org"}
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

      {/* IF Check Modal */}
      <Modal isOpen={ifModalOpen} onClose={() => { if (!ifScanning) setIfModalOpen(false) }} title="Integrity & Fraud Check" size="lg">
        {ifScanning ? (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-sendme-50 flex items-center justify-center">
                <ShieldCheck size={32} className="text-sendme animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-text-primary">Scanning Pending Withdrawals</p>
              <p className="text-[11px] text-text-muted">{ifScanStep}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">Progress</span>
                <span className="text-[10px] font-semibold text-sendme">{ifProgress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-sendme rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${ifProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : ifResult ? (
          <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-secondary/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-text-muted mb-1">Total Scanned</p>
                <p className="text-2xl font-bold text-text-primary">{ifResult.total}</p>
              </div>
              <div className="bg-sendme-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-sendme mb-1">Passed</p>
                <p className="text-2xl font-bold text-sendme">{ifResult.passedCount}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[9px] text-sendme">{ifResult.passedByType.drivers} riders</span>
                  <span className="text-[9px] text-text-muted">/</span>
                  <span className="text-[9px] text-purple-500">{ifResult.passedByType.customers} customers</span>
                  <span className="text-[9px] text-text-muted">/</span>
                  <span className="text-[9px] text-sendme">{ifResult.passedByType.organizations} orgs</span>
                </div>
              </div>
              <div className="bg-danger-light/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-danger mb-1">Failed</p>
                <p className="text-2xl font-bold text-danger">{ifResult.failedCount}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[9px] text-danger">{ifResult.failedByType.drivers} riders</span>
                  <span className="text-[9px] text-text-muted">/</span>
                  <span className="text-[9px] text-danger">{ifResult.failedByType.customers} customers</span>
                  <span className="text-[9px] text-text-muted">/</span>
                  <span className="text-[9px] text-danger">{ifResult.failedByType.organizations} orgs</span>
                </div>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIfResultView("summary")}
                className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-colors ${
                  ifResultView === "summary" ? "bg-sendme text-white" : "bg-surface-secondary text-text-muted hover:text-text-primary"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setIfResultView("passed")}
                disabled={ifResult.passedCount === 0}
                className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40 ${
                  ifResultView === "passed" ? "bg-sendme text-white" : "bg-surface-secondary text-text-muted hover:text-text-primary"
                }`}
              >
                Passed ({ifResult.passedCount})
              </button>
              <button
                onClick={() => setIfResultView("failed")}
                disabled={ifResult.failedCount === 0}
                className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40 ${
                  ifResultView === "failed" ? "bg-danger text-white" : "bg-surface-secondary text-text-muted hover:text-text-primary"
                }`}
              >
                Failed ({ifResult.failedCount})
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[320px] overflow-y-auto space-y-2">
              {ifResultView === "summary" && (
                <div className="space-y-3">
                  <div className="bg-surface-secondary/50 rounded-lg p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-text-primary">Scan Results</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">Total pending requests scanned</span>
                        <span className="text-[10px] font-semibold text-text-primary">{ifResult.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sendme">Passed integrity checks</span>
                        <span className="text-[10px] font-semibold text-sendme">{ifResult.passedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-danger">Failed integrity checks</span>
                        <span className="text-[10px] font-semibold text-danger">{ifResult.failedCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-secondary/50 rounded-lg p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-text-primary">Breakdown by Type</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">Drivers passed / failed</span>
                        <span className="text-[10px] font-semibold">
                          <span className="text-sendme">{ifResult.passedByType.drivers}</span>
                          <span className="text-text-muted"> / </span>
                          <span className="text-danger">{ifResult.failedByType.drivers}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">Customers passed / failed</span>
                        <span className="text-[10px] font-semibold">
                          <span className="text-sendme">{ifResult.passedByType.customers}</span>
                          <span className="text-text-muted"> / </span>
                          <span className="text-danger">{ifResult.failedByType.customers}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">Organizations passed / failed</span>
                        <span className="text-[10px] font-semibold">
                          <span className="text-sendme">{ifResult.passedByType.organizations}</span>
                          <span className="text-text-muted"> / </span>
                          <span className="text-danger">{ifResult.failedByType.organizations}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ifResultView === "passed" && ifResult.results.filter((r) => r.passed).map((r) => (
                <div key={r.id} className="bg-sendme-50/50 border border-sendme/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${
                        r.type === "driver" ? "bg-sendme text-white" :
                        r.type === "customer" ? "bg-purple-500 text-white" :
                        "bg-blue-500 text-white"
                      }`}>
                        {r.type === "driver" ? <User size={10} /> : r.type === "customer" ? <User size={10} /> : <Building2 size={10} />}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-text-primary">{r.user_name}</p>
                        <p className="text-[9px] text-text-muted">{r.type === "driver" ? "Driver" : r.type === "customer" ? "Customer" : "Organization"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-sendme">₦{r.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={10} className="text-sendme shrink-0" />
                    <p className="text-[9px] text-sendme">{r.reason}</p>
                  </div>
                  <div className="mt-1.5 text-[9px] text-text-muted">
                    {r.bank_name} - {r.account_number} ({r.account_name})
                  </div>
                </div>
              ))}

              {ifResultView === "failed" && ifResult.results.filter((r) => !r.passed).map((r) => (
                <div key={r.id} className="bg-danger-light/30 border border-danger/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${
                        r.type === "driver" ? "bg-sendme text-white" :
                        r.type === "customer" ? "bg-purple-500 text-white" :
                        "bg-blue-500 text-white"
                      }`}>
                        {r.type === "driver" ? <User size={10} /> : r.type === "customer" ? <User size={10} /> : <Building2 size={10} />}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-text-primary">{r.user_name}</p>
                        <p className="text-[9px] text-text-muted">{r.type === "driver" ? "Driver" : r.type === "customer" ? "Customer" : "Organization"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-danger">₦{r.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 mb-2">
                    <AlertTriangle size={10} className="text-danger shrink-0 mt-0.5" />
                    <p className="text-[9px] text-danger leading-relaxed">{r.reason}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(r.checks).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1">
                        {val ? (
                          <CheckCircle size={8} className="text-sendme shrink-0" />
                        ) : (
                          <XCircle size={8} className="text-danger shrink-0" />
                        )}
                        <span className={`text-[8px] ${val ? "text-sendme" : "text-danger"}`}>{checkLabels[key]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[9px] text-text-muted">
                    {r.bank_name} - {r.account_number} ({r.account_name})
                  </div>
                </div>
              ))}

              {ifResultView === "passed" && ifResult.passedCount === 0 && (
                <div className="text-center py-8">
                  <XCircle size={24} className="text-text-muted mx-auto mb-2" />
                  <p className="text-[11px] text-text-muted">No requests passed the integrity check</p>
                </div>
              )}
              {ifResultView === "failed" && ifResult.failedCount === 0 && (
                <div className="text-center py-8">
                  <CheckCircle size={24} className="text-sendme mx-auto mb-2" />
                  <p className="text-[11px] text-sendme">All requests passed!</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-border-light">
              {ifResult.passedCount > 0 && (
                <button
                  onClick={exportPassedAsCSV}
                  className="flex-1 flex items-center justify-center gap-2 bg-sendme text-white py-2.5 rounded-lg text-[11px] font-semibold hover:bg-sendme/90 transition-colors"
                >
                  <Download size={14} />
                  Export Passed as CSV
                </button>
              )}
              <button
                onClick={() => setIfModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-surface-secondary text-text-primary py-2.5 rounded-lg text-[11px] font-semibold hover:bg-surface-secondary/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Export Approved Modal */}
      <Modal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Approved Payouts" size="lg">
        <div className="space-y-5">
          {/* Time Range */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-text-primary">Approval Time Range</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-text-muted block mb-1">From</label>
                <input
                  type="datetime-local"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>
              <div>
                <label className="text-[9px] text-text-muted block mb-1">To</label>
                <input
                  type="datetime-local"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { label: "Last 10 min", mins: 10 },
                { label: "Last 30 min", mins: 30 },
                { label: "Last hour", mins: 60 },
                { label: "Today", mins: 1440 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const now = new Date()
                    const from = new Date(now.getTime() - preset.mins * 60000)
                    setExportFrom(from.toISOString().slice(0, 16))
                    setExportTo(now.toISOString().slice(0, 16))
                  }}
                  className="text-[9px] font-medium px-2 py-1 rounded border border-border-default text-text-muted hover:bg-surface-secondary transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number Range */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-text-primary">Approval Number Range</p>
            <p className="text-[9px] text-text-muted">Specify which approvals to export (e.g. 1-10 for first batch, 11-20 for next)</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-text-muted block mb-1">From #</label>
                <input
                  type="number"
                  min="1"
                  value={exportRangeStart}
                  onChange={(e) => setExportRangeStart(e.target.value)}
                  className="w-full text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>
              <span className="text-text-muted mt-4">—</span>
              <div className="flex-1">
                <label className="text-[9px] text-text-muted block mb-1">To #</label>
                <input
                  type="number"
                  min="1"
                  value={exportRangeEnd}
                  onChange={(e) => setExportRangeEnd(e.target.value)}
                  className="w-full text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={handleExportFilter}
            disabled={!exportFrom || !exportTo || exportLoading}
            className="w-full flex items-center justify-center gap-2 bg-sendme text-white py-2.5 rounded-lg text-[11px] font-semibold hover:bg-sendme/90 transition-colors disabled:opacity-50"
          >
            {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {exportLoading ? "Filtering..." : "Filter Approvals"}
          </button>

          {/* Results */}
          {exportSearched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-text-primary">
                  Results ({exportFiltered.length} of {exportApproved.length} total)
                </p>
                {exportFiltered.some((item) => item.alreadyExported) && (
                  <span className="text-[9px] font-semibold text-danger bg-danger-light px-2 py-0.5 rounded-full">
                    {exportFiltered.filter((item) => item.alreadyExported).length} duplicate(s)
                  </span>
                )}
              </div>

              {exportFiltered.length === 0 ? (
                <div className="text-center py-8 bg-surface-secondary/50 rounded-lg">
                  <p className="text-[11px] text-text-muted">No approved payouts found in this range</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {exportFiltered.map((item, i) => (
                    <div
                      key={item.id}
                      className={`rounded-lg p-3 border ${
                        item.alreadyExported
                          ? "bg-danger-light/30 border-danger/30"
                          : "bg-white border-border-light"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-text-muted w-5">#{i + 1}</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${
                            item.type === "driver" ? "bg-sendme text-white" :
                            item.type === "customer" ? "bg-purple-500 text-white" :
                            "bg-blue-500 text-white"
                          }`}>
                            {item.type === "driver" ? <User size={10} /> : item.type === "customer" ? <User size={10} /> : <Building2 size={10} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-text-primary">{item.user_name}</p>
                            <p className="text-[9px] text-text-muted">
                              {item.type === "driver" ? "Driver" : item.type === "customer" ? "Customer" : "Org"} — {item.bank_name} ({item.account_number})
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-text-primary">₦{item.amount.toLocaleString()}</p>
                          {item.alreadyExported ? (
                            <span className="text-[8px] font-semibold text-danger">ALREADY EXPORTED</span>
                          ) : (
                            <span className="text-[8px] font-semibold text-sendme">NEW</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {exportFiltered.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-center gap-2 bg-sendme text-white py-2.5 rounded-lg text-[11px] font-semibold hover:bg-sendme/90 transition-colors"
                >
                  <Download size={14} />
                  Export as CSV
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
