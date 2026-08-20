"use client"

import { useState, useEffect } from "react"
import {
  X, CheckCircle, Clock, AlertTriangle, Eye, Edit, RotateCcw, Trash2,
  Star, TrendingUp, FileText, Loader2, DollarSign, MapPin, Truck, User
} from "lucide-react"

interface BidsPricingDetailProps {
  type: "bids" | "price-control" | "route-pricing" | "pricing-logs" | "overrides"
  itemId: string
  onClose: () => void
}

function DetailRow({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between py-1 border-b border-border-light last:border-0">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className={`text-[10px] font-medium ${danger ? "text-danger" : bold ? "text-sendme font-bold" : "text-text-primary"}`}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h4 className="text-[11px] font-semibold text-text-primary mb-2">{title}</h4>{children}</div>
}

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-sendme" /><span className="ml-2 text-[11px] text-text-muted">Loading...</span></div>
}

function ErrorState({ message }: { message: string }) {
  return <div className="text-center py-8"><AlertTriangle size={20} className="mx-auto text-danger mb-2 opacity-60" /><p className="text-[11px] text-text-muted">{message}</p></div>
}

function statusColor(s: string) {
  if (s === "delivered") return "bg-green-50 text-green-600"
  if (s === "accepted" || s === "picked_up" || s === "in_transit") return "bg-sendme-50 text-sendme"
  if (s === "canceled" || s === "cancelled") return "bg-gray-100 text-gray-500"
  if (["searching", "bidding"].includes(s)) return "bg-yellow-50 text-yellow-600"
  if (s === "completed" || s === "paid") return "bg-green-50 text-green-600"
  if (s === "pending") return "bg-yellow-50 text-yellow-600"
  if (s === "failed") return "bg-red-50 text-red-500"
  return "bg-gray-100 text-gray-500"
}

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

// ── Bid Activity Detail ──
function BidActivityDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [order, setOrder] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    setError(null)
    fetch(`/api/dashboard/bids/${encodeURIComponent(itemId)}`)
      .then(r => { if (!r.ok) throw new Error("Order not found"); return r.json() })
      .then(d => {
        setOrder(d.order)
        setBids(d.bids || [])
        setTransactions(d.transactions || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} />
  if (!order) return <ErrorState message="No data" />

  const bidsCount = bids.length
  const acceptedBid = bids.find(b => b.status === "accepted")
  const platformFee = order.pricing?.winningBid ? Math.round(order.pricing.winningBid * 0.15) : 0
  const subTabs = ["Overview", `Bids (${bidsCount})`, "Timeline"]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
        <span className="text-[10px] text-text-muted font-medium">{order.shortId}</span>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-4">
          <Section title="Route">
            <div className="bg-surface-secondary rounded-lg p-3 space-y-1.5">
              <div className="flex items-start gap-2"><MapPin size={12} className="text-sendme mt-0.5 shrink-0" /><div><p className="text-[10px] font-semibold text-text-primary">Pickup</p><p className="text-[10px] text-text-muted">{order.pickupAddress}</p></div></div>
              <div className="flex items-start gap-2"><MapPin size={12} className="text-danger mt-0.5 shrink-0" /><div><p className="text-[10px] font-semibold text-text-primary">Drop-off</p><p className="text-[10px] text-text-muted">{order.dropoffAddress}</p></div></div>
              <div className="flex gap-3 pt-1"><span className="text-[9px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{order.distance}</span><span className="text-[9px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded capitalize">{order.vehicleType}</span><span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${order.urgency === "express" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>{order.urgency}</span></div>
            </div>
          </Section>

          <Section title="Item">
            <DetailRow label="Type" value={order.item.type} />
            <DetailRow label="Description" value={order.item.description || "—"} />
            {order.item.value && <DetailRow label="Declared Value" value={`₦${order.item.value.toLocaleString()}`} bold />}
            {order.item.weight && <DetailRow label="Weight" value={`${order.item.weight} kg`} />}
          </Section>

          <Section title="People">
            <DetailRow label="Sender" value={`${order.customer.name} (${order.customer.phone})`} />
            <DetailRow label="Receiver" value={`${order.receiverName} (${order.receiverPhone})`} />
            <DetailRow label="State" value={order.pickupState} />
          </Section>

          <Section title="Pricing">
            <DetailRow label="Highest Bid" value={order.pricing.highestBid ? `₦${order.pricing.highestBid.toLocaleString()}` : "—"} />
            <DetailRow label="Winning Bid" value={order.pricing.winningBid ? `₦${order.pricing.winningBid.toLocaleString()}` : "—"} bold={!!order.pricing.winningBid} />
            <DetailRow label="Platform Fee (15%)" value={platformFee ? `-₦${platformFee.toLocaleString()}` : "—"} />
            <DetailRow label="Driver Earning" value={order.pricing.driverEarning ? `₦${order.pricing.driverEarning.toLocaleString()}` : "—"} />
            <DetailRow label="Final Price" value={order.pricing.finalPrice ? `₦${order.pricing.finalPrice.toLocaleString()}` : "—"} bold />
          </Section>

          {order.winner && (
            <Section title="Assigned Driver">
              <div className="flex items-center gap-2 bg-surface-secondary rounded-lg p-2.5">
                <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold">{order.winner.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold truncate">{order.winner.name}</span>
                    {order.winner.rating > 0 && <><Star size={9} className="text-warning fill-warning" /><span className="text-[9px] text-text-muted">{order.winner.rating?.toFixed(1)}</span></>}
                    <CheckCircle size={9} className="text-sendme shrink-0" />
                  </div>
                  <p className="text-[9px] text-text-muted">{order.winner.vehicle?.type || "—"} • {order.winner.vehicle?.plate || "—"} • {order.winner.trips} trips</p>
                </div>
              </div>
            </Section>
          )}

          {transactions.length > 0 && (
            <Section title="Transactions">
              {transactions.map((t: any) => (
                <div key={t.id} className="flex justify-between py-1 border-b border-border-light last:border-0">
                  <div><p className="text-[10px] font-medium text-text-primary capitalize">{t.type}</p><p className="text-[9px] text-text-muted">{t.date}</p></div>
                  <div className="text-right"><p className="text-[10px] font-semibold">₦{t.amount.toLocaleString()}</p><span className={`text-[8px] font-medium ${statusColor(t.status)} px-1 py-0.5 rounded`}>{t.status}</span></div>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {tab === "Bids" && (
        <div className="space-y-2">
          {bidsCount === 0 ? (
            <p className="text-center text-[11px] text-text-muted py-6">No bids yet</p>
          ) : (
            bids.map((b: any) => (
              <div key={b.id} className={`p-2.5 rounded-lg border ${b.status === "accepted" ? "border-sendme/30 bg-sendme-50/30" : "border-border-light bg-white"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center text-[9px] font-semibold text-text-primary">{b.driver.name?.charAt(0)}</div>
                    <div>
                      <p className="text-[10px] font-semibold text-text-primary">{b.driver.name}</p>
                      <p className="text-[8px] text-text-muted">{b.driver.vehicle?.type || "—"} • ★ {b.driver.rating?.toFixed(1)} • {b.driver.trips} trips</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-sendme">₦{b.amount.toLocaleString()}</p>
                    <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[8px] text-text-muted">{b.time}</p>
                  {b.eta && <p className="text-[8px] text-text-muted">ETA: {b.eta}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Timeline" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 py-1.5">
            <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
            <div><p className="text-[10px] font-medium text-text-primary">Order created</p><p className="text-[9px] text-text-muted">{new Date(order.created).toLocaleString()}</p></div>
          </div>
          {bids.length > 0 && (
            <div className="flex items-start gap-2 py-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div><p className="text-[10px] font-medium text-text-primary">{bids.length} bid{bids.length !== 1 ? "s" : ""} received</p></div>
            </div>
          )}
          {acceptedBid && (
            <div className="flex items-start gap-2 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div><p className="text-[10px] font-medium text-text-primary">Won by {acceptedBid.driver.name} — ₦{acceptedBid.amount.toLocaleString()}</p></div>
            </div>
          )}
          {order.status === "delivered" && (
            <div className="flex items-start gap-2 py-1.5">
              <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
              <div><p className="text-[10px] font-medium text-text-primary">Delivered</p><p className="text-[9px] text-text-muted">{order.updated ? new Date(order.updated).toLocaleString() : "—"}</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Price Control Detail ──
function PriceControlDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch("/api/admin/state-pricing")
      .then(r => r.json())
      .then(d => setData((d.states || []).find((s: any) => s.id === itemId || s.state === itemId) || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Rule not found" />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${data.is_active ? "bg-sendme-50 text-sendme" : "bg-gray-100 text-gray-500"}`}>{data.is_active ? "Active" : "Inactive"}</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {["Overview"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <Section title="State">
            <DetailRow label="State" value={data.state || "—"} bold />
            <DetailRow label="Label" value={data.label || "—"} />
            <DetailRow label="Base Fare" value={data.base_fare ? `₦${Number(data.base_fare).toLocaleString()}` : "—"} />
          </Section>
          <Section title="Per-KM Rates">
            {data.per_km && Object.entries(data.per_km).map(([k, v]) => (
              <DetailRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={`₦${Number(v).toLocaleString()}/km`} />
            ))}
          </Section>
          {data.per_minute && Object.values(data.per_minute).some(v => v) && (
            <Section title="Per-Minute Rates">
              {Object.entries(data.per_minute).map(([k, v]) => (
                <DetailRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v ? `₦${Number(v).toLocaleString()}/min` : "—"} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

// ── Route Pricing Detail ──
function RoutePricingDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch("/api/admin/route-pricing")
      .then(r => r.json())
      .then(d => setData((d.routes || []).find((r: any) => r.id === itemId) || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Route not found" />

  const vehicleFields = [
    { type: "Motorbike", base: data.motorcycle_base, perKm: data.motorcycle_per_km, min: data.motorcycle_min },
    { type: "Car", base: data.car_base, perKm: data.car_per_km, min: data.car_min },
    { type: "Pickup", base: data.pickup_base, perKm: data.pickup_per_km, min: data.pickup_min },
    { type: "Truck (1-3T)", base: data.truck_light_base, perKm: data.truck_light_per_km, min: data.truck_light_min },
    { type: "Truck (4-7T)", base: data.truck_medium_base, perKm: data.truck_medium_per_km, min: data.truck_medium_min },
    { type: "Truck (8-15T)", base: data.truck_heavy_base, perKm: data.truck_heavy_per_km, min: data.truck_heavy_min },
  ].filter(v => v.base != null || v.perKm != null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${data.is_active ? "bg-sendme-50 text-sendme" : "bg-gray-100 text-gray-500"}`}>{data.is_active ? "Active" : "Inactive"}</span></div>
      <div><h3 className="text-xs font-bold text-text-primary">{data.name || "—"}</h3><p className="text-[9px] text-text-muted">{data.origin_state} → {data.destination_state}{data.distance_km ? ` • ${data.distance_km} km` : ""}</p></div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {["Overview", "Pricing"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <Section title="Route Details">
            <DetailRow label="Type" value={data.route_type || "—"} />
            <DetailRow label="Distance" value={data.distance_km ? `${data.distance_km} km` : "—"} />
            <DetailRow label="Duration" value={data.estimated_duration || "—"} />
            <DetailRow label="Currency" value={data.currency || "NGN"} />
            <DetailRow label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "—"} />
          </Section>
        </div>
      )}
      {tab === "Pricing" && vehicleFields.length > 0 && (
        <div className="space-y-4">
          <Section title="Vehicle Pricing">
            <div className="space-y-0">
              <div className="grid grid-cols-4 gap-1 text-[8px] font-semibold text-text-muted uppercase py-1 border-b border-border-light"><span>Vehicle</span><span>Base</span><span>/KM</span><span>Min</span></div>
              {vehicleFields.map(v => (
                <div key={v.type} className="grid grid-cols-4 gap-1 py-1.5 border-b border-border-light last:border-0 text-[10px]">
                  <span className="font-medium text-text-primary">{v.type}</span>
                  <span className="text-text-primary">{v.base != null ? `₦${Number(v.base).toLocaleString()}` : "—"}</span>
                  <span className="text-text-primary">{v.perKm != null ? `₦${Number(v.perKm).toLocaleString()}` : "—"}</span>
                  <span className="text-text-primary">{v.min != null ? `₦${Number(v.min).toLocaleString()}` : "—"}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}

// ── Pricing Logs Detail ──
function PricingLogsDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Details")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch("/api/admin/pricing-logs")
      .then(r => r.json())
      .then(d => setData((d.logs || []).find((l: any) => l.id === itemId) || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Log not found" />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full capitalize">{data.action || "Log"}</span></div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {["Details"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Details" && (
        <div className="space-y-4">
          <Section title="Log Details">
            <DetailRow label="Action" value={data.action || "—"} />
            <DetailRow label="Module" value={(data.module || "—").replace(/_/g, " ")} />
            <DetailRow label="Route" value={data.route_name || "—"} />
            <DetailRow label="Changed By" value={data.changed_by_name || "—"} />
            <DetailRow label="Timestamp" value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"} />
          </Section>
          {data.reason && <Section title="Reason"><p className="text-[10px] text-text-primary bg-surface-secondary rounded-lg p-2.5">{data.reason}</p></Section>}
          {data.previous_value && data.new_value && (
            <Section title="Change Summary">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-secondary rounded-lg p-2.5"><p className="text-[9px] font-semibold text-text-muted mb-1">Previous</p>{Object.entries(data.previous_value).map(([k, v]) => <DetailRow key={k} label={k} value={String(v)} />)}</div>
                <div className="bg-sendme-50 rounded-lg p-2.5"><p className="text-[9px] font-semibold text-sendme mb-1">New</p>{Object.entries(data.new_value).map(([k, v]) => <DetailRow key={k} label={k} value={String(v)} />)}</div>
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

// ── Override Detail ──
function OverrideDetail({ itemId }: { itemId: string }) {
  const [tab, setTab] = useState("Overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    fetch("/api/admin/pricing-overrides")
      .then(r => r.json())
      .then(d => setData((d.overrides || []).find((o: any) => o.id === itemId) || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemId])

  if (loading) return <LoadingSpinner />
  if (!data) return <ErrorState message="Override not found" />

  const isActive = data.is_active && (!data.end_date || new Date(data.end_date) > new Date())

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-sendme-50 text-sendme" : "bg-gray-100 text-gray-500"}`}>{isActive ? "Active" : "Expired"}</span></div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {["Overview"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <Section title="Override Details">
            <DetailRow label="Name" value={data.override_name || "—"} bold />
            <DetailRow label="Coverage" value={`${data.state || "All States"}${data.city ? ` → ${data.city}` : ""}`} />
            <DetailRow label="Vehicle" value={data.vehicle_type || "All Vehicles"} />
            <DetailRow label="Adjustment" value={`${data.adjustment_type === "percentage" ? `${data.adjustment_value > 0 ? "+" : ""}${data.adjustment_value}%` : `₦${data.adjustment_value?.toLocaleString()}`}`} bold />
            <DetailRow label="Applies To" value={(data.applies_to || []).join(", ") || "—"} />
          </Section>
          <Section title="Duration">
            <DetailRow label="Start" value={data.start_date ? new Date(data.start_date).toLocaleDateString() : "—"} />
            <DetailRow label="End" value={data.end_date ? new Date(data.end_date).toLocaleDateString() : "No end date"} />
          </Section>
          {data.reason && <Section title="Reason"><p className="text-[10px] text-text-primary bg-surface-secondary rounded-lg p-2.5">{data.reason}</p></Section>}
        </div>
      )}
    </div>
  )
}

export function BidsPricingDetail({ type, itemId, onClose }: BidsPricingDetailProps) {
  const titles: Record<string, string> = {
    "bids": "Order Details",
    "price-control": "State Pricing",
    "route-pricing": "Route Details",
    "pricing-logs": "Change Log",
    "overrides": "Override Details",
  }

  return (
    <div className="w-[360px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
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
