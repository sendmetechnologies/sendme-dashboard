"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Search, Filter, Download, ChevronDown, X, MoreHorizontal, CheckCircle, XCircle, Clock, FileText, DollarSign, Tag, ShieldCheck, MessageSquare } from "lucide-react"

const stats = [
  { label: "All Pending", value: "18", change: "+12% vs last 30 days", up: true, icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
  { label: "Driver Verifications", value: "6", change: "+20% vs last 30 days", up: true, icon: ShieldCheck, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Payout Requests", value: "4", change: "-10% vs last 30 days", up: false, icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
  { label: "Price Overrides", value: "3", change: "+5% vs last 30 days", up: true, icon: Tag, bg: "bg-purple-50", color: "text-purple-600" },
  { label: "Refunds", value: "3", change: "+14% vs last 30 days", up: true, icon: DollarSign, bg: "bg-orange-50", color: "text-orange-600" },
  { label: "Document Verifications", value: "2", change: "+100% vs last 30 days", up: true, icon: FileText, bg: "bg-red-50", color: "text-red-600" },
]

const approvalTabs = [
  { name: "All", count: 18 },
  { name: "Pending", count: 18 },
  { name: "Approved", count: 128 },
  { name: "Rejected", count: 12 },
]

const priorityColors: Record<string, string> = { High: "bg-red-50 text-red-600", Medium: "bg-yellow-50 text-yellow-600", Low: "bg-blue-50 text-blue-600" }
const statusColors: Record<string, string> = { Pending: "bg-yellow-50 text-yellow-600", Approved: "bg-green-50 text-green-600", Rejected: "bg-red-50 text-red-600" }
const typeColors: Record<string, string> = { "Driver Verification": "bg-blue-50 text-blue-600", "Payout Request": "bg-green-50 text-green-600", "Price Override": "bg-purple-50 text-purple-600", "Refund Request": "bg-orange-50 text-orange-600", "Document Verification": "bg-red-50 text-red-600" }
const typeIcons: Record<string, any> = { "Driver Verification": ShieldCheck, "Payout Request": DollarSign, "Price Override": Tag, "Refund Request": DollarSign, "Document Verification": FileText }

const requests = [
  { id: "DRV-VER-250520-1248", type: "Driver Verification", requestedBy: "Damilare Adegbite", avatar: "DA", role: "Driver", priority: "High", status: "Pending", date: "May 20, 2025", time: "10:24 AM" },
  { id: "PAYOUT-250520-1247", type: "Payout Request", requestedBy: "Tosin Adebayo", avatar: "TA", role: "Driver", priority: "Medium", status: "Pending", date: "May 20, 2025", time: "9:58 AM" },
  { id: "OVERRIDE-250520-1246", type: "Price Override", requestedBy: "Ada Okon", avatar: "AO", role: "Operations", priority: "Medium", status: "Pending", date: "May 20, 2025", time: "9:15 AM" },
  { id: "REFUND-250520-1245", type: "Refund Request", requestedBy: "Victoria Logistics", avatar: "VL", role: "Organization", priority: "High", status: "Pending", date: "May 20, 2025", time: "8:47 AM" },
  { id: "DOC-VER-250519-1244", type: "Document Verification", requestedBy: "Ibrahim Musa", avatar: "IM", role: "Driver", priority: "Low", status: "Pending", date: "May 19, 2025", time: "6:30 PM" },
  { id: "PAYOUT-250519-1243", type: "Payout Request", requestedBy: "Emeka Nwosu", avatar: "EN", role: "Driver", priority: "Medium", status: "Pending", date: "May 19, 2025", time: "4:12 PM" },
  { id: "OVERRIDE-250519-1242", type: "Price Override", requestedBy: "Peace Stores", avatar: "PS", role: "Organization", priority: "Low", status: "Pending", date: "May 19, 2025", time: "2:05 PM" },
  { id: "REFUND-250518-1241", type: "Refund Request", requestedBy: "John Paul", avatar: "JP", role: "Driver", priority: "High", status: "Pending", date: "May 18, 2025", time: "11:45 AM" },
]

const documents = [
  { name: "Driver's License", status: "Uploaded", icon: FileText },
  { name: "NIN Slip", status: "Uploaded", icon: FileText },
  { name: "Passport Photo", status: "Uploaded", icon: FileText },
  { name: "Proof of Address", status: "Uploaded", icon: FileText },
]

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("All")
  const [selected, setSelected] = useState(requests[0])
  const [detailTab, setDetailTab] = useState("Details")

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div><h1 className="text-xl font-bold text-text-primary">Approvals</h1><p className="text-xs text-text-muted mt-0.5">Review and approve pending actions and requests across the platform.</p></div>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {stats.map(s => { const I = s.icon; return (
            <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
          )})}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by ID, name, type or description..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Types <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Priorities <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Status <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
        </div>
        <div className="flex items-center justify-between border-b border-border-light mb-3">
          <div className="flex gap-0">{approvalTabs.map(t => (
            <button key={t.name} onClick={() => setActiveTab(t.name)} className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab===t.name?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t.name} <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab===t.name?"bg-sendme-50 text-sendme":"bg-surface-secondary text-text-muted"}`}>({t.count})</span></button>
          ))}</div>
          <div className="flex items-center gap-2 pb-2"><button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium"><Download size={12}/> Export</button><button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium">Newest First <ChevronDown size={12}/></button></div>
        </div>
        <div className="bg-white rounded-xl border border-border-default overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border-light text-text-muted">
              <th className="text-left px-3 py-2.5 font-medium">Request</th>
              <th className="text-left px-3 py-2.5 font-medium">Type</th>
              <th className="text-left px-3 py-2.5 font-medium">Requested By</th>
              <th className="text-left px-3 py-2.5 font-medium">Priority</th>
              <th className="text-left px-3 py-2.5 font-medium">Status</th>
              <th className="text-left px-3 py-2.5 font-medium">Requested On</th>
              <th className="text-right px-3 py-2.5 font-medium">Actions</th>
            </tr></thead>
            <tbody>{requests.map((r,i) => { const TI = typeIcons[r.type]; return (
              <tr key={i} onClick={() => setSelected(r)} className={`border-b border-border-light cursor-pointer hover:bg-surface-secondary transition-colors ${selected.id===r.id?"bg-sendme-50":""}`}>
                <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg ${typeColors[r.type]}`}><TI size={12}/></div><p className="font-medium text-text-primary">{r.id}</p></div></td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${typeColors[r.type]}`}>{r.type}</span></td>
                <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[8px] font-semibold shrink-0">{r.avatar}</div><div><p className="font-medium text-text-primary">{r.requestedBy}</p><p className="text-[9px] text-text-muted">{r.role}</p></div></div></td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${priorityColors[r.priority]}`}>{r.priority}</span></td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${statusColors[r.status]}`}>{r.status}</span></td>
                <td className="px-3 py-2.5"><p className="text-text-primary">{r.date}</p><p className="text-[9px] text-text-muted">{r.time}</p></td>
                <td className="px-3 py-2.5 text-right"><button className="p-1 hover:bg-surface-secondary rounded"><MoreHorizontal size={14} className="text-text-muted"/></button></td>
              </tr>
            )})}</tbody>
          </table>
          <div className="flex items-center justify-between px-3 py-2 border-t border-border-light text-[10px] text-text-muted">
            <span>Showing 1 to 8 of 18 requests</span>
            <div className="flex items-center gap-1"><button className="px-2 py-1 border border-border-default rounded bg-sendme text-white text-[9px]">1</button><button className="px-2 py-1 border border-border-default rounded text-[9px]">2</button><button className="px-2 py-1 border border-border-default rounded text-[9px]">3</button></div>
          </div>
        </div>
      </div>
      {selected && (
        <div className="w-[360px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div><p className="font-semibold text-sm text-text-primary">{selected.id}</p><span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-medium mt-0.5 ${statusColors[selected.status]}`}>{selected.status}</span></div>
            <button onClick={() => setSelected(null as any)} className="p-1 hover:bg-surface-secondary rounded"><X size={16} className="text-text-muted"/></button>
          </div>
          <div className="flex gap-0 border-b border-border-light px-4">{["Details","Activity"].map(t => (
            <button key={t} onClick={() => setDetailTab(t)} className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${detailTab===t?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t}</button>
          ))}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {detailTab === "Details" && (<>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Driver Information</p>
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-sm font-semibold">{selected.avatar}</div><div><p className="text-[12px] font-medium text-text-primary">{selected.requestedBy}</p><p className="text-[10px] text-text-muted">Active • {selected.role}</p></div></div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-[11px] text-text-muted">Phone</span><span className="text-[11px] font-medium text-text-primary">0806 987 6543</span></div>
                  <div className="flex justify-between"><span className="text-[11px] text-text-muted">Email</span><span className="text-[11px] font-medium text-text-primary">damilare.ad@example.com</span></div>
                  <div className="flex justify-between"><span className="text-[11px] text-text-muted">License Number</span><span className="text-[11px] font-medium text-text-primary">L/AG/123456/2022</span></div>
                  <div className="flex justify-between"><span className="text-[11px] text-text-muted">Vehicle</span><span className="text-[11px] font-medium text-text-primary">Toyota Hiace (Van)</span></div>
                  <div className="flex justify-between"><span className="text-[11px] text-text-muted">Organization</span><span className="text-[11px] font-medium text-text-primary">Victoria Logistics</span></div>
                </div>
              </div>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Verification Documents</p>
                <div className="space-y-2">{documents.map((d,i) => { const DI = d.icon; return (
                  <div key={i} className="flex items-center justify-between p-2 border border-border-default rounded-lg">
                    <div className="flex items-center gap-2"><DI size={14} className="text-text-muted"/><span className="text-[11px] text-text-primary">{d.name}</span></div>
                    <span className="text-[9px] text-sendme font-medium">{d.status}</span>
                  </div>
                )})}</div>
              </div>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Review Notes</p>
                <div className="p-3 bg-surface-secondary rounded-lg space-y-2">
                  <p className="text-[11px] text-text-secondary leading-relaxed">All documents have been reviewed and are valid. Driver meets all requirements.</p>
                  <p className="text-[10px] text-text-muted">— Verified by Admin, May 19, 2025, 10:20 AM</p>
                </div>
              </div>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90"><CheckCircle size={12}/> Approve</button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11px] font-medium hover:bg-red-100"><XCircle size={12}/> Reject</button>
                  </div>
                  <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><MessageSquare size={12}/> Request More Info</button>
                </div>
              </div>
            </>)}
            {detailTab === "Activity" && (<>
              <div className="space-y-3">
                {[{ action: "Request submitted", detail: `${selected.requestedBy} submitted a ${selected.type.toLowerCase()} request`, time: selected.time, icon: FileText, color: "text-blue-600" },
                  { action: "Assigned for review", detail: "Auto-assigned based on request type and priority", time: "10:25 AM", icon: ShieldCheck, color: "text-purple-600" },
                  { action: "Documents verified", detail: "All supporting documents verified successfully", time: "10:30 AM", icon: CheckCircle, color: "text-green-600" },
                  { action: "Awaiting approval", detail: "Request is pending admin approval", time: "10:31 AM", icon: Clock, color: "text-yellow-600" },
                ].map((a,i) => { const I = a.icon; return (
                  <div key={i} className="flex gap-2.5"><div className={`mt-0.5 ${a.color}`}><I size={14}/></div><div className="flex-1"><p className="text-[11px] font-medium text-text-primary">{a.action}</p><p className="text-[10px] text-text-muted mt-0.5">{a.detail}</p><p className="text-[9px] text-text-muted mt-0.5">{a.time}</p></div></div>
                )})}
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  )
}
