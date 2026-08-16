"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import {
  Users, Truck, Building2, DollarSign, Package,
  ArrowRight, TrendingUp, TrendingDown, Loader2, Calendar
} from "lucide-react"

interface DashboardStats {
  senders: { total: number; active: number; verified: number; suspended: number }
  riders: { total: number; verified: number; pending: number; suspended: number }
  organizations: { total: number; verified: number; pending: number; suspended: number }
  payouts: { total: number; totalFunds: number; totalRequests: number; recent: number; pending: number }
  deliveries: { total: number; completed: number; searching: number; inTransit: number; failed: number }
}

interface Delta {
  current: number; previous: number; delta: number; deltaPercent: number; direction: "up" | "down" | "flat"
}

interface Comparison {
  deliveries: Delta; revenue: Delta; newSenders: Delta; newRiders: Delta; newOrgs: Delta; newMarketers: Delta; payouts: Delta
}

interface ChartData {
  deliveries: { label: string; value: number; prevValue: number }[]
  revenue: { label: string; value: number; prevValue: number }[]
  userGrowth: { label: string; senders: number; riders: number; orgs: number; marketers: number; prevSenders: number; prevRiders: number; prevOrgs: number; prevMarketers: number }[]
  payoutTrend: { label: string; amount: number; prevAmount: number }[]
}

interface RecentData {
  deliveries: { id: string; status: string; from: string; to: string; price: number; created_at: string }[]
  riders: { id: string; name: string; phone: string; status: string; rating: number; vehicle: string; created_at: string }[]
  senders: { id: string; name: string; email: string; phone: string; created_at: string }[]
  organizations: { id: string; name: string; contact: string; email: string; verified: boolean; created_at: string }[]
}

type Tab = "deliveries" | "riders" | "senders" | "organizations"
type Period = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "custom"

const periods: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "this_year", label: "This Year" },
]

function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (["delivered", "completed", "verified", "paid", "active"].includes(s)) return "bg-sendme-50 text-sendme"
  if (["pending", "searching", "bidding", "under_review"].includes(s)) return "bg-warning-light text-warning"
  if (["canceled", "failed", "rejected", "suspended"].includes(s)) return "bg-danger-light text-danger"
  if (["accepted", "picked_up", "in_transit", "processing"].includes(s)) return "bg-info-light text-info"
  return "bg-surface-secondary text-text-muted"
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function fmtAmt(v: number): string {
  if (v >= 1e9) return `₦${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `₦${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `₦${(v / 1e3).toFixed(1)}K`
  return `₦${v.toLocaleString()}`
}

function SubStat({ label, value, color = "text-text-secondary", format }: { label: string; value: number; color?: string; format?: string }) {
  const displayValue = format === "currency" ? fmtAmt(value) : value.toLocaleString()
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-lg font-bold ${color}`}>{displayValue}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  )
}

function StatCard({ label, icon: Icon, total, subs }: { label: string; icon: React.ElementType; total: number; subs: { label: string; value: number; color?: string; format?: string }[] }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-sendme-50 text-sendme"><Icon size={20} /></div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-text-primary mb-3">{total.toLocaleString()}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-border-light">
        {subs.map((s) => <SubStat key={s.label} {...s} />)}
      </div>
    </Card>
  )
}

function ComparisonBadge({ d, label }: { d: Delta; label?: string }) {
  if (d.direction === "flat") return <span className="text-[11px] font-medium text-text-muted">No change</span>
  const Icon = d.direction === "up" ? TrendingUp : TrendingDown
  const color = d.direction === "up" ? "text-sendme" : "text-danger"
  const prefix = d.direction === "up" ? "+" : ""
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold ${color}`}>
      <Icon size={12} />
      {prefix}{d.deltaPercent}%{label ? ` vs ${label}` : ""}
    </span>
  )
}

export default function DashboardOverview() {
  const [activeTab, setActiveTab] = useState<Tab>("deliveries")
  const [period, setPeriod] = useState<Period>("this_week")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [periodInfo, setPeriodInfo] = useState<{ current: string; previous: string; groupBy: string } | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [recent, setRecent] = useState<RecentData | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (period === "custom") {
      if (customFrom) params.set("from", customFrom)
      if (customTo) params.set("to", customTo)
    }
    fetch(`/api/dashboard/overview?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        setComparison(data.comparison)
        setPeriodInfo(data.period)
        setCharts(data.charts)
        setRecent(data.recent)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period, customFrom, customTo])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-sendme" />
      </div>
    )
  }

  if (!stats || !charts || !recent) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-text-muted text-sm">Failed to load dashboard data</p>
      </div>
    )
  }

  const tabData: Record<Tab, { label: string; count: number }> = {
    deliveries: { label: "Deliveries", count: stats.deliveries.total },
    riders: { label: "Riders", count: stats.riders.total },
    senders: { label: "Senders", count: stats.senders.total },
    organizations: { label: "Organizations", count: stats.organizations.total },
  }

  const tabHeaders: Record<Tab, string[]> = {
    deliveries: ["Order ID", "Status", "Route", "Created"],
    riders: ["Name", "Phone", "Vehicle", "Rating", "Status"],
    senders: ["Name", "Email", "Phone", "Joined"],
    organizations: ["Organization", "Contact", "Status"],
  }

  const chartSubtitle = (unit: string) => {
    if (unit === "h") return "Hourly breakdown"
    if (unit === "m") return "Monthly breakdown"
    return "Daily breakdown"
  }

  const prevLabel = periodInfo?.previous || "previous period"

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Senders" icon={Users} total={stats.senders.total} subs={[
          { label: "active", value: stats.senders.active, color: "text-sendme" },
          { label: "verified", value: stats.senders.verified },
          { label: "suspended", value: stats.senders.suspended, color: "text-danger" },
        ]} />
        <StatCard label="Riders" icon={Truck} total={stats.riders.total} subs={[
          { label: "verified", value: stats.riders.verified, color: "text-sendme" },
          { label: "pending", value: stats.riders.pending, color: "text-warning" },
          { label: "suspended", value: stats.riders.suspended, color: "text-danger" },
        ]} />
        <StatCard label="Organizations" icon={Building2} total={stats.organizations.total} subs={[
          { label: "verified", value: stats.organizations.verified, color: "text-sendme" },
          { label: "pending", value: stats.organizations.pending, color: "text-warning" },
          { label: "suspended", value: stats.organizations.suspended, color: "text-danger" },
        ]} />
        <StatCard label="Payouts" icon={DollarSign} total={stats.payouts.total} subs={[
          { label: "total funds", value: stats.payouts.totalFunds, color: "text-sendme", format: "currency" },
          { label: "total requests", value: stats.payouts.totalRequests, color: "text-info", format: "currency" },
          { label: "pending", value: stats.payouts.pending, color: "text-warning" },
        ]} />
        <StatCard label="Deliveries" icon={Package} total={stats.deliveries.total} subs={[
          { label: "completed", value: stats.deliveries.completed, color: "text-sendme" },
          { label: "searching", value: stats.deliveries.searching, color: "text-warning" },
          { label: "in transit", value: stats.deliveries.inTransit, color: "text-info" },
          { label: "failed", value: stats.deliveries.failed, color: "text-danger" },
        ]} />
      </div>

      {/* ── Period Selector ── */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Calendar size={14} />
            <span className="text-xs font-semibold">Period:</span>
          </div>
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                period === p.id ? "bg-sendme text-white" : "bg-surface-secondary text-text-muted hover:text-text-primary hover:bg-border-light"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setPeriod(period === "custom" ? "this_week" : "custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === "custom" ? "bg-sendme text-white" : "bg-surface-secondary text-text-muted hover:text-text-primary hover:bg-border-light"
            }`}
          >
            Custom
          </button>
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-border-light rounded-lg px-2.5 py-1.5 text-xs text-text-primary bg-white" />
              <span className="text-xs text-text-muted">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-border-light rounded-lg px-2.5 py-1.5 text-xs text-text-primary bg-white" />
            </div>
          )}
          {periodInfo && (
            <span className="text-[11px] text-text-muted ml-auto">
              {periodInfo.current} vs {periodInfo.previous}
            </span>
          )}
        </div>
      </Card>

      {/* ── Comparison Summary ── */}
      {comparison && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {([
            { key: "deliveries" as const, label: "Deliveries", value: comparison.deliveries.current, fmt: (v: number) => v.toLocaleString() },
            { key: "revenue" as const, label: "Revenue", value: comparison.revenue.current, fmt: fmtAmt },
            { key: "newSenders" as const, label: "New Senders", value: comparison.newSenders.current, fmt: (v: number) => v.toLocaleString() },
            { key: "newRiders" as const, label: "New Riders", value: comparison.newRiders.current, fmt: (v: number) => v.toLocaleString() },
            { key: "newOrgs" as const, label: "New Orgs", value: comparison.newOrgs.current, fmt: (v: number) => v.toLocaleString() },
            { key: "newMarketers" as const, label: "New Marketers", value: comparison.newMarketers.current, fmt: (v: number) => v.toLocaleString() },
            { key: "payouts" as const, label: "Payouts", value: comparison.payouts.current, fmt: fmtAmt },
          ]).map((item) => {
            const d = comparison[item.key]
            return (
              <Card key={item.key} className="p-3">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-xl font-extrabold text-text-primary">{item.fmt(item.value)}</p>
                <div className="mt-1">
                  <ComparisonBadge d={d} label={prevLabel} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Recent Activity Tabs ── */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-6 px-5 pt-4 border-b border-border-light">
          {(Object.keys(tabData) as Tab[]).map((key) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`text-sm font-semibold pb-3 border-b-2 transition-colors ${activeTab === key ? "text-sendme border-sendme" : "text-text-muted border-transparent hover:text-text-primary"}`}>
              {tabData[key].label}
              <span className="ml-1.5 text-[10px] font-medium text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded-full">{tabData[key].count.toLocaleString()}</span>
            </button>
          ))}
        </div>
        <div className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light">
                {tabHeaders[activeTab].map((h) => <th key={h} className="pb-3 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeTab === "deliveries" && recent.deliveries.map((d) => (
                <tr key={d.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary transition-colors">
                  <td className="py-3 pr-4 text-xs font-mono font-semibold text-text-primary">{d.id}</td>
                  <td className="py-3 pr-4"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(d.status)}`}>{d.status}</span></td>
                  <td className="py-3 pr-4 text-xs text-text-secondary hidden md:table-cell">{d.from} → {d.to}</td>
                  <td className="py-3 text-xs text-text-muted">{timeAgo(d.created_at)}</td>
                </tr>
              ))}
              {activeTab === "riders" && recent.riders.map((r) => (
                <tr key={r.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary transition-colors">
                  <td className="py-3 pr-4"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">{r.name[0]}</div><span className="text-xs font-semibold text-text-primary">{r.name}</span></div></td>
                  <td className="py-3 pr-4 text-xs text-text-muted hidden md:table-cell">{r.phone}</td>
                  <td className="py-3 pr-4 text-xs text-text-secondary hidden lg:table-cell">{r.vehicle}</td>
                  <td className="py-3 pr-4 text-xs font-semibold text-text-primary">{r.rating || "—"}</td>
                  <td className="py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
              {activeTab === "senders" && recent.senders.map((s) => (
                <tr key={s.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary transition-colors">
                  <td className="py-3 pr-4"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-info-light rounded-full flex items-center justify-center text-info text-xs font-bold">{s.name[0]}</div><span className="text-xs font-semibold text-text-primary">{s.name}</span></div></td>
                  <td className="py-3 pr-4 text-xs text-text-muted hidden md:table-cell">{s.email}</td>
                  <td className="py-3 pr-4 text-xs text-text-muted lg:table-cell">{s.phone}</td>
                  <td className="py-3 text-xs text-text-muted">{timeAgo(s.created_at)}</td>
                </tr>
              ))}
              {activeTab === "organizations" && recent.organizations.map((o) => (
                <tr key={o.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary transition-colors">
                  <td className="py-3 pr-4"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold"><Building2 size={14} /></div><div><p className="text-xs font-semibold text-text-primary">{o.name}</p><p className="text-[10px] text-text-muted">{o.contact}</p></div></div></td>
                  <td className="py-3 pr-4 text-xs text-text-muted hidden md:table-cell">{o.email}</td>
                  <td className="py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.verified ? "bg-sendme-50 text-sendme" : "bg-warning-light text-warning"}`}>{o.verified ? "Verified" : "Pending"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-sendme hover:text-sendme-dark transition-colors mt-4">
            View all {tabData[activeTab].label.toLowerCase()} <ArrowRight size={14} />
          </button>
        </div>
      </Card>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Deliveries Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-text-primary">Deliveries</p>
              <p className="text-xs text-text-muted mt-0.5">{chartSubtitle(periodInfo?.groupBy || "d")}</p>
            </div>
            {comparison && <ComparisonBadge d={comparison.deliveries} label={prevLabel} />}
          </div>
          <div className="flex items-end gap-2 h-44">
            {charts.deliveries.map((d) => {
              const maxVal = Math.max(...charts.deliveries.map((x) => x.value), 1)
              const height = (d.value / maxVal) * 100
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold text-text-secondary">{d.value}</span>
                  <div className="w-full rounded-t-lg bg-sendme/20 relative" style={{ height: `${Math.max(height, 4)}%` }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-sendme transition-all duration-500" style={{ height: "100%" }} />
                  </div>
                  <span className="text-[9px] font-medium text-text-muted truncate w-full text-center">{d.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-text-primary">Revenue</p>
              <p className="text-xs text-text-muted mt-0.5">{chartSubtitle(periodInfo?.groupBy || "d")} — ₦</p>
            </div>
            {comparison && <ComparisonBadge d={comparison.revenue} label={prevLabel} />}
          </div>
          <div className="relative h-44">
            {(() => {
              const maxVal = Math.max(...charts.revenue.map((x) => x.value), 1)
              const topLabel = maxVal >= 1e6 ? `₦${(maxVal / 1e6).toFixed(1)}M` : maxVal >= 1e3 ? `₦${(maxVal / 1e3).toFixed(0)}K` : `₦${maxVal}`
              return (
                <>
                  <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-text-muted">
                    <span>{topLabel}</span><span>{maxVal >= 1e6 ? `₦${(maxVal / 2e6).toFixed(1)}M` : `₦${(maxVal / 2000).toFixed(0)}K`}</span><span>₦0</span>
                  </div>
                  <div className="absolute left-8 right-0 top-0 bottom-6 flex flex-col justify-between">{[0, 1, 2].map((i) => <div key={i} className="border-t border-border-light w-full" />)}</div>
                  <div className="absolute left-8 right-0 top-0 bottom-6 flex items-end gap-2">
                    {charts.revenue.map((d) => {
                      const height = (d.value / maxVal) * 100
                      const disp = d.value >= 1e6 ? `${(d.value / 1e6).toFixed(1)}M` : d.value >= 1e3 ? `${(d.value / 1e3).toFixed(0)}K` : d.value
                      return (
                        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-semibold text-text-secondary">₦{disp}</span>
                          <div className="w-full rounded-t-lg bg-info/20 relative" style={{ height: `${Math.max(height, 4)}%` }}>
                            <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-info transition-all duration-500" style={{ height: "100%" }} />
                          </div>
                          <span className="text-[9px] font-medium text-text-muted truncate w-full text-center">{d.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </Card>

        {/* User Growth Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-text-primary">User Growth</p>
              <p className="text-xs text-text-muted mt-0.5">Senders / Riders / Orgs / Marketers</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sendme" /><span className="text-[10px] text-text-muted">Senders</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-info" /><span className="text-[10px] text-text-muted">Riders</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger" /><span className="text-[10px] text-text-muted">Orgs</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /><span className="text-[10px] text-text-muted">Marketers</span></div>
            </div>
          </div>
          <div className="flex items-end gap-2 h-44">
            {charts.userGrowth.map((m) => {
              const maxVal = Math.max(...charts.userGrowth.map((x) => Math.max(x.senders, x.riders, x.orgs, x.marketers)), 1)
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="flex items-end gap-[2px] w-full" style={{ height: "120px" }}>
                    <div className="flex-1 rounded-t-lg bg-sendme/20 relative" style={{ height: `${Math.max((m.senders / maxVal) * 100, 4)}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-sendme transition-all duration-500" style={{ height: "100%" }} />
                    </div>
                    <div className="flex-1 rounded-t-lg bg-info/20 relative" style={{ height: `${Math.max((m.riders / maxVal) * 100, 4)}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-info transition-all duration-500" style={{ height: "100%" }} />
                    </div>
                    <div className="flex-1 rounded-t-lg bg-danger/20 relative" style={{ height: `${Math.max((m.orgs / maxVal) * 100, 4)}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-danger transition-all duration-500" style={{ height: "100%" }} />
                    </div>
                    <div className="flex-1 rounded-t-lg bg-warning/20 relative" style={{ height: `${Math.max((m.marketers / maxVal) * 100, 4)}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-warning transition-all duration-500" style={{ height: "100%" }} />
                    </div>
                  </div>
                  <span className="text-[9px] font-medium text-text-muted truncate w-full text-center">{m.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Payout Trend */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-text-primary">Payout Trend</p>
              <p className="text-xs text-text-muted mt-0.5">Payout volume — ₦</p>
            </div>
            {comparison && <ComparisonBadge d={comparison.payouts} label={prevLabel} />}
          </div>
          <div className="relative h-44">
            {(() => {
              const maxVal = Math.max(...charts.payoutTrend.map((x) => x.amount), 1)
              return (
                <svg viewBox="0 0 360 160" className="w-full h-full" preserveAspectRatio="none">
                  {[40, 80, 120].map((y) => <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#f1f5f9" strokeWidth="1" />)}
                  <path d={`M0,${160 - (charts.payoutTrend[0]?.amount || 0) / maxVal * 140} ${charts.payoutTrend.map((d, i) => { const x = (i / Math.max(charts.payoutTrend.length - 1, 1)) * 360; return `L${x},${160 - d.amount / maxVal * 140}` }).join(" ")} L360,160 L0,160 Z`} fill="url(#payoutGrad)" />
                  <path d={`M${charts.payoutTrend.map((d, i) => { const x = (i / Math.max(charts.payoutTrend.length - 1, 1)) * 360; return `${x},${160 - d.amount / maxVal * 140}` }).join(" L")}`} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {charts.payoutTrend.map((d, i) => { const x = (i / Math.max(charts.payoutTrend.length - 1, 1)) * 360; return <circle key={i} cx={x} cy={160 - d.amount / maxVal * 140} r="3.5" fill="#d97706" stroke="white" strokeWidth="2" /> })}
                  <defs><linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d97706" stopOpacity="0.2" /><stop offset="100%" stopColor="#d97706" stopOpacity="0.02" /></linearGradient></defs>
                </svg>
              )
            })()}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
              {charts.payoutTrend.map((d) => <span key={d.label} className="text-[9px] font-medium text-text-muted truncate">{d.label}</span>)}
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}
