"use client"

import { useState, useEffect } from "react"
import {
  X, Phone, MessageCircle, Star, CheckCircle, Clock, Truck,
  Eye, Loader2, AlertTriangle, Trash2, Ban, Shield, DollarSign, CreditCard
} from "lucide-react"

interface DriverDetailProps {
  driverId: string
  onClose: () => void
}

interface DriverData {
  driver: {
    id: string
    name: string
    phone: string
    avatar: string
    status: string
    statusColor: string
    statusRaw: string
    reviewReason: string | null
    type: string
    city: string
    memberSince: string
    memberDuration: string
    created_at: string
  }
  stats: {
    tripsCompleted: number
    cancellationRate: string
    acceptanceRate: string
    rating: number | null
    ratingCount: number
    totalEarnings: number
    totalEarningsFormatted: string
  }
  wallet: {
    balance: number
    balanceFormatted: string
    outstandingBalance: number
    outstandingFormatted: string
  } | null
  vehicle: {
    type: string
    capacity: string
    makeModel: string
    ownership: string
    plateNumber: string
    fuelType: string
    color: string
    transmission: string
    year: string
    seatingCapacity: string
  } | null
  recentPayouts: {
    id: string
    amount: number
    amountFormatted: string
    status: string
    statusColor: string
    created_at: string
  }[]
  recentTrips: {
    id: string
    route: string
    date: string
    fare: string
    status: string
    statusColor: string
  }[]
}

const tabs = ["Overview", "Vehicle", "Trips", "Payouts", "Activity"]

function OverviewTab({ data }: { data: DriverData }) {
  const { driver, stats, wallet } = data
  return (
    <div className="space-y-5">
      {/* Driver Info */}
      <div className="space-y-2">
        {[
          ["Full Name", driver.name],
          ["Phone Number", driver.phone],
          ["City", driver.city],
          ["Driver Type", driver.type],
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
          ["Trips Completed", String(stats.tripsCompleted)],
          ["Cancellation Rate", stats.cancellationRate],
          ["Acceptance Rate", stats.acceptanceRate],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface-secondary rounded-lg p-2.5 text-center">
            <p className="text-[9px] text-text-muted">{label}</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Rating & Earnings */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-secondary rounded-lg p-2.5 text-center">
          <p className="text-[9px] text-text-muted">Rating</p>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            {stats.rating ? (
              <>
                <Star size={10} className="text-warning fill-warning" />
                <span className="text-sm font-bold text-text-primary">{stats.rating}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-text-muted">—</span>
            )}
          </div>
          {stats.ratingCount > 0 && <p className="text-[8px] text-text-muted">({stats.ratingCount} reviews)</p>}
        </div>
        <div className="bg-surface-secondary rounded-lg p-2.5 text-center">
          <p className="text-[9px] text-text-muted">Total Earnings</p>
          <p className="text-sm font-bold text-text-primary mt-0.5">{stats.totalEarningsFormatted}</p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-2.5 text-center">
          <p className="text-[9px] text-text-muted">Wallet Balance</p>
          <p className="text-sm font-bold text-sendme mt-0.5">{wallet?.balanceFormatted || "₦0"}</p>
        </div>
      </div>

      {/* Account Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-primary">Account Status</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
            <p className="text-[11px] text-text-muted">KYC Verification</p>
            <div className="flex items-center gap-1">
              {driver.statusRaw === "verified" ? (
                <>
                  <CheckCircle size={12} className="text-sendme" />
                  <span className="text-[11px] font-semibold text-sendme">Verified</span>
                </>
              ) : driver.statusRaw === "rejected" ? (
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
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${driver.statusColor}`}>{driver.status}</span>
          </div>
          {driver.reviewReason && (
            <div className="bg-danger-light rounded-lg p-2.5">
              <p className="text-[9px] text-danger font-semibold mb-0.5">Rejection Reason</p>
              <p className="text-[11px] text-danger">{driver.reviewReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VehicleTab({ data }: { data: DriverData }) {
  const v = data.vehicle
  if (!v) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-muted">No vehicle information available</p>
      </div>
    )
  }

  const vehicleInfo = [
    ["Vehicle Type", v.type],
    ["Load Capacity", v.capacity],
    ["Make / Model", v.makeModel],
    ["Ownership Type", v.ownership],
    ["Plate Number", v.plateNumber],
    ["Fuel Type", v.fuelType],
    ["Color", v.color],
    ["Transmission", v.transmission],
    ["Year", v.year],
    ["Seating Capacity", v.seatingCapacity],
  ]

  return (
    <div className="space-y-4">
      <div className="h-28 bg-surface-secondary rounded-lg border border-border-light flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <Truck size={24} className="text-text-muted/40 mx-auto mb-1" />
          <p className="text-[9px] text-text-muted">Vehicle Photo</p>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-text-primary mb-3">Vehicle Information</h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {vehicleInfo.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-border-light">
              <p className="text-[10px] text-text-muted">{label}</p>
              <p className="text-[10px] font-medium text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TripsTab({ data }: { data: DriverData }) {
  if (data.recentTrips.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-muted">No trips yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-text-primary">Recent Trips</h4>
      <div className="space-y-2">
        {data.recentTrips.map((trip) => (
          <div key={trip.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-sendme-50 rounded-lg flex items-center justify-center shrink-0">
                <Truck size={12} className="text-sendme" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-primary">{trip.id}</p>
                <p className="text-[9px] text-text-muted">{trip.route}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-text-primary">{trip.fare}</p>
              <p className="text-[9px] text-text-muted">{trip.date}</p>
            </div>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${trip.statusColor}`}>{trip.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PayoutsTab({ data, onProcessPayout }: { data: DriverData; onProcessPayout: (payoutId: string, action: string) => void }) {
  if (data.recentPayouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-muted">No payout requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-text-primary">Payout Requests</h4>
        {data.wallet && (
          <div className="text-right">
            <p className="text-[9px] text-text-muted">Wallet Balance</p>
            <p className="text-[11px] font-bold text-sendme">{data.wallet.balanceFormatted}</p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data.recentPayouts.map((payout) => (
          <div key={payout.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-sendme-50 rounded-lg flex items-center justify-center shrink-0">
                <CreditCard size={12} className="text-sendme" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-primary">{payout.amountFormatted}</p>
                <p className="text-[9px] text-text-muted">{payout.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${payout.statusColor}`}>{payout.status}</span>
              {payout.status === "pending" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onProcessPayout(payout.id, "approve")}
                    className="px-2 py-1 bg-sendme text-white rounded text-[9px] font-semibold hover:bg-sendme-dark transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onProcessPayout(payout.id, "reject")}
                    className="px-2 py-1 bg-danger-light text-danger rounded text-[9px] font-semibold hover:bg-danger/10 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
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

export function DriverDetail({ driverId, onClose }: DriverDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DriverData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditNote, setCreditNote] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const fetchData = () => {
    if (!driverId) return
    setLoading(true)
    fetch(`/api/dashboard/drivers/${driverId}`)
      .then((r) => r.json())
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [driverId])

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/dashboard/drivers/${driverId}/actions`, {
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
          fetchData()
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
      const res = await fetch(`/api/dashboard/drivers/${driverId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "credit", amount: amt, note: creditNote }),
      })
      const result = await res.json()
      if (result.success) {
        setShowCreditModal(false)
        setCreditAmount("")
        setCreditNote("")
        fetchData()
      } else {
        alert(result.error || "Credit failed")
      }
    } catch {
      alert("Credit failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    setActionLoading("reject")
    try {
      const res = await fetch(`/api/dashboard/drivers/${driverId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      })
      const result = await res.json()
      if (result.success) {
        setShowRejectModal(false)
        setRejectReason("")
        fetchData()
      } else {
        alert(result.error || "Reject failed")
      }
    } catch {
      alert("Reject failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleProcessPayout = async (payoutId: string, action: string) => {
    await handleAction("process_payout", { payout_id: payoutId, payout_action: action })
  }

  const isVerified = data?.driver.statusRaw === "verified"

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
              {data.driver.avatar}
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
                  <h3 className="text-sm font-bold text-text-primary">{data.driver.name}</h3>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${data.driver.statusColor}`}>{data.driver.status}</span>
                </div>
                <p className="text-[10px] text-text-muted">{data.driver.id.slice(0, 8).toUpperCase()} • {data.driver.type}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-text-muted">Member since {data.driver.memberSince} ({data.driver.memberDuration})</span>
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
            <p className="text-xs text-text-muted">Failed to load driver details</p>
          </div>
        ) : (
          <>
            {activeTab === "Overview" && <OverviewTab data={data} />}
            {activeTab === "Vehicle" && <VehicleTab data={data} />}
            {activeTab === "Trips" && <TripsTab data={data} />}
            {activeTab === "Payouts" && <PayoutsTab data={data} onProcessPayout={handleProcessPayout} />}
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
                {confirmAction === "hard_delete" ? "Permanently delete this rider?" :
                 confirmAction === "suspend" ? "Suspend this rider?" :
                 confirmAction === "verify" ? "Verify this rider?" :
                 "Deactivate this rider?"}
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
              <p className="text-[11px] font-semibold text-text-primary">Credit Rider Wallet</p>
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
              <p className="text-[11px] font-semibold text-text-primary">Reject Rider Application</p>
              <textarea
                placeholder="Reason for rejection (shown to rider)"
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
                    <Shield size={10} /> Verify Rider
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
                <DollarSign size={10} /> Credit Rider
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
