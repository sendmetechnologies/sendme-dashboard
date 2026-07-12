"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { VehicleDetail } from "@/components/dashboard/vehicle-detail"
import { VehicleForm } from "@/components/dashboard/forms"
import {
  Car, CheckCircle, Clock, AlertTriangle, Ban, Eye, Shield,
  ChevronDown, Search, Download, Plus, MoreHorizontal, ArrowUpDown, Filter,
  ChevronLeft, ChevronRight, FileText, Truck, Bike
} from "lucide-react"

const stats = [
  { label: "Total Vehicles", value: "5,682", change: "↑ 12% vs last 30 days", up: true, icon: Car, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Active", value: "4,912", change: "↑ 10% vs last 30 days", up: true, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Inactive", value: "312", change: "↓ 6% vs last 30 days", up: false, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
  { label: "Under Review", value: "126", change: "↓ 5% vs last 30 days", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
  { label: "Blacklisted", value: "24", change: "— 0% vs last 30 days", up: true, icon: Ban, color: "text-text-muted", bg: "bg-surface-secondary" },
]

const statusTabs = [
  { name: "All Vehicles", count: 5682, active: true },
  { name: "Active", count: 4912 },
  { name: "Inactive", count: 312 },
  { name: "Under Review", count: 126 },
  { name: "Blacklisted", count: 24 },
  { name: "Expiring Docs", count: 168 },
]

const vehicles = [
  {
    plate: "ABC 123 DE", vin: "JTZBG22K5X0123456",
    type: "Motorbike", model: "Bajaj Boxer BM150",
    driver: "Damilare Adegbite", driverPhone: "0806 987 6543", driverAvatar: "D",
    status: "Active", verified: true, statusColor: "bg-sendme-50 text-sendme",
    city: "Lagos", area: "Ikeja",
    docs: 3, added: "May 12, 2024", addedNote: "1 year ago",
  },
  {
    plate: "KJA 908 LM", vin: "1HGBH41JXMN109186",
    type: "Car", model: "Toyota Camry 2019",
    driver: "Rashid Lawal", driverPhone: "0803 123 4567", driverAvatar: "R",
    status: "Active", verified: true, statusColor: "bg-sendme-50 text-sendme",
    city: "Lagos", area: "Surulere",
    docs: 1, added: "Apr 28, 2024", addedNote: "1 year ago",
  },
  {
    plate: "GGE 432 YY", vin: "3C6JRE6KXJG123456",
    type: "Truck (10 Tons)", model: "Mitsubishi Canter",
    driver: "Emeka Nwosu", driverPhone: "0809 234 5678", driverAvatar: "E",
    status: "Active", verified: true, statusColor: "bg-sendme-50 text-sendme",
    city: "Abuja", area: "Gwarinpa",
    docs: 3, added: "Mar 10, 2024", addedNote: "1 year ago",
  },
  {
    plate: "LND 234 TR", vin: "ZTURBMHKEMT23456",
    type: "Pickup", model: "Hilux 2.8",
    driver: "Collins Bassie", driverPhone: "0803 123 4567", driverAvatar: "C",
    status: "Inactive", verified: false, statusColor: "bg-surface-secondary text-text-muted",
    statusNote: "Not in use",
    city: "Lagos", area: "Lekki",
    docs: 1, added: "May 20, 2025", addedNote: "2 days ago",
  },
  {
    plate: "KRD 998 JJ", vin: "WD3PF4CC9F591234",
    type: "Van", model: "Mercedes Benz Vito",
    driver: "Tosin Adebayo", driverPhone: "0805 678 9123", driverAvatar: "T",
    status: "Under Review", verified: false, statusColor: "bg-warning-light text-warning",
    statusNote: "Pending",
    city: "Ibadan", area: "Bodija",
    docs: 2, added: "Feb 18, 2024", addedNote: "1 year ago",
  },
  {
    plate: "KLA 908 LM", vin: "WFTFWTEHFCE12345",
    type: "Car", model: "Ford F-150",
    driver: "Chinedu Okafor", driverPhone: "0802 345 6789", driverAvatar: "C",
    status: "Active", verified: true, statusColor: "bg-sendme-50 text-sendme",
    city: "Port Harcourt", area: "Rumoula",
    docs: 1, added: "Jan 05, 2024", addedNote: "1 year ago",
  },
  {
    plate: "LAG 456 GH", vin: "MH13AB1234A12345",
    type: "Motorbike", model: "TVS Apache 160",
    driver: "Ada Okon", driverPhone: "0807 654 3210", driverAvatar: "A",
    status: "Active", verified: true, statusColor: "bg-sendme-50 text-sendme",
    city: "Lagos", area: "Yaba",
    docs: 2, added: "Dec 12, 2023", addedNote: "1 year ago",
  },
  {
    plate: "BDG 776 GH", vin: "JH4KA8260MC12345",
    type: "Truck (5 Tons)", model: "Hino Dutro",
    driver: "Ibrahim Musa", driverPhone: "0801 234 5678", driverAvatar: "I",
    status: "Inactive", verified: false, statusColor: "bg-surface-secondary text-text-muted",
    statusNote: "Not in use",
    city: "Kano", area: "Fagge",
    docs: 1, added: "Nov 03, 2023", addedNote: "1 year ago",
  },
]

function getVehicleIcon(type: string) {
  if (type.includes("Motorbike")) return <Bike size={16} className="text-text-muted" />
  if (type.includes("Truck")) return <Truck size={16} className="text-text-muted" />
  return <Car size={16} className="text-text-muted" />
}

export default function VehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>("ABC 123 DE")
  const [activeTab, setActiveTab] = useState("All Vehicles")
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Vehicles</h1>
              <p className="text-sm text-text-muted mt-0.5">Monitor and manage all registered vehicles on the platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary">
                <span className="text-sendme">📍</span> Lagos, Nigeria
              </div>
              <button 
                onClick={() => setIsVehicleFormOpen(true)}
                className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"
              >
                <Plus size={16} /> Add Vehicle
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
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
              <input type="text" placeholder="Search by plate number, vehicle type, driver or VIN..." className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent" />
            </div>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Status <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Vehicle Types <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
              All Cities <ChevronDown size={14} className="text-text-muted" />
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Filter size={14} /> Filters
            </button>
          </div>

          {/* Status Tabs & Sort */}
          <div className="flex items-center justify-between border-b border-border-light">
            <div className="flex gap-0">
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
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.name ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {tab.count.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pb-2">
              <button className="flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
                <Download size={14} className="text-text-muted" /> Export
              </button>
              <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
                Newest First <ChevronDown size={14} className="text-text-muted" />
              </button>
            </div>
          </div>

          {/* Vehicles Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Driver</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">City / Area</th>
                    <th className="px-4 py-3 font-semibold">Documents</th>
                    <th className="px-4 py-3 font-semibold">Added On</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr
                      key={v.plate}
                      onClick={() => setSelectedVehicle(v.plate)}
                      className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                        selectedVehicle === v.plate ? "bg-sendme-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-10 bg-surface-secondary rounded-lg flex items-center justify-center shrink-0">
                            {getVehicleIcon(v.type)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary">{v.plate}</p>
                            <p className="text-[10px] text-text-muted">VIN: {v.vin}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{v.type}</p>
                        <p className="text-[10px] text-text-muted">{v.model}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[9px] font-bold shrink-0">{v.driverAvatar}</div>
                          <div>
                            <p className="text-xs font-medium text-text-primary">{v.driver}</p>
                            <p className="text-[10px] text-text-muted">{v.driverPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.statusColor}`}>{v.status}</span>
                        {v.statusNote && <p className="text-[10px] text-text-muted mt-0.5">{v.statusNote}</p>}
                        {v.verified && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-sendme mt-0.5">
                            <CheckCircle size={10} /> Verified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{v.city}</p>
                        <p className="text-[10px] text-text-muted">{v.area}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <FileText size={12} className="text-text-muted" />
                          <span className="text-xs font-medium text-text-primary">{v.docs}</span>
                          {v.docs >= 2 && (
                            <span className="text-[10px] text-sendme">+{v.docs - 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{v.added}</p>
                        <p className="text-[10px] text-text-muted">{v.addedNote}</p>
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
              <p className="text-xs text-text-muted">Showing 1 to 8 of 5,682 vehicles</p>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                  <ChevronLeft size={14} />
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === 1 ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <span className="text-text-muted text-xs px-1">...</span>
                <button className="w-7 h-7 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-hover transition-colors">
                  711
                </button>
                <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vehicle Detail Sidebar */}
      {selectedVehicle && (
        <VehicleDetail vehicleId={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}

      {/* Vehicle Form Modal */}
      <VehicleForm isOpen={isVehicleFormOpen} onClose={() => setIsVehicleFormOpen(false)} />
    </div>
  )
}
