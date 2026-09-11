"use client"

import { useState } from "react"
import { X, MapPin, Phone, MessageCircle, Package, Truck, MoreHorizontal } from "lucide-react"

interface ReturnLoadDetailProps {
  loadId: string
  load?: any | null
  onClose: () => void
}

const tabs = ["Overview", "Loads", "Driver", "Timeline", "Activity"]

function OverviewTab({ d }: { d: any | null }) {
  const driverName = d?.driver || null
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Route Information</h4>
          <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark flex items-center gap-1">
            View on map
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-sendme">From</p>
              <p className="text-xs font-semibold text-text-primary">{d?.from || "—"}</p>
              <p className="text-[10px] text-text-muted">{d?.fromState || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-danger">To</p>
              <p className="text-xs font-semibold text-text-primary">{d?.to || "—"}</p>
              <p className="text-[10px] text-text-muted">{d?.toState || "—"}</p>
            </div>
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
        <h4 className="text-xs font-semibold text-text-primary mb-3">Load & Capacity</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted flex items-center gap-1.5"><Truck size={12} /> Vehicle Type</p>
            <p className="text-[11px] font-medium text-text-primary">{d?.vehicle || "—"}</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Max Load Capacity</p>
            <p className="text-[11px] font-semibold text-sendme">{d?.capacity || "—"}</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Return Date</p>
            <p className="text-[11px] font-medium text-text-primary">{d?.returnDate || "—"}</p>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Created</p>
            <p className="text-[11px] font-medium text-text-primary">{d?.created || "—"}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Match Details</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Match State</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d?.statusColor || "bg-surface-secondary text-text-muted"}`}>{d?.status || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Status Note</p>
            <p className="text-[11px] font-medium text-text-primary">{d?.statusNote || "—"}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Driver / Organization</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold shrink-0">
              {driverName ? driverName[0] : "?"}
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">{driverName || "Not assigned"}</p>
              <p className="text-[10px] text-text-muted">{d?.driverPlate || d?.vehicle || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          View Full Details
        </button>
        <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-[11px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5">
          Unmatch
        </button>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <Icon size={18} className="text-text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-text-muted">{text}</p>
      </div>
    </div>
  )
}

export function ReturnLoadDetail({ loadId, load, onClose }: ReturnLoadDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{load?.id || loadId}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${load?.statusColor || "bg-surface-secondary text-text-muted"}`}>{load?.status || "—"}</span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
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
        {activeTab === "Overview" && <OverviewTab d={load} />}
        {activeTab === "Loads" && <EmptyState icon={Package} text="No matched loads recorded for this route yet." />}
        {activeTab === "Driver" && <EmptyState icon={Truck} text="No driver profile linked to this route." />}
        {activeTab === "Timeline" && <EmptyState icon={MapPin} text="No timeline recorded for this route yet." />}
        {activeTab === "Activity" && <EmptyState icon={MoreHorizontal} text="Activity log not available yet." />}
      </div>
    </div>
  )
}