"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, ChevronDown, X, MoreHorizontal, MessageSquare, Clock, AlertTriangle, AlertCircle, CheckCircle, Ban, Send, Tag, UserPlus, Eye } from "lucide-react"

const stats = [
  { label: "Open Tickets", value: "125", change: "+16% vs last 30 days", up: true, icon: AlertCircle, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "In Progress", value: "68", change: "+9% vs last 30 days", up: true, icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
  { label: "Waiting on Customer", value: "32", change: "-8% vs last 30 days", up: false, icon: MessageSquare, bg: "bg-orange-50", color: "text-orange-600" },
  { label: "Resolved", value: "842", change: "+18% vs last 30 days", up: true, icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
  { label: "Disputes", value: "45", change: "+12% vs last 30 days", up: true, icon: AlertTriangle, bg: "bg-purple-50", color: "text-purple-600" },
  { label: "Escalated", value: "5", change: "+25% vs last 30 days", up: true, icon: Ban, bg: "bg-red-50", color: "text-red-600" },
]

const ticketTabs = [
  { name: "All Tickets", count: 1248 },
  { name: "Open", count: 125 },
  { name: "In Progress", count: 68 },
  { name: "Waiting", count: 32 },
  { name: "Resolved", count: 842 },
  { name: "Disputes", count: 45 },
  { name: "Escalated", count: 5 },
]

const priorityColors: Record<string, string> = { High: "bg-red-50 text-red-600", Medium: "bg-yellow-50 text-yellow-600", Low: "bg-blue-50 text-blue-600" }
const statusColors: Record<string, string> = { "In Progress": "bg-blue-50 text-blue-600", "Waiting on Customer": "bg-yellow-50 text-yellow-600", Open: "bg-green-50 text-green-600", Escalated: "bg-red-50 text-red-600", Resolved: "bg-gray-100 text-gray-600" }

const tickets = [
  { id: "TKT-250520-1248", date: "May 20, 2025 • 10:24 AM", customer: "Collins Bassie", phone: "0806 987 6543", avatar: "CB", category: "Payment Dispute", sub: "Dispute", priority: "High", status: "In Progress", updated: "10 min ago" },
  { id: "TKT-250520-1247", date: "May 20, 2025 • 9:58 AM", customer: "Damilare Adegbite", phone: "0806 987 6543", avatar: "DA", category: "Delivery Issue", sub: "Support", priority: "Medium", status: "Waiting on Customer", updated: "32 min ago" },
  { id: "TKT-250520-1246", date: "May 20, 2025 • 9:15 AM", customer: "Peace Stores", phone: "0902 234 5678", avatar: "PS", category: "Refund Request", sub: "Dispute", priority: "High", status: "Open", updated: "1 hr ago" },
  { id: "TKT-250520-1245", date: "May 20, 2025 • 8:47 AM", customer: "Tosin Adebayo", phone: "0805 678 9123", avatar: "TA", category: "Driver Behavior", sub: "Support", priority: "Low", status: "In Progress", updated: "2 hrs ago" },
  { id: "TKT-250519-1244", date: "May 19, 2025 • 6:30 PM", customer: "QuickStore Ltd.", phone: "0702 345 6789", avatar: "QS", category: "Payment Dispute", sub: "Dispute", priority: "High", status: "Escalated", updated: "3 hrs ago" },
  { id: "TKT-250519-1243", date: "May 19, 2025 • 4:12 PM", customer: "Emeka Nwosu", phone: "0809 234 5678", avatar: "EN", category: "Missing Item", sub: "Support", priority: "Medium", status: "Open", updated: "5 hrs ago" },
  { id: "TKT-250519-1242", date: "May 19, 2025 • 2:05 PM", customer: "Ada Okon", phone: "0807 654 3210", avatar: "AO", category: "Route Deviation", sub: "Support", priority: "Low", status: "Resolved", updated: "1 day ago" },
  { id: "TKT-250519-1241", date: "May 19, 2025 • 11:45 AM", customer: "Starlight Logistics", phone: "0809 876 5432", avatar: "SL", category: "Damage Claim", sub: "Dispute", priority: "High", status: "In Progress", updated: "1 day ago" },
  { id: "TKT-250518-1240", date: "May 18, 2025 • 9:40 AM", customer: "Blessing Okafor", phone: "0806 678 9012", avatar: "BO", category: "Payment Failure", sub: "Support", priority: "Medium", status: "Resolved", updated: "2 days ago" },
  { id: "TKT-250518-1239", date: "May 18, 2025 • 8:15 AM", customer: "Rashid Lawal", phone: "0803 123 4567", avatar: "RL", category: "Driver Unassigned", sub: "Support", priority: "Low", status: "Resolved", updated: "2 days ago" },
]

const messages = [
  { id: 1, sender: "Collins Bassie", avatar: "CB", role: "Customer", text: "I was overcharged for my order SM-20491. Expected fare was ₦6,500 but I was charged ₦8,000.", time: "10:24 AM", self: false },
  { id: 2, sender: "John Paul", avatar: "JP", role: "Support Agent", text: "Hi Collins, I'm looking into this now. Can you confirm the route you took?", time: "10:30 AM", self: true },
  { id: 3, sender: "Collins Bassie", avatar: "CB", role: "Customer", text: "Yes, it was from Lekki Phase 1 to Admiralty Rd, Ikeja. Same route as usual.", time: "10:32 AM", self: false },
  { id: 4, sender: "John Paul", avatar: "JP", role: "Support Agent", text: "I've checked the fare breakdown. There was an additional fuel surcharge that was automatically applied. I'll process a refund of ₦1,500 for you.", time: "10:45 AM", self: true },
  { id: 5, sender: "System", avatar: "SY", role: "System", text: "Refund of ₦1,500 has been initiated for order SM-20491. ETA: 24-48 hours.", time: "10:46 AM", self: false },
  { id: 6, sender: "Collins Bassie", avatar: "CB", role: "Customer", text: "Thank you for the quick resolution!", time: "10:50 AM", self: false },
]

const activityLog = [
  { action: "Ticket created", detail: "Customer reported payment dispute for order SM-20491", time: "10:24 AM", icon: AlertCircle, color: "text-blue-600" },
  { action: "Assigned to John Paul", detail: "Auto-assigned based on availability and expertise", time: "10:25 AM", icon: UserPlus, color: "text-purple-600" },
  { action: "Status changed to In Progress", detail: "John Paul started investigating the dispute", time: "10:30 AM", icon: Clock, color: "text-yellow-600" },
  { action: "Customer responded", detail: "Collins Bassie provided route details", time: "10:32 AM", icon: MessageSquare, color: "text-blue-600" },
  { action: "Internal note added", detail: "Fuel surcharge detected in fare breakdown - eligible for refund", time: "10:40 AM", icon: Tag, color: "text-gray-600" },
  { action: "Refund processed", detail: "₦1,500 refund initiated for order SM-20491", time: "10:46 AM", icon: CheckCircle, color: "text-green-600" },
  { action: "Customer acknowledged", detail: "Customer confirmed satisfaction with resolution", time: "10:50 AM", icon: MessageSquare, color: "text-green-600" },
]

const relatedTickets = [
  { id: "TKT-250518-1235", subject: "Fuel surcharge dispute", status: "Resolved", date: "May 18, 2025" },
  { id: "TKT-250515-1198", subject: "Incorrect fare calculation", status: "Resolved", date: "May 15, 2025" },
  { id: "TKT-250510-1142", subject: "Promotional discount not applied", status: "Resolved", date: "May 10, 2025" },
]

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState("All Tickets")
  const [selectedTicket, setSelectedTicket] = useState(tickets[0])
  const [detailTab, setDetailTab] = useState("Details")

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div><h1 className="text-xl font-bold text-text-primary">Disputes & Support</h1><p className="text-xs text-text-muted mt-0.5">Manage customer disputes and support tickets.</p></div>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {stats.map(s => { const I = s.icon; return (
            <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
          )})}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by ticket ID, customer, phone or email..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Status <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Categories <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Priorities <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
        </div>
        <div className="flex items-center justify-between border-b border-border-light mb-3">
          <div className="flex gap-0">{ticketTabs.map(t => (
            <button key={t.name} onClick={() => setActiveTab(t.name)} className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab===t.name?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t.name}<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab===t.name?"bg-sendme-50 text-sendme":"bg-surface-secondary text-text-muted"}`}>{t.count.toLocaleString()}</span></button>
          ))}</div>
          <div className="flex items-center gap-2 pb-2"><button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium"><Download size={12}/> Export</button><button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium">Newest First <ChevronDown size={12}/></button></div>
        </div>
        <div className="bg-white rounded-xl border border-border-default overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-border-light text-text-muted">
              <th className="text-left px-3 py-2.5 font-medium">Ticket</th>
              <th className="text-left px-3 py-2.5 font-medium">Customer</th>
              <th className="text-left px-3 py-2.5 font-medium">Category</th>
              <th className="text-left px-3 py-2.5 font-medium">Priority</th>
              <th className="text-left px-3 py-2.5 font-medium">Status</th>
              <th className="text-left px-3 py-2.5 font-medium">Updated</th>
              <th className="text-right px-3 py-2.5 font-medium">Actions</th>
            </tr></thead>
            <tbody>{tickets.map((t,i) => (
              <tr key={i} onClick={() => setSelectedTicket(t)} className={`border-b border-border-light cursor-pointer hover:bg-surface-secondary transition-colors ${selectedTicket.id===t.id?"bg-sendme-50":""}`}>
                <td className="px-3 py-2.5"><p className="font-medium text-text-primary">{t.id}</p><p className="text-[9px] text-text-muted">{t.date}</p></td>
                <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[9px] font-semibold shrink-0">{t.avatar}</div><div><p className="font-medium text-text-primary">{t.customer}</p><p className="text-[9px] text-text-muted">{t.phone}</p></div></div></td>
                <td className="px-3 py-2.5"><p className="text-text-primary">{t.category}</p><p className="text-[9px] text-text-muted">{t.sub}</p></td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${statusColors[t.status]}`}>{t.status}</span></td>
                <td className="px-3 py-2.5 text-text-muted">{t.updated}</td>
                <td className="px-3 py-2.5 text-right"><button className="p-1 hover:bg-surface-secondary rounded"><MoreHorizontal size={14} className="text-text-muted"/></button></td>
              </tr>
            ))}</tbody>
          </table>
          <div className="flex items-center justify-between px-3 py-2 border-t border-border-light text-[10px] text-text-muted">
            <span>Showing 1 to 10 of 1,248 tickets</span>
            <div className="flex items-center gap-1"><button className="px-2 py-1 border border-border-default rounded bg-sendme text-white text-[9px]">1</button><button className="px-2 py-1 border border-border-default rounded text-[9px]">2</button><button className="px-2 py-1 border border-border-default rounded text-[9px]">3</button><span>...</span><button className="px-2 py-1 border border-border-default rounded text-[9px]">125</button><button className="px-2 py-1 border border-border-default rounded text-[9px]">→</button></div>
          </div>
        </div>
      </div>
      {selectedTicket && (
        <div className="w-[360px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div><p className="font-semibold text-sm text-text-primary">{selectedTicket.id}</p><span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-medium mt-0.5 ${statusColors[selectedTicket.status]}`}>{selectedTicket.status}</span></div>
            <button onClick={() => setSelectedTicket(null as any)} className="p-1 hover:bg-surface-secondary rounded"><X size={16} className="text-text-muted"/></button>
          </div>
          <div className="flex gap-0 border-b border-border-light px-4">{["Details","Messages","Activity","Related"].map(t => (
            <button key={t} onClick={() => setDetailTab(t)} className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${detailTab===t?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t}{t==="Messages"&&<span className="ml-1 text-[9px] bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">6</span>}</button>
          ))}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {detailTab === "Details" && (<>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Customer Information</p><div className="space-y-1.5"><div className="flex justify-between"><span className="text-[11px] text-text-muted">Name</span><span className="text-[11px] font-medium text-text-primary">{selectedTicket.customer}</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Phone</span><span className="text-[11px] font-medium text-text-primary">{selectedTicket.phone}</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Email</span><span className="text-[11px] font-medium text-text-primary">collins.bassie@example.com</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Location</span><span className="text-[11px] font-medium text-text-primary">Lekki, Lagos, Nigeria</span></div></div></div>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Ticket Information</p><div className="space-y-1.5"><div className="flex justify-between"><span className="text-[11px] text-text-muted">Category</span><span className="text-[11px] font-medium text-text-primary">{selectedTicket.category}</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Order ID</span><span className="text-[11px] font-medium text-sendme">SM-20491</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Priority</span><span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${priorityColors[selectedTicket.priority]}`}>{selectedTicket.priority}</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Assigned To</span><span className="text-[11px] font-medium text-text-primary">John Paul</span></div><div className="flex justify-between"><span className="text-[11px] text-text-muted">Source</span><span className="text-[11px] font-medium text-text-primary">Web Portal</span></div></div></div>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Description</p><p className="text-[11px] text-text-secondary leading-relaxed">Customer was overcharged on order SM-20491. Amount paid: ₦8,000. Expected: ₦6,500. Requesting refund of ₦1,500.</p></div>
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Quick Actions</p><div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><MessageSquare size={12}/> Send Message</button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><Tag size={12}/> Add Note</button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><UserPlus size={12}/> Assign Ticket</button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><AlertTriangle size={12}/> Escalate</button>
              </div></div>
              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-[11px] font-medium hover:bg-red-50"><Ban size={12}/> Close Ticket</button>
            </>)}
            {detailTab === "Messages" && (<>
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex gap-2 ${m.self?"flex-row-reverse":""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${m.self?"bg-sendme text-white":"bg-surface-secondary text-text-muted"}`}>{m.avatar}</div>
                    <div className={`max-w-[240px] ${m.self?"text-right":""}`}>
                      <div className="flex items-center gap-1.5 mb-0.5"><span className="text-[10px] font-medium text-text-primary">{m.sender}</span><span className="text-[8px] text-text-muted">{m.time}</span></div>
                      <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${m.self?"bg-sendme text-white rounded-tr-sm":"bg-surface-secondary text-text-secondary rounded-tl-sm"}`}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border-light"><input className="flex-1 text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme" placeholder="Type a message..."/><button className="bg-sendme text-white p-2 rounded-lg"><Send size={14}/></button></div>
            </>)}
            {detailTab === "Activity" && (<>
              <div className="space-y-3">
                {activityLog.map((a,i) => { const I = a.icon; return (
                  <div key={i} className="flex gap-2.5"><div className={`mt-0.5 ${a.color}`}><I size={14}/></div><div className="flex-1"><p className="text-[11px] font-medium text-text-primary">{a.action}</p><p className="text-[10px] text-text-muted mt-0.5">{a.detail}</p><p className="text-[9px] text-text-muted mt-0.5">{a.time}</p></div></div>
                )})}
              </div>
            </>)}
            {detailTab === "Related" && (<>
              <div className="space-y-2">
                {relatedTickets.map(r => (
                  <div key={r.id} className="p-3 border border-border-default rounded-lg hover:bg-surface-secondary cursor-pointer">
                    <div className="flex items-center justify-between"><p className="text-[11px] font-medium text-text-primary">{r.id}</p><span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600">{r.status}</span></div>
                    <p className="text-[10px] text-text-muted mt-1">{r.subject}</p>
                    <p className="text-[9px] text-text-muted mt-0.5">{r.date}</p>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  )
}
