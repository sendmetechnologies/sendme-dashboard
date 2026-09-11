"use client"

import { useState } from "react"
import { X, Clock, Calendar, Package, CreditCard, User, MapPin, Phone, MessageCircle, Star } from "lucide-react"

interface ScheduleDetailProps {
  scheduleId: string
  schedule?: any | null
  onClose: () => void
}

const tabs = ["Overview", "Timeline", "Details", "Activity"]

function OverviewTab({ s }: { s: any | null }) {
  const driverName = s?.driver || null
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-text-muted mb-1">Pickup Window</p>
          <p className="text-sm font-bold text-text-primary">{s?.window || "—"}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s?.statusColor || "bg-surface-secondary text-text-muted"}`}>{s?.status || "—"}</span>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-muted" />
          <span className="text-xs text-text-primary">{s?.date || "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-text-muted" />
          <span className="text-xs font-medium text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">{s?.itemType || "Standard"}</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-text-muted" />
          <span className="text-xs text-text-primary">{s?.payment || "—"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 py-2 border-t border-border-light">
        <div className="w-7 h-7 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold">
          {s?.customer ? s.customer[0] : "?"}
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Created by</p>
          <p className="text-xs font-semibold text-text-primary">{s?.customer || "—"}</p>
          <p className="text-[10px] text-text-muted">{s?.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Route</h4>
          <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">View on map</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-sendme">Pickup</p>
              <p className="text-xs text-text-primary">{s?.fromAddr || "—"}</p>
            </div>
            <span className="text-[10px] text-text-muted">{s?.window?.split(" - ")[0] || ""}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-danger">Dropoff</p>
              <p className="text-xs text-text-primary">{s?.toAddr || s?.to || "—"}</p>
            </div>
            <span className="text-[10px] text-text-muted">{s?.window?.split(" - ")[1] || ""}</span>
          </div>
        </div>
        <div className="mt-3 h-20 bg-surface-secondary rounded-lg border border-border-light flex items-center justify-center">
          <div className="text-center">
            <MapPin size={14} className="text-sendme/40 mx-auto mb-0.5" />
            <p className="text-[9px] text-text-muted">Map preview</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Driver & Vehicle</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">{driverName ? driverName[0] : "?"}</div>
            <div>
              <p className="text-xs font-semibold text-text-primary">{driverName || "Not assigned"}</p>
              <div className="flex items-center gap-1">
                {s?.driverRating && (
                  <>
                    <Star size={10} className="text-warning fill-warning" />
                    <span className="text-[10px] text-text-muted">{s.driverRating}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
            <button className="p-1 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-10">
          <span className="text-[10px] text-text-muted">{s?.vehicle || "—"}</span>
          {s?.vehiclePlate && (
            <>
              <span className="text-[10px] text-text-muted">•</span>
              <span className="text-[10px] text-text-muted">{s.vehiclePlate}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <MapPin size={12} /> View on Map
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Calendar size={12} /> Reschedule
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <User size={12} /> Reassign Driver
        </button>
        <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-[11px] font-medium text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5">
          Cancel Schedule
        </button>
      </div>
    </div>
  )
}

function TimelineTab() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <Clock size={18} className="text-text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-text-muted">No timeline recorded for this schedule yet.</p>
        <p className="text-[10px] text-text-muted mt-1">Booking status updates will appear here.</p>
      </div>
    </div>
  )
}

function DetailsTab({ s }: { s: any | null }) {
  const rows: [string, string | null | undefined][] = [
    ["Schedule ID", s?.id],
    ["Date", s?.date],
    ["Pickup Window", s?.window],
    ["Delivery Type", s?.itemType],
    ["Payment Method", s?.payment],
    ["Driver", s?.driver],
    ["Vehicle", s?.vehicle],
    ["Vehicle Plate", s?.vehiclePlate],
    ["Customer", s?.customer],
    ["Pickup Address", s?.fromAddr],
    ["Dropoff Address", s?.toAddr],
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Schedule Information</h4>
        </div>
        <div className="space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted shrink-0">{label}</p>
              <p className="text-[11px] font-medium text-text-primary text-right break-words">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Confirmation Settings</h4>
        <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
          <p className="text-[11px] text-text-muted">Confirmation status</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s?.statusColor || "bg-surface-secondary text-text-muted"}`}>{s?.status || "—"}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <p className="text-[11px] text-text-muted">Driver confirmation required</p>
          <p className="text-[11px] font-medium text-text-primary">{s?.driver ? "Yes" : "Pending"}</p>
        </div>
      </div>
    </div>
  )
}

export function ScheduleDetail({ scheduleId, schedule, onClose }: ScheduleDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{schedule?.id || scheduleId}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${schedule?.statusColor || "bg-surface-secondary text-text-muted"}`}>{schedule?.status || "—"}</span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[11px] font-medium transition-colors border-b-2 ${
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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "Overview" && <OverviewTab s={schedule} />}
        {activeTab === "Timeline" && <TimelineTab />}
        {activeTab === "Details" && <DetailsTab s={schedule} />}
        {activeTab === "Activity" && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-text-muted">Activity log not available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}