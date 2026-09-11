"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { TrackerDetail } from "@/components/dashboard/tracker-detail"
import {
  Truck, Users, Car, CheckCircle, AlertTriangle, ChevronDown,
  Plus, Maximize2, Minus, Activity
} from "lucide-react"

const statIcons: Record<string, any> = {
  truck: Truck,
  users: Users,
  car: Car,
  check: CheckCircle,
  alert: AlertTriangle,
}

const deliveryStatuses = [
  { label: "In Transit", checked: true },
  { label: "Arrived at Pickup", checked: true },
  { label: "Picked Up", checked: true },
  { label: "En Route to Dropoff", checked: true },
  { label: "Delivered", checked: true },
  { label: "Delayed", checked: true },
  { label: "At Risk", checked: true },
]

const vehicleTypes = [
  { icon: "\u{1F68D}", label: "Motorbike" },
  { icon: "\u{1F697}", label: "Car" },
  { icon: "\u{1F6FB}", label: "Pickup" },
  { icon: "\u{1F69B}", label: "Truck" },
  { icon: "\u{1F69A}", label: "Bulk Vehicle" },
]

const statusLegend = [
  { color: "bg-sendme", label: "On Time" },
  { color: "bg-warning", label: "Delayed" },
  { color: "bg-danger", label: "At Risk" },
]

// Nigeria bounding box used to place real GPS coordinates on the map
const BBOX = { minLat: 4.5, maxLat: 14, minLng: 3, maxLng: 14 }

const markerPos = (lat: number, lng: number) => ({
  top: `${((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * 100}%`,
  left: `${((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100}%`,
})

const TAB_MATCH: Record<string, string[]> = {
  "In Transit": ["In Transit", "En Route to Dropoff", "Searching", "Open for Bids"],
  Arrived: [],
  "Picked Up": ["Picked Up"],
  "At Risk": [],
}

export default function LiveTrackerPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [activeDeliveryTab, setActiveDeliveryTab] = useState("In Transit")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any[]>([])
  const [viewOptions, setViewOptions] = useState<any[]>([])
  const [deliveryTabs, setDeliveryTabs] = useState<any[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/dashboard/live-tracker")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setStats(data.stats || [])
        setViewOptions(data.viewOptions || [])
        setDeliveryTabs(data.deliveryTabs || [])
        setActiveDeliveries(data.activeDeliveries || [])
        setError(null)
        setLoading(false)
        if ((data.activeDeliveries || []).length > 0) setSelectedOrder(data.activeDeliveries[0].id)
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load live tracker")
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const matched = TAB_MATCH[activeDeliveryTab] || []
  const shownDeliveries = matched.length === 0
    ? activeDeliveries
    : activeDeliveries.filter((d) => matched.includes(d.status))

  const selectedDelivery = activeDeliveries.find((d) => d.id === selectedOrder) || null
  const mapDeliveries = activeDeliveries.filter((d) => d.lat != null && d.lng != null)

  return (
    <div className="flex h-full relative">
      {/* Left Filters Panel */}
      <div className="w-[240px] bg-white border-r border-border-default overflow-y-auto shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
            <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">Reset</button>
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">View</p>
            <div className="space-y-2">
              {viewOptions.map((opt, i) => (
                <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="view" defaultChecked={i === 0} className="w-3.5 h-3.5 text-sendme border-border-default focus:ring-sendme/20" />
                  <span className="text-xs text-text-primary group-hover:text-sendme transition-colors flex-1">{opt.label}</span>
                  {opt.count != null && <span className="text-[10px] text-text-muted">{opt.count.toLocaleString()}</span>}
                </label>
              ))}
            </div>
          </div>

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

          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Vehicle Type</p>
            <button className="w-full flex items-center justify-between bg-white border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors">
              All Types <ChevronDown size={14} className="text-text-muted" />
            </button>
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Delivery Type</p>
            <button className="w-full flex items-center justify-between bg-white border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors">
              All Types <ChevronDown size={14} className="text-text-muted" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">More Filters</p>
            <button className="flex items-center gap-1.5 text-xs font-medium text-sendme hover:text-sendme-dark transition-colors">
              <Plus size={14} /> Add Filter
            </button>
          </div>

          <p className="text-[10px] text-text-muted">
            Tracking <span className="font-semibold text-sendme">{activeDeliveries.length}</span> active {activeDeliveries.length === 1 ? "delivery" : "deliveries"}
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

            {mapDeliveries.map((d) => (
              <div
                key={d.id}
                style={markerPos(d.lat, d.lng)}
                className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center shadow-lg cursor-pointer z-10 transition-transform hover:scale-110 ${selectedOrder === d.id ? "bg-sendme ring-2 ring-sendme/30" : "bg-sendme/70"}`}
                onClick={() => setSelectedOrder(d.id)}
                title={`${d.id} · ${d.status}`}
              >
                <Truck size={12} className="text-white" />
              </div>
            ))}

            {selectedDelivery && selectedDelivery.lat != null && selectedDelivery.lng != null && (
              <div
                style={markerPos(selectedDelivery.lat, selectedDelivery.lng)}
                className="absolute -translate-x-1/2 -translate-y-[150%] bg-white border border-border-default rounded-lg px-2.5 py-1 shadow-md z-20"
              >
                <p className="text-[10px] font-bold text-text-primary">{selectedDelivery.id}</p>
                <p className="text-[9px] text-text-muted">{selectedDelivery.status}</p>
              </div>
            )}
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

        {selectedOrder && (
          <TrackerDetail
            orderId={selectedOrder}
            delivery={selectedDelivery}
            onClose={() => setSelectedOrder(null)}
          />
        )}

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
      </div>

      {/* Right Sidebar - Active Deliveries */}
      <div className="w-[300px] bg-white border-l border-border-default flex flex-col shrink-0 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Active Deliveries</h3>
            <span className="text-[10px] font-semibold text-sendme hover:text-sendme-dark cursor-pointer">View All</span>
          </div>
          <div className="flex gap-0 border-b border-border-light">
            {deliveryTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveDeliveryTab(tab.name)}
                className={`px-2.5 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeDeliveryTab === tab.name
                    ? "border-sendme text-sendme"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.name} <span className="ml-0.5">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3 text-xs font-semibold text-text-primary">Stats</div>
        <div className="grid grid-cols-2 gap-2 px-4 pt-2">
          {stats.slice(0, 2).map((s) => {
            const Icon = statIcons[s.icon] || Truck
            return (
              <Card key={s.label} className="p-2.5 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className={s.color || "text-sendme"} />
                  <p className="text-[9px] text-text-muted truncate">{s.label}</p>
                </div>
                <p className="text-sm font-bold text-text-primary truncate" title={String(s.value)}>{String(s.value)}</p>
              </Card>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {error ? (
            <p className="text-xs text-danger">{error}</p>
          ) : !loading && shownDeliveries.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">No active deliveries{` for "${activeDeliveryTab}"`}.</p>
          ) : (
            shownDeliveries.map((d) => (
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
                      {d.driver ? d.driver.charAt(0) : "?"}
                    </div>
                    <span className="text-[10px] text-text-muted truncate">{d.driver} • {d.vehicle}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-sendme">{d.eta}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}