"use client"
import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import {
  TrendingUp, TrendingDown, Download, ChevronDown, ChevronRight,
  DollarSign, Package, Truck, Users, Star, AlertTriangle, Loader2,
  Clock, CheckCircle, XCircle, Eye, BarChart3, User
} from "lucide-react"

interface ReportStats {
  revenue: number; revenueChange: string; totalOrders: number; completedOrders: number;
  completedChange: string; cancelledOrders: number; inProgressOrders: number;
  activeDrivers: number; totalDrivers: number; disputes: number;
  totalUsers: number; newUsers: number; orgCount: number;
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(1) + "K"
  return "₦" + n.toLocaleString("en-NG")
}

function formatFullCurrency(n: number) { return "₦" + n.toLocaleString("en-NG") }
function shortDate(dateStr: string) { return new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) }

function statusColor(s: string) {
  if (s === "delivered") return "bg-green-50 text-green-600"
  if (s === "canceled" || s === "cancelled") return "bg-red-50 text-red-500"
  if (["searching", "bidding"].includes(s)) return "bg-yellow-50 text-yellow-600"
  if (["accepted", "picked_up", "in_transit"].includes(s)) return "bg-blue-50 text-blue-600"
  return "bg-gray-100 text-gray-500"
}

const subTabs = ["Overview", "Orders", "Financials", "Drivers", "Customers", "Performance"]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Overview")
  const [range, setRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ range, tab: activeTab.toLowerCase() })
      const res = await fetch(`/api/dashboard/reports?${params}`)
      const d = await res.json()
      setData(d)
    } catch { console.error("Failed to fetch reports") }
    finally { setLoading(false) }
  }, [range, activeTab])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading || !data) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-text-muted" /></div>
  }

  const stats: ReportStats = data.stats || {}
  const charts = data.charts || {}
  const tabData = data.tabData || {}
  const totalOrders = stats.totalOrders || 0
  const statusCounts = charts.ordersByStatus || {}
  const statusTotal = Object.values(statusCounts).reduce((a: number, b: any) => a + b, 0) || 1
  const statusBreakdown = [
    { label: "Delivered", count: statusCounts["delivered"] || 0, color: "bg-sendme" },
    { label: "In Progress", count: (statusCounts["searching"] || 0) + (statusCounts["bidding"] || 0) + (statusCounts["accepted"] || 0) + (statusCounts["picked_up"] || 0), color: "bg-blue-400" },
    { label: "Cancelled", count: (statusCounts["canceled"] || 0) + (statusCounts["cancelled"] || 0), color: "bg-orange-400" },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Reports & Insights</h1>
          <p className="text-xs text-text-muted mt-0.5">Analyze performance metrics and generate actionable insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-white border border-border-default rounded-lg px-3 py-1.5 text-[11px] font-medium" value={range} onChange={e => setRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last 12 months</option>
          </select>
          <button className="flex items-center gap-1.5 bg-sendme text-white rounded-lg px-3 py-1.5 text-[11px] font-medium"><Download size={12} /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Revenue", value: formatCurrency(stats.revenue || 0), icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
          { label: "Orders", value: (stats.totalOrders || 0).toLocaleString(), icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Completed", value: (stats.completedOrders || 0).toLocaleString(), icon: CheckCircle, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Active Drivers", value: (stats.activeDrivers || 0).toLocaleString(), icon: Truck, bg: "bg-orange-50", color: "text-orange-600" },
          { label: "Users", value: (stats.totalUsers || 0).toLocaleString(), icon: Users, bg: "bg-yellow-50", color: "text-yellow-600" },
          { label: "Disputes", value: (stats.disputes || 0).toLocaleString(), icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
        ].map(s => { const I = s.icon; return (
          <Card key={s.label} className="p-3 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14} /></div></div>
            <p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p>
          </Card>
        )})}
      </div>

      <div className="flex items-center justify-between border-b border-border-light">
        <div className="flex gap-0 overflow-x-auto">{subTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}</div>
      </div>

      {activeTab === "Overview" && <OverviewTab stats={stats} charts={charts} data={data} />}
      {activeTab === "Orders" && <OrdersTab tabData={tabData} />}
      {activeTab === "Financials" && <FinancialsTab tabData={tabData} />}
      {activeTab === "Drivers" && <DriversTab tabData={tabData} />}
      {activeTab === "Customers" && <CustomersTab tabData={tabData} />}
      {activeTab === "Performance" && <PerformanceTab tabData={tabData} stats={stats} />}

      <p className="text-[9px] text-text-muted text-center pb-2">All times are in WAT (UTC+1) • Data updates every 15 minutes</p>
    </div>
  )
}

function OverviewTab({ stats, charts, data }: any) {
  const totalOrders = stats.totalOrders || 0
  const statusCounts = charts.ordersByStatus || {}
  const statusTotal = Object.values(statusCounts).reduce((a: number, b: any) => a + b, 0) || 1
  const statusBreakdown = [
    { label: "Delivered", count: statusCounts["delivered"] || 0, color: "bg-sendme" },
    { label: "In Progress", count: (statusCounts["searching"] || 0) + (statusCounts["bidding"] || 0) + (statusCounts["accepted"] || 0) + (statusCounts["picked_up"] || 0), color: "bg-blue-400" },
    { label: "Cancelled", count: (statusCounts["canceled"] || 0) + (statusCounts["cancelled"] || 0), color: "bg-orange-400" },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[11px] font-semibold text-text-primary">Revenue Overview</p><p className="text-lg font-bold text-text-primary mt-0.5">{formatCurrency(stats.revenue || 0)}</p></div>
          </div>
          <div className="h-[120px] flex items-end gap-1.5 px-1">
            {(charts.revenueByDay || []).slice(-14).map((d: any, i: number) => {
              const maxRev = Math.max(...(charts.revenueByDay || []).map((x: any) => x.amount), 1)
              const pct = (d.amount / maxRev) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-sendme/20 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }}><div className="w-full bg-sendme rounded-t" style={{ height: `${Math.max(pct * 0.6, 4)}%` }} /></div>
                  <span className="text-[7px] text-text-muted">{shortDate(d.date)}</span>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3"><p className="text-[11px] font-semibold text-text-primary">Orders Overview</p><p className="text-lg font-bold text-text-primary mt-0.5">{(stats.totalOrders || 0).toLocaleString()}</p></div>
          <div className="h-[120px] flex items-end gap-1.5 px-1">
            {(charts.ordersByDay || []).slice(-14).map((d: any, i: number) => {
              const maxOrd = Math.max(...(charts.ordersByDay || []).map((x: any) => x.total), 1)
              const pct = (d.total / maxOrd) * 100
              return <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }} /><span className="text-[7px] text-text-muted">{shortDate(d.date)}</span></div>
            })}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Orders by Status</p>
          <div className="flex items-center justify-center mb-3">
            <div className="w-[100px] h-[100px] rounded-full border-[12px] border-sendme border-t-blue-400 border-r-orange-400 flex items-center justify-center">
              <div className="text-center"><p className="text-lg font-bold text-text-primary">{totalOrders.toLocaleString()}</p><p className="text-[8px] text-text-muted">Total</p></div>
            </div>
          </div>
          <div className="space-y-1.5">
            {statusBreakdown.map((s: any, i: number) => {
              const pct = statusTotal > 0 ? ((s.count / statusTotal) * 100).toFixed(1) : "0.0"
              return <div key={i} className="flex items-center justify-between text-[10px]"><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${s.color}`} /><span className="text-text-muted">{s.label}</span></div><div className="flex items-center gap-2"><span className="font-medium text-text-primary">{s.count.toLocaleString()}</span><span className="text-text-muted">{pct}%</span></div></div>
            })}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Top Routes</p>
          {(data.topRoutes || []).length === 0 ? <p className="text-[10px] text-text-muted py-4 text-center">No data</p> : (
            <table className="w-full text-[10px]"><thead><tr className="border-b border-border-light text-text-muted"><th className="text-left py-1.5 font-medium">Route</th><th className="text-left py-1.5 font-medium">Orders</th><th className="text-left py-1.5 font-medium">Revenue</th></tr></thead>
            <tbody>{data.topRoutes.map((r: any, i: number) => <tr key={i} className="border-b border-border-light"><td className="py-2 font-medium text-text-primary max-w-[160px] truncate">{r.route}</td><td className="py-2">{r.orders}</td><td className="py-2 font-medium">{formatFullCurrency(r.revenue)}</td></tr>)}</tbody></table>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Top Drivers</p>
          {(data.topDrivers || []).length === 0 ? <p className="text-[10px] text-text-muted py-4 text-center">No data</p> : (
            <div className="space-y-2">{data.topDrivers.slice(0, 5).map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[9px] font-semibold">{d.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div><div><p className="text-[11px] font-medium text-text-primary">{d.name}</p><p className="text-[9px] text-text-muted">{d.rating?.toFixed(1)} {d.trips} trips</p></div></div>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
    </>
  )
}

function OrdersTab({ tabData }: any) {
  const orders = tabData.recentOrders || []
  const vehicles = tabData.vehicleBreakdown || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {vehicles.map((v: any) => (
          <Card key={v.type} className="p-3 min-w-0 overflow-hidden">
            <p className="text-[10px] text-text-muted truncate">{v.type}</p>
            <p className="text-base font-bold text-text-primary">{v.count}</p>
            <p className="text-[9px] text-text-muted">{v.pct}% of total</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-text-muted"><Package size={20} className="mb-2 opacity-40" /><p className="text-[11px]">No orders found</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">Order</th><th className="px-3 py-2">Route</th><th className="px-3 py-2">Vehicle</th><th className="px-3 py-2">Distance</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th>
          </tr></thead><tbody>{orders.map((o: any) => (
            <tr key={o.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50">
              <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{o.shortId}</p><p className="text-[9px] text-text-muted">{o.date}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary max-w-[200px] truncate">{o.route}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] text-text-primary">{o.vehicle}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] text-text-primary">{o.distance}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-semibold text-text-primary">{o.amount ? formatFullCurrency(o.amount) : "—"}</p></td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status}</span></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}

function FinancialsTab({ tabData }: any) {
  const breakdown = tabData.breakdown || []
  const transactions = tabData.transactions || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3"><p className="text-[10px] text-text-muted">Total Commissions</p><p className="text-lg font-bold text-text-primary">{formatFullCurrency(tabData.totalCommissions || 0)}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Avg. Order Value</p><p className="text-lg font-bold text-text-primary">{formatFullCurrency(tabData.avgOrderValue || 0)}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Transaction Types</p><p className="text-lg font-bold text-text-primary">{breakdown.length}</p></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Revenue by Transaction Type</p>
          {breakdown.length === 0 ? <p className="text-[10px] text-text-muted py-4 text-center">No data</p> : (
            <div className="space-y-2">{breakdown.map((b: any) => (
              <div key={b.type} className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg">
                <div><p className="text-[11px] font-medium text-text-primary capitalize">{b.type}</p><p className="text-[9px] text-text-muted">{b.count} transactions</p></div>
                <p className="text-[11px] font-semibold text-text-primary">{formatFullCurrency(b.amount)}</p>
              </div>
            ))}</div>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Recent Transactions</p>
          {transactions.length === 0 ? <p className="text-[10px] text-text-muted py-4 text-center">No data</p> : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">{transactions.slice(0, 15).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                <div><p className="text-[10px] font-medium text-text-primary capitalize">{t.type}</p><p className="text-[9px] text-text-muted">{t.date}</p></div>
                <div className="text-right"><p className="text-[10px] font-semibold text-text-primary">{formatFullCurrency(t.amount)}</p><p className={`text-[8px] font-medium ${t.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>{t.status}</p></div>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
    </div>
  )
}

function DriversTab({ tabData }: any) {
  const drivers = tabData.drivers || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3"><p className="text-[10px] text-text-muted">Total Drivers</p><p className="text-lg font-bold text-text-primary">{drivers.length}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Online Now</p><p className="text-lg font-bold text-sendme">{tabData.onlineDrivers || 0}</p></Card>
      </div>
      <Card className="overflow-hidden">
        {drivers.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-text-muted"><Truck size={20} className="mb-2 opacity-40" /><p className="text-[11px]">No driver data</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">Driver</th><th className="px-3 py-2">Rating</th><th className="px-3 py-2">Trips</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Earnings</th>
          </tr></thead><tbody>{drivers.map((d: any) => (
            <tr key={d.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50">
              <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[9px] font-semibold">{d.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div><div><p className="text-[11px] font-medium text-text-primary">{d.name}</p><p className="text-[9px] text-text-muted">{d.phone}</p></div></div></td>
              <td className="px-3 py-2.5"><div className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400" /><span className="text-[10px] font-medium">{d.rating?.toFixed(1)}</span></div></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium">{d.trips}</p></td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${d.online ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>{d.online ? "Online" : "Offline"}</span></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-semibold">{formatFullCurrency(d.periodEarnings || 0)}</p></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}

function CustomersTab({ tabData }: any) {
  const users = tabData.users || []
  const roles = tabData.roleBreakdown || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roles.map((r: any) => (
          <Card key={r.role} className="p-3">
            <p className="text-[10px] text-text-muted capitalize">{r.role}</p>
            <p className="text-lg font-bold text-text-primary">{r.count}</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        {users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-text-muted"><Users size={20} className="mb-2 opacity-40" /><p className="text-[11px]">No user data</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">User</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Joined</th>
          </tr></thead><tbody>{users.map((u: any) => (
            <tr key={u.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50">
              <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center"><User size={12} className="text-text-muted" /></div><p className="text-[11px] font-medium text-text-primary">{u.name}</p></div></td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${u.role === "driver" ? "bg-blue-50 text-blue-600" : u.role === "organization" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"}`}>{u.role}</span></td>
              <td className="px-3 py-2.5"><p className="text-[10px] text-text-muted">{u.joined}</p></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}

function PerformanceTab({ tabData, stats }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-3"><p className="text-[10px] text-text-muted">Avg. Delivery Time</p><p className="text-lg font-bold text-text-primary">{tabData.avgDeliveryTime || "—"}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Bid Acceptance Rate</p><p className="text-lg font-bold text-text-primary">{tabData.bidAcceptanceRate || 0}%</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Total Bids</p><p className="text-lg font-bold text-text-primary">{(tabData.totalBids || 0).toLocaleString()}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Delivered Orders</p><p className="text-lg font-bold text-text-primary">{(tabData.deliveredCount || 0).toLocaleString()}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Avg. Order Value</p><p className="text-lg font-bold text-text-primary">{formatFullCurrency(tabData.avgOrderValue || 0)}</p></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Completion Rate</p>
          <div className="space-y-3">
            {[
              { label: "Delivered", count: stats.completedOrders || 0, total: stats.totalOrders || 1, color: "bg-sendme" },
              { label: "Cancelled", count: stats.cancelledOrders || 0, total: stats.totalOrders || 1, color: "bg-orange-400" },
              { label: "In Progress", count: stats.inProgressOrders || 0, total: stats.totalOrders || 1, color: "bg-blue-400" },
            ].map(item => {
              const pct = item.total > 0 ? (item.count / item.total * 100) : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1"><span className="text-text-muted">{item.label}</span><span className="font-medium text-text-primary">{item.count} ({pct.toFixed(1)}%)</span></div>
                  <div className="w-full bg-surface-secondary rounded-full h-2"><div className={`${item.color} rounded-full h-2`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Key Metrics</p>
          <div className="space-y-2">
            {[
              { label: "Revenue per Order", value: stats.totalOrders > 0 ? formatFullCurrency(Math.round((stats.revenue || 0) / stats.totalOrders)) : "—" },
              { label: "Completion Rate", value: stats.totalOrders > 0 ? `${((stats.completedOrders || 0) / stats.totalOrders * 100).toFixed(1)}%` : "—" },
              { label: "Cancellation Rate", value: stats.totalOrders > 0 ? `${((stats.cancelledOrders || 0) / stats.totalOrders * 100).toFixed(1)}%` : "—" },
              { label: "Drivers per Order", value: stats.totalOrders > 0 ? (stats.totalDrivers / stats.totalOrders).toFixed(2) : "—" },
              { label: "Dispute Rate", value: stats.totalOrders > 0 ? `${((stats.disputes || 0) / stats.totalOrders * 100).toFixed(1)}%` : "—" },
            ].map(m => (
              <div key={m.label} className="flex justify-between py-1.5 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{m.label}</span><span className="text-[10px] font-semibold text-text-primary">{m.value}</span></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
