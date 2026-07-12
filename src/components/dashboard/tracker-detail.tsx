"use client"

import { useState } from "react"
import { X, MapPin, Phone, MessageCircle, Star, Navigation, Clock } from "lucide-react"

interface TrackerDetailProps {
  orderId: string
  onClose: () => void
}

const tabs = ["Details", "Timeline", "Proof", "Chat", "Activity"]

function DetailsTab() {
  return (
    <div className="space-y-4">
      {/* Driver & Customer */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-text-muted font-medium mb-1.5">Driver</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">D</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">Damilaro Adegbite</p>
              <div className="flex items-center gap-1">
                <Star size={10} className="text-warning fill-warning" />
                <span className="text-[10px] text-text-muted">4.8</span>
              </div>
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
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">C</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">Collins Bassie</p>
              <p className="text-[10px] text-text-muted">0803 123 4567</p>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button className="p-1 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
              <button className="p-1 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle */}
      <div className="flex items-center justify-between py-2 border-b border-border-light">
        <p className="text-xs text-text-muted">Vehicle</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-primary">Motorbike</span>
          <span className="text-xs text-text-muted">ABC 123 DE</span>
        </div>
      </div>

      {/* Route */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-sendme">Pickup</p>
              <p className="text-xs text-text-primary">Lekki Phase 1, Lekki</p>
            </div>
            <span className="text-[10px] text-text-muted">10:24 AM</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-danger">Dropoff</p>
              <p className="text-xs text-text-primary">Ikeja, Lagos</p>
            </div>
            <span className="text-[10px] text-text-muted">11:10 AM</span>
          </div>
        </div>
      </div>

      {/* Fare / Payment / Type */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-light">
        <div>
          <p className="text-[10px] text-text-muted">Fare</p>
          <p className="text-sm font-bold text-text-primary">₦6,800</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Payment</p>
          <p className="text-sm font-semibold text-text-primary">Cash</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Order Type</p>
          <p className="text-sm font-semibold text-text-primary">Small Item</p>
        </div>
      </div>

      {/* View Full Details */}
      <button className="w-full flex items-center justify-center gap-2 bg-sendme text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors">
        View Full Details <Navigation size={12} />
      </button>
    </div>
  )
}

export function TrackerDetail({ orderId, onClose }: TrackerDetailProps) {
  const [activeTab, setActiveTab] = useState("Details")

  return (
    <div className="absolute bottom-4 right-4 w-[380px] bg-white border border-border-default rounded-xl shadow-lg z-20 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{orderId}</h3>
            <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">In Transit</span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
        {/* Tabs */}
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

      {/* Content */}
      <div className="px-4 py-3 max-h-[320px] overflow-y-auto">
        {activeTab === "Details" && <DetailsTab />}
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
