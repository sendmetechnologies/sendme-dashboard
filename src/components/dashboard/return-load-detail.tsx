"use client"

import { useState } from "react"
import { X, MapPin, Phone, MessageCircle, Star, CheckCircle, Clock, Package, Truck, Users, ChevronRight, ExternalLink, Edit, MoreHorizontal, AlertTriangle, Send as SendIcon } from "lucide-react"

interface ReturnLoadDetailProps {
  loadId: string
  onClose: () => void
}

const tabs = ["Overview", "Loads (2)", "Driver", "Timeline", "Activity"]

function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Route Information */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Route Information</h4>
          <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark flex items-center gap-1">
            View on map <ExternalLink size={10} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-sendme">From</p>
              <p className="text-xs font-semibold text-text-primary">Asaba, Delta</p>
              <p className="text-[10px] text-text-muted">Ogwulogbo Road, Asaba</p>
            </div>
            <span className="text-[10px] text-text-muted">10:00 AM</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-danger">To</p>
              <p className="text-xs font-semibold text-text-primary">Lagos Island, Lagos</p>
              <p className="text-[10px] text-text-muted">Marina, Lagos Island</p>
            </div>
            <span className="text-[10px] text-text-muted">6:00 PM</span>
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

      {/* Load & Capacity */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Load & Capacity</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted flex items-center gap-1.5"><Truck size={12} /> Vehicle Type</p>
            <p className="text-[11px] font-medium text-text-primary">Truck (10 Tons)</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Total Capacity</p>
            <p className="text-[11px] font-medium text-text-primary">10 Tons</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Matched Capacity</p>
            <p className="text-[11px] font-semibold text-sendme">8 / 10 Tons</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Load Type</p>
            <p className="text-[11px] font-medium text-text-primary">General Goods</p>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Special Requirements</p>
            <p className="text-[11px] font-medium text-text-muted italic">None</p>
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Match Details</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Match Score</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div className="h-full bg-sendme rounded-full" style={{ width: "92%" }} />
              </div>
              <span className="text-[11px] font-semibold text-sendme">92%</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Matched At</p>
            <p className="text-[11px] font-medium text-text-primary">May 19, 2025, 9:35 AM</p>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Reason</p>
            <p className="text-[11px] font-medium text-text-primary">Same route, compatible capacity and delivery window</p>
          </div>
        </div>
      </div>

      {/* Driver / Organization */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Driver / Organization</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold shrink-0">D</div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-text-primary">Damilaro Adegbite</p>
                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-sendme bg-sendme-50 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-sendme" /> Online
                </span>
              </div>
              <p className="text-[10px] text-text-muted">ABC 123 DE • Truck Driver</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          View Full Details
        </button>
        <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-[11px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5">
          Unmatch
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <MessageCircle size={12} /> Message Driver
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Phone size={12} /> Call Driver
        </button>
      </div>
    </div>
  )
}

function LoadsTab() {
  const loads = [
    {
      id: "LD-5031", status: "Matched", statusColor: "bg-sendme-50 text-sendme",
      company: "GreenBasket Ltd.", route: "Asaba, Delta → Lagos Island, Lagos",
      capacity: "3.5 / 10 Tons", capacityPct: "35% of capacity",
      tags: ["General Goods", "Boxed"],
      fare: "₦85,000", matchedAt: "May 19, 2025, 9:18 AM", matchScore: "95%",
    },
    {
      id: "LD-5032", status: "Matched", statusColor: "bg-sendme-50 text-sendme",
      company: "Swift Supplies", route: "Onitsha, Anambra → Lagos Mainland, Lagos",
      capacity: "4.5 / 10 Tons", capacityPct: "45% of capacity",
      tags: ["Electronics", "Fragile"],
      fare: "₦120,000", matchedAt: "May 19, 2025, 9:32 AM", matchScore: "89%",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-text-primary">Matched Loads</h4>
          <p className="text-[10px] text-text-muted mt-0.5">2</p>
        </div>
        <button className="flex items-center gap-1 text-[10px] font-semibold text-white bg-sendme px-2.5 py-1.5 rounded-lg hover:bg-sendme-dark transition-colors">
          + Add Load
        </button>
      </div>

      {loads.map((load) => (
        <div key={load.id} className="border border-border-light rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">{load.id}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${load.statusColor}`}>{load.status}</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-text-primary">{load.company}</p>
          <p className="text-[10px] text-text-muted">{load.route}</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">{load.capacity}</span>
            <span className="text-[10px] text-text-muted">{load.capacityPct}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {load.tags.map((tag) => (
              <span key={tag} className="text-[9px] font-medium bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border-light">
            <div>
              <p className="text-[9px] text-text-muted">Fare</p>
              <p className="text-[11px] font-semibold text-text-primary">{load.fare}</p>
            </div>
            <div>
              <p className="text-[9px] text-text-muted">Matched At</p>
              <p className="text-[10px] font-medium text-text-primary">{load.matchedAt}</p>
            </div>
            <div>
              <p className="text-[9px] text-text-muted">Match Score</p>
              <p className="text-[11px] font-semibold text-sendme">{load.matchScore}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-border-default rounded-lg text-[10px] font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Eye size={10} /> View Load
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors">
              <X size={10} /> Remove
            </button>
          </div>
        </div>
      ))}

      {/* Available Capacity */}
      <div className="border border-border-light rounded-lg p-3">
        <h4 className="text-xs font-semibold text-text-primary mb-3">Available Capacity</h4>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-sendme" />
            <div>
              <p className="text-[11px] font-semibold text-text-primary">Available Capacity</p>
              <p className="text-[10px] text-text-muted">2 / 10 Tons</p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-text-muted">20% remaining</span>
        </div>
        <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden mb-3">
          <div className="h-full bg-sendme rounded-full" style={{ width: "80%" }} />
        </div>
        <div className="flex items-center justify-between py-1.5 border-t border-border-light">
          <p className="text-[10px] text-text-muted">Matching Status</p>
          <span className="text-[10px] font-semibold text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">Active</span>
        </div>
        <p className="text-[10px] text-text-muted mt-1">System is still matching compatible loads for this route.</p>
        <button className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1.5 border border-border-default rounded-lg text-[10px] font-medium text-text-primary hover:bg-surface-hover transition-colors">
          Recalculate Match
        </button>
      </div>

      {/* Load Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1">
          <Package size={10} /> View All Loads
        </button>
        <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1">
          + Add Compatible Load
        </button>
        <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1">
          <ChevronRight size={10} /> Recalculate Match
        </button>
      </div>
    </div>
  )
}

function DriverTab() {
  return (
    <div className="space-y-5">
      {/* Driver Profile */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Driver Profile</h4>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-sm font-bold shrink-0">D</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-text-primary">Damilaro Adegbite</p>
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-sendme bg-sendme-50 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sendme" /> Online
              </span>
            </div>
            <p className="text-[10px] text-text-muted">ABC 123 DE • Truck Driver</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <Star size={10} className="text-warning fill-warning" />
                <span className="text-[10px] font-medium text-text-primary">4.8</span>
                <span className="text-[10px] text-text-muted">(128 trips)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors"><Phone size={12} /></button>
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors"><MessageCircle size={12} /></button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <CheckCircle size={12} className="text-sendme" />
          <span className="text-[10px] font-medium text-sendme">Verified</span>
        </div>
      </div>

      {/* Vehicle & Capacity */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Vehicle & Capacity</h4>
        <div className="space-y-2">
          {[
            ["Vehicle Type", "Truck (10 Tons)"],
            ["Plate Number", "ABC 123 DE"],
            ["Total Capacity", "10 Tons"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-[11px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Matched Capacity</p>
            <p className="text-[11px] font-semibold text-sendme">8 Tons (80%)</p>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Available Capacity</p>
            <p className="text-[11px] font-medium text-text-primary">2 Tons (20%)</p>
          </div>
        </div>
        <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden mt-2">
          <div className="h-full bg-sendme rounded-full" style={{ width: "80%" }} />
        </div>
      </div>

      {/* Current Movement */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Current Movement</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Current Location</p>
            <p className="text-[11px] font-medium text-text-primary">Benin-Asaba Expressway</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Heading To</p>
            <p className="text-[11px] font-medium text-text-primary">Lagos Island, Lagos</p>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">ETA</p>
            <p className="text-[11px] font-semibold text-sendme">6:00 PM Today</p>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Last Location Update</p>
            <p className="text-[11px] font-medium text-text-primary">10 mins ago</p>
          </div>
        </div>
        <button className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-sendme-50 border border-sendme/20 rounded-lg text-[11px] font-semibold text-sendme hover:bg-sendme-100 transition-colors">
          <MapPin size={12} /> View on Map
        </button>
      </div>

      {/* Performance & Reliability */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Performance & Reliability</h4>
        <div className="space-y-2">
          {[
            ["Completed Return Loads", "48"],
            ["On-time Rate", "94%"],
            ["Cancellation Rate", "2%"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-[11px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Customer Rating</p>
            <div className="flex items-center gap-1">
              <Star size={10} className="text-warning fill-warning" />
              <span className="text-[11px] font-semibold text-text-primary">4.8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <MessageCircle size={12} /> Message Driver
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Phone size={12} /> Call Driver
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Users size={12} /> View Profile
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Truck size={12} /> Reassign Driver
        </button>
      </div>
    </div>
  )
}

function TimelineTab() {
  const events = [
    { time: "May 19, 2025\n8:10 AM", title: "Return route created", desc: "Return route Asaba → Lagos was created", actor: "System", icon: "🟢", color: "bg-sendme text-white", completed: true },
    { time: "May 19, 2025\n8:30 AM", title: "Matching started", desc: "System started matching for compatible loads", actor: "System", icon: "🔄", color: "bg-info text-white", completed: true },
    { time: "May 19, 2025\n8:35 AM", title: "Load matched", desc: "LD-5031 (GreenBasket Ltd) matched to this route", actor: "System", icon: "📦", color: "bg-sendme text-white", completed: true },
    { time: "May 19, 2025\n8:48 AM", title: "Second load matched", desc: "LD-5032 (Swift Supplies) matched to this route", actor: "System", icon: "📦", color: "bg-sendme text-white", completed: true },
    { time: "May 19, 2025\n9:02 AM", title: "Driver assigned", desc: "Damilaro Adegbite was assigned to this route", actor: "Admin", icon: "👤", color: "bg-sendme-50 text-sendme", completed: true },
    { time: "May 19, 2025\n9:15 AM", title: "Driver accepted", desc: "Driver accepted the matched loads and route", actor: "Damilaro Adegbite", icon: "✅", color: "bg-sendme-50 text-sendme", completed: true },
    { time: "May 19, 2025\n10:00 AM", title: "Departed pickup location", desc: "Driver departed Asaba, Delta", actor: "System (GPS)", icon: "🗺️", color: "bg-info text-white", completed: true },
    { time: "May 19, 2025\n11:30 AM", title: "In transit", desc: "Driver is on the way to Lagos Island, Lagos", actor: "System (GPS)", icon: "🚗", color: "bg-sendme text-white", live: true, completed: false },
  ]

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold text-text-primary">Route Timeline</h4>
      </div>
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
                <span className="text-[10px] text-text-muted whitespace-nowrap">{event.time.split("\n")[1]}</span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">{event.desc}</p>
            <p className="text-[9px] text-text-muted mt-0.5">{event.actor}</p>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-text-muted text-center pt-3 border-t border-border-light">
        All times shown in Africa/Lagos (WAT). Updates appear in real time.
      </p>
    </div>
  )
}

function ActivityTab() {
  const activities = [
    { title: "Admin manually matched load", desc: "LD-5032 (Swift Supplies) was added to this route", actor: "Admin", time: "May 19, 2025\n9:18 AM", icon: "👤", color: "bg-sendme-50 text-sendme" },
    { title: "System recalculated match score", desc: "Match score changed from 89% to 92%", actor: "System", time: "May 19, 2025\n8:50 AM", icon: "🔄", color: "bg-info text-white" },
    { title: "Driver updated capacity", desc: "Available capacity changed from 3 tons to 2 tons", actor: "Damilaro Adegbite", time: "May 19, 2025\n9:10 AM", icon: "📝", color: "bg-sendme-50 text-sendme" },
    { title: "Load removed from route", desc: "LD-5034 was removed from this route", actor: "Admin", time: "May 19, 2025\n8:55 AM", icon: "🗑️", color: "bg-danger-light text-danger" },
    { title: "Customer notified", desc: "GreenBasket Ltd. received pickup confirmation SMS", actor: "System", time: "May 19, 2025\n9:12 AM", icon: "📧", color: "bg-sendme-50 text-sendme" },
    { title: "Support contacted driver", desc: "John Paul called the driver to confirm pickup time", actor: "John Paul", time: "May 19, 2025\n9:20 AM", icon: "📞", color: "bg-warning-light text-warning" },
    { title: "Departure time updated", desc: "Driver updated departure time to 10:00 AM", actor: "Damilaro Adegbite", time: "May 19, 2025\n9:05 AM", icon: "⏰", color: "bg-sendme-50 text-sendme" },
    { title: "Internal note added", desc: "Admin confirmed he can take one more small load", actor: "Admin", time: "May 19, 2025\n9:22 AM", icon: "📝", color: "bg-surface-secondary text-text-muted" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-text-primary">Activity Log</h4>
        <button className="text-[10px] font-semibold text-text-muted hover:text-text-primary flex items-center gap-1">
          <Filter size={10} /> Filters
        </button>
      </div>
      {activities.map((a, i) => (
        <div key={i} className="flex gap-3 pb-4 border-b border-border-light last:border-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${a.color}`}>
            {a.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">{a.title}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{a.desc}</p>
            <p className="text-[9px] text-text-muted mt-0.5">{a.actor}</p>
          </div>
          <span className="text-[10px] text-text-muted whitespace-nowrap">{a.time.split("\n")[1]}</span>
        </div>
      ))}
      {/* Add internal note */}
      <div className="pt-3 border-t border-border-light">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add internal note..."
            className="flex-1 text-xs text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
          />
          <button className="p-2 bg-sendme text-white rounded-lg hover:bg-sendme-dark transition-colors">
            <SendIcon size={14} />
          </button>
        </div>
        <p className="text-[9px] text-text-muted mt-1.5">Only admins and support can see internal notes.</p>
      </div>
    </div>
  )
}

// Need to import Eye and Filter
import { Eye, Filter } from "lucide-react"

export function ReturnLoadDetail({ loadId, onClose }: ReturnLoadDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{loadId}</h3>
            <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-2 py-0.5 rounded-full">Matched</span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Tabs */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "Overview" && <OverviewTab />}
        {activeTab === "Loads (2)" && <LoadsTab />}
        {activeTab === "Driver" && <DriverTab />}
        {activeTab === "Timeline" && <TimelineTab />}
        {activeTab === "Activity" && <ActivityTab />}
      </div>
    </div>
  )
}
