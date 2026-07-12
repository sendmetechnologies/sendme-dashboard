"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ReturnLoadDetail } from "@/components/dashboard/return-load-detail"
import {
  ArrowLeftRight, Package, CheckCircle, Clock, AlertTriangle,
  ChevronDown, Search, Download, Plus, MoreHorizontal, ArrowUpDown,
  Filter, ChevronLeft, ChevronRight, Truck, Users
} from "lucide-react"

const stats = [
  { label: "Active Return Routes", value: "28", change: "↑ 12% vs yesterday", up: true, icon: ArrowLeftRight, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Available Loads", value: "43", change: "↑ 8% vs yesterday", up: true, icon: Package, color: "text-info", bg: "bg-info-light" },
  { label: "Matched Today", value: "17", change: "↑ 15% vs yesterday", up: true, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Unmatched Loads", value: "11", change: "↓ 5% vs yesterday", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
  { label: "Completed Today", value: "12", change: "↑ 9% vs yesterday", up: true, icon: Package, color: "text-info", bg: "bg-info-light" },
]

const statusTabs = [
  { name: "All Routes", count: 59, active: true },
  { name: "Available Loads", count: 43 },
  { name: "Matched", count: 17 },
  { name: "Completed", count: 12 },
]

const routes = [
  {
    id: "RL-10028", created: "Created 10:24 AM", iconBg: "bg-sendme", iconLetter: "RL",
    from: "Asaba", fromState: "Asaba, Delta", to: "Lagos", toState: "Lagos Island, Lagos",
    vehicle: "Truck (10 Tons)", capacity: "8 / 10 Tons",
    status: "Matched", statusNote: "In Transit", statusColor: "bg-sendme-50 text-sendme",
    matchScore: "92", driver: "Damilaro Adegbite", driverPlate: "ABC 123 DE", driverAvatar: "D",
  },
  {
    id: "RL-10027", created: "Created 9:15 AM", iconBg: "bg-info", iconLetter: "RL",
    from: "Ibadan", fromState: "Ibadan, Oyo", to: "Abuja", toState: "Abuja, FCT",
    vehicle: "Truck (7 Tons)", capacity: "7 / 7 Tons",
    status: "Available", statusNote: "Open for match", statusColor: "bg-info-light text-info",
    matchScore: null, driver: null, driverPlate: null, driverAvatar: null,
  },
  {
    id: "RL-10026", created: "Created 8:40 AM", iconBg: "bg-sendme", iconLetter: "RL",
    from: "Port Harcourt", fromState: "Port Harcourt, Rivers", to: "Onitsha", toState: "Onitsha, Anambra",
    vehicle: "Pickup (1.5 Tons)", capacity: "1.5 / 1.5 Tons",
    status: "Matched", statusNote: "Driver Assigned", statusColor: "bg-sendme-50 text-sendme",
    matchScore: "87", driver: "Emeka Nwosu", driverPlate: "GGE 432 YY", driverAvatar: "E",
  },
  {
    id: "RL-10025", created: "Created 7:30 AM", iconBg: "bg-danger", iconLetter: "RL",
    from: "Kano", fromState: "Kano, Kano", to: "Kaduna", toState: "Kaduna, Kaduna",
    vehicle: "Truck (5 Tons)", capacity: "0 / 5 Tons",
    status: "Available", statusNote: "Open for match", statusColor: "bg-info-light text-info",
    matchScore: null, driver: null, driverPlate: null, driverAvatar: null,
  },
  {
    id: "RL-10024", created: "Created Yesterday", iconBg: "bg-warning", iconLetter: "RL",
    from: "Abeokuta", fromState: "Abeokuta, Ogun", to: "Lagos", toState: "Lagos Mainland, Lagos",
    vehicle: "Truck (3 Tons)", capacity: "1 / 3 Tons",
    status: "Partially Matched", statusNote: "Finding more loads", statusColor: "bg-warning-light text-warning",
    matchScore: "64", driver: "Tosin Adebayo", driverPlate: "LND 234 TR", driverAvatar: "T",
  },
  {
    id: "RL-10023", created: "Created Yesterday", iconBg: "bg-sendme", iconLetter: "RL",
    from: "Uyo", fromState: "Uyo, Akwa Ibom", to: "Calabar", toState: "Calabar, Cross River",
    vehicle: "Pickup (1 Ton)", capacity: "1 / 1 Ton",
    status: "Completed", statusNote: "Delivered", statusColor: "bg-sendme-50 text-sendme",
    matchScore: "100", driver: "Rashid Lawal", driverPlate: "KJA 908 LM", driverAvatar: "R",
  },
  {
    id: "RL-10022", created: "Created 2 days ago", iconBg: "bg-danger", iconLetter: "RL",
    from: "Kaduna", fromState: "Kaduna, Kaduna", to: "Kano", toState: "Kano, Kano",
    vehicle: "Truck (10 Tons)", capacity: "—",
    status: "Cancelled", statusNote: "No driver found", statusColor: "bg-danger-light text-danger",
    matchScore: null, driver: null, driverPlate: null, driverAvatar: null,
  },
  {
    id: "RL-10021", created: "Created 2 days ago", iconBg: "bg-info", iconLetter: "RL",
    from: "Enugu", fromState: "Enugu, Enugu", to: "Port Harcourt", toState: "Port Harcourt, Rivers",
    vehicle: "Truck (6 Tons)", capacity: "—",
    status: "Available", statusNote: "Open for match", statusColor: "bg-info-light text-info",
    matchScore: null, driver: null, driverPlate: null, driverAvatar: null,
  },
]

export default function ReturnLoadPage() {
  const [selectedLoad, setSelectedLoad] = useState<string | null>("RL-10028")
  const [activeTab, setActiveTab] = useState("All Routes")

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Return Load</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage return routes and match available loads with drivers.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary">
                <span className="w-2 h-2 rounded-full bg-sendme" /> Lagos, Nigeria <ChevronDown size={14} className="text-text-muted" />
              </div>
              <button className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors">
                <Plus size={16} /> Create Return Route
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted">{stat.label}</p>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5">{stat.value}</p>
                  <p className={`text-[10px] font-medium ${stat.up ? "text-sendme" : "text-danger"}`}>
                    {stat.change}
                  </p>
                </Card>
              )
            })}
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input type="text" placeholder="Search by route, location, driver or load ID..." className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent" />
            </div>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Status <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Vehicle Types <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Route Types <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              <Filter size={14} className="text-text-muted" /> Filters
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-0 border-b border-border-light overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.name
                    ? "border-sendme text-sendme"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.name ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Routes Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Route & Load <ArrowUpDown size={10} className="inline ml-1" /></th>
                    <th className="px-4 py-3 font-semibold">Route Details</th>
                    <th className="px-4 py-3 font-semibold">Vehicle / Capacity</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Match Score</th>
                    <th className="px-4 py-3 font-semibold">Driver / Organization</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedLoad(r.id)}
                      className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                        selectedLoad === r.id ? "bg-sendme-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${r.iconBg} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                            {r.iconLetter}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary">{r.id}</p>
                            <p className="text-[10px] text-text-muted">{r.created}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{r.from} → {r.to}</p>
                        <p className="text-[10px] text-text-muted">{r.fromState}</p>
                        <p className="text-[10px] text-text-muted">{r.toState}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{r.vehicle}</p>
                        <p className="text-[10px] text-text-muted">{r.capacity}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.statusColor}`}>{r.status}</span>
                        <p className="text-[10px] text-text-muted mt-0.5">{r.statusNote}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.matchScore ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  parseInt(r.matchScore) >= 80 ? "bg-sendme" : parseInt(r.matchScore) >= 60 ? "bg-warning" : "bg-danger"
                                }`}
                                style={{ width: `${r.matchScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-text-primary">{r.matchScore}%</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.driver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold shrink-0">
                              {r.driverAvatar}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{r.driver}</p>
                              <p className="text-[10px] text-text-muted">{r.driverPlate}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-light">
              <p className="text-xs text-text-muted">Showing 1 to 8 of 28 routes</p>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                  <ChevronLeft size={14} />
                </button>
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === 1 ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Return Load Detail Sidebar */}
      {selectedLoad && (
        <ReturnLoadDetail loadId={selectedLoad} onClose={() => setSelectedLoad(null)} />
      )}
    </div>
  )
}
