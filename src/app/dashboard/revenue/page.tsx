"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { FilterSelect, StateFilter, DateRangeFilter } from "@/components/dashboard/filters"
import {
  TrendingUp, DollarSign, Wallet, ArrowDownRight,
  Search, Download, Plus, RotateCcw,
  Loader2, CheckCircle, Clock, AlertTriangle, Trash2, Calendar,
  Layers, ShieldCheck, X, Receipt, RefreshCw,
  Tag, ExternalLink, ArrowRight
} from "lucide-react"

interface SummaryData {
  totalGrossGMV: number
  totalGrossGMVFormatted: string
  totalPlatformRevenue: number
  totalPlatformRevenueFormatted: string
  totalPlatformCommission: number
  totalPlatformCommissionFormatted: string
  totalNovacFeesCollected: number
  totalNovacFeesCollectedFormatted: string
  totalDriverEarnings: number
  totalDriverEarningsFormatted: string
  totalPayoutsDisbursed: number
  totalPayoutsDisbursedFormatted: string
  totalPayoutsPending: number
  totalPayoutsPendingFormatted: string
  totalOperationalCosts: number
  totalOperationalCostsFormatted: string
  totalMonthlyRunningCost?: number
  totalMonthlyRunningCostFormatted?: string
  netOperatingProfit: number
  netOperatingProfitFormatted: string
  netProfitMargin: number
  deliveredOrdersCount: number
  totalOrdersCount: number
}

interface MonthlyRunningCostSummary {
  totalEstimatedMonthly: number
  totalEstimatedMonthlyFormatted: string
  recurringServices: {
    name: string
    vendor: string
    frequency: string
    costFormatted: string
    nextDueDate: string
    status: string
  }[]
  annualCommitments: {
    name: string
    costFormatted: string
    nextDueDate: string
  }[]
  nextPaymentTimeline: {
    dueDate: string
    service: string
    amountFormatted: string
    note: string
  }[]
}

interface RideRecord {
  id: string
  shortId: string
  date: string
  time: string
  customer: string
  driver: string
  route: string
  state: string
  vehicle: string
  fare: number
  fareFormatted: string
  commission: number
  commissionFormatted: string
  commissionRate: string
  driverEarning: number
  driverEarningFormatted: string
  paymentMethod: string
  status: string
  statusColor: string
}

interface PayoutRecord {
  id: string
  shortId: string
  type: string
  name: string
  phone: string
  amount: number
  amountFormatted: string
  status: string
  statusColor: string
  date: string
  note: string
}

interface FundingRecord {
  id: string
  ref: string
  date: string
  grossAmount: number
  feeDeducted: number
  netCredited: number
  grossFormatted: string
  feeFormatted: string
  netFormatted: string
  status: string
  note: string
}

interface CostRecord {
  id: string
  category: string
  categoryLabel: string
  title: string
  amount: number
  vendor: string
  date: string
  notes?: string
  recordedBy?: string
  frequency?: string
  nextPaymentDate?: string
  nextPaymentAmount?: number
  nextPaymentNote?: string
}

type TabType = "costs" | "rides" | "payouts" | "funding"
type SideviewMode = "none" | "create_cost" | "view_cost" | "view_ride"

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState<TabType>("costs")
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [monthlyRunning, setMonthlyRunning] = useState<MonthlyRunningCostSummary | null>(null)
  const [rides, setRides] = useState<RideRecord[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [funding, setFunding] = useState<FundingRecord[]>([])
  const [costs, setCosts] = useState<CostRecord[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [dateRangeFilter, setDateRangeFilter] = useState("all")
  const [streamFilter, setStreamFilter] = useState("all")

  // Sideview Bar State
  const [sideviewMode, setSideviewMode] = useState<SideviewMode>("none")
  const [selectedCost, setSelectedCost] = useState<CostRecord | null>(null)
  const [selectedRide, setSelectedRide] = useState<RideRecord | null>(null)

  // Cost Form State
  const [costForm, setCostForm] = useState({
    category: "cloud_server",
    title: "",
    amount: "",
    vendor: "",
    date: new Date().toISOString().slice(0, 10),
    frequency: "monthly",
    nextPaymentDate: "",
    nextPaymentAmount: "",
    nextPaymentNote: "",
    notes: "",
  })
  const [submittingCost, setSubmittingCost] = useState(false)
  const [formError, setFormError] = useState("")

  // Derived figures
  const totalLoggedCostsAmount = useMemo(() => {
    return costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  }, [costs])

  const totalLoggedCostsFormatted = useMemo(() => {
    return totalLoggedCostsAmount > 0
      ? `₦${totalLoggedCostsAmount.toLocaleString()}`
      : summary?.totalOperationalCostsFormatted || "₦477,000"
  }, [totalLoggedCostsAmount, summary])

  const fetchRevenueData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (stateFilter) params.set("state", stateFilter)
      if (dateRangeFilter && dateRangeFilter !== "all") params.set("date_range", dateRangeFilter)
      if (streamFilter && streamFilter !== "all") params.set("stream", streamFilter)

      const res = await fetch(`/api/dashboard/revenue?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load revenue data")
      const data = await res.json()

      setSummary(data.summary || null)
      setMonthlyRunning(data.monthlyRunningCost || null)
      setRides(data.ridesLedger || [])
      setPayouts(data.payouts || [])
      setFunding(data.fundingRecords || [])
      setCosts(data.operationalCosts || [])
    } catch (err) {
      console.error("[RevenuePage] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, stateFilter, dateRangeFilter, streamFilter])

  useEffect(() => {
    fetchRevenueData()
  }, [fetchRevenueData])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStateFilter("")
    setDateRangeFilter("all")
    setStreamFilter("all")
  }

  const hasActiveFilters = Boolean(
    searchQuery || stateFilter || (dateRangeFilter && dateRangeFilter !== "all") || (streamFilter && streamFilter !== "all")
  )

  const openCreateCostSideview = () => {
    setCostForm({
      category: "cloud_server",
      title: "",
      amount: "",
      vendor: "",
      date: new Date().toISOString().slice(0, 10),
      frequency: "monthly",
      nextPaymentDate: "",
      nextPaymentAmount: "",
      nextPaymentNote: "",
      notes: "",
    })
    setFormError("")
    setSideviewMode("create_cost")
  }

  const openViewCostSideview = (cost: CostRecord) => {
    setSelectedCost(cost)
    setSideviewMode("view_cost")
  }

  const openViewRideSideview = (ride: RideRecord) => {
    setSelectedRide(ride)
    setSideviewMode("view_ride")
  }

  const closeSideview = () => {
    setSideviewMode("none")
    setSelectedCost(null)
    setSelectedRide(null)
    setFormError("")
  }

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!costForm.title.trim() || !costForm.amount) {
      setFormError("Please provide an expense title and amount.")
      return
    }

    setSubmittingCost(true)
    try {
      const res = await fetch("/api/dashboard/revenue/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record expense")

      closeSideview()
      fetchRevenueData()
    } catch (err: any) {
      setFormError(err.message || "Failed to save expense")
    } finally {
      setSubmittingCost(false)
    }
  }

  const handleDeleteCost = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this operational expense record?")) return
    try {
      const res = await fetch(`/api/dashboard/revenue/costs?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        closeSideview()
        fetchRevenueData()
      }
    } catch (err) {
      console.error("Delete cost error:", err)
    }
  }

  const handleExportCSV = () => {
    let headers: string[] = []
    let rows: (string | number)[][] = []
    const filename = `sendme-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`

    if (activeTab === "rides") {
      headers = ["Order ID", "Date", "Customer", "Driver", "Route", "State", "Vehicle", "Fare (₦)", "Commission (₦)", "Commission %", "Driver Earning (₦)", "Status"]
      rows = rides.map(r => [r.shortId, r.date, `"${r.customer}"`, `"${r.driver}"`, `"${r.route}"`, r.state, r.vehicle, r.fare, r.commission, r.commissionRate, r.driverEarning, r.status])
    } else if (activeTab === "payouts") {
      headers = ["Payout ID", "Recipient", "Type", "Phone", "Amount (₦)", "Status", "Date", "Note"]
      rows = payouts.map(p => [p.shortId, `"${p.name}"`, p.type, p.phone, p.amount, p.status, p.date, `"${p.note}"`])
    } else if (activeTab === "funding") {
      headers = ["Reference", "Date", "Gross Amount (₦)", "Novac Fee (₦)", "Net Credited (₦)", "Status", "Note"]
      rows = funding.map(f => [f.ref, f.date, f.grossAmount, f.feeDeducted, f.netCredited, f.status, `"${f.note}"`])
    } else {
      headers = ["ID", "Category", "Expense Title", "Vendor", "Amount (₦)", "Date Paid", "Frequency", "Next Due", "Logged By"]
      rows = costs.map(c => [c.id, c.categoryLabel, `"${c.title}"`, `"${c.vendor}"`, c.amount, c.date, c.frequency || "monthly", c.nextPaymentDate || "—", c.recordedBy || "admin"])
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encoded = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encoded)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Unified Stat Cards
  const statCards = [
    {
      label: "Platform Revenue",
      value: summary?.totalPlatformRevenueFormatted || "₦0",
      sub: "15% commission + ₦50 Novac fees",
      icon: DollarSign,
      color: "text-sendme",
      bg: "bg-sendme-50",
    },
    {
      label: "Gross Delivery GMV",
      value: summary?.totalGrossGMVFormatted || "₦0",
      sub: `${summary?.deliveredOrdersCount || 0} completed deliveries`,
      icon: TrendingUp,
      color: "text-sendme",
      bg: "bg-sendme-50",
    },
    {
      label: "Driver Payout Base",
      value: summary?.totalDriverEarningsFormatted || "₦0",
      sub: "85% retained by riders",
      icon: Wallet,
      color: "text-text-primary",
      bg: "bg-surface-secondary",
    },
    {
      label: "Operating Expenses",
      value: totalLoggedCostsFormatted,
      sub: `${costs.length} verified records · ~₦126.5k/mo`,
      icon: Layers,
      color: "text-danger",
      bg: "bg-danger-light",
    },
    {
      label: "Net EBITDA Profit",
      value: summary?.netOperatingProfitFormatted || "₦0",
      sub: `${(summary?.netProfitMargin ?? 0) >= 0 ? "+" : ""}${summary?.netProfitMargin ?? 0}% profit margin`,
      icon: ShieldCheck,
      color: (summary?.netOperatingProfit ?? 0) >= 0 ? "text-sendme" : "text-danger",
      bg: (summary?.netOperatingProfit ?? 0) >= 0 ? "bg-sendme-50" : "bg-danger-light",
    },
  ]

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "costs", label: "Operating Expenses", count: costs.length },
    { id: "rides", label: "Ride Commissions", count: rides.length },
    { id: "payouts", label: "Payout Records", count: payouts.length },
    { id: "funding", label: "Novac ₦50 Fee Logs", count: funding.length },
  ]

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Revenue & Financials</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Audit platform cash inflows, ride commissions, Novac funding charges, driver payouts, and operational expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRevenueData()}
            className="p-2 bg-white border border-border-default rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-sendme" : ""} />
          </button>
          <button
            onClick={openCreateCostSideview}
            className="flex items-center gap-2 bg-sendme text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors shadow-xs"
          >
            <Plus size={14} /> Record Expense
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-border-default hover:bg-surface-hover px-3.5 py-2 rounded-lg text-xs font-semibold text-text-primary transition-colors shadow-xs"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Realigned 5-Card Metric Overview (Matches standard dashboard layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-3.5 min-w-0 overflow-hidden bg-white border border-border-default rounded-xl">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-[11px] font-medium text-text-muted truncate">{card.label}</p>
                <div className={`p-1.5 rounded-lg ${card.bg} ${card.color} shrink-0`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-lg lg:text-xl font-bold text-text-primary truncate font-mono tracking-tight">
                {card.value}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 truncate">
                {card.sub}
              </p>
            </Card>
          )
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border-default rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search order ID, rider, recipient, vendor or expense..."
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

          {/* Date Range Filter */}
          <DateRangeFilter value={dateRangeFilter} onChange={setDateRangeFilter} />

          {/* Revenue Stream Filter */}
          <FilterSelect
            value={streamFilter}
            onChange={setStreamFilter}
            placeholder="All Revenue Streams"
            options={[
              { value: "ride_commission", label: "Ride Commissions (15%)" },
              { value: "novac_fees", label: "Novac ₦50 Funding Fees" },
              { value: "payouts", label: "Driver/Org Payout Records" },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="pt-2 border-t border-border-light flex items-center justify-between">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-danger font-medium hover:underline px-1 py-0.5"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white border border-border-default rounded-xl p-1 w-full sm:w-fit overflow-x-auto no-scrollbar shadow-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-sendme text-white shadow-xs"
                : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-surface-secondary text-text-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Tabbed Content Card */}
      <Card className="overflow-hidden bg-white border border-border-default rounded-xl shadow-xs">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 size={24} className="animate-spin text-sendme mb-2" />
            <p className="text-xs text-text-muted">Loading live financial records...</p>
          </div>
        ) : activeTab === "costs" ? (
          /* Operational Costs Ledger */
          <div className="divide-y divide-border-light">
            {/* Clean Monthly Subscriptions Summary Bar (Realigned from scattered boxes) */}
            <div className="p-4 bg-surface-secondary/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-danger-light text-danger flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Operational Running Costs
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-sendme border border-sendme/20">
                      PostgreSQL Ledger
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Estimated monthly burn: <span className="font-semibold text-text-primary font-mono">~₦126,500/mo</span> (Supabase, Expo, Sendbyte, Maps, Termii) · Next batch due <span className="font-semibold text-warning">5th Oct (₦112,500)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={openCreateCostSideview}
                  className="flex items-center gap-1.5 bg-sendme text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors shadow-xs"
                >
                  <Plus size={14} /> Record Expense
                </button>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              {costs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted text-xs">
                  <p>No operational expenses recorded.</p>
                  <button
                    onClick={openCreateCostSideview}
                    className="mt-2 text-xs font-semibold text-sendme underline"
                  >
                    + Record first operational expense
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/40">
                      <th className="px-4 py-3 font-semibold">Expense / Service</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Vendor</th>
                      <th className="px-4 py-3 font-semibold">Amount Paid</th>
                      <th className="px-4 py-3 font-semibold">Date Paid</th>
                      <th className="px-4 py-3 font-semibold">Billing Schedule</th>
                      <th className="px-4 py-3 font-semibold">Logged By</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {costs.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => openViewCostSideview(c)}
                        className="hover:bg-surface-hover/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary group-hover:text-sendme transition-colors">
                            {c.title}
                          </p>
                          {c.notes && (
                            <p className="text-[10px] text-text-muted truncate max-w-[220px]">
                              {c.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-md border border-border-light">
                            {c.categoryLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {c.vendor}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-danger font-mono">
                          ₦{c.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {c.date}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {c.nextPaymentNote ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-warning-light/70 text-warning px-2 py-0.5 rounded">
                              <Clock size={10} /> {c.nextPaymentNote}
                            </span>
                          ) : c.nextPaymentDate ? (
                            <span className="text-[10px] text-text-secondary font-medium">
                              Next: {c.nextPaymentDate}
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-muted">
                              {c.frequency || "one_off"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-text-secondary">
                          <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-0.5 rounded-full text-[10px] font-semibold text-text-primary">
                            @{c.recordedBy || "admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCost(c.id)
                            }}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-md transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : activeTab === "rides" ? (
          /* Ride Profit Dossier Table */
          <div className="overflow-x-auto">
            {rides.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted text-xs">
                No ride transactions found matching filters
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/40">
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Route & State</th>
                    <th className="px-4 py-3 font-semibold">Customer / Driver</th>
                    <th className="px-4 py-3 font-semibold">Gross Fare</th>
                    <th className="px-4 py-3 font-semibold">Platform Cut (15%)</th>
                    <th className="px-4 py-3 font-semibold">Driver Share (85%)</th>
                    <th className="px-4 py-3 font-semibold">Payment / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {rides.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => openViewRideSideview(r)}
                      className="hover:bg-surface-hover/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs text-text-primary group-hover:text-sendme transition-colors">
                          {r.shortId}
                        </p>
                        <p className="text-[10px] text-text-muted">{r.date} · {r.time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary truncate max-w-[200px]">{r.route}</p>
                        <p className="text-[10px] text-text-muted">{r.state} · {r.vehicle}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-text-primary font-medium">{r.customer}</p>
                        <p className="text-[10px] text-text-muted">Rider: {r.driver}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-text-primary font-mono">{r.fareFormatted}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-sendme font-mono">{r.commissionFormatted}</span>
                          <span className="text-[9px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.2 rounded">
                            {r.commissionRate}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-text-secondary font-mono">{r.driverEarningFormatted}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.statusColor}`}>
                          {r.status}
                        </span>
                        <p className="text-[10px] text-text-muted mt-0.5">{r.paymentMethod}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === "payouts" ? (
          /* Payout Records Table */
          <div className="overflow-x-auto">
            {payouts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted text-xs">
                No payout records found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/40">
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Recipient</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Requested Date</th>
                    <th className="px-4 py-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-hover/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">{p.shortId}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-text-primary">{p.name}</p>
                        <p className="text-[10px] text-text-muted font-mono">{p.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-xs text-text-primary font-mono">{p.amountFormatted}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.statusColor}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{p.date}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Novac Funding & Debit Logs Table */
          <div className="overflow-x-auto">
            {funding.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted text-xs">
                No wallet funding records found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/40">
                    <th className="px-4 py-3 font-semibold">Transaction Ref</th>
                    <th className="px-4 py-3 font-semibold">Deposit Date</th>
                    <th className="px-4 py-3 font-semibold">Gross Funded (Novac)</th>
                    <th className="px-4 py-3 font-semibold">Fee Deducted (SendMe)</th>
                    <th className="px-4 py-3 font-semibold">Net Wallet Credited</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {funding.map((f) => (
                    <tr key={f.id} className="hover:bg-surface-hover/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">{f.ref}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{f.date}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-text-primary font-mono">{f.grossFormatted}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-sendme font-mono">+{f.feeFormatted}</span>
                        <span className="text-[10px] text-text-muted ml-1">(Platform Revenue)</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-text-secondary font-mono">{f.netFormatted}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* SIDEVIEW BAR DISPLAY (Slide-over drawer on the right edge - NO POPUP)     */}
      {/* ========================================================================= */}
      {sideviewMode !== "none" && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
            onClick={closeSideview}
          />

          {/* Slide-over Right Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-300">
              {/* Sideview Header */}
              <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {sideviewMode === "create_cost"
                      ? "Record Operating Expense"
                      : sideviewMode === "view_cost"
                      ? "Expense Record Details"
                      : "Ride Profit Breakdown"}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {sideviewMode === "create_cost"
                      ? "Add a recurring subscription, API quota or overhead fee."
                      : sideviewMode === "view_cost"
                      ? "Audit details and payment renewal schedule."
                      : "Platform 15% commission vs rider earning."}
                  </p>
                </div>
                <button
                  onClick={closeSideview}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sideview Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {sideviewMode === "create_cost" && (
                  <form id="cost-sideview-form" onSubmit={handleAddCost} className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-danger-light border border-danger/20 rounded-lg text-xs text-danger font-medium flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                        Expense Category *
                      </label>
                      <select
                        value={costForm.category}
                        onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
                        className="w-full text-xs border border-border-default rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-sendme font-medium"
                      >
                        <option value="cloud_server">Cloud Hosting & Mobile Builds (Supabase, Expo)</option>
                        <option value="maps_api">Google Maps & Geocoding API</option>
                        <option value="sms_otp">SMS & OTP Verification (Termii, Twilio)</option>
                        <option value="marketing">Marketing & WhatsApp Gateway (Sendbyte)</option>
                        <option value="legal">Developer Licenses & Legal (Apple, Google Play)</option>
                        <option value="other">Domain Registration & General Overhead</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                        Expense Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Supabase Pro Database (October)"
                        value={costForm.title}
                        onChange={(e) => setCostForm({ ...costForm, title: e.target.value })}
                        className="w-full text-xs border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                          Amount (₦) *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 51000"
                          value={costForm.amount}
                          onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                          className="w-full text-xs border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                          Vendor / Service
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Supabase Inc."
                          value={costForm.vendor}
                          onChange={(e) => setCostForm({ ...costForm, vendor: e.target.value })}
                          className="w-full text-xs border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                          Date Paid
                        </label>
                        <input
                          type="date"
                          value={costForm.date}
                          onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                          className="w-full text-xs border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                          Billing Frequency
                        </label>
                        <select
                          value={costForm.frequency}
                          onChange={(e) => setCostForm({ ...costForm, frequency: e.target.value })}
                          className="w-full text-xs border border-border-default rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-sendme"
                        >
                          <option value="monthly">Monthly Recurring</option>
                          <option value="yearly">Yearly Commitment</option>
                          <option value="usage_based">Usage-based Credit</option>
                          <option value="one_off">One-off Payment</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-surface-secondary/70 rounded-xl border border-border-light space-y-3">
                      <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider block">
                        Renewal & Next Schedule (Optional)
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] text-text-muted block mb-1">Next Payment Date</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026-10-05"
                            value={costForm.nextPaymentDate}
                            onChange={(e) => setCostForm({ ...costForm, nextPaymentDate: e.target.value })}
                            className="w-full text-xs border border-border-default rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-sendme"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted block mb-1">Expected Amount (₦)</label>
                          <input
                            type="number"
                            placeholder="e.g. 51000"
                            value={costForm.nextPaymentAmount}
                            onChange={(e) => setCostForm({ ...costForm, nextPaymentAmount: e.target.value })}
                            className="w-full text-xs border border-border-default rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-sendme font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted block mb-1">Renewal Note / Plan Tier</label>
                        <input
                          type="text"
                          placeholder="e.g. Due 5th Oct: $35 upward"
                          value={costForm.nextPaymentNote}
                          onChange={(e) => setCostForm({ ...costForm, nextPaymentNote: e.target.value })}
                          className="w-full text-xs border border-border-default rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-sendme"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                        Notes & Invoice Details
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add invoice reference, billing period, receipt notes..."
                        value={costForm.notes}
                        onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
                        className="w-full text-xs border border-border-default rounded-lg p-2.5 focus:outline-none focus:border-sendme resize-none"
                      />
                    </div>
                  </form>
                )}

                {sideviewMode === "view_cost" && selectedCost && (
                  <div className="space-y-4">
                    {/* Amount Banner */}
                    <div className="p-4 bg-surface-secondary/70 rounded-xl border border-border-light text-center">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
                        Expense Amount Paid
                      </span>
                      <p className="text-2xl font-bold text-danger font-mono mt-1">
                        ₦{selectedCost.amount.toLocaleString()}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary">
                        <Tag size={12} className="text-sendme" />
                        <span>{selectedCost.categoryLabel}</span>
                      </div>
                    </div>

                    {/* Breakdown Items */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Expense Item</span>
                        <span className="font-semibold text-text-primary text-right">{selectedCost.title}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Vendor / Provider</span>
                        <span className="font-semibold text-text-primary">{selectedCost.vendor}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Payment Date</span>
                        <span className="font-semibold text-text-primary font-mono">{selectedCost.date}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Billing Cycle</span>
                        <span className="font-semibold text-text-primary capitalize">{selectedCost.frequency || "Monthly"}</span>
                      </div>
                      {selectedCost.nextPaymentNote && (
                        <div className="flex items-start justify-between p-2.5 bg-warning-light/40 rounded-lg border border-warning/20">
                          <span className="text-warning font-medium">Renewal Schedule</span>
                          <span className="font-bold text-warning text-right">{selectedCost.nextPaymentNote}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Logged By Admin</span>
                        <span className="font-semibold text-text-primary bg-surface-secondary px-2 py-0.5 rounded-full text-[11px]">
                          @{selectedCost.recordedBy || "admin"}
                        </span>
                      </div>
                    </div>

                    {selectedCost.notes && (
                      <div className="p-3 bg-surface-secondary/40 rounded-xl border border-border-light">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                          Notes & Ledger Record
                        </span>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {selectedCost.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {sideviewMode === "view_ride" && selectedRide && (
                  <div className="space-y-4">
                    {/* Fare Summary Box */}
                    <div className="p-4 bg-surface-secondary/70 rounded-xl border border-border-light text-center">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
                        Customer Paid (Gross Fare)
                      </span>
                      <p className="text-2xl font-bold text-text-primary font-mono mt-1">
                        {selectedRide.fareFormatted}
                      </p>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-light">
                        <div>
                          <span className="text-[10px] text-text-muted block">Platform Cut (15%)</span>
                          <span className="font-bold text-sendme font-mono">{selectedRide.commissionFormatted}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-muted block">Driver Share (85%)</span>
                          <span className="font-bold text-text-secondary font-mono">{selectedRide.driverEarningFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Order ID</span>
                        <span className="font-semibold text-text-primary font-mono">{selectedRide.shortId}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Delivery Route</span>
                        <span className="font-semibold text-text-primary truncate max-w-[200px]">{selectedRide.route}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">State / Territory</span>
                        <span className="font-semibold text-text-primary">{selectedRide.state}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Customer</span>
                        <span className="font-semibold text-text-primary">{selectedRide.customer}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Rider Assigned</span>
                        <span className="font-semibold text-text-primary">{selectedRide.driver}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Payment Method</span>
                        <span className="font-semibold text-text-primary">{selectedRide.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border-light">
                        <span className="text-text-muted">Delivery Status</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selectedRide.statusColor}`}>
                          {selectedRide.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sideview Footer */}
              <div className="px-5 py-3.5 border-t border-border-light bg-surface-secondary/40 flex items-center justify-between">
                {sideviewMode === "create_cost" ? (
                  <>
                    <button
                      type="button"
                      onClick={closeSideview}
                      className="px-3.5 py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="cost-sideview-form"
                      disabled={submittingCost}
                      className="flex items-center gap-1.5 bg-sendme text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors shadow-xs disabled:opacity-50"
                    >
                      {submittingCost ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Expense"
                      )}
                    </button>
                  </>
                ) : sideviewMode === "view_cost" && selectedCost ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDeleteCost(selectedCost.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-danger hover:underline px-1 py-1"
                    >
                      <Trash2 size={13} /> Delete Record
                    </button>
                    <button
                      type="button"
                      onClick={closeSideview}
                      className="px-3.5 py-2 bg-white border border-border-default hover:bg-surface-hover rounded-lg text-xs font-semibold text-text-primary transition-colors"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={closeSideview}
                    className="w-full py-2 bg-white border border-border-default hover:bg-surface-hover rounded-lg text-xs font-semibold text-text-primary transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
