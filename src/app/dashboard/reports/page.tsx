"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Download, Filter, ChevronDown, Calendar, ChevronRight, DollarSign, Package, Truck, Users, Star, AlertTriangle } from "lucide-react"

const stats = [
  { label: "Total Revenue", value: "₦24,560,000", change: "+16% vs May 6 – May 12", up: true, icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
  { label: "Total Orders", value: "1,842", change: "+12% vs May 6 – May 12", up: true, icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Completed Orders", value: "1,542", change: "+14% vs May 6 – May 12", up: true, icon: Package, bg: "bg-purple-50", color: "text-purple-600" },
  { label: "Active Drivers", value: "642", change: "+8% vs May 6 – May 12", up: true, icon: Truck, bg: "bg-orange-50", color: "text-orange-600" },
  { label: "Customer Satisfaction", value: "4.6/5", change: "+5% vs May 6 – May 12", up: true, icon: Star, bg: "bg-yellow-50", color: "text-yellow-600" },
  { label: "Disputes", value: "45", change: "-12% vs May 6 – May 12", up: false, icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
]

const subTabs = ["Overview", "Orders", "Financials", "Drivers", "Vehicles", "Customers", "Performance"]

const topRoutes = [
  { route: "Lekki → Ikeja", orders: 245, completed: 230, revenue: "₦3,245,000", avgTime: "2h 45m", success: "93.9%" },
  { route: "Victoria Island → Surulere", orders: 198, completed: 184, revenue: "₦2,890,000", avgTime: "2h 30m", success: "92.9%" },
  { route: "Yaba → Ojodu", orders: 176, completed: 165, revenue: "₦2,450,000", avgTime: "2h 20m", success: "93.8%" },
  { route: "Apapa → Oshodi", orders: 162, completed: 150, revenue: "₦2,150,000", avgTime: "2h 50m", success: "92.6%" },
  { route: "Abuja → Lagos", orders: 148, completed: 137, revenue: "₦1,980,000", avgTime: "6h 30m", success: "92.6%" },
]

const topDrivers = [
  { name: "Tosin Adebayo", avatar: "TA", orders: 128, success: "96.1%", rating: 4.8 },
  { name: "Emeka Nwosu", avatar: "EN", orders: 112, success: "95.5%", rating: 4.7 },
  { name: "Ibrahim Musa", avatar: "IM", orders: 105, success: "94.3%", rating: 4.6 },
  { name: "Ada Okon", avatar: "AO", orders: 98, success: "93.9%", rating: 4.7 },
  { name: "John Paul", avatar: "JP", orders: 92, success: "93.5%", rating: 4.6 },
]

const reports = [
  { name: "Operations Summary", desc: "Overview of all operations", icon: Package },
  { name: "Financial Summary", desc: "Revenue and payouts report", icon: DollarSign },
  { name: "Driver Performance", desc: "Driver activity and rating report", icon: Users },
  { name: "Customer Insights", desc: "Customer behavior and trends", icon: Star },
]

const insights = [
  { text: "Revenue is up 16% this week", detail: "Great job! Keep up the momentum.", trend: "up" },
  { text: "On-time delivery improved by 6%", detail: "Customers are more satisfied.", trend: "up" },
  { text: "Disputes decreased by 12%", detail: "Continue maintaining quality.", trend: "up" },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="p-4 lg:p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between mb-2">
        <div><h1 className="text-xl font-bold text-text-primary">Reports & Insights</h1><p className="text-xs text-text-muted mt-0.5">Analyze performance metrics and generate actionable insights across the platform.</p></div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-[11px] font-medium"><Calendar size={12}/> May 13 – May 20, 2025</button>
          <button className="flex items-center gap-1.5 bg-sendme text-white rounded-lg px-3 py-1.5 text-[11px] font-medium"><Download size={12}/> Export Report</button>
        </div>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => { const I = s.icon; return (
          <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
        )})}
      </div>
      <div className="flex items-center justify-between border-b border-border-light">
        <div className="flex gap-0">{subTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab===t?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t}</button>
        ))}</div>
        <div className="flex items-center gap-2 pb-2">
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Organizations <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Routes <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[11px] font-semibold text-text-primary">Revenue Overview</p><p className="text-lg font-bold text-text-primary mt-0.5">₦24,560,000</p><p className="text-[9px] text-sendme font-medium">↑ 16% vs May 6 – May 12</p></div>
            <button className="text-[10px] bg-surface-secondary px-2 py-1 rounded flex items-center gap-1">Daily <ChevronDown size={10}/></button>
          </div>
          <div className="h-[120px] flex items-end gap-1.5 px-1">
            {[40,55,45,70,60,80,75,90].map((h,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-sendme/20 rounded-t" style={{height:`${h}%`}}><div className="w-full bg-sendme rounded-t" style={{height:`${h*0.6}%`}}/></div>
                <span className="text-[8px] text-text-muted">{["May 13","May 14","May 15","May 16","May 17","May 18","May 19","May 20"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4 col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[11px] font-semibold text-text-primary">Orders Overview</p><p className="text-lg font-bold text-text-primary mt-0.5">1,842</p><p className="text-[9px] text-sendme font-medium">↑ 12% vs May 6 – May 12</p></div>
            <button className="text-[10px] bg-surface-secondary px-2 py-1 rounded flex items-center gap-1">Daily <ChevronDown size={10}/></button>
          </div>
          <div className="h-[120px] flex items-end gap-1.5 px-1">
            {[60,75,65,85,80,95,90,100].map((h,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t" style={{height:`${h}%`}}/>
                <span className="text-[8px] text-text-muted">{["May 13","May 14","May 15","May 16","May 17","May 18","May 19","May 20"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4 col-span-1">
          <p className="text-[11px] font-semibold text-text-primary mb-3">Orders by Status</p>
          <div className="flex items-center justify-center mb-3 relative">
            <div className="w-[100px] h-[100px] rounded-full border-[12px] border-sendme border-t-blue-400 border-r-orange-400 border-b-red-300 flex items-center justify-center">
              <div className="text-center"><p className="text-lg font-bold text-text-primary">1,842</p><p className="text-[8px] text-text-muted">Total</p></div>
            </div>
          </div>
          <div className="space-y-1.5">
            {[{label:"Completed",val:"1,542",pct:"83.7%",color:"bg-sendme"},{label:"In Progress",val:"246",pct:"13.3%",color:"bg-blue-400"},{label:"Cancelled",val:"16",pct:"0.9%",color:"bg-orange-400"},{label:"Returned",val:"38",pct:"2.1%",color:"bg-red-300"}].map((s,i) => (
              <div key={i} className="flex items-center justify-between text-[10px]"><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${s.color}`}/><span className="text-text-muted">{s.label}</span></div><div className="flex items-center gap-2"><span className="font-medium text-text-primary">{s.val}</span><span className="text-text-muted">{s.pct}</span></div></div>
            ))}
          </div>
          <button className="text-[10px] text-sendme font-medium mt-2 flex items-center gap-1">View full report <ChevronRight size={10}/></button>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-semibold text-text-primary">Top Performing Routes</p></div>
          <table className="w-full text-[10px]">
            <thead><tr className="border-b border-border-light text-text-muted"><th className="text-left py-1.5 font-medium">Route</th><th className="text-left py-1.5 font-medium">Total Orders</th><th className="text-left py-1.5 font-medium">Completed</th><th className="text-left py-1.5 font-medium">Revenue</th><th className="text-left py-1.5 font-medium">Avg. Delivery Time</th><th className="text-left py-1.5 font-medium">Success Rate</th></tr></thead>
            <tbody>{topRoutes.map((r,i) => (
              <tr key={i} className="border-b border-border-light"><td className="py-2 font-medium text-text-primary">{r.route}</td><td className="py-2">{r.orders}</td><td className="py-2">{r.completed}</td><td className="py-2 font-medium">{r.revenue}</td><td className="py-2">{r.avgTime}</td><td className="py-2 text-sendme font-medium">{r.success}</td></tr>
            ))}</tbody>
          </table>
          <button className="text-[10px] text-sendme font-medium mt-2 flex items-center gap-1">View all routes performance <ChevronRight size={10}/></button>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-semibold text-text-primary">Top Drivers by Performance</p></div>
          <div className="space-y-2">{topDrivers.map((d,i) => (
            <div key={i} className="flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg">
              <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[10px] font-semibold">{d.avatar}</div><div><p className="text-[11px] font-medium text-text-primary">{d.name}</p><p className="text-[9px] text-text-muted">★ {d.rating}</p></div></div>
              <div className="text-right"><p className="text-[11px] font-medium text-text-primary">{d.orders}</p><p className="text-[9px] text-text-muted">Completed Orders</p></div>
              <div className="text-right"><p className="text-[11px] font-medium text-sendme">{d.success}</p><p className="text-[9px] text-text-muted">Success Rate</p></div>
            </div>
          ))}</div>
          <button className="text-[10px] text-sendme font-medium mt-2 flex items-center gap-1">View all drivers performance <ChevronRight size={10}/></button>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 col-span-2">
          <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-semibold text-text-primary">Quick Stats</p></div>
          <div className="grid grid-cols-2 gap-3">
            {[{l:"Total Distance",v:"156,250 km",c:"+9%",up:true},{l:"Total Fuel Used",v:"28,540 L",c:"-4%",up:false},{l:"On-time Delivery",v:"92.4%",c:"+6%",up:true},{l:"Avg. Delivery Time",v:"3h 24m",c:"+3%",up:false}].map((s,i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-surface-secondary rounded-lg"><div><p className="text-[10px] text-text-muted">{s.l}</p><p className="text-[12px] font-bold text-text-primary">{s.v}</p></div><span className={`text-[9px] font-medium ${s.up?"text-sendme":"text-danger"}`}>{s.c}</span></div>
            ))}
          </div>
          <button className="text-[10px] text-sendme font-medium mt-2 flex items-center gap-1">View all statistics <ChevronRight size={10}/></button>
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-[11px] font-semibold text-text-primary mb-2">Reports</p>
            <div className="space-y-2">{reports.map((r,i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg cursor-pointer">
                <div className="flex items-center gap-2"><r.icon size={14} className="text-text-muted"/><div><p className="text-[10px] font-medium text-text-primary">{r.name}</p><p className="text-[8px] text-text-muted">{r.desc}</p></div></div>
                <Download size={12} className="text-text-muted"/>
              </div>
            ))}</div>
            <button className="text-[10px] text-sendme font-medium mt-2 flex items-center gap-1">View all reports <ChevronRight size={10}/></button>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-semibold text-text-primary mb-2">Insights</p>
            <div className="space-y-2">{insights.map((ins,i) => (
              <div key={i} className="p-2 bg-sendme-50 rounded-lg"><div className="flex items-center gap-1.5"><TrendingUp size={10} className="text-sendme"/><p className="text-[10px] font-medium text-text-primary">{ins.text}</p></div><p className="text-[9px] text-text-muted mt-0.5 ml-4">{ins.detail}</p></div>
            ))}</div>
            <button className="text-[10px] text-sendme font-medium mt-2 flex items-center gap-1">View more insights <ChevronRight size={10}/></button>
          </Card>
        </div>
      </div>
      <p className="text-[9px] text-text-muted text-center pb-2">All times are in WAT (UTC+1) • Data updates every 15 minutes</p>
    </div>
  )
}
