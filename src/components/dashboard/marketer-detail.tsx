"use client"

import { toast } from "sonner"
import { useState, useEffect } from "react"
import {
  X, Phone, Mail, MapPin, Briefcase, Target, Star,
  Loader2, AlertTriangle, Trash2, Ban, ShieldCheck,
  CheckCircle, Clock, RotateCcw, Users
} from "lucide-react"

interface MarketerDetailProps {
  marketerId: string
  onClose: () => void
}

interface MarketerData {
  marketer: {
    id: string
    name: string
    phone: string
    email: string
    state: string
    city: string
    occupation: string
    hasSalesExperience: boolean
    experienceDescription: string
    onboardedTargets: number | null
    marketerId: string
    status: string
    statusLabel: string
    statusColor: string
    reviewReason: string | null
    totalReferrals: number
    totalEarnings: number
    totalEarningsFormatted: string
    memberSince: string
    memberDuration: string
    created_at: string
  }
  referrals: {
    id: string
    name: string
    email: string
    phone: string
    role: string
    joined: string
  }[]
}

const tabs = ["Overview", "Referrals"]

export function MarketerDetail({ marketerId, onClose }: MarketerDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MarketerData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    if (!marketerId) return
    setLoading(true)
    fetch(`/api/dashboard/marketers/${marketerId}`)
      .then((r) => r.json())
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [marketerId])

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/dashboard/marketers/${marketerId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message || "Action completed")
        setConfirmAction(null)
        setShowRejectModal(false)
        setRejectReason("")
        if (action === "hard_delete") {
          onClose()
        } else {
          const r = await fetch(`/api/dashboard/marketers/${marketerId}`)
          const updated = await r.json()
          setData(updated)
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

  const handleReject = () => {
    handleAction("reject", { reason: rejectReason })
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
              {(data.marketer.name || "?")[0]}
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
                <h3 className="text-sm font-bold text-text-primary">{data.marketer.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-text-muted">Marketer • {data.marketer.id.slice(0, 8).toUpperCase()}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${data.marketer.statusColor}`}>
                    {data.marketer.statusLabel}
                  </span>
                </div>
                {data.marketer.marketerId !== "Pending" && (
                  <p className="text-[10px] font-mono text-sendme mt-0.5">{data.marketer.marketerId}</p>
                )}
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
            <p className="text-xs text-text-muted">Failed to load marketer details</p>
          </div>
        ) : activeTab === "Overview" ? (
          <div className="space-y-5">
            {/* Personal Info */}
            <div className="space-y-2">
              {[
                ["Full Name", data.marketer.name],
                ["Phone", data.marketer.phone],
                ["Email", data.marketer.email],
                ["State", data.marketer.state],
                ["City", data.marketer.city],
                ["Occupation", data.marketer.occupation],
                ["Member Since", `${data.marketer.memberSince} (${data.marketer.memberDuration})`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                  <p className="text-[11px] text-text-muted">{label}</p>
                  <p className="text-[11px] font-medium text-text-primary text-right max-w-[180px] truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-text-primary">Experience</h4>
              <div className="flex items-center justify-between py-1.5 border-b border-border-light">
                <p className="text-[11px] text-text-muted">Sales/Marketing Experience</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  data.marketer.hasSalesExperience ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                }`}>
                  {data.marketer.hasSalesExperience ? "Yes" : "No"}
                </span>
              </div>
              {data.marketer.hasSalesExperience && data.marketer.experienceDescription !== "—" && (
                <p className="text-[11px] text-text-muted bg-surface-secondary rounded-lg p-2.5">
                  {data.marketer.experienceDescription}
                </p>
              )}
              {data.marketer.onboardedTargets && (
                <div className="flex items-center justify-between py-1.5 border-b border-border-light">
                  <p className="text-[11px] text-text-muted">30-Day Target</p>
                  <p className="text-[11px] font-medium text-text-primary">{data.marketer.onboardedTargets} businesses</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-secondary rounded-lg p-3 text-center">
                <p className="text-[9px] text-text-muted">Total Referrals</p>
                <p className="text-lg font-bold text-text-primary mt-0.5">{data.marketer.totalReferrals}</p>
              </div>
              <div className="bg-sendme-50 rounded-lg p-3 text-center">
                <p className="text-[9px] text-text-muted">Total Earnings</p>
                <p className="text-lg font-bold text-sendme mt-0.5">{data.marketer.totalEarningsFormatted}</p>
              </div>
            </div>

            {/* Review Reason (if rejected) */}
            {data.marketer.reviewReason && (
              <div className="bg-danger-light rounded-lg p-3">
                <p className="text-[10px] font-semibold text-danger mb-1">Review Reason</p>
                <p className="text-[11px] text-text-primary">{data.marketer.reviewReason}</p>
              </div>
            )}
          </div>
        ) : (
          /* Referrals Tab */
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-primary">
              Referrals ({data.referrals.length})
            </h4>
            {data.referrals.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Users size={24} className="text-text-muted/30 mx-auto mb-2" />
                  <p className="text-xs text-text-muted">No referrals yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {data.referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-sendme-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-sendme">{(ref.name || "?")[0]}</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-text-primary">{ref.name}</p>
                        <p className="text-[9px] text-text-muted">{ref.email}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      ref.role === "driver" ? "bg-blue-50 text-blue-700" :
                      ref.role === "organization" ? "bg-purple-50 text-purple-700" :
                      "bg-green-50 text-green-700"
                    }`}>
                      {ref.role === "driver" ? "Courier" : ref.role === "organization" ? "Org" : "Customer"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!loading && data && (
        <div className="px-4 py-3 border-t border-border-light space-y-2">
          {confirmAction ? (
            <div className="space-y-2">
              <p className="text-[11px] text-text-muted text-center">
                {confirmAction === "hard_delete" ? "Permanently delete this marketer?" :
                 confirmAction === "suspend" ? "Suspend this marketer?" :
                 confirmAction === "reinstate" ? "Reinstate this marketer as approved?" :
                 "Deactivate this marketer?"}
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
          ) : showRejectModal ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-text-primary">Reject Application</p>
              <textarea
                placeholder="Reason for rejection (optional)"
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
            <div className="grid grid-cols-3 gap-2">
              {data.marketer.status === "pending" && (
                <>
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={!!actionLoading}
                    className="px-2 py-2 border border-sendme/30 bg-sendme-50 rounded-lg text-[10px] font-semibold text-sendme hover:bg-sendme/10 transition-colors flex items-center justify-center gap-1"
                  >
                    {actionLoading === "approve" ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Ban size={10} /> Reject
                  </button>
                </>
              )}
              {data.marketer.status === "approved" && (
                <>
                  <button
                    onClick={() => setConfirmAction("suspend")}
                    className="px-2 py-2 border border-warning/30 bg-warning-light rounded-lg text-[10px] font-semibold text-warning hover:bg-warning/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Ban size={10} /> Suspend
                  </button>
                </>
              )}
              {data.marketer.status === "suspended" && (
                <button
                  onClick={() => setConfirmAction("reinstate")}
                  className="px-2 py-2 border border-sendme/30 bg-sendme-50 rounded-lg text-[10px] font-semibold text-sendme hover:bg-sendme/10 transition-colors flex items-center justify-center gap-1 col-span-2"
                >
                  <RotateCcw size={10} /> Reinstate
                </button>
              )}
              {data.marketer.status === "rejected" && (
                <button
                  onClick={() => handleAction("approve")}
                  disabled={!!actionLoading}
                  className="px-2 py-2 border border-sendme/30 bg-sendme-50 rounded-lg text-[10px] font-semibold text-sendme hover:bg-sendme/10 transition-colors flex items-center justify-center gap-1 col-span-2"
                >
                  {actionLoading === "approve" ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                  Approve Anyway
                </button>
              )}
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
