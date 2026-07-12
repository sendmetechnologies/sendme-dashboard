"use client"

import { useState } from "react"
import { X, Clock, Calendar, Package, CreditCard, User, MapPin, Phone, MessageCircle, Star, MoreHorizontal } from "lucide-react"

interface ScheduleDetailProps {
  scheduleId: string
  onClose: () => void
}

const tabs = ["Overview", "Timeline", "Details", "Activity"]

function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Pickup Window */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-text-muted mb-1">Pickup Window</p>
          <p className="text-sm font-bold text-text-primary">10:00 AM - 12:00 PM</p>
        </div>
        <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">In 35 mins</span>
      </div>

      {/* Quick Info */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-muted" />
          <span className="text-xs text-text-primary">May 20, 2024</span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-text-muted" />
          <span className="text-xs font-medium text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">Small Item</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-text-muted" />
          <span className="text-xs text-text-primary">Cash</span>
        </div>
      </div>

      {/* Created By */}
      <div className="flex items-center gap-2.5 py-2 border-t border-border-light">
        <div className="w-7 h-7 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold">C</div>
        <div>
          <p className="text-[10px] text-text-muted">Created by</p>
          <p className="text-xs font-semibold text-text-primary">Collins Bassie</p>
          <p className="text-[10px] text-text-muted">May 19, 2024 • 8:24 PM</p>
        </div>
      </div>

      {/* Route */}
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
              <p className="text-xs text-text-primary">Legacy St 29, Lekki</p>
            </div>
            <span className="text-[10px] text-text-muted">10:00 AM</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-danger">Dropoff</p>
              <p className="text-xs text-text-primary">99 Admiralty Rd, Ikeja</p>
            </div>
            <span className="text-[10px] text-text-muted">11:30 AM</span>
          </div>
        </div>
        {/* Mini map */}
        <div className="mt-3 h-20 bg-surface-secondary rounded-lg border border-border-light flex items-center justify-center">
          <div className="text-center">
            <MapPin size={14} className="text-sendme/40 mx-auto mb-0.5" />
            <p className="text-[9px] text-text-muted">Map preview</p>
          </div>
        </div>
      </div>

      {/* Driver & Vehicle */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Driver & Vehicle</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">D</div>
            <div>
              <p className="text-xs font-semibold text-text-primary">Damilaro Adegbite</p>
              <div className="flex items-center gap-1">
                <Star size={10} className="text-warning fill-warning" />
                <span className="text-[10px] text-text-muted">4.8 (128 trips)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
            <button className="p-1 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-10">
          <span className="text-[10px] text-text-muted">Motorbike</span>
          <span className="text-[10px] text-text-muted">•</span>
          <span className="text-[10px] text-text-muted">ABC 123 DE</span>
        </div>
      </div>

      {/* Quick Actions */}
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
  const events = [
    { time: "8:24 PM", title: "Schedule created", desc: "Customer scheduled delivery request", icon: "📋", color: "bg-sendme-50 text-sendme", completed: true },
    { time: "8:32 PM", title: "Driver reserved", desc: "Damilaro Adegbite was reserved for this pickup", icon: "👤", color: "bg-sendme-50 text-sendme", completed: true },
    { time: "9:00 AM", title: "Reminder sent", desc: "Pickup reminder sent to driver and customer", icon: "📧", color: "bg-sendme-50 text-sendme", completed: true },
    { time: "9:18 AM", title: "Driver confirmed", desc: "Driver confirmed availability for pickup window", icon: "✅", color: "bg-sendme-50 text-sendme", completed: true },
    { time: "9:25 AM", title: "Pickup window opens soon", desc: "Pickup starts in 35 mins", icon: "🔵", color: "bg-info text-white", live: true, completed: false },
    { time: "—", title: "Pickup expected", desc: "Scheduled for 10:00 AM - 12:00 PM", icon: "📦", color: "bg-surface-secondary text-text-muted", completed: false },
  ]

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3 pb-5 relative">
          {i < events.length - 1 && (
            <div className={`absolute left-[15px] top-[30px] bottom-0 w-px ${event.completed ? "bg-sendme/20" : "bg-border-light"}`} />
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${event.color} relative z-10`}>
            {event.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-primary">{event.title}</p>
              <div className="flex items-center gap-1.5">
                {event.live && (
                  <span className="text-[9px] font-bold text-sendme bg-sendme-50 px-1.5 py-0.5 rounded-full animate-pulse">Live</span>
                )}
                <span className="text-[10px] text-text-muted whitespace-nowrap">{event.time}</span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">{event.desc}</p>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-text-muted text-center pt-3 border-t border-border-light">
        All times shown in Africa/Lagos (WAT). Updates appear in real time.
      </p>
    </div>
  )
}

function DetailsTab() {
  return (
    <div className="space-y-5">
      {/* Schedule Information */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Schedule Information</h4>
          <div className="flex items-center gap-1">
            <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">Edit</button>
          </div>
        </div>
        <div className="space-y-2">
          {[
            ["Schedule ID", "SCH-20491"],
            ["Date", "May 20, 2024"],
            ["Pickup Window", "10:00 AM - 12:00 PM"],
            ["Delivery Type", "Small Item"],
            ["Payment Method", "Cash"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-[11px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-[11px] text-text-muted">Created By</p>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-5 h-5 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[8px] font-bold">C</div>
            <span className="text-[11px] font-medium text-text-primary">Collins Bassie</span>
          </div>
        </div>
        <div className="space-y-2 mt-1">
          {[
            ["Created On", "May 19, 2024 • 8:24 PM"],
            ["Last Updated", "May 19, 2024 • 8:24 PM"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-[11px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Settings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Confirmation Settings</h4>
          <button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14} /></button>
        </div>
        <div className="space-y-2">
          {[
            ["Driver confirmation required", "Yes"],
            ["Must confirm by", "9:30 AM, May 20"],
            ["Auto-reassign if unconfirmed", "9:40 AM, May 20"],
            ["Reminder sent", "9:00 AM, May 20"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-[11px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Confirmation status</p>
            <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">Confirmed</span>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Additional Information</h4>
        <div className="space-y-2">
          {[
            ["Priority", "Normal"],
            ["Special Instructions", "Leave at the reception"],
            ["Item Category", "Electronics"],
            ["Item", "Laptop"],
            ["Item Size", "Small"],
            ["Weight", "2.5 kg"],
            ["Market Value", "₦165,000"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className={`text-[11px] font-medium ${label === "Special Instructions" ? "text-text-secondary italic" : "text-text-primary"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ScheduleDetail({ scheduleId, onClose }: ScheduleDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{scheduleId}</h3>
            <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">Confirmed</span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Tabs */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "Overview" && <OverviewTab />}
        {activeTab === "Timeline" && <TimelineTab />}
        {activeTab === "Details" && <DetailsTab />}
        {activeTab === "Activity" && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-text-muted">Activity log coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
