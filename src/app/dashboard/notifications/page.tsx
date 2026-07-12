"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Bell, Package, DollarSign, Users, Truck, AlertTriangle, CheckCircle, Clock, Info, Settings, ChevronRight, Eye, EyeOff, Trash2, Filter, ChevronDown, Search } from "lucide-react"

const stats = [
  { label: "Total Notifications", value: "248", change: "All time", up: true, icon: Bell, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Unread", value: "42", change: "Requires attention", up: true, icon: Eye, bg: "bg-red-50", color: "text-red-600" },
  { label: "Today", value: "18", change: "+25% vs yesterday", up: true, icon: Clock, bg: "bg-green-50", color: "text-green-600" },
  { label: "This Week", value: "86", change: "+12% vs last week", up: true, icon: Bell, bg: "bg-purple-50", color: "text-purple-600" },
]

const notifTabs = [
  { name: "All Notifications", count: 248 },
  { name: "Unread", count: 42 },
  { name: "Orders", count: 98 },
  { name: "Payments", count: 64 },
  { name: "System", count: 86 },
]

const typeConfig: Record<string, { icon: any; bg: string; color: string }> = {
  order: { icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
  payment: { icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
  driver: { icon: Truck, bg: "bg-orange-50", color: "text-orange-600" },
  system: { icon: Settings, bg: "bg-purple-50", color: "text-purple-600" },
  alert: { icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
  approval: { icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
}

const notifications = [
  { id: 1, type: "order", title: "New order created", desc: "Order SM-20491 has been created by Collins Bassie for Lekki → Ikeja delivery.", time: "2 min ago", unread: true, entity: "SM-20491" },
  { id: 2, type: "payment", title: "Payment received", desc: "₦6,800 payment received from Collins Bassie for order SM-20491.", time: "5 min ago", unread: true, entity: "SM-20491" },
  { id: 3, type: "driver", title: "Driver went online", desc: "Damilare Adegbite (ABC 123 DE) is now online and available for deliveries.", time: "8 min ago", unread: true, entity: "DRV-78901" },
  { id: 4, type: "alert", title: "Delayed delivery", desc: "Order SM-20489 is running 15 minutes behind schedule. Driver Rashid Lawal is en route.", time: "12 min ago", unread: true, entity: "SM-20489" },
  { id: 5, type: "order", title: "Order completed", desc: "Order SM-20485 has been successfully delivered by Tosin Adebayo to Victoria Island.", time: "18 min ago", unread: true, entity: "SM-20485" },
  { id: 6, type: "payment", title: "Payout processed", desc: "₦8,360 payout to Damilare Adegbite has been processed successfully.", time: "25 min ago", unread: false, entity: "PAY-250520-045" },
  { id: 7, type: "system", title: "System maintenance scheduled", desc: "Scheduled maintenance on May 22, 2025 from 2:00 AM to 4:00 AM WAT.", time: "32 min ago", unread: false, entity: "" },
  { id: 8, type: "approval", title: "Approval request", desc: "Driver verification request from Ibrahim Musa is pending your approval.", time: "45 min ago", unread: false, entity: "DRV-VER-250519-1244" },
  { id: 9, type: "driver", title: "Driver document expiring", desc: "Vehicle insurance for KJA 908 LM (Rashid Lawal) expires in 7 days.", time: "1 hr ago", unread: false, entity: "VH-KJA908" },
  { id: 10, type: "order", title: "Dispute opened", desc: "A payment dispute has been opened for order SM-20482 by QuickStore Ltd.", time: "1 hr ago", unread: false, entity: "TKT-250520-1244" },
  { id: 11, type: "alert", title: "High demand alert", desc: "Delivery demand in Lekki has increased by 40% in the last hour.", time: "2 hrs ago", unread: false, entity: "" },
  { id: 12, type: "payment", title: "Wallet low balance", desc: "Main wallet balance is below ₦500,000. Current balance: ₦420,500.", time: "3 hrs ago", unread: false, entity: "" },
  { id: 13, type: "system", title: "New feature: Return Load", desc: "Return Load matching is now live. Drivers can now match loads for return trips.", time: "4 hrs ago", unread: false, entity: "" },
  { id: 14, type: "order", title: "Bulk order received", desc: "Starlight Logistics has placed 15 orders for delivery across Lagos.", time: "5 hrs ago", unread: false, entity: "ORG-55123" },
  { id: 15, type: "driver", title: "Driver suspended", desc: "Chinedu Okafor (DRV-78288) has been suspended until May 30 for multiple cancellations.", time: "6 hrs ago", unread: false, entity: "DRV-78288" },
]

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("All Notifications")
  const [selected, setSelected] = useState(notifications[0])

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div><h1 className="text-xl font-bold text-text-primary">Notifications</h1><p className="text-xs text-text-muted mt-0.5">Stay updated on all platform activities and system alerts.</p></div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-[11px] font-medium text-sendme hover:bg-sendme-50"><Eye size={12}/> Mark all read</button>
            <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-[11px] font-medium text-text-muted hover:bg-surface-secondary"><Settings size={12}/> Preferences</button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {stats.map(s => { const I = s.icon; return (
            <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className="text-[9px] font-medium text-text-muted truncate">{s.change}</p></Card>
          )})}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search notifications..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Types <ChevronDown size={12}/></button>
          <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">Newest First <ChevronDown size={12}/></button>
        </div>
        <div className="flex items-center border-b border-border-light mb-3">
          {notifTabs.map(t => (
            <button key={t.name} onClick={() => setActiveTab(t.name)} className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab===t.name?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t.name}<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab===t.name?"bg-sendme-50 text-sendme":"bg-surface-secondary text-text-muted"}`}>{t.count}</span></button>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-border-default divide-y divide-border-light">
          {notifications.map(n => {
            const tc = typeConfig[n.type]; const I = tc.icon;
            return (
              <div key={n.id} onClick={() => setSelected(n)} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-secondary transition-colors ${selected?.id===n.id?"bg-sendme-50":""} ${n.unread?"bg-blue-50/30":""}`}>
                <div className={`p-1.5 rounded-lg ${tc.bg} ${tc.color} shrink-0 mt-0.5`}><I size={14}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[11px] ${n.unread?"font-semibold text-text-primary":"font-medium text-text-primary"}`}>{n.title}</p>
                    {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-sendme shrink-0"/>}
                    {n.entity && <span className="text-[9px] text-sendme bg-sendme-50 px-1.5 py-0.5 rounded-full shrink-0">{n.entity}</span>}
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{n.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-text-muted">{n.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {selected && (
        <div className="w-[360px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div className="flex items-center gap-2">
              {(() => { const tc = typeConfig[selected.type]; const I = tc.icon; return <div className={`p-1.5 rounded-lg ${tc.bg} ${tc.color}`}><I size={14}/></div> })()}
              <div><p className="font-semibold text-sm text-text-primary">{selected.title}</p><p className="text-[9px] text-text-muted">{selected.time}</p></div>
            </div>
            <button onClick={() => setSelected(null as any)} className="p-1 hover:bg-surface-secondary rounded"><span className="text-text-muted text-sm">✕</span></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Details</p><p className="text-[11px] text-text-secondary leading-relaxed">{selected.desc}</p></div>
            {selected.entity && (
              <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Related Entity</p>
                <div className="p-3 border border-border-default rounded-lg"><p className="text-[11px] font-medium text-sendme">{selected.entity}</p><p className="text-[9px] text-text-muted mt-0.5 capitalize">{selected.type}</p></div>
              </div>
            )}
            <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="space-y-2">
                {selected.unread && <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90"><Eye size={12}/> Mark as Read</button>}
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><EyeOff size={12}/> Mute Similar Notifications</button>
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary"><Trash2 size={12} className="text-red-500"/> <span className="text-red-500">Delete</span></button>
              </div>
            </div>
            <div><p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Notification Info</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-[11px] text-text-muted">Type</span><span className="text-[11px] font-medium text-text-primary capitalize">{selected.type}</span></div>
                <div className="flex justify-between"><span className="text-[11px] text-text-muted">Status</span><span className={`text-[11px] font-medium ${selected.unread?"text-sendme":"text-text-muted"}`}>{selected.unread?"Unread":"Read"}</span></div>
                <div className="flex justify-between"><span className="text-[11px] text-text-muted">Received</span><span className="text-[11px] font-medium text-text-primary">{selected.time}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
