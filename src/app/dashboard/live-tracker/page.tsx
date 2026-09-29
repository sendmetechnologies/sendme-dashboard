"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card } from "@/components/ui/card"
import { TrackerDetail } from "@/components/dashboard/tracker-detail"
import { FilterSelect, StateFilter } from "@/components/dashboard/filters"
import { PAGE_REFRESH_EVENT } from "@/hooks/use-page-refresh"
import {
  Truck, Users, Car, CheckCircle, AlertTriangle, ChevronDown,
  Plus, Maximize2, Minus, Activity, Search, RefreshCw, Crosshair,
  MapPin, Navigation, ExternalLink, Copy, Check, Eye, RotateCcw,
  Compass, Radio, ShieldCheck
} from "lucide-react"

const statIcons: Record<string, any> = {
  truck: Truck,
  users: Users,
  car: Car,
  check: CheckCircle,
  alert: AlertTriangle,
}

const vehicleTypes = [
  { icon: "🏍️", label: "Motorbike" },
  { icon: "🚗", label: "Car" },
  { icon: "🛻", label: "Pickup" },
  { icon: "🚚", label: "Truck" },
]

const statusLegend = [
  { color: "bg-sendme", label: "In Transit" },
  { color: "bg-info", label: "Picked Up" },
  { color: "bg-sendme-500", label: "Delivered" },
  { color: "bg-warning", label: "Searching" },
]

// Default Nigeria bounding box
const NIGERIA_BBOX = { minLat: 4.2, maxLat: 13.8, minLng: 2.8, maxLng: 14.5 }

export default function LiveTrackerPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null)
  const [activeDeliveryTab, setActiveDeliveryTab] = useState("All Deliveries")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any[]>([])
  const [viewOptions, setViewOptions] = useState<any[]>([])
  const [deliveryTabs, setDeliveryTabs] = useState<any[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([])

  // Filters State
  const [stateFilter, setStateFilter] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"all" | "deliveries" | "drivers">("all")
  const [statusCheckboxes, setStatusCheckboxes] = useState<Record<string, boolean>>({
    in_transit: true,
    picked_up: true,
    delivered: true,
    searching: true,
  })

  // Map controls
  const [mapType, setMapType] = useState<"radar" | "google">("radar")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [copiedCoords, setCopiedCoords] = useState(false)

  const trackingOrderIdRef = useRef<string | null>(null)

  const fetchTrackerData = useCallback((overrides?: {
    state?: string
    search?: string
    vehicle?: string
    view?: string
  }) => {
    // Only show full loading spinner if activeDeliveries is empty
    setLoading((prev) => (activeDeliveries.length === 0 ? true : false))
    const effectiveState = overrides?.state !== undefined ? overrides.state : stateFilter
    const effectiveSearch = overrides?.search !== undefined ? overrides.search : searchQuery
    const effectiveVehicle = overrides?.vehicle !== undefined ? overrides.vehicle : vehicleFilter
    const effectiveView = overrides?.view !== undefined ? overrides.view : viewMode

    const params = new URLSearchParams()
    if (effectiveState) params.set("state", effectiveState)
    if (effectiveSearch) params.set("search", effectiveSearch)
    if (effectiveVehicle) params.set("vehicle_type", effectiveVehicle)
    if (effectiveView) params.set("view", effectiveView)

    fetch(`/api/dashboard/live-tracker?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats || [])
        setViewOptions(data.viewOptions || [])
        setDeliveryTabs(data.deliveryTabs || [])
        const dels = data.activeDeliveries || []
        setActiveDeliveries(dels)
        setOnlineDrivers(data.onlineDrivers || [])
        setError(null)
        setLoading(false)

        // Keep tracked order locked and firmly updated with newest telemetry
        if (trackingOrderIdRef.current) {
          const fresh = dels.find((d: any) => d.id === trackingOrderIdRef.current || d.fullId === trackingOrderIdRef.current)
          if (fresh) {
            setTrackingOrder(fresh)
          }
        }
      })
      .catch((err) => {
        setError("Failed to load live tracker telemetry")
        setLoading(false)
      })
  }, [stateFilter, searchQuery, vehicleFilter, viewMode, activeDeliveries.length])

  // Initial fetch
  useEffect(() => {
    fetchTrackerData()
  }, [fetchTrackerData])

  // Auto-refresh interval (every 15 seconds)
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchTrackerData()
    }, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchTrackerData])

  // Global header refresh listener
  useEffect(() => {
    const onRefresh = () => fetchTrackerData()
    window.addEventListener(PAGE_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(PAGE_REFRESH_EVENT, onRefresh)
  }, [fetchTrackerData])

  // Filter deliveries according to active tabs, checkboxes, and search
  const filteredDeliveries = useMemo(() => {
    return activeDeliveries.filter((d) => {
      // Tab filter
      if (activeDeliveryTab === "In Transit" && d.statusKey !== "in_transit") return false
      if (activeDeliveryTab === "Picked Up" && d.statusKey !== "picked_up") return false
      if (activeDeliveryTab === "Delivered" && d.statusKey !== "delivered") return false
      if (activeDeliveryTab === "Searching" && d.statusKey !== "searching") return false

      // Checkbox filter
      if (d.statusKey && statusCheckboxes[d.statusKey] === false) return false

      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          d.id.toLowerCase().includes(q) ||
          d.fullId.toLowerCase().includes(q) ||
          (d.customer || "").toLowerCase().includes(q) ||
          (d.customerPhone || "").includes(q) ||
          (d.driver || "").toLowerCase().includes(q) ||
          (d.driverPhone || "").includes(q) ||
          (d.fromAddr || "").toLowerCase().includes(q) ||
          (d.toAddr || "").toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })
  }, [activeDeliveries, activeDeliveryTab, statusCheckboxes, searchQuery])

  const selectedDelivery = useMemo(() => {
    return activeDeliveries.find((d) => d.id === selectedOrder || d.fullId === selectedOrder) || null
  }, [activeDeliveries, selectedOrder])

  // Trigger tracking mode for an order
  const handleTrackOrder = (order: any) => {
    trackingOrderIdRef.current = order.id || order.fullId
    setTrackingOrder(order)
    setSelectedOrder(order.id)
    setZoomLevel(2) // zoom in to order corridor
  }

  const handleExitTracking = () => {
    trackingOrderIdRef.current = null
    setTrackingOrder(null)
    setZoomLevel(1)
  }

  const handleResetFilters = () => {
    setStateFilter("")
    setVehicleFilter("")
    setSearchQuery("")
    setViewMode("all")
    setActiveDeliveryTab("All Deliveries")
    setStatusCheckboxes({
      in_transit: true,
      picked_up: true,
      delivered: true,
      searching: true,
    })
    fetchTrackerData({ state: "", search: "", vehicle: "", view: "all" })
  }

  // Calculate dynamic bounding box for tracking view or general view
  const currentBBox = useMemo(() => {
    if (trackingOrder) {
      const lats: number[] = []
      const lngs: number[] = []

      if (trackingOrder.pickupLat) { lats.push(trackingOrder.pickupLat); lngs.push(trackingOrder.pickupLng) }
      if (trackingOrder.dropoffLat) { lats.push(trackingOrder.dropoffLat); lngs.push(trackingOrder.dropoffLng) }
      if (trackingOrder.driverLat) { lats.push(trackingOrder.driverLat); lngs.push(trackingOrder.driverLng) }

      if (lats.length > 0) {
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        // Add margin
        const latPad = Math.max((maxLat - minLat) * 0.35, 0.08)
        const lngPad = Math.max((maxLng - minLng) * 0.35, 0.08)
        return {
          minLat: minLat - latPad,
          maxLat: maxLat + latPad,
          minLng: minLng - lngPad,
          maxLng: maxLng + lngPad,
        }
      }
    }
    return NIGERIA_BBOX
  }, [trackingOrder])

  // Convert GPS coordinates to percentage position on canvas
  const getCanvasPos = (lat: number, lng: number) => {
    const { minLat, maxLat, minLng, maxLng } = currentBBox
    const top = ((maxLat - lat) / (maxLat - minLat)) * 100
    const left = ((lng - minLng) / (maxLng - minLng)) * 100
    return {
      top: `${Math.min(96, Math.max(4, top))}%`,
      left: `${Math.min(96, Math.max(4, left))}%`,
      rawTop: top,
      rawLeft: left,
    }
  }

  // Copy GPS
  const handleCopyTargetCoords = () => {
    if (!trackingOrder) return
    const lat = trackingOrder.targetLat || trackingOrder.lat
    const lng = trackingOrder.targetLng || trackingOrder.lng
    if (lat && lng) {
      navigator.clipboard.writeText(`${lat}, ${lng}`)
      setCopiedCoords(true)
      setTimeout(() => setCopiedCoords(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-secondary overflow-hidden">

      {/* ── Top Parent Filters Bar ── */}
      <div className="bg-white border-b border-border-default px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0 z-20">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          <StateFilter
            value={stateFilter}
            onChange={(v) => {
              setStateFilter(v)
              fetchTrackerData({ state: v })
            }}
          />

          <FilterSelect
            value={vehicleFilter}
            onChange={(v) => {
              setVehicleFilter(v)
              fetchTrackerData({ vehicle: v })
            }}
            placeholder="All Vehicles"
            options={[
              { value: "motorcycle", label: "Motorcycle" },
              { value: "car", label: "Car" },
              { value: "pickup", label: "Pickup Van" },
              { value: "truck", label: "Truck" },
              { value: "bicycle", label: "Bicycle" },
            ]}
          />

          <div className="flex-1 min-w-[180px] max-w-[320px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-2.5 py-1.5 shadow-sm">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by order ID, rider, customer, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
            />
          </div>

          {(stateFilter || vehicleFilter || searchQuery || trackingOrder) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-semibold text-danger hover:underline px-1 py-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Map view switcher */}
          <div className="bg-surface-secondary border border-border-default p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setMapType("radar")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${mapType === "radar" ? "bg-white text-sendme shadow-xs" : "text-text-muted hover:text-text-primary"}`}
            >
              Radar HUD
            </button>
            <button
              onClick={() => setMapType("google")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${mapType === "google" ? "bg-white text-sendme shadow-xs" : "text-text-muted hover:text-text-primary"}`}
            >
              Google Map
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              autoRefresh
                ? "bg-sendme-50 border-sendme/30 text-sendme"
                : "bg-white border-border-default text-text-muted hover:text-text-primary"
            }`}
            title="Auto refresh every 15s"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-sendme animate-ping" : "bg-text-muted"}`} />
            {autoRefresh ? "Live 15s" : "Paused"}
          </button>

          <button
            onClick={() => fetchTrackerData()}
            className="p-1.5 bg-white border border-border-default rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
            title="Manual refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-sendme" : ""} />
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">

        {/* ── Left Sidebar: Advanced Filter Panels ── */}
        <div className="w-[230px] bg-white border-r border-border-default overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4 space-y-5 text-xs">
            {/* View Mode Radio */}
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2.5">Display Mode</p>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Active", count: activeDeliveries.length + onlineDrivers.length },
                  { id: "deliveries", label: "Deliveries Only", count: activeDeliveries.length },
                  { id: "drivers", label: "Drivers (Live Fleet)", count: onlineDrivers.filter((d: any) => d.isOnline).length },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() => {
                      setViewMode(opt.id as any)
                      fetchTrackerData({ view: opt.id })
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      viewMode === opt.id ? "bg-sendme-50 text-sendme font-bold" : "hover:bg-surface-secondary text-text-secondary"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${viewMode === opt.id ? "bg-sendme text-white" : "bg-surface-secondary text-text-muted"}`}>
                      {opt.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Status Filter */}
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2.5">Delivery Status</p>
              <div className="space-y-2">
                {[
                  { key: "in_transit", label: "In Transit", color: "text-sendme" },
                  { key: "picked_up", label: "Picked Up", color: "text-info" },
                  { key: "delivered", label: "Delivered", color: "text-sendme-dark" },
                  { key: "searching", label: "Searching / Bids", color: "text-warning" },
                ].map((st) => (
                  <label key={st.key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={statusCheckboxes[st.key] ?? true}
                      onChange={(e) => setStatusCheckboxes({ ...statusCheckboxes, [st.key]: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-sendme border-border-default focus:ring-sendme/20"
                    />
                    <span className={`text-xs ${st.color} font-medium group-hover:underline`}>{st.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Security Quick Guide */}
            <div className="p-3 bg-sendme-50/50 rounded-xl border border-sendme/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sendme font-bold text-[11px]">
                <ShieldCheck size={14} /> Security Tracking
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Click any delivery or rider to isolate their GPS telemetry, last go-online coordinates, and dispatch direct Google Maps routing.
              </p>
            </div>
          </div>
        </div>

        {/* ── Center: Interactive Map & Live Tracking Canvas ── */}
        <div className="flex-1 relative overflow-hidden bg-[#e6eee6]">

          {/* Top Floating HUD when an order is actively being tracked */}
          {trackingOrder && (
            <div className="absolute top-3 left-3 right-3 md:right-[320px] bg-white/95 backdrop-blur-md border border-border-default rounded-xl p-3 shadow-lg z-20 flex items-center justify-between gap-3 flex-wrap animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-sendme-50 text-sendme shrink-0">
                  <Compass size={20} className="animate-spin text-sendme duration-1000" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text-primary">{trackingOrder.id}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trackingOrder.statusColor}`}>
                      {trackingOrder.status}
                    </span>
                    <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                      Target: <strong className="text-text-primary">{trackingOrder.targetIsRider ? `Rider ${trackingOrder.driver || ""}` : "Pickup Location"}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {trackingOrder.from} → {trackingOrder.to}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyTargetCoords}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-surface-secondary border border-border-default px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-text-primary transition-colors"
                >
                  {copiedCoords ? <Check size={12} className="text-sendme" /> : <Copy size={12} />}
                  {copiedCoords ? "Copied" : "Copy GPS"}
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${trackingOrder.targetLat},${trackingOrder.targetLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold bg-sendme text-white px-2.5 py-1.5 rounded-lg hover:bg-sendme-dark transition-colors shadow-xs"
                >
                  <ExternalLink size={12} /> Directions
                </a>

                <button
                  onClick={handleExitTracking}
                  className="text-[11px] font-semibold bg-surface-secondary text-text-muted hover:text-text-primary px-2 py-1.5 rounded-lg transition-colors"
                >
                  Exit Tracking
                </button>
              </div>
            </div>
          )}

          {/* Map Render: Google Map Mode */}
          {mapType === "google" ? (
            <div className="w-full h-full relative">
              <iframe
                title="Google Maps Tracking"
                src={`https://maps.google.com/maps?q=${
                  trackingOrder ? `${trackingOrder.targetLat},${trackingOrder.targetLng}` : (stateFilter.toLowerCase().includes("abuja") ? "9.0765,7.3986" : "6.5244,3.3792")
                }&z=${zoomLevel >= 2 ? 15 : 12}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          ) : (
            /* Map Render: SendMe Radar Canvas */
            <div className="w-full h-full relative overflow-hidden select-none">
              {/* Textured Map Background */}
              <div
                className="absolute inset-0 transition-all duration-700"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #e2ece2 0%, #d8e5d8 50%, #cbdccb 100%)',
                }}
              >
                {/* Simulated Road Lines Grid */}
                <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 1000 700">
                  <path d="M50,150 Q300,120 500,280 T950,220" stroke="#9bb39b" strokeWidth="3" fill="none" />
                  <path d="M120,50 Q160,250 250,500 T400,680" stroke="#9bb39b" strokeWidth="2.5" fill="none" />
                  <path d="M500,50 Q480,200 520,400 T500,680" stroke="#9bb39b" strokeWidth="2" fill="none" />
                  <path d="M50,450 Q300,400 650,480 T950,420" stroke="#9bb39b" strokeWidth="2.5" fill="none" />
                  <path d="M200,100 L800,600" stroke="#a6bea6" strokeWidth="1" strokeDasharray="5,5" fill="none" />
                  <path d="M800,100 L200,600" stroke="#a6bea6" strokeWidth="1" strokeDasharray="5,5" fill="none" />
                </svg>

                {/* Major Landmark Watermarks */}
                {!trackingOrder && (
                  <>
                    <span className="absolute top-[18%] left-[24%] text-[11px] font-bold text-text-secondary/40">Ikeja</span>
                    <span className="absolute top-[36%] left-[16%] text-[11px] font-bold text-text-secondary/40">Mushin</span>
                    <span className="absolute top-[52%] left-[42%] text-[11px] font-bold text-text-secondary/40">Yaba</span>
                    <span className="absolute top-[66%] left-[34%] text-[11px] font-bold text-text-secondary/40">Surulere</span>
                    <span className="absolute top-[82%] left-[28%] text-[11px] font-bold text-text-secondary/40">Lekki Phase 1</span>
                    <span className="absolute top-[28%] left-[72%] text-[11px] font-bold text-text-secondary/40">Abuja Central</span>
                  </>
                )}

                {/* ── Route Polylines when an order is tracking ── */}
                {trackingOrder && trackingOrder.pickupLat && trackingOrder.dropoffLat && (
                  (() => {
                    const pPos = getCanvasPos(trackingOrder.pickupLat, trackingOrder.pickupLng)
                    const dPos = getCanvasPos(trackingOrder.dropoffLat, trackingOrder.dropoffLng)
                    const rPos = trackingOrder.driverLat
                      ? getCanvasPos(trackingOrder.driverLat, trackingOrder.driverLng)
                      : null

                    return (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <defs>
                          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#158A5E" />
                            <stop offset="100%" stopColor="#DC2626" />
                          </linearGradient>
                        </defs>

                        {rPos ? (
                          <>
                            {/* Route: Pickup to Rider (Completed Leg) */}
                            <line
                              x1={pPos.left}
                              y1={pPos.top}
                              x2={rPos.left}
                              y2={rPos.top}
                              stroke="#158A5E"
                              strokeWidth="3.5"
                              strokeDasharray="6,4"
                              className="animate-pulse"
                            />
                            {/* Route: Rider to Dropoff (Active Target Leg) */}
                            <line
                              x1={rPos.left}
                              y1={rPos.top}
                              x2={dPos.left}
                              y2={dPos.top}
                              stroke="#DC2626"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                          </>
                        ) : (
                          /* Direct Route: Pickup to Dropoff */
                          <line
                            x1={pPos.left}
                            y1={pPos.top}
                            x2={dPos.left}
                            y2={dPos.top}
                            stroke="url(#routeGradient)"
                            strokeWidth="3.5"
                            strokeDasharray="8,5"
                          />
                        )}
                      </svg>
                    )
                  })()
                )}

                {/* ── Single Order Tracking Markers ── */}
                {trackingOrder ? (
                  <>
                    {/* Pickup Pin */}
                    {trackingOrder.pickupLat && (
                      <div
                        style={getCanvasPos(trackingOrder.pickupLat, trackingOrder.pickupLng)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-sendme text-white flex items-center justify-center shadow-lg ring-4 ring-sendme/20">
                          <MapPin size={16} />
                        </div>
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-border-default rounded-md px-2 py-0.5 shadow-md whitespace-nowrap text-[10px] font-bold text-sendme">
                          Pickup: {trackingOrder.from}
                        </div>
                      </div>
                    )}

                    {/* Dropoff Pin */}
                    {trackingOrder.dropoffLat && (
                      <div
                        style={getCanvasPos(trackingOrder.dropoffLat, trackingOrder.dropoffLng)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center shadow-lg ring-4 ring-danger/20">
                          <MapPin size={16} />
                        </div>
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-border-default rounded-md px-2 py-0.5 shadow-md whitespace-nowrap text-[10px] font-bold text-danger">
                          Dropoff: {trackingOrder.to}
                        </div>
                      </div>
                    )}

                    {/* Target Rider Pin with Live Pulsing Radar */}
                    {trackingOrder.driverLat != null && trackingOrder.driverLng != null && (
                      <div
                        style={getCanvasPos(trackingOrder.driverLat, trackingOrder.driverLng)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                      >
                        {/* Radar Ripple */}
                        <div className="absolute -inset-4 rounded-full bg-sendme/30 animate-ping pointer-events-none" />
                        <div className="absolute -inset-8 rounded-full bg-sendme/15 animate-pulse pointer-events-none" />

                        {/* Rider Marker */}
                        <div className="w-10 h-10 rounded-full bg-sendme text-white flex items-center justify-center shadow-2xl ring-4 ring-white border-2 border-sendme-dark cursor-pointer transform hover:scale-110 transition-transform">
                          <Truck size={18} />
                        </div>

                        {/* Rider Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-border-default rounded-lg px-2.5 py-1.5 shadow-xl text-center whitespace-nowrap">
                          <p className="text-[10px] font-bold text-text-primary">{trackingOrder.driver || "Assigned Rider"}</p>
                          <p className="text-[9px] text-sendme font-semibold">{trackingOrder.plate || trackingOrder.vehicle}</p>
                          <p className="text-[8px] font-mono text-text-muted mt-0.5">
                            {trackingOrder.driverLat.toFixed(4)}, {trackingOrder.driverLng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Overview Markers Mode ── */
                  <>
                    {/* Render Deliveries on Map */}
                    {viewMode !== "drivers" &&
                      filteredDeliveries.map((d) => {
                        const targetLat = d.targetLat || d.pickupLat
                        const targetLng = d.targetLng || d.pickupLng
                        if (!targetLat || !targetLng) return null

                        const isSelected = selectedOrder === d.id || selectedOrder === d.fullId

                        return (
                          <div
                            key={d.fullId}
                            style={getCanvasPos(targetLat, targetLng)}
                            onClick={() => {
                              setSelectedOrder(d.id)
                            }}
                            className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center shadow-lg cursor-pointer z-10 transition-all hover:scale-125 ${
                              isSelected
                                ? "bg-sendme text-white ring-4 ring-sendme/40 z-20 scale-110"
                                : d.statusKey === "delivered"
                                ? "bg-sendme-dark text-white ring-1 ring-white"
                                : d.statusKey === "picked_up"
                                ? "bg-info text-white ring-1 ring-white"
                                : "bg-sendme/85 text-white ring-1 ring-white"
                            }`}
                            title={`${d.id} · ${d.status} · ${d.from}`}
                          >
                            <Truck size={13} />
                          </div>
                        )
                      })}

                    {/* Render Online Fleet Drivers on Map */}
                    {(viewMode === "all" || viewMode === "drivers") &&
                      onlineDrivers.map((driver: any) => {
                        if (!driver.lat || !driver.lng) return null

                        return (
                          <div
                            key={driver.id}
                            style={getCanvasPos(driver.lat, driver.lng)}
                            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning border-2 border-white shadow-md flex items-center justify-center z-10 cursor-pointer hover:scale-125 transition-transform"
                            title={`Rider: ${driver.name} (${driver.phone}) · ${driver.vehicle}`}
                          >
                            <span className="text-[9px]">🏍️</span>
                          </div>
                        )
                      })}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Map Floating Control Widget */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 1))}
              className="bg-white border border-border-default rounded-lg p-2 shadow-md hover:bg-surface-hover text-text-primary transition-colors"
              title="Zoom In"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
              className="bg-white border border-border-default rounded-lg p-2 shadow-md hover:bg-surface-hover text-text-primary transition-colors"
              title="Zoom Out"
            >
              <Minus size={16} />
            </button>
            {trackingOrder && (
              <button
                onClick={() => setZoomLevel(2)}
                className="bg-white border border-border-default rounded-lg p-2 shadow-md hover:bg-surface-hover text-sendme transition-colors"
                title="Recenter on Target Rider"
              >
                <Crosshair size={16} />
              </button>
            )}
          </div>

          {/* Tracker Detail Pop-up Card */}
          {selectedOrder && (
            <TrackerDetail
              orderId={selectedOrder}
              delivery={selectedDelivery}
              onClose={() => setSelectedOrder(null)}
              onTrackOrder={handleTrackOrder}
              isTracking={trackingOrder?.id === selectedOrder || trackingOrder?.fullId === selectedDelivery?.fullId}
            />
          )}

          {/* Bottom Map Legend */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-border-default rounded-xl px-4 py-2 shadow-md hidden sm:flex items-center gap-4 z-10">
            {vehicleTypes.map((v) => (
              <div key={v.label} className="flex items-center gap-1.5">
                <span className="text-xs">{v.icon}</span>
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

        {/* ── Right Sidebar: Active Deliveries List ── */}
        <div className="w-[310px] bg-white border-l border-border-default flex flex-col shrink-0 overflow-hidden z-10">
          <div className="px-4 pt-3 pb-2 border-b border-border-light">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-text-primary">Deliveries</h3>
              <span className="text-[10px] font-bold text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">
                {filteredDeliveries.length} in view
              </span>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {deliveryTabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveDeliveryTab(tab.name)}
                  className={`px-2 py-1.5 text-[10px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeDeliveryTab === tab.name
                      ? "border-sendme text-sendme"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab.name} <span className="opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-surface-secondary/40 border-b border-border-light">
            {stats.slice(0, 2).map((s) => {
              const Icon = statIcons[s.icon] || Truck
              return (
                <Card key={s.label} className="p-2 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={12} className={s.color || "text-sendme"} />
                    <p className="text-[9px] text-text-muted truncate">{s.label}</p>
                  </div>
                  <p className="text-sm font-extrabold text-text-primary">{String(s.value)}</p>
                </Card>
              )
            })}
          </div>

          {/* Scrollable Deliveries Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {error ? (
              <div className="p-4 text-center text-xs text-danger">{error}</div>
            ) : !loading && filteredDeliveries.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted">
                No deliveries match your active filters.
              </div>
            ) : (
              filteredDeliveries.map((d) => {
                const isSelected = selectedOrder === d.id || selectedOrder === d.fullId
                const isTracking = trackingOrder?.id === d.id || trackingOrder?.fullId === d.fullId

                return (
                  <div
                    key={d.fullId}
                    onClick={() => {
                      setSelectedOrder(d.id)
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isTracking
                        ? "border-sendme bg-sendme-50/40 ring-2 ring-sendme/20 shadow-sm"
                        : isSelected
                        ? "border-sendme/70 bg-surface-secondary shadow-xs"
                        : "border-border-light hover:border-border-default bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary">{d.id}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${d.statusColor}`}>
                          {d.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted">{d.time}</span>
                    </div>

                    {/* From - To */}
                    <div className="space-y-1 mb-2 text-[11px] leading-tight">
                      <div className="flex items-center gap-1.5 text-text-secondary truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-sendme shrink-0" />
                        <span className="truncate">{d.from}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                        <span className="truncate">{d.to}</span>
                      </div>
                    </div>

                    {/* Rider Info & Track Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-border-light/60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-[9px] shrink-0">
                          {d.driver ? d.driver.charAt(0).toUpperCase() : "?"}
                        </div>
                        <span className="text-[10px] text-text-muted truncate">
                          {d.driver || "Unassigned"}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTrackOrder(d)
                        }}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                          isTracking
                            ? "bg-sendme text-white"
                            : "bg-surface-secondary hover:bg-sendme-50 text-sendme"
                        }`}
                      >
                        <Crosshair size={11} /> {isTracking ? "Tracking" : "Track"}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}