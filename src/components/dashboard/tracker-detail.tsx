"use client"

import { useState } from "react"
import {
  X, Phone, MessageCircle, Navigation, Crosshair,
  Copy, Check, ExternalLink, ShieldAlert, MapPin, Clock, CheckCircle2
} from "lucide-react"

interface TrackerDetailProps {
  orderId: string
  delivery?: any | null
  onClose: () => void
  onTrackOrder?: (delivery: any) => void
  isTracking?: boolean
}

const tabs = ["Details", "Rider Security", "Timeline"]

function formatCoordinates(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return "No GPS lock"
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function cleanPhoneForWa(phone?: string | null): string {
  if (!phone) return ""
  let p = phone.replace(/[^0-9]/g, "")
  if (p.startsWith("0")) p = "234" + p.slice(1)
  return p
}

export function TrackerDetail({
  orderId,
  delivery,
  onClose,
  onTrackOrder,
  isTracking = false,
}: TrackerDetailProps) {
  const [activeTab, setActiveTab] = useState("Details")
  const [copiedGps, setCopiedGps] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)

  const d = delivery
  const driverName = d?.driver || null
  const driverPhone = d?.driverPhone || null
  const customerName = d?.customer || null
  const targetLat = d?.targetLat ?? d?.lat
  const targetLng = d?.targetLng ?? d?.lng
  const coordsText = formatCoordinates(targetLat, targetLng)

  const handleCopyGps = () => {
    if (targetLat != null && targetLng != null) {
      navigator.clipboard.writeText(`${targetLat}, ${targetLng}`)
      setCopiedGps(true)
      setTimeout(() => setCopiedGps(false), 2000)
    }
  }

  const handleCopyPhone = () => {
    if (driverPhone) {
      navigator.clipboard.writeText(driverPhone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  const googleMapsUrl = targetLat != null && targetLng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d?.toAddr || d?.fromAddr || "Nigeria")}`

  return (
    <div className="absolute bottom-4 right-4 w-[380px] max-w-[calc(100vw-32px)] bg-white border border-border-default rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-surface-secondary/40 border-b border-border-light">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{d?.id || orderId}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d?.statusColor || "bg-surface-secondary text-text-muted"}`}>
              {d?.status || "—"}
            </span>
            {isTracking && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-sendme bg-sendme-50 px-2 py-0.5 rounded-full ring-1 ring-sendme/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-sendme" /> Tracking
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-hover transition-colors"
            title="Close details"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-light mt-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-sendme text-sendme"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 max-h-[340px] overflow-y-auto space-y-4">
        {activeTab === "Details" && (
          <div className="space-y-3.5">
            {/* Driver & Customer */}
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-surface-secondary border border-border-light">
              <div>
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Rider / Driver</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold shrink-0">
                    {driverName ? driverName[0].toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{driverName || "Unassigned"}</p>
                    <p className="text-[10px] text-text-muted truncate">{driverPhone || "No phone"}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Sender</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-info-light rounded-full flex items-center justify-center text-info text-xs font-bold shrink-0">
                    {customerName ? customerName[0].toUpperCase() : "C"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{customerName || "Customer"}</p>
                    <p className="text-[10px] text-text-muted truncate">{d?.customerPhone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Plate */}
            <div className="flex items-center justify-between text-xs py-1 px-1 border-b border-border-light">
              <span className="text-text-muted">Vehicle</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary capitalize">{d?.vehicle || "Motorcycle"}</span>
                {d?.plate && (
                  <span className="text-[10px] font-mono font-bold bg-surface-secondary border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                    {d.plate}
                  </span>
                )}
              </div>
            </div>

            {/* Route Points */}
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sendme mt-1 shrink-0 ring-2 ring-sendme/20" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-sendme uppercase">Pickup</p>
                  <p className="text-xs text-text-primary leading-tight line-clamp-2">{d?.fromAddr || d?.from || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-danger mt-1 shrink-0 ring-2 ring-danger/20" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-danger uppercase">Dropoff</p>
                  <p className="text-xs text-text-primary leading-tight line-clamp-2">{d?.toAddr || d?.to || "—"}</p>
                </div>
              </div>
            </div>

            {/* Pricing & Fare */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-light text-center">
              <div className="bg-surface-secondary/60 rounded p-1.5">
                <p className="text-[9px] text-text-muted font-medium">Fare</p>
                <p className="text-xs font-extrabold text-sendme">{d?.fare || "—"}</p>
              </div>
              <div className="bg-surface-secondary/60 rounded p-1.5">
                <p className="text-[9px] text-text-muted font-medium">Payment</p>
                <p className="text-xs font-semibold text-text-primary">{d?.payment || "—"}</p>
              </div>
              <div className="bg-surface-secondary/60 rounded p-1.5">
                <p className="text-[9px] text-text-muted font-medium">Package</p>
                <p className="text-xs font-semibold text-text-primary truncate">{d?.itemType || "Standard"}</p>
              </div>
            </div>

            {/* Action: Track this Order */}
            <button
              onClick={() => onTrackOrder?.(d)}
              className="w-full flex items-center justify-center gap-2 bg-sendme text-white py-2.5 rounded-lg text-xs font-bold hover:bg-sendme-dark transition-all shadow-md shadow-sendme/20 active:scale-[0.99]"
            >
              <Crosshair size={14} className="animate-pulse" /> Track this Order
            </button>
          </div>
        )}

        {activeTab === "Rider Security" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-warning-light/40 border border-warning/30 rounded-lg">
              <ShieldAlert size={16} className="text-warning shrink-0" />
              <p className="text-[10px] text-text-secondary leading-tight">
                Real-time security telemetry for recovering goods or locating rogue riders.
              </p>
            </div>

            {/* Coordinates Box */}
            <div className="p-3 bg-surface-secondary rounded-lg border border-border-default space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Last Known GPS</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d?.driverOnline ? "bg-sendme-50 text-sendme" : "bg-surface-hover text-text-muted"}`}>
                  {d?.driverOnline ? "● Live Online" : "Last Online"}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-text-primary select-all">
                {coordsText}
              </p>
              {d?.driverLastOnline && (
                <p className="text-[10px] text-text-muted flex items-center gap-1">
                  <Clock size={11} /> Pinged: {new Date(d.driverLastOnline).toLocaleTimeString()} ({new Date(d.driverLastOnline).toLocaleDateString()})
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCopyGps}
                  className="flex-1 flex items-center justify-center gap-1 bg-white border border-border-default py-1.5 rounded text-[11px] font-semibold text-text-primary hover:bg-surface-hover transition-colors"
                >
                  {copiedGps ? <Check size={12} className="text-sendme" /> : <Copy size={12} />}
                  {copiedGps ? "Copied Coordinates" : "Copy GPS"}
                </button>
                <button
                  onClick={() => onTrackOrder?.(d)}
                  className="flex-1 flex items-center justify-center gap-1 bg-sendme-50 border border-sendme/30 py-1.5 rounded text-[11px] font-bold text-sendme hover:bg-sendme hover:text-white transition-colors"
                  title="Center and track live in dashboard map"
                >
                  <Crosshair size={12} /> {isTracking ? "Active in Map" : "Track in Dashboard"}
                </button>
              </div>
            </div>

            {/* Rider Contact & Legal Info */}
            {driverName ? (
              <div className="p-3 bg-white rounded-lg border border-border-light space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Rider Name:</span>
                  <span className="font-bold text-text-primary">{driverName}</span>
                </div>
                {driverPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Phone Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-text-primary">{driverPhone}</span>
                      <button onClick={handleCopyPhone} title="Copy phone" className="text-text-muted hover:text-text-primary">
                        {copiedPhone ? <Check size={12} className="text-sendme" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}
                {d?.plate && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">License Plate:</span>
                    <span className="font-mono font-bold bg-surface-secondary px-1.5 py-0.5 rounded">{d.plate}</span>
                  </div>
                )}

                {/* Direct Emergency Dispatch Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-light">
                  {driverPhone && (
                    <a
                      href={`tel:${driverPhone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-sendme text-white py-2 rounded-lg text-xs font-bold hover:bg-sendme-dark transition-colors"
                    >
                      <Phone size={13} /> Call Rider
                    </a>
                  )}
                  {driverPhone && (
                    <a
                      href={`https://wa.me/${cleanPhoneForWa(driverPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-surface-secondary/50 rounded-lg text-xs text-text-muted">
                No rider assigned to this order yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="space-y-3 py-1">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sendme text-white flex items-center justify-center shrink-0 text-[10px]">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Order Created</p>
                <p className="text-[10px] text-text-muted">{d?.created_at ? new Date(d.created_at).toLocaleString() : "Confirmed"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${driverName ? "bg-sendme text-white" : "bg-border-default text-text-muted"}`}>
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Rider Assigned</p>
                <p className="text-[10px] text-text-muted">{driverName ? `${driverName} (${d?.vehicle || "Rider"})` : "Waiting for driver..."}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${d?.statusKey === "picked_up" || d?.statusKey === "delivered" ? "bg-sendme text-white" : "bg-border-default text-text-muted"}`}>
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Goods Picked Up</p>
                <p className="text-[10px] text-text-muted">{d?.fromAddr || "Pickup point"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${d?.statusKey === "delivered" ? "bg-sendme text-white" : "bg-border-default text-text-muted"}`}>
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Delivery Completed</p>
                <p className="text-[10px] text-text-muted">{d?.toAddr || "Dropoff point"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}