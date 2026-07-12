"use client"

import { toast } from "sonner"
import { useState, useEffect } from "react"
import {
  X, CheckCircle, Clock, Package, Users, Edit,
  MessageCircle, Wallet, AlertTriangle, Eye, Building2, FileText,
  Loader2, DollarSign, Ban, Trash2, Shield
} from "lucide-react"

interface OrganizationDetailProps {
  orgId: string
  onClose: () => void
}

interface OrgData {
  organization: {
    id: string
    shortId: string
    name: string
    initials: string
    industry: string
    address: string
    city: string
    contactName: string
    contactPhone: string
    contactEmail: string
    website: string
    registrationNumber: string
    taxId: string
    logoUrl: string | null
    status: string
    statusColor: string
    statusRaw: string
    reviewReason: string | null
    memberSince: string
    memberDuration: string
    created_at: string
  }
  stats: {
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    totalSpend: number
    totalSpendFormatted: string
    driverCount: number
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

function OverviewTab({ data }: { data: OrgData }) {
  const { organization: org, stats, wallet } = data
  return (
    <div className="space-y-5">
      {/* Org Info */}
      <div className="space-y-2">
        {[
          ["Organization Name", org.name],
          ["Industry", org.industry],
          ["Registration Number", org.registrationNumber],
          ["City", org.city],
          ["Address", org.address],
          ["Contact Person", org.contactName],
          ["Phone", org.contactPhone],
          ["Email", org.contactEmail],
          ["Website", org.website],
          ["Tax ID (TIN)", org.taxId],
          ["Member Since", `${org.memberSince} (${org.memberDuration})`],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">{label}</p>
            <p className="text-[11px] font-medium text-text-primary text-right max-w-[180px] truncate">{value}</p>
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

      {/* Spend & Drivers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-sendme-50 rounded-lg p-3 text-center">
          <p className="text-[9px] text-text-muted">Total Spend</p>
          <p className="text-lg font-bold text-sendme mt-0.5">{stats.totalSpendFormatted}</p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 text-center">
          <p className="text-[9px] text-text-muted">Drivers</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">{stats.driverCount}</p>
        </div>
      </div>

      {/* Wallet Balance */}
      {wallet && (
        <div className="bg-sendme-50 rounded-lg p-3 text-center">
          <p className="text-[9px] text-text-muted">Wallet Balance</p>
          <p className="text-lg font-bold text-sendme mt-0.5">{wallet.balanceFormatted}</p>
        </div>
      )}

      {/* Account Status */}
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Account Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">Verification Status</p>
            <div className="flex items-center gap-1">
              {org.statusRaw === "verified" ? (
                <>
                  <CheckCircle size={12} className="text-sendme" />
                  <span className="text-[11px] font-semibold text-sendme">Verified</span>
                </>
              ) : org.statusRaw === "rejected" ? (
                <>
                  <AlertTriangle size={12} className="text-danger" />
                  <span className="text-[11px] font-semibold text-danger">Rejected</span>
                </>
              ) : (
                <>
                  <Clock size={12} className="text-warning" />
                  <span className="text-[11px] font-semibold text-warning">Pending</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <p className="text-[11px] text-text-muted">Status</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${org.statusColor}`}>{org.status}</span>
          </div>
          {org.reviewReason && (
            <div className="bg-danger-light rounded-lg p-2.5">
              <p className="text-[9px] text-danger font-semibold mb-0.5">Rejection Reason</p>
              <p className="text-[11px] text-danger">{org.reviewReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ data }: { data: OrgData }) {
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
    <div className="flex items-center justify-center h-32">
      <p className="text-xs text-text-muted">Activity log coming soon</p>
    </div>
  )
}

export function OrganizationDetail({ orgId, onClose }: OrganizationDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrgData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditNote, setCreditNote] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const fetchData = () => {
    if (!orgId) return
    setLoading(true)
    fetch(`/api/dashboard/organizations/${orgId}`)
      .then((r) => r.json())
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [orgId])

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/dashboard/organizations/${orgId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message || "Action completed")
        setConfirmAction(null)
        if (action === "hard_delete") {
          onClose()
        } else {
          fetchData()
        }
      } else {
        toast.error(result.error || "Action failed")
      }
    } catch {
      toast.error("Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCredit = async () => {
    const amt = parseFloat(creditAmount)
    if (!amt || amt <= 0) return toast.error("Enter a valid amount")
    setActionLoading("credit")
    try {
      const res = await fetch(`/api/dashboard/organizations/${orgId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "credit", amount: amt, note: creditNote }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Wallet credited successfully")
        setShowCreditModal(false)
        setCreditAmount("")
        setCreditNote("")
        fetchData()
      } else {
        toast.error(result.error || "Credit failed")
      }
    } catch {
      toast.error("Credit failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    setActionLoading("reject")
    try {
      const res = await fetch(`/api/dashboard/organizations/${orgId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Organization rejected")
        setShowRejectModal(false)
        setRejectReason("")
        fetchData()
      } else {
        toast.error(result.error || "Reject failed")
      }
    } catch {
      toast.error("Reject failed")
    } finally {
      setActionLoading(null)
    }
  }

  const isVerified = data?.organization.statusRaw === "verified"

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-start gap-3 mb-3">
          {loading ? (
            <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center shrink-0">
              <Loader2 size={16} className="animate-spin text-text-muted" />
            </div>
          ) : data ? (
            <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
              {data.organization.initials}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">{data.organization.name}</h3>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${data.organization.statusColor}`}>{data.organization.status}</span>
                </div>
                <p className="text-[10px] text-text-muted">{data.organization.shortId} • {data.organization.industry}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-text-muted">Member since {data.organization.memberSince} ({data.organization.memberDuration})</span>
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
            <p className="text-xs text-text-muted">Failed to load organization details</p>
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
                {confirmAction === "hard_delete" ? "Permanently delete this organization?" :
                 confirmAction === "suspend" ? "Suspend this organization?" :
                 confirmAction === "verify" ? "Verify this organization?" :
                 "Deactivate this organization?"}
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
                  className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                    confirmAction === "verify"
                      ? "bg-sendme text-white hover:bg-sendme-dark"
                      : "bg-danger text-white hover:bg-danger/90"
                  }`}
                >
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          ) : showCreditModal ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-text-primary">Credit Organization Wallet</p>
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
          ) : showRejectModal ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-text-primary">Reject Organization</p>
              <textarea
                placeholder="Reason for rejection (shown to organization)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full text-[11px] text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason("") }}
                  className="flex-1 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!!actionLoading}
                  className="flex-1 px-3 py-2 bg-danger text-white rounded-lg text-[11px] font-semibold hover:bg-danger/90 transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading === "reject" && <Loader2 size={12} className="animate-spin" />}
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {!isVerified && (
                <>
                  <button
                    onClick={() => setConfirmAction("verify")}
                    className="px-2 py-2 border border-sendme/30 bg-sendme-50 rounded-lg text-[10px] font-semibold text-sendme hover:bg-sendme/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Shield size={10} /> Verify
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Ban size={10} /> Reject
                  </button>
                </>
              )}
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
                className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1"
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
