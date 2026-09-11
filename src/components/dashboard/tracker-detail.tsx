"use client"

import { useState } from "react"
import { X, Phone, MessageCircle, Navigation } from "lucide-react"

interface TrackerDetailProps {
  orderId: string
  delivery?: any | null
  onClose: () => void
}

const tabs = ["Details", "Timeline", "Proof", "Chat", "Activity"]

function DetailsTab({ d }: { d: any | null }) {
  const driverName = d?.driver || null
  const customerName = d?.customer || null
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-text-muted font-medium mb-1.5">Driver</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">{driverName ? driverName[0] : "?"}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{driverName || "Unassigned"}</p>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button className="p-1 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
              <button className="p-1 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-text-muted font-medium mb-1.5">Customer</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">{customerName ? customerName[0] : "?"}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{customerName || "—"}</p>
              <p className="text-[10px] text-text-muted">{d?.customerPhone || ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-border-light">
        <p className="text-xs text-text-muted">Vehicle</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-primary">{d?.vehicle || "—"}</span>
          {d?.plate && <span className="text-xs text-text-muted">{d.plate}</span>}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-sendme">Pickup</p>
              <p className="text-xs text-text-primary">{d?.fromAddr || "—"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-danger">Dropoff</p>
              <p className="text-xs text-text-primary">{d?.toAddr || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-light">
        <div>
          <p className="text-[10px] text-text-muted">Fare</p>
          <p className="text-sm font-bold text-text-primary">{d?.fare || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Payment</p>
          <p className="text-sm font-semibold text-text-primary">{d?.payment || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Order Type</p>
          <p className="text-sm font-semibold text-text-primary">{d?.itemType || "—"}</p>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 bg-sendme text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors">
        View Full Details <Navigation size={12} />
      </button>
    </div>
  )
}

export function TrackerDetail({ orderId, delivery, onClose }: TrackerDetailProps) {
  const [activeTab, setActiveTab] = useState("Details")

  return (
    <div className="absolute bottom-4 right-4 w-[380px] bg-white border border-border-default rounded-xl shadow-lg z-20 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{delivery?.id || orderId}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${delivery?.statusColor || "bg-surface-secondary text-text-muted"}`}>{delivery?.status || "—"}</span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-0 border-b border-border-light">
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

      <div className="px-4 py-3 max-h-[320px] overflow-y-auto">
        {activeTab === "Details" && <DetailsTab d={delivery} />}
        {activeTab === "Timeline" && (
          <div className="flex items-center justify-center h-24"><p className="text-xs text-text-muted">Timeline coming soon</p></div>
        )}
        {activeTab === "Proof" && (
          <div className="flex items-center justify-center h-24"><p className="text-xs text-text-muted">Proof of delivery coming soon</p></div>
        )}
        {activeTab === "Chat" && (
          <div className="flex items-center justify-center h-24"><p className="text-xs text-text-muted">Chat coming soon</p></div>
        )}
        {activeTab === "Activity" && (
          <div className="flex items-center justify-center h-24"><p className="text-xs text-text-muted">Activity log coming soon</p></div>
        )}
      </div>
    </div>
  )
}