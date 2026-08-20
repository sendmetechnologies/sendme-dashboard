"use client"

import { useState, useEffect } from "react"
import {
  X, CheckCircle, Clock, AlertTriangle, Eye, Edit, RotateCcw, Trash2,
  Star, ChevronRight, ArrowRight, TrendingUp, FileText, Loader2
} from "lucide-react"

interface BidsPricingDetailProps {
  type: "bids" | "price-control" | "route-pricing" | "pricing-logs" | "overrides"
  itemId: string
  onClose: () => void
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1 border-b border-border-light last:border-0">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className={`text-[10px] font-medium ${bold ? "text-sendme font-bold" : "text-text-primary"}`}>{value}</span>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={18} className="animate-spin text-sendme" />
      <span className="ml-2 text-[11px] text-text-muted">Loading...</span>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <AlertTriangle size={20} className="mx-auto text-danger mb-2 opacity-60" />
      <p className="text-[11px] text-text-muted">{message}</p>
    </div>
  )
}

function BidActivityDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    setError(null)
    fetch(`/api/dashboard/bids?search=${encodeURIComponent(itemId)}&limit=1`)
      .then(r => r.json())
      .then(d => {
        const order = (d.bids || []).find((b: any) => b.id === itemId || b.shortId === itemId)
        if (order) setData(order)
        else setError("Order not found")
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} />
  if (!data) return <ErrorState message="No data" />

  const bidsCount = data.bids?.length || 0
  const subTabs = [`Overview`, `Bids (${bidsCount})`, "Timeline", "Activity"]

  const platformFee = data.winningBid ? Math.round(data.winningBid * 0.15) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${data.statusColor}`}>{data.status}</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Order Information</h4>
            <DetailRow label="Order ID" value={data.shortId} />
            <DetailRow label="Route" value={data.route} />
            <DetailRow label="Type" value={data.type} />
            <DetailRow label="Customer" value={data.customer} />
            <DetailRow label="Distance" value={data.distance} />
            <DetailRow label="Urgency" value={data.urgency} />
            <DetailRow label="Created" value={data.time} />
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Pricing Summary</h4>
            <DetailRow label="Highest Bid" value={data.highestBid ? `₦${data.highestBid.toLocaleString()}` : "—"} />
            <DetailRow label="Winning Bid" value={data.winningBid ? `₦${data.winningBid.toLocaleString()}` : "—"} bold={!!data.winningBid} />
            <DetailRow label="Platform Fee (15%)" value={platformFee ? `-₦${platformFee.toLocaleString()}` : "—"} />
            <DetailRow label="Driver Earning" value={data.driverEarning ? `₦${data.driverEarning.toLocaleString()}` : "—"} />
            <DetailRow label="Final Price" value={data.finalPrice ? `₦${data.finalPrice.toLocaleString()}` : "—"} bold />
          </div>
          {data.winner !== "—" && (
            <div>
              <h4 className="text-[11px] font-semibold text-text-primary mb-2">Winning Driver</h4>
              <div className="flex items-center gap-2 bg-surface-secondary rounded-lg p-2.5">
                <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold">{data.winner.charAt(0)}</div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold">{data.winner}</span>
                    <CheckCircle size={9} className="text-sendme" />
                  </div>
                  <p className="text-[9px] text-text-muted">{data.winnerVehicle || "—"}</p>
                </div>
              </div>
            </div>
          )}
          {bidsCount > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-text-primary mb-2">Bid Activity ({bidsCount})</h4>
              {data.bids.slice(0, 5).map((b: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-border-light last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">{b.time}</span>
                    <span className="text-[10px] font-medium text-text-primary">{b.driverName}</span>
                    <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${b.status === "accepted" ? "bg-sendme-50 text-sendme" : b.status === "rejected" ? "bg-danger-light text-danger" : "bg-surface-secondary text-text-muted"}`}>{b.status}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-primary">₦{b.amount.toLocaleString()}</span>
                </div>
              ))}
              {bidsCount > 5 && <p className="text-[10px] text-sendme font-medium mt-1">+ {bidsCount - 5} more bids</p>}
            </div>
          )}
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function PriceControlDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch(`/api/dashboard/state-pricing`)
      .then(r => r.json())
      .then(d => {
        const rule = (d.states || []).find((s: any) => s.id === itemId)
        setData(rule || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Rule not found" />

  const subTabs = ["Overview", "History", "Impact", "Activity"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Coverage</h4>
            <DetailRow label="State" value={data.state || "—"} />
            <DetailRow label="Label" value={data.label || "—"} />
            <DetailRow label="Base Fare" value={data.base_fare ? `₦${Number(data.base_fare).toLocaleString()}` : "—"} />
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Per KM Rates</h4>
            {data.motorcycle_per_km != null && <DetailRow label="Motorcycle" value={`₦${Number(data.motorcycle_per_km).toLocaleString()}`} />}
            {data.car_per_km != null && <DetailRow label="Car" value={`₦${Number(data.car_per_km).toLocaleString()}`} />}
            {data.truck_per_km != null && <DetailRow label="Truck" value={`₦${Number(data.truck_per_km).toLocaleString()}`} />}
          </div>
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function RoutePricingDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch(`/api/admin/route-pricing`)
      .then(r => r.json())
      .then(d => {
        const route = (d.routes || []).find((r: any) => r.id === itemId)
        setData(route || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Route not found" />

  const subTabs = ["Overview", "Vehicles & Pricing", "Return Load", "Activity"]
  const vehicles = [
    { type: "Motorbike", base: data.motorcycle_base, perKm: data.motorcycle_per_km, min: data.motorcycle_min },
    { type: "Car", base: data.car_base, perKm: data.car_per_km, min: data.car_min },
    { type: "Pickup", base: data.pickup_base, perKm: data.pickup_per_km, min: data.pickup_min },
    { type: "Truck (1-3 Tons)", base: data.truck_light_base, perKm: data.truck_light_per_km, min: data.truck_light_min },
    { type: "Truck (4-7 Tons)", base: data.truck_medium_base, perKm: data.truck_medium_per_km, min: data.truck_medium_min },
    { type: "Truck (8-15 Tons)", base: data.truck_heavy_base, perKm: data.truck_heavy_per_km, min: data.truck_heavy_min },
  ].filter(v => v.base != null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span></div>
      <div className="flex items-center justify-between">
        <div><h3 className="text-xs font-bold text-text-primary">{data.name || "—"}</h3><p className="text-[9px] text-text-muted">{data.from_state} → {data.to_state}{data.distance_km ? ` • ${data.distance_km} km` : ""}</p></div>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Route Details</h4>
            <DetailRow label="Route Type" value={data.route_type || "—"} />
            <DetailRow label="Currency" value={data.currency || "NGN"} />
            <DetailRow label="Distance" value={data.distance_km ? `${data.distance_km} km` : "—"} />
            <DetailRow label="Active" value={data.is_active ? "Yes" : "No"} />
            <DetailRow label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "—"} />
          </div>
          {vehicles.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-text-primary mb-2">Vehicle Pricing</h4>
              <div className="space-y-0">
                <div className="grid grid-cols-4 gap-1 text-[8px] font-semibold text-text-muted uppercase py-1 border-b border-border-light"><span>Vehicle</span><span>Base</span><span>Per KM</span><span>Min</span></div>
                {vehicles.map(v => (
                  <div key={v.type} className="grid grid-cols-4 gap-1 py-1.5 border-b border-border-light last:border-0 text-[10px]">
                    <span className="font-medium text-text-primary">{v.type}</span>
                    <span className="text-text-primary">{v.base != null ? `₦${Number(v.base).toLocaleString()}` : "—"}</span>
                    <span className="text-text-primary">{v.perKm != null ? `₦${Number(v.perKm).toLocaleString()}` : "—"}</span>
                    <span className="text-text-primary">{v.min != null ? `₦${Number(v.min).toLocaleString()}` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function PricingLogsDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Details")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch(`/api/admin/pricing-logs`)
      .then(r => r.json())
      .then(d => {
        const log = (d.logs || []).find((l: any) => l.id === itemId)
        setData(log || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Log not found" />

  const subTabs = ["Details", "Approval Trail", "Affected Pricing", "History"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">{data.action || "Log"}</span></div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Details" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Log Details</h4>
            <DetailRow label="Action" value={data.action || "—"} />
            <DetailRow label="Module" value={data.module || "—"} />
            <DetailRow label="Route" value={data.route_name || "—"} />
            <DetailRow label="Admin" value={data.admin_email || "—"} />
            <DetailRow label="Timestamp" value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"} />
          </div>
          {data.reason && (
            <div>
              <h4 className="text-[11px] font-semibold text-text-primary mb-1">Reason</h4>
              <p className="text-[10px] text-text-primary bg-surface-secondary rounded-lg p-2.5">{data.reason}</p>
            </div>
          )}
          {data.old_values && data.new_values && (
            <div>
              <h4 className="text-[11px] font-semibold text-text-primary mb-2">Change Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-secondary rounded-lg p-2.5">
                  <p className="text-[9px] font-semibold text-text-muted mb-1.5">Previous</p>
                  {Object.entries(data.old_values).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5"><span className="text-[9px] text-text-muted">{k}</span><span className="text-[9px] font-medium text-text-primary">{String(v)}</span></div>
                  ))}
                </div>
                <div className="bg-sendme-50 rounded-lg p-2.5">
                  <p className="text-[9px] font-semibold text-sendme mb-1.5">New</p>
                  {Object.entries(data.new_values).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5"><span className="text-[9px] text-text-muted">{k}</span><span className="text-[9px] font-bold text-sendme">{String(v)}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab !== "Details" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function OverrideDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch(`/api/admin/pricing-overrides`)
      .then(r => r.json())
      .then(d => {
        const ov = (d.overrides || []).find((o: any) => o.id === itemId)
        setData(ov || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Override not found" />

  const subTabs = ["Overview", "Impact", "Activity", "History"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${data.is_active ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"}`}>{data.is_active ? "Active" : "Inactive"}</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Override Summary</h4>
            <DetailRow label="Name" value={data.name || "—"} />
            <DetailRow label="Route" value={data.route_name || "—"} />
            <DetailRow label="Adjustment Type" value={data.adjustment_type || "—"} />
            <DetailRow label="Adjustment Value" value={data.adjustment_value != null ? `${data.adjustment_value}${data.adjustment_type === "percentage" ? "%" : ""}` : "—"} />
            <DetailRow label="Reason" value={data.reason || "—"} />
            <DetailRow label="Start Date" value={data.start_date ? new Date(data.start_date).toLocaleDateString() : "—"} />
            <DetailRow label="End Date" value={data.end_date ? new Date(data.end_date).toLocaleDateString() : "—"} />
            <DetailRow label="Created" value={data.created_at ? new Date(data.created_at).toLocaleDateString() : "—"} />
          </div>
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

export function BidsPricingDetail({ type, itemId, onClose }: BidsPricingDetailProps) {
  const titles: Record<string, string> = {
    "bids": itemId || "Order",
    "price-control": itemId || "Rule",
    "route-pricing": itemId || "Route",
    "pricing-logs": itemId || "Log",
    "overrides": itemId || "Override",
  }

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-text-primary">{titles[type]}</h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {type === "bids" && <BidActivityDetail itemId={itemId} />}
        {type === "price-control" && <PriceControlDetail itemId={itemId} />}
        {type === "route-pricing" && <RoutePricingDetail itemId={itemId} />}
        {type === "pricing-logs" && <PricingLogsDetail itemId={itemId} />}
        {type === "overrides" && <OverrideDetail itemId={itemId} />}
      </div>
    </div>
  )
}
