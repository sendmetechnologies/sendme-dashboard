"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { FilterSelect, StateFilter, DateRangeFilter } from "@/components/dashboard/filters"
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, ArrowDownRight, ArrowUpRight,
  Search, Download, Plus, Filter, RotateCcw, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, Clock, AlertTriangle, Trash2, Calendar, FileText,
  PieChart, Building2, User, Layers, ShieldCheck, X, Receipt, Server, Globe
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

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState<"rides" | "payouts" | "funding" | "costs">("rides")
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

  // Add Cost Modal
  const [isCostModalOpen, setIsCostModalOpen] = useState(false)
  const [costForm, setCostForm] = useState({
    category: "cloud_server",
    title: "",
    amount: "",
    vendor: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  })
  const [submittingCost, setSubmittingCost] = useState(false)

  // Derived cost figures
  const totalLoggedCostsAmount = useMemo(() => {
    return costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  }, [costs])

  const totalLoggedCostsFormatted = useMemo(() => {
    return totalLoggedCostsAmount > 0
      ? `₦${totalLoggedCostsAmount.toLocaleString()}`
      : summary?.totalOperationalCostsFormatted || "₦477,000"
  }, [totalLoggedCostsAmount, summary])

  // Core recurring burn (monthly)
  const monthlyBurnAmount = 126500
  const oct5BatchDueAmount = 112500
  const annualCommitmentsAmount = 168000

  const fetchRevenueData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (stateFilter) params.set("state", stateFilter)
      if (dateRangeFilter && dateRangeFilter !== "all") params.set("date_range", dateRangeFilter)
      if (streamFilter && streamFilter !== "all") params.set("stream", streamFilter)

      const res = await fetch(`/api/dashboard/revenue?${params.toString()}`)
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

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!costForm.title || !costForm.amount) {
      alert("Please fill in the expense title and amount.")
      return
    }

    setSubmittingCost(true)
    try {
      const res = await fetch("/api/dashboard/revenue/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costForm),
      })
      if (!res.ok) throw new Error("Failed to add cost")
      setIsCostModalOpen(false)
      setCostForm({
        category: "cloud_server",
        title: "",
        amount: "",
        vendor: "",
        date: new Date().toISOString().slice(0, 10),
        notes: "",
      })
      fetchRevenueData()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSubmittingCost(false)
    }
  }

  const handleDeleteCost = async (id: string) => {
    if (!confirm("Are you sure you want to remove this operational cost record?")) return
    try {
      await fetch(`/api/dashboard/revenue/costs?id=${id}`, { method: "DELETE" })
      fetchRevenueData()
    } catch (err) {
      console.error("Delete cost error:", err)
    }
  }

  const handleExportCSV = () => {
    let headers: string[] = []
    let rows: (string | number)[][] = []
    let filename = `sendme-financials-${new Date().toISOString().slice(0, 10)}.csv`

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
      headers = ["ID", "Category", "Expense Title", "Vendor", "Amount (₦)", "Date"]
      rows = costs.map(c => [c.id, c.categoryLabel, `"${c.title}"`, `"${c.vendor}"`, c.amount, c.date])
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

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Revenue & Financial Breakdown</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Audit platform cash inflows, ride commissions, Novac funding charges, driver payouts, and operational expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCostModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-border-default hover:bg-surface-hover px-3.5 py-2 rounded-lg text-xs font-semibold text-text-primary transition-colors shadow-xs"
          >
            <Plus size={14} className="text-sendme" /> Add Cost / Expense
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-sendme text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors shadow-xs"
          >
            <Download size={14} /> Export Financials (CSV)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-border-default rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by order ID, customer, rider or transaction ref..."
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
          <div className="pt-1 border-t border-border-light flex items-center justify-between">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-danger font-medium hover:underline px-2 py-1"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Gross GMV */}
        <Card className="p-3.5 min-w-0 overflow-hidden bg-white">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] text-text-muted truncate">Gross GMV (Inflow)</p>
            <div className="p-1 rounded-lg bg-sendme-50 text-sendme shrink-0">
              <TrendingUp size={14} />
            </div>
          </div>
          <p className="text-lg font-bold text-text-primary truncate">
            {summary?.totalGrossGMVFormatted || "₦0"}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {summary?.deliveredOrdersCount || 0} rides completed
          </p>
        </Card>

        {/* Platform Revenue */}
        <Card className="p-3.5 min-w-0 overflow-hidden bg-white border-sendme/30 ring-1 ring-sendme/20">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-sendme truncate">Platform Gross Cut</p>
            <div className="p-1 rounded-lg bg-sendme text-white shrink-0">
              <DollarSign size={14} />
            </div>
          </div>
          <p className="text-lg font-bold text-sendme truncate">
            {summary?.totalPlatformRevenueFormatted || "₦0"}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5 truncate">
            Commissions + ₦50 Novac fees
          </p>
        </Card>

        {/* Driver Earnings */}
        <Card className="p-3.5 min-w-0 overflow-hidden bg-white">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] text-text-muted truncate">Driver Share (85%)</p>
            <div className="p-1 rounded-lg bg-info-light text-info shrink-0">
              <Wallet size={14} />
            </div>
          </div>
          <p className="text-lg font-bold text-text-primary truncate">
            {summary?.totalDriverEarningsFormatted || "₦0"}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5 truncate">
            Retained in driver wallets
          </p>
        </Card>

        {/* Disbursed Payouts */}
        <Card className="p-3.5 min-w-0 overflow-hidden bg-white">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] text-text-muted truncate">Disbursed Payouts</p>
            <div className="p-1 rounded-lg bg-warning-light text-warning shrink-0">
              <ArrowDownRight size={14} />
            </div>
          </div>
          <p className="text-lg font-bold text-text-primary truncate">
            {summary?.totalPayoutsDisbursedFormatted || "₦0"}
          </p>
          <p className="text-[10px] text-warning font-medium mt-0.5 truncate">
            {summary?.totalPayoutsPendingFormatted || "₦0"} pending
          </p>
        </Card>

        {/* Operational Costs */}
        <Card className="p-3.5 min-w-0 overflow-hidden bg-white">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] text-text-muted truncate">Operating Expenses</p>
            <div className="p-1 rounded-lg bg-danger-light text-danger shrink-0">
              <Layers size={14} />
            </div>
          </div>
          <p className="text-lg font-bold text-danger truncate">
            {totalLoggedCostsFormatted}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5 truncate">
            {costs.length > 0 ? `${costs.length} verified ledger records` : "Historical logged expenses"}
          </p>
        </Card>

        {/* Monthly Running Burn */}
        <Card className="p-3.5 min-w-0 overflow-hidden bg-white border-danger/30 ring-1 ring-danger/10">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-danger truncate">Monthly Running Burn</p>
            <div className="p-1 rounded-lg bg-danger-light text-danger shrink-0">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-lg font-bold text-danger truncate">
            {monthlyRunning?.totalEstimatedMonthlyFormatted || "₦126,500"} / mo
          </p>
          <p className="text-[10px] text-text-muted mt-0.5 truncate">
            Next renewal: 5th Oct (₦112,500 batch)
          </p>
        </Card>

        {/* Net Operating Profit */}
        <Card className={`p-3.5 min-w-0 overflow-hidden ${
          (summary?.netOperatingProfit ?? 0) >= 0 ? "bg-sendme-50/50 border-sendme/40" : "bg-danger-light/50 border-danger/40"
        }`}>
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-[11px] font-bold text-text-primary truncate">Net EBITDA Profit</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              (summary?.netProfitMargin ?? 0) >= 0 ? "bg-sendme text-white" : "bg-danger text-white"
            }`}>
              {(summary?.netProfitMargin ?? 0) >= 0 ? "+" : ""}{summary?.netProfitMargin ?? 0}% Margin
            </span>
          </div>
          <p className={`text-lg font-bold truncate ${
            (summary?.netOperatingProfit ?? 0) >= 0 ? "text-sendme" : "text-danger"
          }`}>
            {summary?.netOperatingProfitFormatted || "₦0"}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5 truncate">
            Revenue minus operating costs
          </p>
        </Card>
      </div>

      {/* Visual Proportional Cashflow Bar */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary">Capital Flow Distribution</span>
          <span className="text-text-muted text-[11px]">Gross Volume: {summary?.totalGrossGMVFormatted || "₦0"}</span>
        </div>
        <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden flex">
          <div className="bg-info h-full" style={{ width: "80%" }} title="Driver Earnings Share (80-85%)" />
          <div className="bg-sendme h-full" style={{ width: "15%" }} title="SendMe Platform Cut (15%)" />
          <div className="bg-danger h-full" style={{ width: "5%" }} title="Operational Costs (5%)" />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-text-muted pt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-info" />
            <span>Driver Payout Base: ~85%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sendme" />
            <span>SendMe Gross Commission: ~15%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" />
            <span>Infrastructure & API Costs</span>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs for Details */}
      <div className="border-b border-border-light flex items-center gap-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab("rides")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "rides"
              ? "border-sendme text-sendme"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <DollarSign size={14} /> Ride Profit Ledger
          <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">
            {rides.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("payouts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "payouts"
              ? "border-sendme text-sendme"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <ArrowDownRight size={14} /> Payout Records
          <span className="text-[10px] font-semibold bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded-full">
            {payouts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("funding")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "funding"
              ? "border-sendme text-sendme"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Wallet size={14} /> Novac ₦50 Fee Logs
          <span className="text-[10px] font-semibold bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded-full">
            {funding.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("costs")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "costs"
              ? "border-sendme text-sendme"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Layers size={14} /> Operational Costs Ledger
          <span className="text-[10px] font-semibold bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded-full">
            {costs.length}
          </span>
        </button>
      </div>

      {/* Main Tabbed Content */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 size={24} className="animate-spin text-sendme mb-2" />
            <p className="text-xs text-text-muted">Loading live financial records...</p>
          </div>
        ) : activeTab === "rides" ? (
          // Ride Profit Dossier Table
          <div className="overflow-x-auto">
            {rides.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted text-xs">
                No ride transactions found matching filters
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Route & State</th>
                    <th className="px-4 py-3 font-semibold">Customer / Driver</th>
                    <th className="px-4 py-3 font-semibold">Customer Paid</th>
                    <th className="px-4 py-3 font-semibold">SendMe Cut (15%)</th>
                    <th className="px-4 py-3 font-semibold">Driver Share</th>
                    <th className="px-4 py-3 font-semibold">Payment / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {rides.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs text-text-primary">{r.shortId}</p>
                        <p className="text-[10px] text-text-muted">{r.date} · {r.time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary truncate max-w-[200px]">{r.route}</p>
                        <p className="text-[10px] text-text-muted">{r.state} · {r.vehicle}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-text-primary">{r.customer}</p>
                        <p className="text-[10px] text-text-muted">Rider: {r.driver}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-text-primary">{r.fareFormatted}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-sendme">{r.commissionFormatted}</span>
                          <span className="text-[9px] font-semibold bg-sendme-50 text-sendme px-1 py-0.5 rounded">
                            {r.commissionRate}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-text-secondary">{r.driverEarningFormatted}</span>
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
          // Payout Records Table
          <div className="overflow-x-auto">
            {payouts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted text-xs">
                No payout records found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Account Holder</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Requested Date</th>
                    <th className="px-4 py-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-hover transition-colors">
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
                      <td className="px-4 py-3 font-bold text-xs text-text-primary">{p.amountFormatted}</td>
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
        ) : activeTab === "funding" ? (
          // Novac Funding & Debit Logs Table
          <div className="overflow-x-auto">
            {funding.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted text-xs">
                No wallet funding records found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
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
                    <tr key={f.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">{f.ref}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{f.date}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-text-primary">{f.grossFormatted}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-sendme">+{f.feeFormatted}</span>
                        <span className="text-[10px] text-text-muted ml-1">(Platform Revenue)</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-text-secondary">{f.netFormatted}</td>
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
        ) : (
          // Operational Costs & Expenses Section
          <div className="space-y-4">
            {/* Proper Cost Figures & Intelligence Cards */}
            <div className="p-4 sm:p-5 bg-surface-secondary/40 border-b border-border-light space-y-4">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Operational Cost Command Center
                    </span>
                    <span className="bg-emerald-50 text-sendme border border-sendme/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      PostgreSQL Ledger · Audited Expenses
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Clear figures for all recurring cloud subscriptions, API quotas, messaging gateways, and developer licenses.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCostModalOpen(true)}
                    className="flex items-center gap-1.5 bg-sendme text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Record New Expense</span>
                  </button>
                </div>
              </div>

              {/* 4 Primary Proper Cost Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* Card 1: Cumulative Logged Expenses */}
                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Total Incurred (All-Time)
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-danger flex items-center justify-center">
                      <Receipt size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-danger font-mono tracking-tight">
                    {totalLoggedCostsFormatted}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light/70 text-[11px] text-text-muted">
                    <span>{costs.length} recorded items</span>
                    <span className="font-semibold text-text-primary">Audited Ledger</span>
                  </div>
                </div>

                {/* Card 2: Active Monthly Burn Rate */}
                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Monthly Running Burn
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-text-primary font-mono tracking-tight">
                    ~₦126,500 <span className="text-xs font-normal text-text-muted">/ mo</span>
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light/70 text-[11px] text-text-muted">
                    <span>Core operational burn</span>
                    <span className="text-amber-600 font-semibold">Active</span>
                  </div>
                </div>

                {/* Card 3: Upcoming Renewal Batch */}
                <div className="p-4 rounded-2xl bg-white border border-warning/30 ring-1 ring-warning/20 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
                      Next Batch Due (Oct 5th)
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-warning-light text-warning flex items-center justify-center">
                      <Calendar size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-warning font-mono tracking-tight">
                    ₦112,500
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light/70 text-[11px] text-text-muted">
                    <span>Supabase, Expo, Sendbyte, Maps</span>
                    <span className="font-semibold text-warning">Due 5th Oct</span>
                  </div>
                </div>

                {/* Card 4: Annual Commitments */}
                <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Annual Commitments
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ShieldCheck size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-indigo-700 font-mono tracking-tight">
                    ₦168,000 <span className="text-xs font-normal text-text-muted">/ yr</span>
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light/70 text-[11px] text-text-muted">
                    <span>Apple ($99) + Domain</span>
                    <span className="font-semibold text-indigo-600">Next: 2027</span>
                  </div>
                </div>
              </div>

              {/* Individual Vendor Figures Matrix */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                  Service & Vendor Cost Breakdown
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Supabase */}
                  <div className="p-3 rounded-xl bg-white border border-border-light hover:border-sendme/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Supabase Pro Tier</span>
                      <span className="text-xs font-bold text-danger font-mono">₦51,000/mo</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">Upgraded to $35/mo from 5th Oct</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>Backfilled: ₦148,000 (4 mos)</span>
                      <span className="font-semibold text-warning">Next: 5th Oct</span>
                    </div>
                  </div>

                  {/* Expo Pro */}
                  <div className="p-3 rounded-xl bg-white border border-border-light hover:border-sendme/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Expo Pro (EAS Builds)</span>
                      <span className="text-xs font-bold text-danger font-mono">₦28,000/mo</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">Mobile cloud build subscription</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>Backfilled: ₦84,000 (3 mos)</span>
                      <span className="font-semibold text-warning">Next: 5th Oct</span>
                    </div>
                  </div>

                  {/* Sendbyte */}
                  <div className="p-3 rounded-xl bg-white border border-border-light hover:border-sendme/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Sendbyte WhatsApp</span>
                      <span className="text-xs font-bold text-danger font-mono">₦15,000/mo</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">WhatsApp notification gateway</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>Backfilled: ₦15,000</span>
                      <span className="font-semibold text-warning">Next: 5th Oct</span>
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div className="p-3 rounded-xl bg-white border border-border-light hover:border-sendme/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Google Maps Utility</span>
                      <span className="text-xs font-bold text-danger font-mono">~₦18,500/mo</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">Expected $9–$15 range (₦14k–₦23k)</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>Last Bill: ₦30,000</span>
                      <span className="font-semibold text-warning">Next: 5th Oct</span>
                    </div>
                  </div>
                </div>

                {/* Additional 3 Service Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                  {/* Termii */}
                  <div className="p-3 rounded-xl bg-white border border-border-light">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Termii SMS & WhatsApp OTP</span>
                      <span className="text-xs font-bold text-text-primary font-mono">₦32,000</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">Pay-as-you-go (~₦14,000/mo average burn rate)</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>3 top-ups backfilled</span>
                      <span className="font-semibold text-sendme">Active Balance</span>
                    </div>
                  </div>

                  {/* Apple Dev */}
                  <div className="p-3 rounded-xl bg-white border border-border-light">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Apple Developer Membership</span>
                      <span className="text-xs font-bold text-indigo-700 font-mono">₦148,000</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">iOS App Store distribution license ($99/year)</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>Paid Sep 4, 2026</span>
                      <span className="font-semibold text-text-primary">Next: Sep 4, 2027</span>
                    </div>
                  </div>

                  {/* senndme.com */}
                  <div className="p-3 rounded-xl bg-white border border-border-light">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">senndme.com Domain</span>
                      <span className="text-xs font-bold text-indigo-700 font-mono">₦20,000</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">Annual domain renewal fee</p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-border-light">
                      <span>Paid Feb 15, 2026</span>
                      <span className="font-semibold text-text-primary">Next: Feb 2027</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table of Backfilled & Logged Expenses */}
            <div className="overflow-x-auto">
              {costs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted text-xs">
                  <p>No operational expenses recorded.</p>
                  <button
                    onClick={() => setIsCostModalOpen(true)}
                    className="mt-2 text-xs font-semibold text-sendme underline"
                  >
                    + Add first cost item
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Expense Description</th>
                      <th className="px-4 py-3 font-semibold">Vendor / Service</th>
                      <th className="px-4 py-3 font-semibold">Amount Paid</th>
                      <th className="px-4 py-3 font-semibold">Date Paid</th>
                      <th className="px-4 py-3 font-semibold">Next Billing Schedule</th>
                      <th className="px-4 py-3 font-semibold">Logged By</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {costs.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
                            {c.categoryLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-text-primary">{c.title}</p>
                          {c.notes && <p className="text-[10px] text-text-muted">{c.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{c.vendor}</td>
                        <td className="px-4 py-3 text-xs font-bold text-danger">₦{c.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-text-muted">{c.date}</td>
                        <td className="px-4 py-3 text-xs">
                          {c.nextPaymentNote ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-warning-light/70 text-warning px-2 py-0.5 rounded">
                              <Clock size={10} /> {c.nextPaymentNote}
                            </span>
                          ) : c.nextPaymentDate ? (
                            <span className="text-[10px] text-text-secondary">Next: {c.nextPaymentDate}</span>
                          ) : (
                            <span className="text-[10px] text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-text-secondary">
                          <span className="inline-flex items-center gap-1 bg-surface-secondary px-2 py-0.5 rounded-full text-[10px] font-semibold text-text-primary">
                            @{c.recordedBy || "admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteCost(c.id)}
                            className="p-1 text-text-muted hover:text-danger transition-colors"
                            title="Delete expense entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Add Cost / Expense Modal */}
      {isCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-border-default space-y-4">
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Add Operational Cost</h3>
                <p className="text-xs text-text-muted mt-0.5">Record platform overhead, SMS, Map API, or marketing fees.</p>
              </div>
              <button onClick={() => setIsCostModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCost} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Expense Category</label>
                <select
                  value={costForm.category}
                  onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
                  className="w-full text-xs border border-border-default rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-sendme"
                >
                  <option value="cloud_server">Cloud Hosting & Supabase DB</option>
                  <option value="maps_api">Google Maps & Geocoding API</option>
                  <option value="sms_otp">SMS & OTP Verification (Termii/Twilio)</option>
                  <option value="marketing">Rider & Customer Acquisition Promo</option>
                  <option value="refunds">Customer / Rider Dispute Refund</option>
                  <option value="equipment">Branding (Vests, Helmets, Delivery Boxes)</option>
                  <option value="legal">Legal, CAC & Compliance</option>
                  <option value="other">General Administrative Overhead</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Expense Title / Item</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Cloud Maps billing for current month"
                  value={costForm.title}
                  onChange={(e) => setCostForm({ ...costForm, title: e.target.value })}
                  className="w-full text-xs border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 35000"
                    value={costForm.amount}
                    onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                    className="w-full text-xs border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">Date Incurred</label>
                  <input
                    type="date"
                    required
                    value={costForm.date}
                    onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                    className="w-full text-xs border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Google Cloud, Termii, Facebook Ads"
                  value={costForm.vendor}
                  onChange={(e) => setCostForm({ ...costForm, vendor: e.target.value })}
                  className="w-full text-xs border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Optional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or invoice reference number..."
                  value={costForm.notes}
                  onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
                  className="w-full text-xs border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCost}
                  className="bg-sendme text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors disabled:opacity-50"
                >
                  {submittingCost ? "Recording..." : "Save Cost"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
