"use client"

import { useState } from "react"
import {
  X, CheckCircle, Clock, Edit, Eye, Download, FileText, Car, Truck, AlertTriangle,
  Users, Ban, Shield, MoreHorizontal, Filter
} from "lucide-react"

interface VehicleDetailProps {
  vehicleId: string
  onClose: () => void
}

const tabs = ["Overview", "Documents", "Driver", "Activity", "Trips"]

function OverviewTab() {
  const vehicleInfo = [
    ["Vehicle Type", "Motorbike"],
    ["Make / Model", "Bajaj Boxer BM150"],
    ["Year", "2022"],
    ["Color", "Red"],
    ["VIN", "JTZBG22K5X0123456"],
    ["Engine Number", "ENG12345678"],
    ["Plate Number", "ABC 123 DE"],
    ["Registration State", "Lagos"],
    ["Registration Expiry", "May 12, 2026 (364 days left)"],
    ["Insurance Expiry", "Sep 10, 2025 (120 days left)"],
  ]

  return (
    <div className="space-y-5">
      {/* Vehicle Information */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Vehicle Information</h4>
          <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">Edit</button>
        </div>
        <div className="space-y-2">
          {vehicleInfo.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-[11px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Information */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Driver Information</h4>
          <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">View Profile</button>
        </div>
        <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
          <div className="w-10 h-10 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-sm font-bold shrink-0">D</div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold text-text-primary">Damilare Adegbite</p>
              <CheckCircle size={10} className="text-sendme" />
              <span className="text-[9px] text-sendme">✓ Verified</span>
            </div>
            <p className="text-[10px] text-text-muted">0806 987 6543 • damilare.ad@example.com</p>
            <p className="text-[9px] text-text-muted mt-0.5">Member since May 12, 2024</p>
          </div>
        </div>
      </div>

      {/* Document Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Document Status</h4>
          <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">View all</button>
        </div>
        <div className="space-y-0">
          {[
            { name: "Registration Certificate", status: "Verified", color: "text-sendme" },
            { name: "Insurance", status: "Verified", color: "text-sendme" },
            { name: "Road Worthiness", status: "Verified", color: "text-sendme" },
            { name: "Driver's License", status: "Verified", color: "text-sendme" },
            { name: "Certificate of Fitness", status: "Verified", color: "text-sendme" },
          ].map((doc, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-text-muted" />
                <p className="text-[11px] font-medium text-text-primary">{doc.name}</p>
              </div>
              <span className={`text-[10px] font-semibold ${doc.color}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Eye size={12} /> View Full Details
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Edit size={12} /> Edit Vehicle
        </button>
        <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-[11px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5">
          <AlertTriangle size={12} /> Suspend Vehicle
        </button>
        <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-[11px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5">
          <Ban size={12} /> Blacklist Vehicle
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Users size={12} /> Assign Driver
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Truck size={12} /> View Trips
        </button>
      </div>
    </div>
  )
}

function DocumentsTab() {
  const docs = [
    { name: "Vehicle Registration", status: "Verified", statusColor: "bg-sendme-50 text-sendme", issueDate: "May 12, 2024", expiryDate: "May 12, 2026" },
    { name: "Insurance Certificate", status: "Verified", statusColor: "bg-sendme-50 text-sendme", issueDate: "Sep 10, 2024", expiryDate: "Sep 10, 2025" },
    { name: "Road Worthiness Certificate", status: "Verified", statusColor: "bg-sendme-50 text-sendme", issueDate: "Apr 20, 2025", expiryDate: "Apr 19, 2026" },
    { name: "Pollution Test", status: "Verified", statusColor: "bg-sendme-50 text-sendme", issueDate: "Oct 12, 2024", expiryDate: "Oct 12, 2025" },
    { name: "Vehicle Permit", status: "Verified", statusColor: "bg-sendme-50 text-sendme", issueDate: "Mar 15, 2024", expiryDate: "Mar 15, 2026" },
  ]

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-primary">Vehicle Documents</h4>
      <div className="space-y-0">
        {docs.map((doc, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-text-muted" />
              <p className="text-[11px] font-medium text-text-primary">{doc.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${doc.statusColor}`}>{doc.status}</span>
              <span className="text-[10px] text-text-muted">{doc.expiryDate}</span>
              <div className="flex items-center gap-0.5">
                <button className="p-1 text-text-muted hover:text-sendme transition-colors"><Eye size={11} /></button>
                <button className="p-1 text-text-muted hover:text-sendme transition-colors"><Download size={11} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriverTab() {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-primary">Assigned Driver</h4>
      <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
        <div className="w-12 h-12 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-base font-bold shrink-0">D</div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-text-primary">Damilare Adegbite</p>
            <CheckCircle size={10} className="text-sendme" />
          </div>
          <p className="text-[10px] text-text-muted">0806 987 6543 • damilare.ad@example.com</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Independent</span>
            <span className="text-[9px] text-sendme font-semibold">★ 4.8</span>
            <span className="text-[9px] text-text-muted">(128 trips)</span>
          </div>
        </div>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Total Trips", "312"],
          ["Rating", "4.8 ★"],
          ["Member Since", "May 2024"],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface-secondary rounded-lg p-2.5 text-center">
            <p className="text-[9px] text-text-muted">{label}</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityTab() {
  const activities = [
    { title: "Vehicle registered", desc: "ABC 123 DE added to platform", actor: "System", time: "May 12, 2024", icon: "🚗", color: "bg-sendme-50 text-sendme" },
    { title: "Insurance renewed", desc: "Insurance certificate updated", actor: "Damilare Adegbite", time: "Sep 10, 2024", icon: "📄", color: "bg-sendme-50 text-sendme" },
    { title: "Roadworthiness approved", desc: "Certificate verified successfully", actor: "Admin", time: "Apr 20, 2025", icon: "✅", color: "bg-sendme-50 text-sendme" },
    { title: "Vehicle status updated", desc: "Status changed to Active", actor: "System", time: "May 10, 2025", icon: "🔄", color: "bg-info-light text-info" },
  ]
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1">Activity Log</h4>
      <div className="space-y-0">
        {activities.map((a, i) => (
          <div key={i} className="flex gap-2.5 py-2.5 border-b border-border-light last:border-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${a.color}`}>{a.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-text-primary">{a.title}</p>
              <p className="text-[9px] text-text-muted mt-0.5">{a.desc}</p>
              <p className="text-[9px] text-text-muted mt-0.5">{a.actor}</p>
            </div>
            <span className="text-[9px] text-text-muted whitespace-nowrap">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TripsTab() {
  const trips = [
    { id: "TR-89231", route: "Lekki → Ikeja", date: "May 20, 2024", fare: "₦6,800", status: "Completed", statusColor: "bg-sendme-50 text-sendme" },
    { id: "TR-89198", route: "Victoria Island → Yaba", date: "May 19, 2024", fare: "₦4,200", status: "Completed", statusColor: "bg-sendme-50 text-sendme" },
    { id: "TR-89145", route: "Surulere → Lekki", date: "May 18, 2024", fare: "₦5,500", status: "Cancelled", statusColor: "bg-danger-light text-danger" },
    { id: "TR-89087", route: "Ikeja → VI", date: "May 17, 2024", fare: "₦7,100", status: "Completed", statusColor: "bg-sendme-50 text-sendme" },
  ]
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-primary">Recent Trips</h4>
      <div className="space-y-0">
        {trips.map((t, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
            <div>
              <p className="text-[11px] font-semibold text-text-primary">{t.id}</p>
              <p className="text-[9px] text-text-muted">{t.route}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-text-primary">{t.fare}</p>
              <p className="text-[9px] text-text-muted">{t.date}</p>
            </div>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${t.statusColor}`}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VehicleDetail({ vehicleId, onClose }: VehicleDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 bg-surface-secondary rounded-lg flex items-center justify-center shrink-0">
            <Truck size={20} className="text-text-muted/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">ABC 123 DE</h3>
              <span className="text-[9px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-[10px] text-text-muted">Motorbike • Bajaj Boxer BM150</p>
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
        {activeTab === "Documents" && <DocumentsTab />}
        {activeTab === "Driver" && <DriverTab />}
        {activeTab === "Activity" && <ActivityTab />}
        {activeTab === "Trips" && <TripsTab />}
      </div>
    </div>
  )
}
