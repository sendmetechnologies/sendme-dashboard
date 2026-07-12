"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { WalletDetail } from "@/components/dashboard/wallet-detail"
import {
  DollarSign, TrendingUp, TrendingDown, Search, Download, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Filter, Eye
} from "lucide-react"

const stats = [
  { label: "Total Balance", value: "₦4,562,300.50", change: "↑ 14% vs last 30 days", up: true, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Available Balance", value: "₦3,892,100.20", change: "↑ 11% vs last 30 days", up: true, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "On Hold", value: "₦420,500.00", change: "↓ 8% vs last 30 days", up: false, icon: DollarSign, color: "text-warning", bg: "bg-warning-light" },
  { label: "Pending Payouts", value: "₦249,700.00", change: "↑ 16% vs last 30 days", up: true, icon: TrendingUp, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Total Payouts (30d)", value: "₦2,185,400.00", change: "↑ 21% vs last 30 days", up: true, icon: TrendingDown, color: "text-sendme", bg: "bg-sendme-50" },
]

const statusTabs = [
  { name: "All Transactions", count: 1248, active: true },
  { name: "Credits", count: 682 },
  { name: "Debits", count: 466 },
  { name: "Payouts", count: 100 },
  { name: "Refunds", count: 32 },
]

const transactions = [
  { id: "TRX-250520-001", type: "Credit", typeColor: "bg-sendme-50 text-sendme", typeIcon: "↓", desc: "Payment received", sub: "From Collins Bassie", amount: "₦6,800.00", amountColor: "text-sendme", status: "Completed", statusColor: "bg-sendme-50 text-sendme", wallet: "Main Wallet", date: "May 20, 2025", time: "10:24 AM" },
  { id: "PAYOUT-250520-045", type: "Debit", typeColor: "bg-danger-light text-danger", typeIcon: "↑", desc: "Payout to driver", sub: "To Damilare Adegbite", amount: "-₦6,800.00", amountColor: "text-danger", status: "Completed", statusColor: "bg-sendme-50 text-sendme", wallet: "Main Wallet", date: "May 20, 2025", time: "9:15 AM" },
  { id: "TRX-250520-002", type: "Credit", typeColor: "bg-sendme-50 text-sendme", typeIcon: "↓", desc: "Payment received", sub: "From Peace Stores", amount: "₦4,500.00", amountColor: "text-sendme", status: "Completed", statusColor: "bg-sendme-50 text-sendme", wallet: "Main Wallet", date: "May 20, 2025", time: "8:40 AM" },
  { id: "PAYOUT-250520-046", type: "Payout", typeColor: "bg-info-light text-info", typeIcon: "↗", desc: "Payout requested", sub: "To Bank Account • 1234", amount: "-₦25,000.00", amountColor: "text-danger", status: "Pending", statusColor: "bg-warning-light text-warning", wallet: "Main Wallet", date: "May 19, 2025", time: "6:30 PM" },
  { id: "REF-250519-003", type: "Refund", typeColor: "bg-warning-light text-warning", typeIcon: "↩", desc: "Refund issued", sub: "To QuickStore Ltd.", amount: "-₦2,200.00", amountColor: "text-danger", status: "Completed", statusColor: "bg-sendme-50 text-sendme", wallet: "Main Wallet", date: "May 19, 2025", time: "3:22 PM" },
  { id: "TRX-250519-004", type: "Credit", typeColor: "bg-sendme-50 text-sendme", typeIcon: "↓", desc: "Payment received", sub: "From Starlight Logistics", amount: "₦52,000.00", amountColor: "text-sendme", status: "Completed", statusColor: "bg-sendme-50 text-sendme", wallet: "Main Wallet", date: "May 19, 2025", time: "12:10 PM" },
  { id: "FEE-250519-005", type: "Debit", typeColor: "bg-danger-light text-danger", typeIcon: "↑", desc: "Platform fee", sub: "Service charge", amount: "-₦520.00", amountColor: "text-danger", status: "Completed", statusColor: "bg-sendme-50 text-sendme", wallet: "Main Wallet", date: "May 19, 2025", time: "12:10 PM" },
  { id: "PAYOUT-250519-047", type: "Payout", typeColor: "bg-info-light text-info", typeIcon: "↗", desc: "Payout requested", sub: "To Opay • 8765", amount: "-₦15,000.00", amountColor: "text-danger", status: "Processing", statusColor: "bg-info-light text-info", wallet: "Main Wallet", date: "May 18, 2025", time: "9:05 AM" },
]

export default function WalletsPaymentsPage() {
  const [activeTab, setActiveTab] = useState("All Transactions")
  const [showWallet, setShowWallet] = useState(true)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Wallets & Payments</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage your wallets, balances, transactions and payouts.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium"><span className="text-sendme">📍</span> Lagos, Nigeria</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.map(s => { const I = s.icon; return (
              <Card key={s.label} className="p-3 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div>
                <p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p>
                <p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p>
              </Card>
            )})}
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by reference, type or description..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
            <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">May 1 – May 20, 2025 📅</button>
            <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Types <ChevronDown size={12}/></button>
            <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Status <ChevronDown size={12}/></button>
            <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center justify-between border-b border-border-light">
            <div className="flex gap-0">{statusTabs.map(t => (
              <button key={t.name} onClick={() => setActiveTab(t.name)} className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab===t.name?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t.name}<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab===t.name?"bg-sendme-50 text-sendme":"bg-surface-secondary text-text-muted"}`}>{t.count.toLocaleString()}</span></button>
            ))}</div>
            <div className="flex items-center gap-2 pb-2">
              <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium"><Download size={12}/> Export</button>
              <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium">Newest First <ChevronDown size={12}/></button>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">Transaction</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Wallet</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Date & Time</th><th className="px-3 py-2 text-right">Actions</th>
          </tr></thead><tbody>{transactions.map(t => (
            <tr key={t.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${t.typeColor}`}>{t.typeIcon}</div>
                  <div>
                    <p className="text-[11px] font-medium text-text-primary">{t.desc}</p>
                    <p className="text-[9px] text-text-muted">{t.sub}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${t.typeColor}`}>{t.type}</span></td>
              <td className="px-3 py-2.5"><p className={`text-[11px] font-semibold ${t.amountColor}`}>{t.amount}</p></td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${t.statusColor}`}>{t.status}</span></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{t.wallet}</p></td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1"><p className="text-[10px] font-mono text-text-muted">{t.id}</p><button className="text-text-muted hover:text-sendme"><Eye size={10}/></button></div>
              </td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{t.date}</p><p className="text-[9px] text-text-muted">{t.time}</p></td>
              <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
            </tr>
          ))}</tbody></table></div>
          <div className="flex items-center justify-between px-3 py-2 border-t border-border-light"><p className="text-[10px] text-text-muted">Showing 1 to 8 of 1,248 transactions</p><div className="flex items-center gap-1"><button className="p-1 text-text-muted"><ChevronLeft size={12}/></button>{[1,2,3].map(p=><button key={p} className={`w-6 h-6 rounded text-[10px] font-medium ${p===1?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>)}<span className="text-text-muted text-[10px]">...</span><button className="w-6 h-6 rounded text-[10px] font-medium text-text-muted">156</button><button className="p-1 text-text-muted"><ChevronRight size={12}/></button></div></div></Card>
        </div>
      </div>
      <WalletDetail onClose={() => {}} />
    </div>
  )
}
