"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  X, DollarSign, User, Building2, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, MessageSquare
} from "lucide-react"

interface PayoutRequest {
  id: string
  type: "driver" | "organization"
  user_id: string
  user_name: string
  user_phone: string
  amount: number
  status: string
  bank_name: string
  account_number: string
  account_name: string
  note: string
  created_at: string
  updated_at?: string
  processed_at?: string
}

interface PayoutDetailProps {
  payout: PayoutRequest
  onClose: () => void
  onActionComplete: () => void
}

export function PayoutDetail({ payout, onClose, onActionComplete }: PayoutDetailProps) {
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    setActionResult(null)

    try {
      const res = await fetch(`/api/dashboard/payouts/${payout.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })

      const data = await res.json()

      if (!res.ok) {
        setActionResult({ success: false, message: data.error || "Action failed" })
      } else {
        setActionResult({ success: true, message: data.message || "Payout approved. User has been notified." })
        setTimeout(() => {
          onActionComplete()
          onClose()
        }, 1500)
      }
    } catch (err) {
      setActionResult({ success: false, message: "Network error" })
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }

    if (!rejectReason.trim()) {
      setActionResult({ success: false, message: "Please provide a reason for rejection" })
      return
    }

    setRejecting(true)
    setActionResult(null)

    try {
      const res = await fetch(`/api/dashboard/payouts/${payout.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setActionResult({ success: false, message: data.error || "Action failed" })
      } else {
        setActionResult({ success: true, message: data.message || "Payout rejected. User has been notified." })
        setTimeout(() => {
          onActionComplete()
          onClose()
        }, 1500)
      }
    } catch (err) {
      setActionResult({ success: false, message: "Network error" })
    } finally {
      setRejecting(false)
    }
  }

  const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    pending: { color: "text-warning", bg: "bg-warning-light", icon: Clock, label: "Pending" },
    processing: { color: "text-info", bg: "bg-info-light", icon: Loader2, label: "Processing" },
    paid: { color: "text-sendme", bg: "bg-sendme-50", icon: CheckCircle, label: "Paid" },
    completed: { color: "text-sendme", bg: "bg-sendme-50", icon: CheckCircle, label: "Completed" },
    failed: { color: "text-danger", bg: "bg-danger-light", icon: XCircle, label: "Failed" },
  }

  const st = statusConfig[payout.status] || statusConfig.pending
  const StatusIcon = st.icon
  const isPending = payout.status === "pending"

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    } catch { return d }
  }

  return (
    <div className="w-[380px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">Payout Request</h3>
            <span className={`text-[9px] font-semibold ${st.bg} ${st.color} px-1.5 py-0.5 rounded-full flex items-center gap-1`}>
              <StatusIcon size={10} className={payout.status === "processing" ? "animate-spin" : ""} />
              {st.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-[10px] text-text-muted">ID: {payout.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Amount */}
        <div className="text-center py-3">
          <p className="text-[10px] text-text-muted mb-1">Requested Amount</p>
          <p className="text-3xl font-bold text-text-primary">₦{payout.amount.toLocaleString()}</p>
        </div>

        {/* Action Buttons (only for pending) */}
        {isPending && (
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              loading={approving}
              onClick={handleApprove}
            >
              <CheckCircle size={14} /> Approve
            </Button>

            {!showRejectInput ? (
              <Button
                variant="danger"
                className="w-full"
                loading={rejecting}
                onClick={handleReject}
              >
                <XCircle size={14} /> Reject
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="bg-surface-secondary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={12} className="text-text-muted" />
                    <p className="text-[10px] font-semibold text-text-primary">Rejection Reason</p>
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full text-[11px] text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme resize-none h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setShowRejectInput(false); setRejectReason("") }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    loading={rejecting}
                    onClick={handleReject}
                  >
                    <XCircle size={14} /> Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Result */}
        {actionResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${actionResult.success ? "bg-sendme-50 text-sendme" : "bg-danger-light text-danger"}`}>
            {actionResult.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {actionResult.message}
          </div>
        )}

        {/* Requester Info */}
        <div>
          <h4 className="text-[11px] font-semibold text-text-primary mb-2">Requester</h4>
          <div className="bg-surface-secondary/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <User size={14} className="text-text-muted shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-text-primary">{payout.user_name}</p>
                <p className="text-[9px] text-text-muted">{payout.user_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-text-muted shrink-0" />
              <p className="text-[10px] text-text-secondary capitalize">{payout.type === "driver" ? "Independent Driver" : "Organization"}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h4 className="text-[11px] font-semibold text-text-primary mb-2">Bank Account</h4>
          <div className="bg-surface-secondary/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-text-muted shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-text-primary">{payout.bank_name}</p>
                <p className="text-[9px] text-text-muted font-mono">{payout.account_number}</p>
              </div>
            </div>
            {payout.account_name && payout.account_name !== "—" && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-text-muted shrink-0" />
                <p className="text-[10px] text-text-secondary">{payout.account_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-[11px] font-semibold text-text-primary mb-2">Timeline</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-sendme-50 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={10} className="text-sendme" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-text-primary">Request Submitted</p>
                <p className="text-[9px] text-text-muted">{formatDate(payout.created_at)}</p>
              </div>
            </div>
            {payout.status === "completed" && payout.processed_at && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-sendme-50 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={10} className="text-sendme" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-text-primary">Payout Approved</p>
                  <p className="text-[9px] text-text-muted">{formatDate(payout.processed_at)}</p>
                  <p className="text-[9px] text-text-muted mt-0.5">Payment to be made manually by admin</p>
                </div>
              </div>
            )}
            {payout.status === "paid" && payout.processed_at && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-sendme-50 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={10} className="text-sendme" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-text-primary">Payout Completed</p>
                  <p className="text-[9px] text-text-muted">{formatDate(payout.processed_at)}</p>
                </div>
              </div>
            )}
            {payout.status === "failed" && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-danger-light flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle size={10} className="text-danger" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-danger">Payout Rejected</p>
                  <p className="text-[9px] text-text-muted">Wallet has been refunded</p>
                </div>
              </div>
            )}
            {payout.status === "processing" && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-info-light flex items-center justify-center shrink-0 mt-0.5">
                  <Loader2 size={10} className="text-info animate-spin" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-info">Processing</p>
                  <p className="text-[9px] text-text-muted">Awaiting admin confirmation</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {payout.note && (
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Note</h4>
            <p className="text-[10px] text-text-secondary bg-surface-secondary/50 rounded-lg p-3">{payout.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
