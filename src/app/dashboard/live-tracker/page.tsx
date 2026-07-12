"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { TrackerDetail } from "@/components/dashboard/tracker-detail"
import {
  Truck, Users, Car, CheckCircle, AlertTriangle, ChevronDown,
  Plus, Maximize2, Minus, Activity
} from "lucide-react"

const stats = [
  { label: "Active Deliveries", value: "246", change: "↑ 12 vs yesterday", up: true, icon: Truck, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Drivers Online", value: "1,284", change: "↑ 8% vs yesterday", up: true, icon: Users, color: "text-info", bg: "bg-info-light" },
  { label: "Vehicles Active", value: "876", change: "↑ 5% vs yesterday", up: true, icon: Car, color: "text-info", bg: "bg-info-light" },
  { label: "On Time", value: "91%", change: "↑ 3% vs yesterday", up: true, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Delayed", value: "15", change: "↓ 2 vs yesterday", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
]

const viewOptions = [
  { label: "All Active", checked: true },
  { label: "Deliveries", count: 246 },
  { label: "Drivers", count: 1284 },
  { label: "Vehicles", count: 876 },
]

const deliveryStatuses = [
  { label: "In Transit", checked: true },
  { label: "Arrived at Pickup", checked: true },
  { label: "Picked Up", checked: true },
  { label: "En Route to Dropoff", checked: true },
  { label: "Delivered", checked: true },
  { label: "Delayed", checked: true },
  { label: "At Risk", checked: true },
]

const activeDeliveries = [
  {
    id: "SM-20491", status: "In Transit", statusColor: "bg-sendme-50 text-sendme",
    from: "Lekki Phase 1, Lekki", to: "Ikeja, Lagos",
    driver: "Damilaro A.", vehicle: "ABC 123 DE", eta: "14 mins",
    time: "10:24 AM",
  },
  {
    id: "SM-20492", status: "In Transit", statusColor: "bg-sendme-50 text-sendme",
    from: "Surulere, Lagos", to: "Ajah, Lagos",
    driver: "Emeka N.", vehicle: "KJA 908 LM", eta: "22 mins",
    time: "10:31 AM",
  },
  {
    id: "SM-20493", status: "Picked Up", statusColor: "bg-info-light text-info",
    from: "Yaba, Lagos", to: "Victoria Island, Lagos",
    driver: "Tosin A.", vehicle: "LND 234 TR", eta: "31 mins",
    time: "10:15 AM",
  },
]

const deliveryTabs = [
  { name: "In Transit", count: 152, active: true },
  { name: "Arrived", count: 24 },
  { name: "Picked Up", count: 38 },
  { name: "At Risk", count: 8 },
]

const vehicleTypes = [
  { icon: "🏍️", label: "Motorbike" },
  { icon: "🚗", label: "Car" },
  { icon: "🛻", label: "Pickup" },
  { icon: "🚛", label: "Truck" },
  { icon: "🚚", label: "Bulk Vehicle" },
]

const statusLegend = [
  { color: "bg-sendme", label: "On Time" },
  { color: "bg-warning", label: "Delayed" },
  { color: "bg-danger", label: "At Risk" },
]

export default function LiveTrackerPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>("SM-20491")

  return (
    <div className="flex h-full relative">
      {/* Left Filters Panel */}
      <div className="w-[240px] bg-white border-r border-border-default overflow-y-auto shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
            <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">Reset</button>
          </div>

          {/* View */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">View</p>
            <div className="space-y-2">
              {viewOptions.map((opt) => (
                <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="view" defaultChecked={opt.checked} className="w-3.5 h-3.5 text-sendme border-border-default focus:ring-sendme/20" />
                  <span className="text-xs text-text-primary group-hover:text-sendme transition-colors flex-1">{opt.label}</span>
                  {opt.count && <span className="text-[10px] text-text-muted">{opt.count.toLocaleString()}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Status */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Delivery Status</p>
            <div className="space-y-2">
              {deliveryStatuses.map((opt) => (
                <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" defaultChecked={opt.checked} className="w-3.5 h-3.5 rounded text-sendme border-border-default focus:ring-sendme/20" />
                  <span className="text-xs text-text-primary group-hover:text-sendme transition-colors">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Vehicle Type</p>
            <button className="w-full flex items-center justify-between bg-white border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors">
              All Types <ChevronDown size={14} className="text-text-muted" />
            </button>
          </div>

          {/* Delivery Type */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Delivery Type</p>
            <button className="w-full flex items-center justify-between bg-white border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors">
              All Types <ChevronDown size={14} className="text-text-muted" />
            </button>
          </div>

          {/* More Filters */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">More Filters</p>
            <button className="flex items-center gap-1.5 text-xs font-medium text-sendme hover:text-sendme-dark transition-colors">
              <Plus size={14} /> Add Filter
            </button>
          </div>

          <p className="text-[10px] text-text-muted">
            Showing results for <span className="font-semibold text-sendme">Lagos, Nigeria</span>
          </p>
        </div>
      </div>

      {/* Center - Map */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#e8f0e8]">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #d4e4d4 0%, #e8f0e8 30%, #c8dcc8 60%, #dce8dc 100%)'
          }}>
            <div className="absolute top-1/4 right-0 w-1/3 h-2/3 opacity-30" style={{
              background: 'linear-gradient(180deg, #b8d4e8 0%, #a8c8e0 100%)',
              borderRadius: '40% 0 0 40%'
            }} />
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 500">
              <path d="M0,200 Q200,180 400,250 T800,200" stroke="#888" strokeWidth="2" fill="none" />
              <path d="M100,0 Q120,200 200,400 T300,500" stroke="#888" strokeWidth="1.5" fill="none" />
              <path d="M400,0 Q380,150 420,300 T400,500" stroke="#888" strokeWidth="1.5" fill="none" />
              <path d="M0,350 Q200,330 500,380 T800,350" stroke="#888" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="absolute top-[15%] left-[30%] text-[10px] text-text-secondary/60 font-medium">Ikeja</span>
            <span className="absolute top-[35%] left-[15%] text-[10px] text-text-secondary/60 font-medium">Mushin</span>
            <span className="absolute top-[50%] left-[40%] text-[10px] text-text-secondary/60 font-medium">Yaba</span>
            <span className="absolute top-[65%] left-[35%] text-[10px] text-text-secondary/60 font-medium">Surulere</span>
            <span className="absolute top-[80%] left-[25%] text-[10px] text-text-secondary/60 font-medium">Ikorodu</span>
            <span className="absolute top-[45%] right-[15%] text-[10px] text-text-secondary/60 font-medium">Lagos Lagoon</span>
            <div className="absolute top-[20%] left-[35%] w-7 h-7 bg-sendme rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedOrder("SM-20491")}>
              <Truck size={12} className="text-white" />
            </div>
            <div className="absolute top-[40%] left-[25%] w-6 h-6 bg-sendme/70 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Car size={10} className="text-white" />
            </div>
            <div className="absolute top-[55%] left-[45%] w-6 h-6 bg-info rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Truck size={10} className="text-white" />
            </div>
            <div className="absolute top-[30%] right-[30%] w-6 h-6 bg-warning rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Truck size={10} className="text-white" />
            </div>
            <div className="absolute top-[70%] left-[50%] w-5 h-5 bg-sendme/50 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
              <path d="M280,100 Q300,150 350,180 T400,220" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeDasharray="6,3" />
            </svg>
            <div className="absolute top-[18%] left-[42%] bg-white border border-border-default rounded-lg px-2.5 py-1 shadow-md">
              <p className="text-[10px] font-bold text-text-primary">SM-20491</p>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button className="bg-white border border-border-default rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-text-primary shadow-sm hover:bg-surface-hover transition-colors">
            <Activity size={14} className="text-text-muted" /> Traffic
          </button>
          <button className="bg-white border border-border-default rounded-lg p-2 shadow-sm hover:bg-surface-hover transition-colors">
            <Maximize2 size={14} className="text-text-muted" />
          </button>
        </div>

        <div className="absolute top-4 right-[140px] flex flex-col gap-1 z-10">
          <button className="bg-white border border-border-default rounded-lg w-8 h-8 flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors">
            <Plus size={14} className="text-text-muted" />
          </button>
          <button className="bg-white border border-border-default rounded-lg w-8 h-8 flex items-center justify-center shadow-sm hover:bg-surface-hover transition-colors">
            <Minus size={14} className="text-text-muted" />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border border-border-default rounded-xl px-5 py-2.5 shadow-sm flex items-center gap-5 z-10">
          {vehicleTypes.map((v) => (
            <div key={v.label} className="flex items-center gap-1.5">
              <span className="text-sm">{v.icon}</span>
              <span className="text-[10px] font-medium text-text-secondary">{v.label}</span>
            </div>
          ))}
          <div className="w-px h-4 bg-border-default" />
          {statusLegend.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-[10px] font-medium text-text-secondary">{s.label}</span>
            </div>
          ))}
        </div>

        {selectedOrder && (
          <TrackerDetail orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </div>

      {/* Right Sidebar - Active Deliveries */}
      <div className="w-[300px] bg-white border-l border-border-default flex flex-col shrink-0 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Active Deliveries</h3>
            <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">View All</button>
          </div>
          <div className="flex gap-0 border-b border-border-light">
            {deliveryTabs.map((tab) => (
              <button
                key={tab.name}
                className={`px-2.5 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab.active
                    ? "border-sendme text-sendme"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.name} <span className="ml-0.5">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {activeDeliveries.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedOrder(d.id)}
              className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                selectedOrder === d.id
                  ? "border-sendme bg-sendme-50/30"
                  : "border-border-light hover:border-border-default"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">{d.id}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${d.statusColor}`}>{d.status}</span>
                </div>
                <span className="text-[10px] text-text-muted">{d.time}</span>
              </div>
              <div className="space-y-1 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sendme shrink-0" />
                  <p className="text-[11px] text-text-secondary truncate">{d.from}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                  <p className="text-[11px] text-text-secondary truncate">{d.to}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[8px] font-bold">
                    {d.driver.charAt(0)}
                  </div>
                  <span className="text-[10px] text-text-muted">{d.driver} • {d.vehicle}</span>
                </div>
                <span className="text-[10px] font-semibold text-sendme">ETA {d.eta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
