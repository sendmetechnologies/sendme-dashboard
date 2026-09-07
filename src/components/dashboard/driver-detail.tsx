"use client"

import { toast } from "sonner"
import { useState, useEffect } from "react"
import { formatCardValue } from "@/lib/format"
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal"
import {
  X, Phone, MessageCircle, Star, CheckCircle, Clock, Truck,
  Eye, Loader2, AlertTriangle, Trash2, Ban, Shield, DollarSign, CreditCard, FileText
} from "lucide-react"

interface DriverDetailProps {
  driverId: string
  onClose: () => void
  /** When true, sensitive KYC data (docs, ID numbers, images) is hidden behind a lock. */
  kycLocked?: boolean
  /** Call to open the OTP unlock modal when kycLocked. */
  onRequestUnlock?: () => void
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
    submissionStatus?: "incomplete" | "submitted"
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
    make: string
    model: string
    plate: string
    color: string
    license: string
  } | null
  idDetails: Record<string, unknown> | null
  vehicleInfo: Record<string, unknown> | null
  storageDocs?: {
    folder: string
    url: string
    name: string
  }[]
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

const tabs = ["Overview", "Documents", "Vehicle", "Trips", "Payouts", "Activity"]

function isDocUrl(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//i.test(v)
}

const docLabels: Record<string, string> = {
  document_url: "ID Document",
  license_url: "Driver's License",
  mot_url: "MOT Certificate",
  papers_url: "Vehicle Papers",
  insurance_url: "Insurance",
  roadworthiness_url: "Roadworthiness",
  passport_photo_url: "Passport Photo",
  tax_certificate_url: "Tax Certificate",
  business_registration_doc_url: "Business Registration",
}

const docFieldLabels: Record<string, string> = {
  type: "ID Type",
  number: "ID Number",
  id_type: "ID Type",
  id_number: "ID Number",
}

function DocList({ docs, onPreview }: { docs: Record<string, unknown>; onPreview: (url: string, label: string) => void }) {
  const entries = Object.entries(docs).filter(([k, v]) => isDocUrl(v) && /(?:_url|_photo|_image|Photo|Image|Url)$/.test(k))
  if (entries.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-2">
      {entries.map(([k, v]) => {
        const label = docLabels[k] || k.replace(/_/g, " ")
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPreview(v as string, label)}
            className="flex items-center gap-2 p-2 border border-border-default rounded-lg text-left hover:bg-surface-hover hover:border-sendme/40 transition-colors w-full group"
          >
            <FileText size={14} className="text-text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-text-primary capitalize truncate">{label}</p>
            </div>
            <span className="text-[9px] text-sendme font-semibold group-hover:underline shrink-0 flex items-center gap-1">
              <Eye size={10} /> View
            </span>
          </button>
        )
      })}
    </div>
  )
}

function docEntries(docs: Record<string, unknown>) {
  return Object.entries(docs).filter(([k, v]) => isDocUrl(v) && /(?:_url|_photo|_image|Photo|Image|Url)$/.test(k))
}

function isImageFile(url: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(url.split("?")[0])
}

function DocumentCard({ url, label, onPreview }: { url: string; label: string; onPreview: (url: string, label: string) => void }) {
  const isPdf = /\.pdf(\?.*)?$/i.test(url.split("?")[0])
  const isKnownImage = isImageFile(url)
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = isKnownImage && !imgFailed

  return (
    <button
      type="button"
      onClick={() => onPreview(url, label)}
      className="w-full p-2 border border-border-default rounded-lg text-left hover:bg-surface-hover hover:border-sendme/40 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-text-primary capitalize truncate">{label}</span>
        <span className="text-[9px] text-sendme font-semibold group-hover:underline shrink-0 flex items-center gap-1">
          <Eye size={10} /> Preview
        </span>
      </div>
      {showImage ? (
        <div className="relative w-full h-28 bg-surface-secondary rounded overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-28 bg-surface-secondary rounded overflow-hidden">
          <FileText size={22} className="text-text-muted/50 mb-1" />
          <span className="text-[9px] font-medium text-text-muted">
            {isPdf ? "PDF document" : imgFailed ? "Preview unavailable — click to view" : "Document file"}
          </span>
        </div>
      )}
    </button>
  )
}

function KycLockedCard({ onRequestUnlock, title = "Sensitive KYC data locked" }: { onRequestUnlock?: () => void; title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-6 border border-dashed border-border-default rounded-xl bg-surface-secondary/50">
      <div className="w-10 h-10 bg-warning-light rounded-full flex items-center justify-center mb-3">
        <Shield size={18} className="text-warning" />
      </div>
      <p className="text-xs font-semibold text-text-primary mb-1">{title}</p>
      <p className="text-[10px] text-text-muted mb-3 max-w-[220px]">
        Documents, ID details, and images are hidden for security. Verify with the OTP sent to your email to view them.
      </p>
      <button
        type="button"
        onClick={onRequestUnlock}
        className="flex items-center gap-1.5 px-3 py-2 bg-sendme text-white rounded-lg text-[11px] font-semibold hover:bg-sendme-dark transition-colors"
      >
        <Shield size={12} /> Enter OTP to view
      </button>
    </div>
  )
}

const storageFolderLabels: Record<string, string> = {
  id_documents: "ID Document (stored)",
  licenses: "Driver's License (stored)",
  vehicle_papers: "Vehicle Papers (stored)",
  mot: "MOT Certificate (stored)",
}

function DocumentsTab({ data, onPreview, kycLocked, onRequestUnlock }: {
  data: DriverData
  onPreview: (url: string, label: string) => void
  kycLocked?: boolean
  onRequestUnlock?: () => void
}) {
  const idDocs = docEntries(data.idDetails || {})
  const vehicleDocs = docEntries(data.vehicleInfo || {})
  const sections = [
    { title: "ID Documents", docs: idDocs },
    { title: "Vehicle Documents", docs: vehicleDocs },
  ].filter((s) => s.docs.length > 0)
  const storageDocs = data.storageDocs || []
  const isIncomplete = data.driver.submissionStatus === "incomplete"

  if (kycLocked) {
    return <KycLockedCard onRequestUnlock={onRequestUnlock} />
  }

  if (sections.length === 0 && storageDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-6">
        <FileText size={24} className="text-text-muted/40 mb-2" />
        <p className="text-xs text-text-muted">
          {isIncomplete
            ? "Registration incomplete — this rider hasn't submitted their documents yet"
            : "No documents uploaded by this rider yet"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-primary">{section.title}</h4>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-muted">{section.docs.length}</span>
          </div>
          <div className="space-y-2">
            {section.docs.map(([k, v]) => (
              <DocumentCard key={k} url={v as string} label={docLabels[k] || k.replace(/_/g, " ")} onPreview={onPreview} />
            ))}
          </div>
        </div>
      ))}

      {storageDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-primary">Stored Uploads</h4>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-muted">{storageDocs.length}</span>
          </div>
          <div className="space-y-2">
            {storageDocs.map((d) => (
              <DocumentCard
                key={d.url}
                url={d.url}
                label={storageFolderLabels[d.folder] || `${d.folder.replace(/_/g, " ")} (stored)`}
                onPreview={onPreview}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ data, onPreview, kycLocked, onRequestUnlock, onEditKyc }: {
  data: DriverData
  onPreview: (url: string, label: string) => void
  kycLocked?: boolean
  onRequestUnlock?: () => void
  onEditKyc?: () => void
}) {
  const { driver, stats, wallet } = data
  const hasIdData = data.idDetails && Object.keys(data.idDetails).filter((k) => !isDocUrl(data.idDetails?.[k])).length > 0
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

      {/* Sensitive KYC sections (docs / ID numbers) */}
      {kycLocked ? (
        <KycLockedCard onRequestUnlock={onRequestUnlock} />
      ) : (
        <>
          {/* ID Details + KYC entry */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-text-primary">ID Details</h4>
              <button
                type="button"
                onClick={onEditKyc}
                className="flex items-center gap-1 text-[9px] font-semibold text-sendme hover:underline"
              >
                <FileText size={10} /> {hasIdData ? "Edit KYC" : "Add KYC"}
              </button>
            </div>
            {hasIdData ? (
              <>
                <div className="space-y-1.5">
                  {Object.entries(data.idDetails as Record<string, unknown>)
                    .filter(([k, v]) => !isDocUrl(v) && k !== "document_url")
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1 border-b border-border-light last:border-0">
                        <p className="text-[11px] text-text-muted">{docFieldLabels[k] || k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}</p>
                        <p className="text-[11px] font-medium text-text-primary">{String(v) || "—"}</p>
                      </div>
                    ))}
                </div>
                {docEntries(data.idDetails as Record<string, unknown>).length > 0 && (
                  <div className="mt-2">
                    <DocList docs={data.idDetails as Record<string, unknown>} onPreview={onPreview} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between py-3 px-3 bg-surface-secondary rounded-lg">
                <p className="text-[10px] text-text-muted">No KYC details added yet</p>
                <button
                  type="button"
                  onClick={onEditKyc}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-sendme-50 text-sendme rounded-lg text-[10px] font-semibold hover:bg-sendme/10 transition-colors"
                >
                  <FileText size={11} /> Add KYC details
                </button>
              </div>
            )}
          </div>

          {/* Vehicle Documents */}
          {data.vehicleInfo && docEntries(data.vehicleInfo).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Vehicle Documents</h4>
              <DocList docs={data.vehicleInfo} onPreview={onPreview} />
            </div>
          )}
        </>
      )}

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
        <div className="bg-surface-secondary rounded-lg p-2.5 text-center min-w-0 overflow-hidden">
          <p className="text-[9px] text-text-muted truncate">Total Earnings</p>
          <p className="text-sm font-bold text-text-primary mt-0.5 truncate" title={stats.totalEarningsFormatted}>{formatCardValue(stats.totalEarningsFormatted)}</p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-2.5 text-center min-w-0 overflow-hidden">
          <p className="text-[9px] text-text-muted truncate">Wallet Balance</p>
          <p className="text-sm font-bold text-sendme mt-0.5 truncate" title={wallet?.balanceFormatted || "₦0"}>{formatCardValue(wallet?.balanceFormatted || "₦0")}</p>
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
              ) : driver.statusRaw === "suspended" ? (
                <>
                  <Ban size={12} className="text-warning" />
                  <span className="text-[11px] font-semibold text-warning">Suspended</span>
                </>
              ) : driver.statusRaw === "deleted" ? (
                <>
                  <Ban size={12} className="text-text-muted" />
                  <span className="text-[11px] font-semibold text-text-muted">Deactivated</span>
                </>
              ) : driver.statusRaw === "rejected" ? (
                <>
                  <AlertTriangle size={12} className="text-danger" />
                  <span className="text-[11px] font-semibold text-danger">Rejected</span>
                </>
              ) : driver.submissionStatus === "incomplete" ? (
                <>
                  <AlertTriangle size={12} className="text-warning" />
                  <span className="text-[11px] font-semibold text-warning">Incomplete Registration</span>
                </>
              ) : (
                <>
                  <Clock size={12} className="text-warning" />
                  <span className="text-[11px] font-semibold text-warning">Pending Review</span>
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
              <p className="text-[9px] text-danger font-semibold mb-0.5">
                {driver.statusRaw === "suspended" ? "Suspension Reason" : "Rejection Reason"}
              </p>
              <p className="text-[11px] text-danger">{driver.reviewReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VehicleTab({ data, kycLocked, onRequestUnlock }: {
  data: DriverData
  kycLocked?: boolean
  onRequestUnlock?: () => void
}) {
  const v = data.vehicle
  if (kycLocked) {
    return <KycLockedCard onRequestUnlock={onRequestUnlock} title="Vehicle details locked" />
  }
  if (!v) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-text-muted">No vehicle information available</p>
      </div>
    )
  }

  const vehicleInfo = [
    ["Vehicle Type", v.type],
    ["Make", v.make],
    ["Model", v.model],
    ["Plate Number", v.plate],
    ["Color", v.color],
    ["Load Capacity", v.capacity],
    ["License Number", v.license],
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
            <p className="text-[11px] font-bold text-sendme truncate" title={data.wallet.balanceFormatted}>{formatCardValue(data.wallet.balanceFormatted)}</p>
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

export function DriverDetail({ driverId, onClose, kycLocked = false, onRequestUnlock }: DriverDetailProps) {
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
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null)
  const [showKycModal, setShowKycModal] = useState(false)
  const [kycSaving, setKycSaving] = useState(false)

  const handlePreview = (url: string, label: string) => setPreviewDoc({ url, label })

  const fetchData = () => {
    if (!driverId) return
    setLoading(true)
    fetch(`/api/dashboard/drivers/${driverId}`)
      .then((r) => r.json())
      .then((result) => {
        // Only accept payloads that actually contain a driver; error objects
        // (e.g. { error: "Driver not found" }) are left as null so the
        // "Failed to load" state renders instead of crashing on .driver.x
        if (result?.driver) setData(result)
        else setData(null)
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
      const res = await fetch(`/api/dashboard/drivers/${driverId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "credit", amount: amt, note: creditNote }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Rider wallet credited successfully")
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
      const res = await fetch(`/api/dashboard/drivers/${driverId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Rider application rejected")
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

  const handleProcessPayout = async (payoutId: string, action: string) => {
    await handleAction("process_payout", { payout_id: payoutId, payout_action: action })
  }

  const isVerified = data?.driver?.statusRaw === "verified"

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
            {activeTab === "Overview" && (
              <OverviewTab
                data={data}
                onPreview={handlePreview}
                kycLocked={kycLocked}
                onRequestUnlock={onRequestUnlock}
                onEditKyc={() => setShowKycModal(true)}
              />
            )}
            {activeTab === "Documents" && <DocumentsTab data={data} onPreview={handlePreview} kycLocked={kycLocked} onRequestUnlock={onRequestUnlock} />}
            {activeTab === "Vehicle" && <VehicleTab data={data} kycLocked={kycLocked} onRequestUnlock={onRequestUnlock} />}
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal url={previewDoc.url} label={previewDoc.label} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Add/Edit KYC Modal */}
      {showKycModal && (
        <KycFormModal
          driverId={driverId}
          existingIdDetails={data?.idDetails || null}
          onClose={() => setShowKycModal(false)}
          onSaved={() => {
            setShowKycModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

const ID_TYPES = ["NIN", "Voter's Card", "Driver's License", "International Passport", "Other"]

function KycFormModal({
  driverId,
  existingIdDetails,
  onClose,
  onSaved,
}: {
  driverId: string
  existingIdDetails: Record<string, unknown> | null
  onClose: () => void
  onSaved: () => void
}) {
  const [idType, setIdType] = useState<string>(() => {
    const raw = existingIdDetails?.type || existingIdDetails?.id_type
    return typeof raw === "string" && ID_TYPES.includes(raw) ? raw : ""
  })
  const [idNumber, setIdNumber] = useState(() => {
    const raw = existingIdDetails?.number ?? existingIdDetails?.id_number
    return typeof raw === "string" ? raw : ""
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!idType) return toast.error("Select an ID type")
    if (!idNumber.trim()) return toast.error("Enter the ID number")
    setSaving(true)
    try {
      const res = await fetch(`/api/dashboard/drivers/${driverId}/kyc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idType, idNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save KYC details")
        return
      }
      toast.success("KYC details saved")
      onSaved()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
          <h3 className="text-sm font-semibold text-text-primary">Add / Edit KYC Details</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-text-muted mb-1">ID Type</label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full text-xs text-text-primary bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
            >
              <option value="">Select ID type...</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-text-muted mb-1">ID Number</label>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. 12345678901"
              className="w-full text-xs text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-sendme text-white rounded-lg text-[11px] font-semibold hover:bg-sendme-dark transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? "Saving..." : "Save KYC"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
