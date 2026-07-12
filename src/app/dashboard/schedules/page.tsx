"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ScheduleDetail } from "@/components/dashboard/schedule-detail"
import { ScheduleForm } from "@/components/dashboard/forms"
import {
  Calendar, Clock, AlertTriangle, ChevronDown,
  Search, Download, Plus, MoreHorizontal, ArrowUpDown, Filter,
  ChevronLeft, ChevronRight, CheckCircle, UserX
} from "lucide-react"

const stats = [
  { label: "Scheduled Today", value: "64", change: "↑ 8% vs yesterday", up: true, icon: Calendar, color: "text-info", bg: "bg-info-light" },
  { label: "Confirmed", value: "42", change: "↑ 10% vs yesterday", up: true, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Confirmation Pending", value: "16", change: "↓ 3% vs yesterday", up: false, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
  { label: "Unassigned", value: "6", change: "↓ 2% vs yesterday", up: false, icon: UserX, color: "text-text-secondary", bg: "bg-surface-secondary" },
  { label: "At Risk", value: "2", change: "↓ 1% vs yesterday", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
]

const statusTabs = [
  { name: "All Schedules", count: 64, active: true },
  { name: "Today", count: 64 },
  { name: "Tomorrow", count: 28 },
  { name: "This Week", count: 156 },
  { name: "Custom Range", count: 0 },
]

const schedules = [
  { id: "SCH-20491", date: "May 20, 2024", window: "10:00 AM - 12:00 PM", windowNote: "In 35 mins", windowColor: "text-sendme", from: "Lekki", to: "Ikeja", fromAddr: "Legacy St 29, Admiralty Rd", customer: "Collins Bassie", customerType: "Individual", driver: "Damilaro Adegbite", driverRating: "4.8", vehicle: "Motorbike", vehiclePlate: "ABC 123 DE", driverAvatar: "D", status: "Confirmed", statusColor: "bg-sendme-50 text-sendme" },
  { id: "SCH-20492", date: "May 20, 2024", window: "12:00 PM - 2:00 PM", windowNote: "In 2h 35m", windowColor: "text-warning", from: "Surulere", to: "Ajah", fromAddr: "Bode Thomas St, Lekki-Epe Expressway", customer: "Starlight Logistics", customerType: "Organization", driver: "Emeka Nwosu", driverRating: "4.6", vehicle: "Truck", vehiclePlate: "GGE 432 YY", driverAvatar: "E", status: "Confirmation Pending", statusColor: "bg-warning-light text-warning" },
  { id: "SCH-20493", date: "May 20, 2024", window: "2:00 PM - 4:00 PM", windowNote: "At Risk", windowColor: "text-danger", from: "Victoria Island", to: "Ibeju", fromAddr: "Ahmadu Bello Way, Lekki-Epe Expressway", customer: "Konga Warehouse", customerType: "Organization", driver: null, driverRating: null, vehicle: "Not assigned", vehiclePlate: null, driverAvatar: null, status: "At Risk", statusColor: "bg-danger-light text-danger" },
  { id: "SCH-20494", date: "May 20, 2024", window: "4:00 PM - 6:00 PM", windowNote: "In 6h 35m", windowColor: "text-text-muted", from: "Yaba", to: "Ikeja", fromAddr: "Herbert Macaulay Rd, Allen Ave", customer: "Ada Okon", customerType: "Individual", driver: "Chinedu Okafor", driverRating: "4.7", vehicle: "Car", vehiclePlate: "KJA 908 LM", driverAvatar: "C", status: "Reserved", statusColor: "bg-info-light text-info" },
  { id: "SCH-20495", date: "May 20, 2024", window: "6:00 PM - 8:00 PM", windowNote: "In 8h 35m", windowColor: "text-text-muted", from: "Oshodi", to: "Abule Egba", fromAddr: "Oshodi Expressway, Abule Egba Rd", customer: "Swift Supplies", customerType: "Organization", driver: "Tunde Ibrahim", driverRating: "4.9", vehicle: "Pickup", vehiclePlate: "BDG 776 GH", driverAvatar: "T", status: "Confirmed", statusColor: "bg-sendme-50 text-sendme" },
  { id: "SCH-20496", date: "May 20, 2024", window: "8:00 PM - 10:00 PM", windowNote: "In 10h 35m", windowColor: "text-text-muted", from: "Ikeja", to: "Ogba", fromAddr: "Obafemi Awolowo Way, Ogba Bus Stop", customer: "Peace Stores", customerType: "Individual", driver: null, driverRating: null, vehicle: "Not assigned", vehiclePlate: null, driverAvatar: null, status: "Unassigned", statusColor: "bg-surface-secondary text-text-muted" },
  { id: "SCH-20497", date: "May 21, 2024", window: "9:00 AM - 11:00 AM", windowNote: "Tomorrow", windowColor: "text-info", from: "Lagos Island", to: "Lekki", fromAddr: "Broad St, Lekki Phase 1", customer: "RedBridge Ltd", customerType: "Organization", driver: "Bashir Lawal", driverRating: "4.8", vehicle: "Truck", vehiclePlate: "KSF 321 HG", driverAvatar: "B", status: "Confirmed", statusColor: "bg-sendme-50 text-sendme" },
  { id: "SCH-20498", date: "May 21, 2024", window: "11:00 AM - 1:00 PM", windowNote: "Tomorrow", windowColor: "text-info", from: "Ikorodu", to: "VI", fromAddr: "Ikorodu Rd, Victoria Island", customer: "Collins Bassie", customerType: "Individual", driver: "Taiwo Adebayo", driverRating: "4.7", vehicle: "Motorbike", vehiclePlate: "LND 234 TR", driverAvatar: "T", status: "Confirmation Pending", statusColor: "bg-warning-light text-warning" },
]

const filters = ["Status", "Vehicle Type", "Customer Type", "Payment Method", "Delivery Type"]

export default function SchedulesPage() {
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>("SCH-20491")
  const [activeTab, setActiveTab] = useState("All Schedules")
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Schedules</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage and monitor all scheduled deliveries and upcoming pickups.</p>
            </div>
            <button 
              onClick={() => setIsScheduleFormOpen(true)}
              className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"
            >
              <Plus size={16} /> Create Schedule
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Calendar size={14} className="text-text-muted" /> Today, May 20 <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <span className="w-2 h-2 rounded-full bg-sendme" /> All Cities <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Statuses <ChevronDown size={14} className="text-text-muted" />
            </button>
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input type="text" placeholder="Search by ID, customer, driver..." className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent" />
            </div>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Download size={14} className="text-text-muted" /> Export
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted">{stat.label}</p>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}><Icon size={16} /></div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5">{stat.value}</p>
                  <p className={`text-[10px] font-medium ${stat.up ? "text-sendme" : "text-danger"}`}>{stat.up ? "↑" : "↓"} {stat.change}</p>
                </Card>
              )
            })}
          </div>

          <div className="flex items-center gap-0 border-b border-border-light overflow-x-auto">
            {statusTabs.map((tab) => (
              <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.name ? "border-sendme text-sendme" : "border-transparent text-text-muted hover:text-text-primary"}`}>
                {tab.name}
                {tab.count > 0 && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab === tab.name ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"}`}>{tab.count}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
              <button key={f} className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors">
                {f} <ChevronDown size={12} className="text-text-muted" />
              </button>
            ))}
            <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors">
              <Filter size={12} className="text-text-muted" /> More Filters
            </button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Schedule ID <ArrowUpDown size={10} className="inline ml-1" /></th>
                    <th className="px-4 py-3 font-semibold">Pickup Window</th>
                    <th className="px-4 py-3 font-semibold">Route</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Driver</th>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} onClick={() => setSelectedSchedule(s.id)} className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${selectedSchedule === s.id ? "bg-sendme-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-text-primary">{s.id}</p>
                        <p className="text-[10px] text-text-muted">{s.date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{s.window}</p>
                        <p className={`text-[10px] font-medium ${s.windowColor}`}>{s.windowNote}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{s.from} → {s.to}</p>
                        <p className="text-[10px] text-text-muted truncate max-w-[140px]">{s.fromAddr}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{s.customer}</p>
                        <p className="text-[10px] text-text-muted">{s.customerType}</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.driver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold shrink-0">{s.driverAvatar}</div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{s.driver}</p>
                              <p className="text-[10px] text-text-muted flex items-center gap-1"><span className="text-warning text-[8px]">★</span> {s.driverRating}</p>
                            </div>
                          </div>
                        ) : <p className="text-[10px] text-text-muted italic">—</p>}
                      </td>
                      <td className="px-4 py-3">
                        {s.vehiclePlate ? (
                          <div>
                            <p className="text-xs font-medium text-text-primary">{s.vehicle}</p>
                            <p className="text-[10px] text-text-muted">{s.vehiclePlate}</p>
                          </div>
                        ) : <p className="text-[10px] text-text-muted italic">{s.vehicle}</p>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.statusColor}`}>{s.status}</span></td>
                      <td className="px-4 py-3 text-right"><button className="p-1 text-text-muted hover:text-text-primary transition-colors"><MoreHorizontal size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
              <p className="text-xs text-text-muted">Showing 1 to 8 of 64 schedules</p>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={14} /></button>
                {[1, 2, 3].map((p) => (
                  <button key={p} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === 1 ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"}`}>{p}</button>
                ))}
                <span className="text-text-muted text-xs px-1">...</span>
                <button className="w-7 h-7 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-hover transition-colors">8</button>
                <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={14} /></button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {selectedSchedule && <ScheduleDetail scheduleId={selectedSchedule} onClose={() => setSelectedSchedule(null)} />}

      {/* Schedule Form Modal */}
      <ScheduleForm isOpen={isScheduleFormOpen} onClose={() => setIsScheduleFormOpen(false)} />
    </div>
  )
}
