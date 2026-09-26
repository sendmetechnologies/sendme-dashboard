"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  MapPin, Phone, MessageCircle, Mail, Copy, Check,
  Send, Bell, Filter, ArrowUpDown, Search, X, Loader2,
  CheckCircle2, Clock, Zap, ShieldCheck, ExternalLink,
  ChevronRight, Sparkles
} from "lucide-react"

export interface NearbyRider {
  id: string
  name: string
  phone: string | null
  email: string | null
  state: string | null
  avatarUrl: string | null
  vehicleType: string
  rating: string
  verificationStatus: string
  isOnline: boolean
  lastLocationAt: string | null
  lat: number | null
  lng: number | null
  distanceKm: number | null
  durationMin: number | null
  isCloseby: boolean
  isStateMatch: boolean
  area: string | null
}

export interface NearbyOrderInfo {
  id: string
  pickupAddress: string
  dropoffAddress?: string
  fare?: number | string
  vehicleType?: string
  pickupLat?: number | null
  pickupLng?: number | null
  detectedState?: string
}

export interface NearbySummary {
  total: number
  onlineCount: number
  offlineCount: number
  closebyCount: number
  withCoordsCount: number
  detectedState: string
}

interface Props {
  orderInfo: NearbyOrderInfo
  riders: NearbyRider[]
  summary: NearbySummary | null
  loading: boolean
  radius: number
  onRadiusChange: (radius: number) => void
  onClose: () => void
  onRefresh: () => void
}

export function NearbyRidersModal({
  orderInfo,
  riders,
  summary,
  loading,
  radius,
  onRadiusChange,
  onClose,
  onRefresh,
}: Props) {
  const router = useRouter()

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")
  const [proximityFilter, setProximityFilter] = useState<"all" | "closeby" | "radius" | "state">("all")
  const [sortBy, setSortBy] = useState<"distance" | "time" | "online" | "name">("distance")

  // Multi-selection of riders
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Copy feedback state tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // In-app alert modal state (instant in-modal sender)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState("📦 New Delivery Request Nearby!")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSending, setAlertSending] = useState(false)
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null)

  // Email modal state (instant in-modal sender)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState(
    `📦 New Delivery Order Available: #${orderInfo.id.slice(0, 8)}`
  )
  const [emailMessage, setEmailMessage] = useState("")
  const [emailSenderName, setEmailSenderName] = useState("SendMe Dispatch")
  const [emailSending, setEmailSending] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev))
    }, 2500)
  }

  // Combined Copy: Copy BOTH Phone & Email for a rider
  const handleCopyBoth = (r: NearbyRider) => {
    const parts: string[] = []
    if (r.phone) parts.push(`Phone: ${r.phone}`)
    if (r.email) parts.push(`Email: ${r.email}`)
    const combined = parts.length > 0 ? parts.join(" | ") : `${r.name}`
    handleCopy(combined, `both-${r.id}`)
  }

  // Filtered and sorted riders
  const filteredRiders = useMemo(() => {
    return riders
      .filter((r) => {
        // Status filter
        if (statusFilter === "online" && !r.isOnline) return false
        if (statusFilter === "offline" && r.isOnline) return false

        // Proximity filter
        if (proximityFilter === "closeby" && !r.isCloseby) return false
        if (proximityFilter === "radius" && (r.distanceKm == null || r.distanceKm > radius)) return false
        if (proximityFilter === "state" && !r.isStateMatch) return false

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesName = (r.name || "").toLowerCase().includes(q)
          const matchesPhone = (r.phone || "").toLowerCase().includes(q)
          const matchesEmail = (r.email || "").toLowerCase().includes(q)
          const matchesArea = (r.area || "").toLowerCase().includes(q)
          const matchesState = (r.state || "").toLowerCase().includes(q)
          if (!matchesName && !matchesPhone && !matchesEmail && !matchesArea && !matchesState) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "distance") {
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
          if (a.distanceKm != null) return -1
          if (b.distanceKm != null) return 1
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          return (a.name || "").localeCompare(b.name || "")
        }
        if (sortBy === "time") {
          if (a.durationMin != null && b.durationMin != null) return a.durationMin - b.durationMin
          if (a.durationMin != null) return -1
          if (b.durationMin != null) return 1
          return (a.name || "").localeCompare(b.name || "")
        }
        if (sortBy === "online") {
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
          return (a.name || "").localeCompare(b.name || "")
        }
        if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "")
        }
        return 0
      })
  }, [riders, statusFilter, proximityFilter, searchQuery, sortBy, radius])

  // Select all / deselect
  const isAllSelected =
    filteredRiders.length > 0 && filteredRiders.every((r) => selectedIds.has(r.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRiders.map((r) => r.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Target riders for actions: either selected ones or all filtered ones if none selected
  const activeTargetRiders = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredRiders.filter((r) => selectedIds.has(r.id))
    }
    return filteredRiders
  }, [selectedIds, filteredRiders])

  // Target valid emails
  const activeEmails = useMemo(() => {
    return activeTargetRiders
      .map((r) => r.email)
      .filter((e): e is string => Boolean(e && e.includes("@")))
  }, [activeTargetRiders])

  // Target valid phones
  const activePhones = useMemo(() => {
    return activeTargetRiders
      .map((r) => r.phone)
      .filter((p): p is string => Boolean(p))
  }, [activeTargetRiders])

  // Copy all emails
  const copyAllEmails = () => {
    if (activeEmails.length === 0) {
      alert("No email addresses found for the current selection.")
      return
    }
    handleCopy(activeEmails.join(", "), "all-emails")
  }

  // Copy all phone numbers
  const copyAllPhones = () => {
    if (activePhones.length === 0) {
      alert("No phone numbers found for the current selection.")
      return
    }
    handleCopy(activePhones.join(", "), "all-phones")
  }

  // Copy both phone and emails for ALL active riders
  const copyAllContacts = () => {
    const list = activeTargetRiders
      .map((r) => {
        const p = r.phone || ""
        const e = r.email || ""
        if (p && e) return `${r.name}: ${p}, ${e}`
        if (p) return `${r.name}: ${p}`
        if (e) return `${r.name}: ${e}`
        return ""
      })
      .filter(Boolean)

    if (list.length === 0) {
      alert("No contacts found for the current selection.")
      return
    }
    handleCopy(list.join("\n"), "all-contacts")
  }

  // ──────────────── NAVIGATE TO EMAIL CAMPAIGNS PAGE ────────────────
  const goToEmailCampaignsPage = (singleRider?: NearbyRider) => {
    const targetEmails = singleRider?.email ? [singleRider.email] : activeEmails
    if (targetEmails.length === 0) {
      alert("No valid email address found to create a campaign.")
      return
    }
    const campaignName = `Delivery Request #${orderInfo.id.slice(0, 8)} Dispatch`
    const defaultMsg = `Hello,\n\nA delivery order is ready for pickup in your area:\n• Order Reference: #${orderInfo.id.slice(0, 8)}\n• Pickup Location: ${orderInfo.pickupAddress || "Pickup"}\n• Dropoff: ${orderInfo.dropoffAddress || "Dropoff"}\n• Fare: ₦${Number(orderInfo.fare || 0).toLocaleString()}\n\nPlease open your SendMe Driver app immediately to accept or bid on this delivery.`

    const url = `/dashboard/email-campaigns?target=individuals&emails=${encodeURIComponent(
      targetEmails.join(", ")
    )}&name=${encodeURIComponent(campaignName)}&message=${encodeURIComponent(
      defaultMsg
    )}&senderName=${encodeURIComponent("SendMe Dispatch")}`

    window.open(url, "_blank")
  }

  // ──────────────── NAVIGATE TO NOTIFICATIONS PAGE ────────────────
  const goToNotificationsPage = (singleRider?: NearbyRider) => {
    const targetEmail = singleRider?.email || (activeEmails.length > 0 ? activeEmails.join(", ") : "")
    const notifTitle = `New Delivery Order Nearby (#${orderInfo.id.slice(0, 8)})`
    const notifBody = `Pickup: ${orderInfo.pickupAddress || "nearby"}. Earn ₦${Number(
      orderInfo.fare || 0
    ).toLocaleString()}. Open your SendMe Driver app now to view and bid!`

    const url = `/dashboard/notifications?targetType=email&targetValue=${encodeURIComponent(
      targetEmail
    )}&title=${encodeURIComponent(notifTitle)}&body=${encodeURIComponent(notifBody)}&type=ORDER`

    window.open(url, "_blank")
  }

  // Open Direct In-App Alert Modal (Instant)
  const openAlertModal = (singleRider?: NearbyRider) => {
    if (singleRider) {
      setSelectedIds(new Set([singleRider.id]))
    }
    const defaultMsg = `New delivery request available nearby!\nPickup: ${orderInfo.pickupAddress || "Pickup location"}\nDropoff: ${orderInfo.dropoffAddress || "Dropoff"}\nEst. Fare: ₦${Number(orderInfo.fare || 0).toLocaleString()}\n\nOpen your SendMe app now to accept or offer your price.`
    setAlertMessage(defaultMsg)
    setAlertSuccess(null)
    setAlertModalOpen(true)
  }

  // Open Direct Email Campaign Modal (Instant)
  const openEmailModal = (singleRider?: NearbyRider) => {
    if (singleRider) {
      setSelectedIds(new Set([singleRider.id]))
    }
    const defaultMsg = `Hello,\n\nA new delivery order is ready for pickup in your area:\n• Order Reference: #${orderInfo.id.slice(0, 8)}\n• Pickup Address: ${orderInfo.pickupAddress || "Pickup location"}\n• Dropoff Address: ${orderInfo.dropoffAddress || "Dropoff"}\n• Fare: ₦${Number(orderInfo.fare || 0).toLocaleString()}\n\nPlease open your SendMe Driver app immediately to accept or place a bid on this delivery.\n\nBest regards,\nSendMe Logistics Team`
    setEmailMessage(defaultMsg)
    setEmailSuccess(null)
    setEmailModalOpen(true)
  }

  // Send in-app notification directly
  const handleSendInApp = async () => {
    const targetIds = activeTargetRiders.map((r) => r.id)
    if (targetIds.length === 0) return

    setAlertSending(true)
    setAlertSuccess(null)
    try {
      const res = await fetch(`/api/dashboard/deliveries/${orderInfo.id}/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverIds: targetIds,
          title: alertTitle,
          message: alertMessage,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send notification")
      setAlertSuccess(`Successfully sent in-app alert to ${data.sentCount || targetIds.length} rider(s)!`)
      setTimeout(() => {
        setAlertModalOpen(false)
        setAlertSuccess(null)
      }, 2000)
    } catch (err: any) {
      alert("Error sending alert: " + err.message)
    } finally {
      setAlertSending(false)
    }
  }

  // Send Email campaign directly
  const handleSendEmailCampaign = async () => {
    if (activeEmails.length === 0) {
      alert("None of the selected riders have a valid email address.")
      return
    }

    setEmailSending(true)
    setEmailSuccess(null)
    try {
      const res = await fetch("/api/dashboard/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailSubject,
          message: emailMessage,
          senderName: emailSenderName,
          targetAudience: "individuals",
          emails: activeEmails.join(", "),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to start campaign")
      setEmailSuccess(`Campaign launched to ${activeEmails.length} rider(s) successfully!`)
      setTimeout(() => {
        setEmailModalOpen(false)
        setEmailSuccess(null)
      }, 2000)
    } catch (err: any) {
      alert("Error launching email campaign: " + err.message)
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-5xl max-h-[94vh] flex flex-col bg-white border border-border-default shadow-2xl rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ──────── TOP HEADER ──────── */}
        <div className="px-6 py-4 border-b border-border-light bg-gradient-to-r from-surface-secondary/70 via-white to-surface-secondary/40 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-sendme-50 text-sendme rounded-xl shadow-xs">
                <MapPin size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-text-primary">
                    Nearby & Area Riders
                  </h2>
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-0.5 rounded-md border border-border-default text-text-primary shadow-xs">
                    Order #{orderInfo.id.slice(0, 8)}
                  </span>
                  {orderInfo.detectedState && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      📍 {orderInfo.detectedState}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-text-muted flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text-primary">Pickup:</span>
              <span className="font-medium text-text-secondary" title={orderInfo.pickupAddress}>
                {orderInfo.pickupAddress || "—"}
              </span>
              {orderInfo.fare && (
                <>
                  <span>•</span>
                  <span className="font-extrabold text-sendme bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ₦{Number(orderInfo.fare).toLocaleString()}
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* ──────── PRIMARY STATUS & RANGE FILTERS (PROMINENT TABS) ──────── */}
        <div className="px-6 py-3 border-b border-border-light bg-white flex flex-col gap-3">
          {/* Row 1: Status Filter Tabs (Large, Unmissable) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-secondary rounded-xl border border-border-light">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-text-primary shadow-xs border border-border-default"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                All Riders ({riders.length})
              </button>

              <button
                onClick={() => setStatusFilter("online")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === "online"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Online Only ({summary?.onlineCount ?? riders.filter((r) => r.isOnline).length})</span>
              </button>

              <button
                onClick={() => setStatusFilter("offline")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === "offline"
                    ? "bg-gray-700 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Offline ({summary?.offlineCount ?? riders.filter((r) => !r.isOnline).length})</span>
              </button>
            </div>

            {/* Proximity / Distance Filters */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-secondary rounded-xl border border-border-light">
              <button
                onClick={() => setProximityFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  proximityFilter === "all"
                    ? "bg-white text-text-primary shadow-xs border border-border-default"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                All Distances
              </button>

              <button
                onClick={() => setProximityFilter("closeby")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  proximityFilter === "closeby"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                <Zap size={13} />
                <span>Closeby (&lt;15 km) ({summary?.closebyCount ?? riders.filter((r) => r.isCloseby).length})</span>
              </button>

              {orderInfo.detectedState && (
                <button
                  onClick={() => setProximityFilter("state")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    proximityFilter === "state"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <span>📍 In {orderInfo.detectedState}</span>
                </button>
              )}
            </div>

            {/* GPS Radius selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-muted font-medium text-[11px]">Radius:</span>
              {[15, 30, 50, 100].map((r) => (
                <button
                  key={r}
                  onClick={() => onRadiusChange(r)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    radius === r
                      ? "bg-sendme text-white shadow-xs"
                      : "bg-surface-secondary text-text-muted border border-border-default hover:text-text-primary"
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Search + Sorting */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search riders by name, phone, email, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-border-default bg-white focus:outline-none focus:ring-2 focus:ring-sendme/20 focus:border-sendme"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-primary"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-text-muted shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-border-default bg-white text-text-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sendme"
              >
                <option value="distance">Closest Distance (km)</option>
                <option value="time">Quickest ETA (mins)</option>
                <option value="online">Online Riders First</option>
                <option value="name">Rider Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ──────── BATCH ACTIONS TOOLBAR (EMAIL CAMPAIGN / IN-APP / COPY ALL) ──────── */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/60 border-b border-border-light flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-2 font-bold text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-border-default text-sendme focus:ring-sendme"
              />
              <span>
                {selectedIds.size > 0
                  ? `${selectedIds.size} Selected`
                  : `All Filtered (${filteredRiders.length})`}
              </span>
            </label>
            <span className="text-text-muted text-[11px] hidden md:inline">
              • Target specific riders or all matching
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action 1: Create Campaign on /dashboard/email-campaigns Page */}
            <button
              onClick={() => goToEmailCampaignsPage()}
              disabled={activeEmails.length === 0}
              className="px-3 py-1.5 bg-sendme text-white font-bold rounded-lg hover:bg-sendme-dark transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Open full campaign creation on /dashboard/email-campaigns page"
            >
              <Mail size={13} />
              <span>Email Campaign Page ({activeEmails.length})</span>
              <ExternalLink size={12} className="opacity-80" />
            </button>

            {/* Primary Action 2: Send In-App Notification on /dashboard/notifications Page */}
            <button
              onClick={() => goToNotificationsPage()}
              disabled={activeTargetRiders.length === 0}
              className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Open announcement creation on /dashboard/notifications page"
            >
              <Bell size={13} />
              <span>Notifications Page ({activeTargetRiders.length})</span>
              <ExternalLink size={12} className="opacity-80" />
            </button>

            {/* In-Modal Direct Alert */}
            <button
              onClick={() => openAlertModal()}
              disabled={activeTargetRiders.length === 0}
              className="px-2.5 py-1.5 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
              title="Send direct in-app message right now without leaving"
            >
              <Send size={12} />
              <span>Quick Alert</span>
            </button>

            {/* Copy All Contacts (Phone + Email) */}
            <button
              onClick={copyAllContacts}
              className="px-2.5 py-1.5 bg-white border border-border-default text-text-primary font-semibold rounded-lg hover:bg-surface-hover transition-all flex items-center gap-1"
              title="Copy both phone numbers and emails for all active riders"
            >
              {copiedKey === "all-contacts" ? (
                <>
                  <Check size={13} className="text-sendme" />
                  <span className="text-sendme font-bold">Copied Contacts!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Contacts</span>
                </>
              )}
            </button>

            {/* Copy Emails */}
            <button
              onClick={copyAllEmails}
              className="px-2 py-1.5 bg-white border border-border-default text-text-primary font-medium rounded-lg hover:bg-surface-hover transition-all flex items-center gap-1"
              title="Copy all filtered emails"
            >
              {copiedKey === "all-emails" ? (
                <span className="text-sendme font-bold text-[11px]">Copied!</span>
              ) : (
                <span className="text-[11px]">Emails</span>
              )}
            </button>

            {/* Copy Phones */}
            <button
              onClick={copyAllPhones}
              className="px-2 py-1.5 bg-white border border-border-default text-text-primary font-medium rounded-lg hover:bg-surface-hover transition-all flex items-center gap-1"
              title="Copy all filtered phones"
            >
              {copiedKey === "all-phones" ? (
                <span className="text-sendme font-bold text-[11px]">Copied!</span>
              ) : (
                <span className="text-[11px]">Phones</span>
              )}
            </button>
          </div>
        </div>

        {/* ──────── RIDER LIST ──────── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 min-h-[320px] bg-surface-secondary/20">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-sendme" />
              <p className="text-sm font-semibold text-text-primary">
                Scanning riders near pickup address and matching state...
              </p>
              <p className="text-xs text-text-muted">Fetching live coordinates, status, and contacts.</p>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-dashed border-border-default p-8">
              <div className="w-14 h-14 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-text-muted">
                <Search size={24} />
              </div>
              <p className="text-sm font-bold text-text-primary">No riders match your active filters</p>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Currently showing 0 riders. Click &quot;All Riders&quot; or &quot;All Distances&quot; above to view all registered riders in this area.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("all")
                  setProximityFilter("all")
                  setSearchQuery("")
                }}
                className="px-4 py-2 text-xs font-bold bg-sendme text-white rounded-xl shadow-xs hover:bg-sendme-dark transition-all inline-block"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredRiders.map((r) => {
              const isSelected = selectedIds.has(r.id)
              const cleanPhone = (r.phone || "").replace(/[^0-9+]/g, "")
              const waPhone = cleanPhone.startsWith("0")
                ? "234" + cleanPhone.slice(1)
                : cleanPhone.replace("+", "")

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected
                      ? "border-sendme bg-sendme-50/20 shadow-xs ring-1 ring-sendme/20"
                      : "border-border-default/80 hover:border-sendme/40 bg-white shadow-xs"
                  }`}
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(r.id)}
                      className="mt-1 sm:mt-0 w-4 h-4 rounded border-border-default text-sendme focus:ring-sendme shrink-0"
                    />

                    {/* Avatar with Live Status indicator */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sendme-100 to-emerald-100 flex items-center justify-center text-sendme font-extrabold text-sm border border-sendme/20">
                        {(r.name || "R")[0].toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          r.isOnline ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-gray-400"
                        }`}
                        title={r.isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    {/* Rider info */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-text-primary truncate">
                          {r.name}
                        </span>

                        {r.isOnline ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Online
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Offline
                          </span>
                        )}

                        {r.verificationStatus === "verified" ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck size={11} /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            {r.verificationStatus}
                          </span>
                        )}

                        <span className="text-[11px] text-text-muted">
                          • {r.vehicleType}
                        </span>
                        <span className="text-[11px] text-amber-600 font-bold">
                          ★ {r.rating}
                        </span>
                      </div>

                      {/* Location & Proximity Indicators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {r.distanceKm != null ? (
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                              r.isCloseby
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            <Zap size={12} className={r.isCloseby ? "text-emerald-700" : "text-blue-700"} />
                            <span>{r.distanceKm.toFixed(1)} km away</span>
                            {r.durationMin != null && (
                              <span className="font-medium opacity-85">· ~{r.durationMin} mins</span>
                            )}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-medium">
                            📍 {r.state ? `Registered in ${r.state}` : "Nigeria"}
                          </span>
                        )}

                        {r.area && (
                          <span className="text-text-muted text-[11px] truncate max-w-[220px]" title={r.area}>
                            📌 {r.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Contact & Dispatch Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border-light">
                    {/* 1. Primary "Copy Phone & Email" Button */}
                    <button
                      onClick={() => handleCopyBoth(r)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border border-gray-300 shadow-2xs"
                      title="Copy both phone number and email address to clipboard"
                    >
                      {copiedKey === `both-${r.id}` ? (
                        <>
                          <Check size={14} className="text-sendme" />
                          <span className="text-sendme font-extrabold">Copied Phone & Email!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-gray-600" />
                          <span>Copy Phone & Email</span>
                        </>
                      )}
                    </button>

                    {/* 2. Direct Call */}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                        title={`Call ${cleanPhone}`}
                      >
                        <Phone size={13} />
                        <span className="font-mono text-[11px]">{r.phone}</span>
                      </a>
                    )}

                    {/* 3. Direct WhatsApp */}
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                          `Hello ${r.name}, there is a SendMe delivery order #${orderInfo.id.slice(0, 8)} available for pickup at ${orderInfo.pickupAddress || "your area"}. Are you available to deliver?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                        title="Chat on WhatsApp with order details"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* 4. Single Rider Email Campaign Page */}
                    {r.email && (
                      <button
                        onClick={() => goToEmailCampaignsPage(r)}
                        className="px-2.5 py-1.5 bg-sendme-50 hover:bg-sendme-100 text-sendme border border-sendme-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                        title="Create an email campaign targeting this rider on /dashboard/email-campaigns"
                      >
                        <Mail size={13} />
                        <span>Email Page</span>
                        <ExternalLink size={11} className="opacity-70" />
                      </button>
                    )}

                    {/* 5. Single Rider In-App Notification Page */}
                    <button
                      onClick={() => goToNotificationsPage(r)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                      title="Send in-app notification to this rider on /dashboard/notifications"
                    >
                      <Bell size={13} />
                      <span>In-App Page</span>
                      <ExternalLink size={11} className="opacity-70" />
                    </button>

                    {/* 6. Quick in-modal alert */}
                    <button
                      onClick={() => openAlertModal(r)}
                      className="p-2 text-text-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-border-default"
                      title="Quick Alert in-modal"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ──────── FOOTER ──────── */}
        <div className="px-6 py-3.5 border-t border-border-light bg-surface-secondary/50 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
          <div>
            Showing <span className="font-extrabold text-text-primary">{filteredRiders.length}</span> of{" "}
            <span className="font-extrabold text-text-primary">{riders.length}</span> riders in location
            {orderInfo.detectedState && ` (Region: ${orderInfo.detectedState})`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-border-default rounded-xl font-bold text-text-primary hover:bg-surface-hover transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Card>

      {/* ──────────────── IN-APP ALERT MODAL ──────────────── */}
      {alertModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAlertModalOpen(false)}
        >
          <Card
            className="w-full max-w-lg p-6 bg-white border border-border-default shadow-2xl rounded-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-amber-600" />
                <h3 className="text-sm font-bold text-text-primary">Send In-App Dispatch Alert</h3>
              </div>
              <button onClick={() => setAlertModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Sending to <span className="font-bold text-text-primary">{activeTargetRiders.length}</span> rider(s). This writes a high-priority dispatch message into their SendMe Driver app inbox.
            </p>

            {alertSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{alertSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-default focus:ring-2 focus:ring-sendme/20 focus:border-sendme focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  Alert Message Body
                </label>
                <textarea
                  rows={4}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-default focus:ring-2 focus:ring-sendme/20 focus:border-sendme focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setAlertModalOpen(false)
                  goToNotificationsPage()
                }}
                className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Use Notifications Page instead</span>
                <ExternalLink size={12} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAlertModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInApp}
                  disabled={alertSending || !alertMessage.trim()}
                  className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {alertSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Send In-App Alert</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ──────────────── EMAIL CAMPAIGN MODAL ──────────────── */}
      {emailModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEmailModalOpen(false)}
        >
          <Card
            className="w-full max-w-lg p-6 bg-white border border-border-default shadow-2xl rounded-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-sendme" />
                <h3 className="text-sm font-bold text-text-primary">Launch Targeted Email Campaign</h3>
              </div>
              <button onClick={() => setEmailModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-sendme-50 rounded-xl text-xs text-text-primary flex items-center justify-between border border-sendme-100">
              <div>
                Recipients: <span className="font-bold">{activeEmails.length} riders</span> with valid emails.
              </div>
              <span className="text-[10px] font-bold text-sendme uppercase">SendByte API</span>
            </div>

            {emailSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={emailSenderName}
                  onChange={(e) => setEmailSenderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-default focus:ring-2 focus:ring-sendme/20 focus:border-sendme focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  Email Subject / Campaign Title
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-default focus:ring-2 focus:ring-sendme/20 focus:border-sendme focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  Email Message Body
                </label>
                <textarea
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-border-default focus:ring-2 focus:ring-sendme/20 focus:border-sendme focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setEmailModalOpen(false)
                  goToEmailCampaignsPage()
                }}
                className="text-xs text-sendme hover:underline font-bold flex items-center gap-1"
              >
                <span>Open in Email Campaigns Hub</span>
                <ExternalLink size={12} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailCampaign}
                  disabled={emailSending || !emailSubject.trim() || !emailMessage.trim()}
                  className="px-4 py-2 bg-sendme text-white font-bold text-xs rounded-xl hover:bg-sendme-dark transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {emailSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Launch Campaign</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
