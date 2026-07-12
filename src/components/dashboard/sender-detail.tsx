"use client"

import { useState, useEffect } from "react"
import {
  X, Phone, MessageCircle, Package, Clock,
  Eye, Loader2, AlertTriangle, Trash2, Ban, DollarSign
} from "lucide-react"

interface SenderDetailProps {
  senderId: string
  onClose: () => void
}

interface SenderData {
  sender: {
    id: string
    name: string
    phone: string
    email: string
    avatar: string
    status: string
    statusColor: string
    memberSince: string
    memberDuration: string
    created_at: string
  }
  stats: {
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    totalSpent: number
    totalSpentFormatted: string
  }
  wallet: {
    balance: number
    balanceFormatted: string
  } | null
  recentOrders: {
    id: string
    route: string
    date: string
    fare: string
    status: string
    statusColor: string
  }[]
}

const tabs = ["Overview", "Orders", "Activity"]

function OverviewTab({ data }: { data: SenderData }) {
  const { sender, stats, wallet } = data
  return (
    <div className="space-y-5">
      {/* Sender Info */}
      <div className="space-y-2">
        {[
          ["Full Name", sender.name],
          ["Phone Number", sender.phone],
          ["Email Address", sender.email],
          ["Member Since", `${sender.memberSince} (${sender.memberDuration})`],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">{label}</p>
            <p className="text-[11px] font-medium text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Total Orders", String(stats.totalOrders)],
          ["Completed", String(stats.completedOrders)],
          ["Cancelled", String(stats.cancelledOrders)],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface-secondary rounded-lg p-2.5 text-center">
            <p className="text-[9px] text-text-muted">{label}</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Spending */}
      <div className="bg-surface-secondary rounded-lg p-3 text-center">
        <p className="text-[9px] text-text-muted">Total Spent</p>
        <p className="text-lg font-bold text-sendme mt-0.5">{stats.totalSpentFormatted}</p>
      </div>

      {/* Wallet Balance */}
      {wallet && (
        <div className="bg-sendme-50 rounded-lg p-3 text-center">
          <p className="text-[9px] text-text-muted">Wallet Balance</p>
          <p className="text-lg font-bold text-sendme mt-0.5">{wallet.balanceFormatted}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <Eye size={12} /> View Full Profile
        </button>
        <button className="px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5">
          <MessageCircle size={12} /> Send Message
        </button>
      </div>
    </div>
  )
}

function OrdersTab({ data }: { data: SenderData }) {
  if (data.recentOrders.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-muted">No orders yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-primary">Recent Orders</h4>
      <div className="space-y-2">
        {data.recentOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-sendme-50 rounded-lg flex items-center justify-center shrink-0">
                <Package size={12} className="text-sendme" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-primary">{order.id}</p>
                <p className="text-[9px] text-text-muted">{order.route}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-text-primary">{order.fare}</p>
              <p className="text-[9px] text-text-muted">{order.date}</p>
            </div>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${order.statusColor}`}>{order.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1">Activity Log <Clock size={10} className="text-text-muted" /></h4>
      </div>
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-muted">Activity log coming soon</p>
      </div>
    </div>
  )
}

export function SenderDetail({ senderId, onClose }: SenderDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SenderData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditNote, setCreditNote] = useState("")

  useEffect(() => {
    if (!senderId) return
    setLoading(true)
    fetch(`/api/dashboard/senders/${senderId}`)
      .then((r) => r.json())
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [senderId])

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/dashboard/senders/${senderId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const result = await res.json()
      if (result.success) {
        setConfirmAction(null)
        if (action === "hard_delete") {
          onClose()
        } else {
          // Reload data
          const r = await fetch(`/api/dashboard/senders/${senderId}`)
          const updated = await r.json()
          setData(updated)
        }
      } else {
        alert(result.error || "Action failed")
      }
    } catch {
      alert("Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCredit = async () => {
    const amt = parseFloat(creditAmount)
    if (!amt || amt <= 0) return alert("Enter a valid amount")
    setActionLoading("credit")
    try {
      const res = await fetch(`/api/dashboard/senders/${senderId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "credit", amount: amt, note: creditNote }),
      })
      const result = await res.json()
      if (result.success) {
        setShowCreditModal(false)
        setCreditAmount("")
        setCreditNote("")
        // Reload data
        const r = await fetch(`/api/dashboard/senders/${senderId}`)
        const updated = await r.json()
        setData(updated)
      } else {
        alert(result.error || "Credit failed")
      }
    } catch {
      alert("Credit failed")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-start gap-3 mb-3">
          {loading ? (
            <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center shrink-0">
              <Loader2 size={16} className="animate-spin text-text-muted" />
            </div>
          ) : data ? (
            <div className="w-12 h-12 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-lg font-bold shrink-0">
              {data.sender.avatar}
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-4 bg-surface-secondary rounded w-32" />
                <div className="h-3 bg-surface-secondary rounded w-24" />
              </div>
            ) : data ? (
              <>
                <h3 className="text-sm font-bold text-text-primary">{data.sender.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-text-muted">Sender • {data.sender.id.slice(0, 8).toUpperCase()}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${data.sender.statusColor}`}>{data.sender.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-text-muted">Member since {data.sender.memberSince} ({data.sender.memberDuration})</span>
                </div>
              </>
            ) : null}
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
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-sendme" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-xs text-text-muted">Failed to load sender details</p>
          </div>
        ) : (
          <>
            {activeTab === "Overview" && <OverviewTab data={data} />}
            {activeTab === "Orders" && <OrdersTab data={data} />}
            {activeTab === "Activity" && <ActivityTab />}
          </>
        )}
      </div>

      {/* Action Buttons */}
      {!loading && data && (
        <div className="px-4 py-3 border-t border-border-light space-y-2">
          {confirmAction ? (
            <div className="space-y-2">
              <p className="text-[11px] text-text-muted text-center">
                {confirmAction === "hard_delete" ? "Permanently delete this sender?" :
                 confirmAction === "suspend" ? "Suspend this sender? They won't be able to place orders." :
                 "Deactivate this sender?"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(confirmAction)}
                  disabled={!!actionLoading}
                  className="flex-1 px-3 py-2 bg-danger text-white rounded-lg text-[11px] font-semibold hover:bg-danger/90 transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          ) : showCreditModal ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-text-primary">Credit Sender Wallet</p>
              <input
                type="number"
                placeholder="Amount (₦)"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full text-[11px] text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                className="w-full text-[11px] text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCreditModal(false); setCreditAmount(""); setCreditNote("") }}
                  className="flex-1 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCredit}
                  disabled={!!actionLoading || !creditAmount}
                  className="flex-1 px-3 py-2 bg-sendme text-white rounded-lg text-[11px] font-semibold hover:bg-sendme-dark transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading === "credit" && <Loader2 size={12} className="animate-spin" />}
                  Credit
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowCreditModal(true)}
                className="px-2 py-2 border border-sendme/30 bg-sendme-50 rounded-lg text-[10px] font-semibold text-sendme hover:bg-sendme/10 transition-colors flex items-center justify-center gap-1"
              >
                <DollarSign size={10} /> Credit
              </button>
              <button
                onClick={() => setConfirmAction("suspend")}
                className="px-2 py-2 border border-warning/30 bg-warning-light rounded-lg text-[10px] font-semibold text-warning hover:bg-warning/10 transition-colors flex items-center justify-center gap-1"
              >
                <Ban size={10} /> Suspend
              </button>
              <button
                onClick={() => setConfirmAction("soft_delete")}
                className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={10} /> Deactivate
              </button>
              <button
                onClick={() => setConfirmAction("hard_delete")}
                className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors col-span-3 flex items-center justify-center gap-1"
              >
                <AlertTriangle size={10} /> Delete Permanently
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
