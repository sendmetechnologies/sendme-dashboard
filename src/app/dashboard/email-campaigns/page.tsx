"use client"

import { useState, useEffect, useCallback, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  Mail, Send, X, Loader2, Users, CheckCircle, AlertTriangle,
  ChevronRight, Megaphone, Eye, Ban, Clock, Layers,
  CheckCircle2, Play, RotateCcw,
  Bold, Italic, Heading1, Heading2, List, ListOrdered,
  Sparkles, LayoutTemplate, Smartphone, Monitor, AlertCircle, Gift,
  ExternalLink, ChevronDown, ChevronUp, Edit3
} from "lucide-react"
import {
  buildCampaignEmailHtml,
  formatMessageToHtml,
  SENDME_BANNER_PARCEL_ILLUS,
  SENDME_BANNER_EARNINGS_ILLUS
} from "@/lib/sendbyte"

interface Campaign {
  id: string
  name: string
  subject: string
  sender_name: string
  target_audience: string
  sub_audience: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  delivered_count: number
  bounced_count: number
  rejected_count: number
  opened_count: number
  created_at: string
}

interface BatchItem {
  batchNumber: number
  batchIndex: number
  count: number
  status: "queued" | "sending" | "completed" | "failed"
  sent: number
  failed: number
  error?: string
}

interface Recipient {
  id: string
  email: string
  name: string
  status: string
  error: string | null
  created_at: string
}

interface AudienceData {
  [target: string]: { [sub: string]: number }
}

const TARGET_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "marketers", label: "Marketers" },
  { value: "senders", label: "Senders" },
  { value: "riders", label: "Riders" },
  { value: "organizations", label: "Organizations" },
  { value: "individuals", label: "Individuals" },
]

const SUB_LABELS: Record<string, string> = {
  all: "All",
  active: "Active",
  suspended: "Suspended",
  verified: "Verified",
  under_review: "Under Review",
  incomplete_documents: "Incomplete Documents",
  rejected: "Rejected",
  unverified: "Unverified",
  approved: "Approved",
  pending: "Pending",
}

const SUB_OPTIONS: Record<string, string[]> = {
  all: ["all"],
  senders: ["all", "active", "suspended"],
  riders: ["all", "verified", "under_review", "incomplete_documents", "rejected", "suspended"],
  organizations: ["all", "verified", "unverified", "rejected", "suspended"],
  marketers: ["all", "approved", "pending", "rejected", "suspended"],
  individuals: ["all"],
}

const recipientStatusColor: Record<string, string> = {
  sent: "bg-blue-50 text-blue-600",
  delivered: "bg-green-50 text-green-600",
  bounced: "bg-orange-50 text-orange-600",
  rejected: "bg-red-50 text-red-500",
  failed: "bg-red-50 text-red-500",
  queued: "bg-gray-100 text-gray-500",
}

function EmailCampaignsContent() {
  const searchParams = useSearchParams()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [audiences, setAudiences] = useState<AudienceData>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [detail, setDetail] = useState<{ campaign: Campaign; recipients: Recipient[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  // Batch runner states (100 emails per batch)
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [batches, setBatches] = useState<BatchItem[]>([])
  const [isDispatching, setIsDispatching] = useState(false)
  const [dispatchError, setDispatchError] = useState("")
  const [dispatchComplete, setDispatchComplete] = useState(false)
  const [resumingBatch, setResumingBatch] = useState(false)

  const [formName, setFormName] = useState("")
  const [formSenderName, setFormSenderName] = useState("SendMe Operations")
  const [formMessage, setFormMessage] = useState("")
  const [formTarget, setFormTarget] = useState("all")
  const [formSub, setFormSub] = useState("all")
  const [formEmails, setFormEmails] = useState("")

  // Modern Email Studio & Composer states
  const [editorTab, setEditorTab] = useState<"compose" | "preview" | "templates">("compose")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [bannerBadge, setBannerBadge] = useState("SENDME DISPATCH")
  const [bannerTitle, setBannerTitle] = useState("")
  const [bannerSubtitle, setBannerSubtitle] = useState("")
  const [bannerImage, setBannerImage] = useState(SENDME_BANNER_PARCEL_ILLUS)
  const [ctaText, setCtaText] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [showBannerConfig, setShowBannerConfig] = useState(false)
  const [aiFormattedNotice, setAiFormattedNotice] = useState(false)
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null)

  const PRESET_TEMPLATES = [
    {
      id: "driver_incentive",
      title: "Driver 100% Earnings Promo",
      badgeText: "SPECIAL REWARD",
      badgeColor: "bg-emerald-100 text-emerald-800",
      desc: "Announce zero company commission and 100% fare retention for riders.",
      subject: "Keep 100% of Your Delivery Earnings on SendMe",
      badge: "SPECIAL REWARD",
      subtitle: "Zero-commission guarantee across Abuja & Lagos",
      image: SENDME_BANNER_EARNINGS_ILLUS,
      ctaText: "Go Online & Accept Bids",
      ctaUrl: "https://senndme.com",
      target: "riders",
      message: `Hi Partner,

We are excited to roll out a major update for all active okada riders on SendMe.

### 100% of Every Fare Goes to You
Starting immediately, SendMe is operating with **zero company commission**. When a customer accepts your bid, every single naira belongs to you.

:::reward
**Zero Commission Guarantee:** No platform cuts. Senders pay your agreed bid directly into your wallet.
:::

### Rider Benefits
- **Live Bidding Radar:** You set your own prices based on distance, traffic, and cargo.
- **Instant Bank Cashouts:** Withdraw delivery earnings directly to any Nigerian bank.
- **PIN Verification Protection:** Handover is only complete when the recipient provides the correct 4-digit code.

:::warning
**Important Notice:** Ensure your driver documents are fully verified to maintain priority dispatch status.
:::

[button: Go Online & Accept Bids -> https://senndme.com]`,
    },
    {
      id: "order_delivered",
      title: "Order Delivered / Handover Receipt",
      badgeText: "DELIVERY RECEIPT",
      badgeColor: "bg-blue-100 text-blue-800",
      desc: "Delivery completed confirmation with pickup/dropoff box and 4-digit PIN confirmation.",
      subject: "Delivered: Package Handover Confirmed (Order #SD-88219)",
      badge: "DELIVERED",
      subtitle: "Handover verified with PIN code.",
      image: SENDME_BANNER_PARCEL_ILLUS,
      ctaText: "View Trip Details",
      ctaUrl: "https://senndme.com/track",
      target: "senders",
      message: `Hi Usman,

Your package has been successfully delivered by rider **Musa Ibrahim**. Handover was confirmed with your secure 4-digit verification PIN.

:::box
**Delivery Summary:**
- **Pickup Address:** Plot 14 Ahmadu Bello Way, Area 11, Garki, Abuja
- **Dropoff Address:** 22 Aminu Kano Crescent, Wuse 2, Abuja
- **Package:** Document Envelope & Electronics
- **Delivered By:** Musa Ibrahim • ABJ-492-KW (Motorcycle)
- **Total Paid:** **₦2,500**
:::

:::reward
**🎉 2% Cashback Earned:** ₦50 has been credited to your SendMe Wallet!
:::

[button: View Delivery Summary & Receipt -> https://senndme.com/track]`,
    },
    {
      id: "sender_cashback",
      title: "Sender 2% Cashback Promo",
      badgeText: "GROWTH PROMO",
      badgeColor: "bg-purple-100 text-purple-800",
      desc: "Incentivize repeat deliveries with wallet cashback on every trip.",
      subject: "Get 2% Cashback on Every Completed Delivery with SendMe",
      badge: "SENDER REWARD",
      subtitle: "Earn cashback credited straight to your wallet on every trip.",
      image: SENDME_BANNER_PARCEL_ILLUS,
      ctaText: "Send a Package Now",
      ctaUrl: "https://senndme.com",
      target: "senders",
      message: `Hello Valued Customer,

Moving packages across town just got even more rewarding.

### Introducing SendMe Delivery Cashback
Every time your package is delivered and confirmed with your 4-digit PIN, you automatically receive **2% cashback** credited instantly into your SendMe Wallet.

:::box
**How It Works:**
1. Create a delivery order and receive bids from nearby verified riders.
2. Accept the best counter-offer and track your rider in real time.
3. Hand over your 4-digit PIN upon delivery — your 2% cashback is credited instantly!
:::

- Use your wallet balance to pay for future deliveries
- No minimum order limit
- Real-time GPS tracking on every trip

[button: Send a Package Now -> https://senndme.com]`,
    },
    {
      id: "kyc_verification",
      title: "Account KYC & Verification Notice",
      badgeText: "SECURITY NOTICE",
      badgeColor: "bg-amber-100 text-amber-800",
      desc: "Remind riders or organizations to upload pending documents.",
      subject: "Action Required: Complete Your Account Verification",
      badge: "IMPORTANT NOTICE",
      subtitle: "Submit your pending credentials to start taking deliveries.",
      image: SENDME_BANNER_EARNINGS_ILLUS,
      ctaText: "Upload Verification Documents",
      ctaUrl: "https://senndme.com",
      target: "riders",
      message: `Hello Partner,

We noticed that your SendMe account verification is incomplete. To start receiving orders and earning with zero commission, please update your documents.

### Required Documents:
- Clear photo of valid Government ID (NIN Slip, Driver's License, or Voter's Card)
- Vehicle registration document
- Clear passport photograph

:::warning
**Account Notice:** Unverified accounts cannot go online or accept bids. Complete verification to activate dispatch alerts.
:::

[button: Upload Verification Documents -> https://senndme.com]`,
    },
  ]

  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    if (!editorTextareaRef.current) return
    const textarea = editorTextareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`

    const newVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end)
    setFormMessage(newVal)

    setTimeout(() => {
      textarea.focus()
      const newCursor = start + prefix.length + (selected ? selected.length : placeholder.length)
      textarea.setSelectionRange(newCursor, newCursor)
    }, 10)
  }

  const handleFormatAiText = () => {
    if (!formMessage.trim()) return

    let text = formMessage

    // Extract subject if AI prefixed with "Subject: ..."
    const subjectMatch = text.match(/^Subject:\s*([^\n]+)/im)
    if (subjectMatch && subjectMatch[1]) {
      setFormName(subjectMatch[1].trim())
      text = text.replace(/^Subject:\s*[^\n]+\n*/im, "")
    }

    // Strip generic greetings / conversational wrappers like "Certainly! Here is your email:"
    text = text.replace(/^(Certainly|Here is|Sure thing|Here's).*?:\s*\n+/i, "")
    text = text.replace(/Best regards,[\s\S]*$/i, (match) => match.trim())

    // Convert common AI patterns to SendMe formatting:
    // Convert "> Note: ..." or "> [!NOTE]" into :::box
    text = text.replace(/>\s*(?:\[!(?:NOTE|TIP)\]|Note:?)\s*([^\n]+(?:\n>[^\n]+)*)/gi, (_, content) => {
      const cleanContent = content.replace(/^>\s*/gm, "")
      return `:::box\n${cleanContent}\n:::`
    })

    // Convert "> Warning: ..." or "> [!WARN]" into :::warning
    text = text.replace(/>\s*(?:\[!(?:WARN|ALERT|IMPORTANT)\]|Warning:?|Important:?)\s*([^\n]+(?:\n>[^\n]+)*)/gi, (_, content) => {
      const cleanContent = content.replace(/^>\s*/gm, "")
      return `:::warning\n${cleanContent}\n:::`
    })

    // Convert button prompts [CTA: Label -> url] or Button: Label (url)
    text = text.replace(/(?:Button|CTA):\s*([^\n(]+)\s*\((https?:\/\/[^\s)]+)\)/gi, "[button: $1 -> $2]")

    setFormMessage(text.trim())
    setAiFormattedNotice(true)
    setTimeout(() => setAiFormattedNotice(false), 4000)
  }

  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setFormName(tpl.subject)
    setBannerBadge(tpl.badge)
    setBannerTitle(tpl.subject)
    setBannerSubtitle(tpl.subtitle)
    setBannerImage(tpl.image)
    setCtaText(tpl.ctaText)
    setCtaUrl(tpl.ctaUrl)
    setFormMessage(tpl.message)
    if (tpl.target) setFormTarget(tpl.target)
    setEditorTab("compose")
  }

  useEffect(() => {
    const target = searchParams.get("target")
    const emails = searchParams.get("emails")
    const name = searchParams.get("name")
    const message = searchParams.get("message")
    const sender = searchParams.get("senderName")

    if (target || emails) {
      setShowCreate(true)
      if (target) setFormTarget(target)
      if (emails) setFormEmails(emails)
      if (name) setFormName(name)
      if (message) setFormMessage(message)
      if (sender) setFormSenderName(sender)
      else setFormSenderName("SendMe Dispatch")
    }
  }, [searchParams])

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const [listRes, audRes] = await Promise.all([
        fetch("/api/dashboard/email-campaigns"),
        fetch("/api/dashboard/email-campaigns/audiences"),
      ])
      const list = await listRes.json()
      const aud = await audRes.json()
      setCampaigns(list.campaigns || [])
      setAudiences(aud.audiences || {})
    } catch (err) {
      console.error("Failed to fetch campaigns:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const openDetail = async (campaign: Campaign) => {
    setSelected(campaign)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/dashboard/email-campaigns/${campaign.id}`)
      const data = await res.json()
      setDetail(data)
    } catch (err) {
      console.error("Failed to fetch campaign detail:", err)
    } finally {
      setDetailLoading(false)
    }
  }

  const runBatchSequence = async (campaignId: string, currentBatches: BatchItem[]) => {
    const updated = [...currentBatches]

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "completed") continue

      updated[i] = { ...updated[i], status: "sending" }
      setBatches([...updated])

      try {
        const res = await fetch("/api/dashboard/email-campaigns/send-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            batchIndex: i,
            batchSize: 100,
          }),
        })

        const result = await res.json()

        if (res.ok && result.success) {
          updated[i] = {
            ...updated[i],
            status: "completed",
            sent: result.sentCount,
            failed: result.failedCount,
          }
          setBatches([...updated])
          if (result.campaign) {
            setActiveCampaign(result.campaign)
          }

          // If there's another batch waiting, pause 3.5s to let the SMTP/SendByte rate limit bucket refresh
          if (i + 1 < updated.length && updated[i + 1].status !== "completed") {
            await new Promise((r) => setTimeout(r, 3500))
          }
        } else {
          updated[i] = {
            ...updated[i],
            status: "failed",
            error: result.error || "Batch dispatch error",
          }
          setBatches([...updated])
          setDispatchError(`Batch ${i + 1} failed: ${result.error || "Unknown error"}`)
          return
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Network error"
        updated[i] = {
          ...updated[i],
          status: "failed",
          error: errorMsg,
        }
        setBatches([...updated])
        setDispatchError(`Batch ${i + 1} error: ${errorMsg}`)
        return
      }
    }

    const allDone = updated.every((b) => b.status === "completed")
    if (allDone) {
      setDispatchComplete(true)
      fetchCampaigns()
    }
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formSenderName.trim() || !formMessage.trim()) return
    setSending(true)
    setError("")
    setDispatchError("")
    try {
      const res = await fetch("/api/dashboard/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          senderName: formSenderName.trim(),
          message: formMessage,
          targetAudience: formTarget,
          subAudience: formSub,
          emails: formTarget === "individuals" ? formEmails : undefined,
          bannerBadge,
          bannerTitle: bannerTitle.trim() || formName.trim(),
          bannerSubtitle: bannerSubtitle.trim(),
          bannerImage,
          ctaText: ctaText.trim(),
          ctaUrl: ctaUrl.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to launch campaign")
        setSending(false)
        return
      }

      // Initialize batches from backend (100 per batch)
      const initialBatches: BatchItem[] = (data.batches || []).map((b: { batchNumber: number; batchIndex: number; count: number }) => ({
        batchNumber: b.batchNumber,
        batchIndex: b.batchIndex,
        count: b.count,
        status: "queued" as const,
        sent: 0,
        failed: 0,
      }))

      setActiveCampaign(data.campaign)
      setBatches(initialBatches)
      setIsDispatching(true)
      setDispatchComplete(false)
      setSending(false)

      // Sequentially dispatch batches
      runBatchSequence(data.campaign.id, initialBatches)
    } catch (err) {
      setError("Network error")
      setSending(false)
    }
  }

  const handleRetryFailedBatch = () => {
    if (!activeCampaign) return
    setDispatchError("")
    runBatchSequence(activeCampaign.id, batches)
  }

  const handleCloseDispatch = () => {
    setShowCreate(false)
    setIsDispatching(false)
    setActiveCampaign(null)
    setBatches([])
    setDispatchComplete(false)
    setDispatchError("")
    setFormName("")
    setFormSenderName("")
    setFormMessage("")
    setFormTarget("all")
    setFormSub("all")
    setFormEmails("")
    fetchCampaigns()
  }

  const handleResumeBatch = async (campaignId: string) => {
    setResumingBatch(true)
    try {
      const res = await fetch("/api/dashboard/email-campaigns/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          batchIndex: 0,
          batchSize: 100,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (selected) {
          openDetail(selected)
        }
        fetchCampaigns()
      } else {
        alert(data.error || "Failed to dispatch batch")
      }
    } catch (err) {
      alert("Network error while dispatching batch")
    } finally {
      setResumingBatch(false)
    }
  }

  const subOptions = SUB_OPTIONS[formTarget] || ["all"]
  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0)
  const totalFailed = campaigns.reduce((s, c) => s + (c.failed_count || 0), 0)
  const totalRecipients = campaigns.reduce((s, c) => s + (c.total_recipients || 0), 0)

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 min-h-0 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Email Campaigns</h1>
            <p className="text-xs text-text-muted mt-0.5">Create, launch and track email campaigns to your users.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-sendme text-white rounded-lg px-3 py-1.5 text-[11px] font-medium hover:bg-sendme/90"
          >
            <Send size={12} /> Create Email Campaign
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Campaigns", value: campaigns.length, icon: Megaphone, bg: "bg-purple-50", color: "text-purple-600" },
            { label: "Total Recipients", value: totalRecipients, icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
            { label: "Sent", value: totalSent, icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
            { label: "Failed", value: totalFailed, icon: AlertTriangle, bg: "bg-red-50", color: "text-red-500" },
          ].map((s) => {
            const I = s.icon
            return (
              <Card key={s.label} className="p-3 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-[10px] text-text-muted truncate">{s.label}</p>
                  <div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14} /></div>
                </div>
                <p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value.toLocaleString()}</p>
              </Card>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-sendme" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <Mail size={32} className="mb-2 opacity-40" />
            <p className="text-[11px] font-medium">No email campaigns yet</p>
            <p className="text-[10px] mt-1">Click &quot;Create Email Campaign&quot; to launch your first one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border-default divide-y divide-border-light">
            {campaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => openDetail(c)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-secondary transition-colors ${
                  selected?.id === c.id ? "bg-sendme-50" : ""
                }`}
              >
                <div className="p-1.5 rounded-lg bg-sendme-50 text-sendme shrink-0 mt-0.5">
                  <Mail size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-text-primary truncate">{c.subject}</p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      c.status === "sent" ? "bg-green-100 text-green-600" : c.status === "sending" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-500"
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    From {c.sender_name} from SendMe · {TARGET_OPTIONS.find((t) => t.value === c.target_audience)?.label || c.target_audience}
                    {" · "}{SUB_LABELS[c.sub_audience] || c.sub_audience}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-text-muted">
                    <span>{c.total_recipients.toLocaleString()} recipients</span>
                    <span className="text-green-600">{c.sent_count.toLocaleString()} sent</span>
                    {c.failed_count > 0 && <span className="text-red-500">{c.failed_count.toLocaleString()} failed</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-text-muted">
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <ChevronRight size={12} className="text-text-muted ml-auto mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[380px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text-primary truncate">{selected.subject}</p>
              <p className="text-[9px] text-text-muted">{selected.sender_name} from SendMe</p>
            </div>
            <button onClick={() => { setSelected(null); setDetail(null) }} className="p-1 hover:bg-surface-secondary rounded">
              <X size={16} className="text-text-muted" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin text-sendme" />
              </div>
            ) : detail ? (
              <>
                <div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Delivery</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Sent", value: detail.campaign.sent_count, icon: Send, color: "text-blue-600" },
                      { label: "Delivered", value: detail.campaign.delivered_count, icon: CheckCircle, color: "text-green-600" },
                      { label: "Opened", value: detail.campaign.opened_count, icon: Eye, color: "text-purple-600" },
                      { label: "Bounced", value: detail.campaign.bounced_count, icon: AlertTriangle, color: "text-orange-600" },
                      { label: "Rejected", value: detail.campaign.rejected_count, icon: Ban, color: "text-red-500" },
                      { label: "Failed", value: detail.campaign.failed_count, icon: X, color: "text-red-500" },
                    ].map((s) => {
                      const I = s.icon
                      return (
                        <div key={s.label} className="flex items-center gap-2 p-2 border border-border-default rounded-lg">
                          <I size={14} className={s.color} />
                          <div><p className="text-[11px] font-semibold text-text-primary">{s.value.toLocaleString()}</p><p className="text-[9px] text-text-muted">{s.label}</p></div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Audience</p>
                  <div className="p-3 border border-border-default rounded-lg">
                    <p className="text-[11px] font-medium text-text-primary">
                      {TARGET_OPTIONS.find((t) => t.value === detail.campaign.target_audience)?.label || detail.campaign.target_audience}
                    </p>
                    <p className="text-[9px] text-text-muted mt-0.5">{SUB_LABELS[detail.campaign.sub_audience] || detail.campaign.sub_audience}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Batch Architecture (100 / batch)</p>
                  <div className="p-3 border border-border-default rounded-lg bg-surface-secondary/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                      <span className="flex items-center gap-1.5">
                        <Layers size={13} className="text-sendme" />
                        {Math.max(1, Math.ceil(detail.campaign.total_recipients / 100))} Total {Math.ceil(detail.campaign.total_recipients / 100) === 1 ? "Batch" : "Batches"}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {detail.campaign.total_recipients.toLocaleString()} recipients
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: Math.max(1, Math.ceil(detail.campaign.total_recipients / 100)) }).map((_, idx) => {
                        const count = Math.min(100, Math.max(0, detail.campaign.total_recipients - idx * 100));
                        return (
                          <span key={idx} className="text-[10px] bg-white border border-border-default px-2 py-0.5 rounded font-mono text-text-secondary">
                            Batch {idx + 1}: {count}
                          </span>
                        );
                      })}
                    </div>
                    {detail.recipients.some((r) => r.status === "queued") && (
                      <button
                        onClick={() => handleResumeBatch(detail.campaign.id)}
                        disabled={resumingBatch}
                        className="w-full mt-2 py-1.5 bg-sendme text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-sendme-dark transition-colors shadow-2xs"
                      >
                        {resumingBatch ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        Dispatch Next Queued Batch (100)
                      </button>
                    )}

                    {detail.recipients.some((r) => r.status === "failed") && (
                      <button
                        onClick={async () => {
                          setResumingBatch(true)
                          try {
                            const res = await fetch("/api/dashboard/email-campaigns/send-batch", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                campaignId: detail.campaign.id,
                                batchIndex: 0,
                                batchSize: 100,
                                retryFailed: true,
                              }),
                            })
                            const data = await res.json()
                            if (res.ok) {
                              if (selected) openDetail(selected)
                              fetchCampaigns()
                            } else {
                              alert(data.error || "Failed to retry")
                            }
                          } catch {
                            alert("Network error while retrying failed emails")
                          } finally {
                            setResumingBatch(false)
                          }
                        }}
                        disabled={resumingBatch}
                        className="w-full mt-1.5 py-1.5 bg-amber-500 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-colors shadow-2xs"
                      >
                        {resumingBatch ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                        Retry All Failed Recipients ({detail.campaign.failed_count})
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Recipients</p>
                  {detail.recipients.length === 0 ? (
                    <p className="text-[11px] text-text-muted py-4 text-center">No recipient records</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {detail.recipients.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-text-primary truncate">{r.name || r.email}</p>
                            <p className="text-[9px] text-text-muted truncate">{r.email}</p>
                          </div>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${recipientStatusColor[r.status] || ""}`}>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-text-muted py-4 text-center">Failed to load detail</p>
            )}
          </div>
        </div>
      )}

      {/* Create modal / Batch runner */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          {isDispatching ? (
            /* Live Sequential Batch Dispatch Runner (100 per batch) */
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-default animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-surface-secondary/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sendme-50 text-sendme flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Dispatching Email Campaign</h3>
                    <p className="text-[11px] text-text-muted">100 Emails per Batch Architecture</p>
                  </div>
                </div>
                {dispatchComplete && (
                  <button onClick={handleCloseDispatch} className="p-1 hover:bg-surface-secondary rounded-lg">
                    <X size={18} className="text-text-muted" />
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Campaign Summary Card */}
                <div className="bg-surface-secondary/60 p-3 rounded-xl border border-border-light flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-bold text-text-primary truncate">{activeCampaign?.subject}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {activeCampaign?.sender_name} from SendMe · {TARGET_OPTIONS.find((t) => t.value === activeCampaign?.target_audience)?.label || activeCampaign?.target_audience}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-sendme">
                      {activeCampaign?.total_recipients || batches.reduce((acc, b) => acc + b.count, 0)} total
                    </p>
                    <p className="text-[10px] text-text-muted font-medium">
                      {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-text-muted">Batch Progress</span>
                    <span className="text-sendme font-mono font-bold">
                      {batches.filter((b) => b.status === "completed").length} of {batches.length} Batches ({batches.reduce((acc, b) => acc + (b.sent + b.failed), 0)} / {batches.reduce((acc, b) => acc + b.count, 0)} emails)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden border border-border-light">
                    <div
                      className="h-full bg-sendme transition-all duration-300 rounded-full"
                      style={{
                        width: `${batches.length > 0 ? (batches.reduce((acc, b) => acc + (b.sent + b.failed), 0) / Math.max(1, batches.reduce((acc, b) => acc + b.count, 0))) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Batches List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {batches.map((batch) => (
                    <div
                      key={batch.batchIndex}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                        batch.status === "completed"
                          ? "bg-sendme-50/50 border-sendme/30 text-text-primary"
                          : batch.status === "sending"
                          ? "bg-amber-50/60 border-amber-300 text-amber-900"
                          : batch.status === "failed"
                          ? "bg-danger-light/60 border-danger/30 text-danger"
                          : "bg-surface-secondary/50 border-border-light text-text-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-white border border-border-light text-[11px] font-bold flex items-center justify-center font-mono">
                          #{batch.batchNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-text-primary">
                            Batch {batch.batchNumber}: {batch.count} {batch.count === 1 ? "email" : "emails"}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {batch.status === "completed"
                              ? `${batch.sent} sent${batch.failed > 0 ? `, ${batch.failed} failed` : ""}`
                              : batch.status === "sending"
                              ? "Dispatching via SendByte Africa..."
                              : batch.status === "failed"
                              ? batch.error || "Failed"
                              : "Queued"}
                          </p>
                        </div>
                      </div>

                      <div>
                        {batch.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sendme bg-white px-2 py-0.5 rounded-full border border-sendme/20">
                            <CheckCircle2 size={12} /> Done
                          </span>
                        )}
                        {batch.status === "sending" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                            <Loader2 size={12} className="animate-spin text-amber-600" /> Sending
                          </span>
                        )}
                        {batch.status === "queued" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted bg-white px-2 py-0.5 rounded-full border border-border-light">
                            <Clock size={12} /> Queued
                          </span>
                        )}
                        {batch.status === "failed" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-danger bg-white px-2 py-0.5 rounded-full border border-danger/20">
                            <AlertTriangle size={12} /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error warning & retry */}
                {dispatchError && (
                  <div className="p-3 bg-danger-light rounded-xl text-xs text-danger flex items-center justify-between border border-danger/20">
                    <span className="truncate">{dispatchError}</span>
                    <button
                      onClick={handleRetryFailedBatch}
                      className="flex items-center gap-1 font-semibold underline text-xs shrink-0 ml-2"
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                  </div>
                )}

                {/* Success Banner */}
                {dispatchComplete && (
                  <div className="p-3 bg-sendme-50 border border-sendme/20 rounded-xl text-center space-y-1 animate-in fade-in">
                    <CheckCircle2 size={24} className="text-sendme mx-auto" />
                    <p className="text-xs font-bold text-text-primary">All Batches Dispatched Successfully!</p>
                    <p className="text-[11px] text-text-muted">
                      {batches.reduce((acc, b) => acc + b.sent, 0)} emails successfully delivered without server timeout.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end px-5 py-4 border-t border-border-light bg-surface-secondary/20">
                {dispatchComplete ? (
                  <button
                    onClick={handleCloseDispatch}
                    className="w-full py-2 bg-sendme text-white text-xs font-bold rounded-xl hover:bg-sendme-dark transition-colors shadow-xs"
                  >
                    Done & View Campaign Details
                  </button>
                ) : (
                  <p className="text-[11px] text-text-muted text-center w-full">
                    Please keep this window open while batches of 100 are dispatched sequentially...
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Modern Email Studio: Rich Formatting, AI Parser, Live Preview & Templates */
            <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-border-default animate-in fade-in duration-200">
              
              {/* Studio Header & Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-border-light bg-surface-secondary/40 gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sendme text-white flex items-center justify-center shadow-2xs">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">SendMe Email Studio</h2>
                    <p className="text-[10px] text-text-muted">Modern Header Layout &amp; AI-Powered Formatting</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Tabs */}
                  <div className="flex items-center bg-surface-secondary p-1 rounded-xl border border-border-default/60">
                    <button
                      type="button"
                      onClick={() => setEditorTab("compose")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        editorTab === "compose"
                          ? "bg-white text-sendme shadow-2xs font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Edit3 size={13} />
                      <span>Compose</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        editorTab === "preview"
                          ? "bg-white text-sendme shadow-2xs font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Eye size={13} />
                      <span>Live Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab("templates")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        editorTab === "templates"
                          ? "bg-white text-sendme shadow-2xs font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <LayoutTemplate size={13} />
                      <span>Templates</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowCreate(false)}
                    className="p-1.5 hover:bg-surface-secondary rounded-lg text-text-muted transition-colors ml-1"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Tab 1: Compose & Format */}
              {editorTab === "compose" && (
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  
                  {/* Subject & Sender row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary mb-1 block">
                        Campaign Name / Email Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Keep 100% of Your Delivery Earnings"
                        className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary mb-1 block">
                        Sender Display Name <span className="text-danger">*</span>
                      </label>
                      <input
                        value={formSenderName}
                        onChange={(e) => setFormSenderName(e.target.value)}
                        placeholder="e.g. SendMe Operations"
                        className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white shadow-2xs"
                      />
                      <p className="text-[9.5px] text-text-muted mt-1">
                        Recipients will see: &quot;{formSenderName || "SendMe Operations"} from SendMe&quot;
                      </p>
                    </div>
                  </div>

                  {/* Banner Layout Customization Drawer (matching fairly-used header banner) */}
                  <div className="border border-border-default rounded-xl overflow-hidden bg-surface-secondary/30">
                    <button
                      type="button"
                      onClick={() => setShowBannerConfig(!showBannerConfig)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sendme"></div>
                        <span>Header Banner (SendMe Green #158A5E Card)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                        <span>{showBannerConfig ? "Collapse" : "Customize Header Text & Image"}</span>
                        {showBannerConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {showBannerConfig && (
                      <div className="p-4 border-t border-border-light bg-white space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10.5px] font-medium text-text-muted mb-1 block">Custom Banner Title (Optional)</label>
                            <input
                              value={bannerTitle}
                              onChange={(e) => setBannerTitle(e.target.value)}
                              placeholder="Defaults to Email Subject"
                              className="w-full border border-border-default rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sendme"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] font-medium text-text-muted mb-1 block">Banner Subtitle (Optional)</label>
                            <input
                              value={bannerSubtitle}
                              onChange={(e) => setBannerSubtitle(e.target.value)}
                              placeholder="e.g. Official dispatch notice for all riders"
                              className="w-full border border-border-default rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sendme"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10.5px] font-medium text-text-muted mb-1.5 block">Header Illustration Image</label>
                          <div className="flex items-center gap-3">
                            <label
                              onClick={() => setBannerImage(SENDME_BANNER_PARCEL_ILLUS)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                                bannerImage === SENDME_BANNER_PARCEL_ILLUS
                                  ? "border-sendme bg-emerald-50/50 ring-1 ring-sendme/30"
                                  : "border-border-default hover:bg-surface-secondary"
                              }`}
                            >
                              <img src={SENDME_BANNER_PARCEL_ILLUS} alt="Parcel" className="w-8 h-8 object-contain" />
                              <div className="text-left">
                                <p className="text-xs font-semibold text-text-primary">Delivery Parcel Box</p>
                                <p className="text-[10px] text-text-muted">For senders, promos &amp; general</p>
                              </div>
                            </label>

                            <label
                              onClick={() => setBannerImage(SENDME_BANNER_EARNINGS_ILLUS)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                                bannerImage === SENDME_BANNER_EARNINGS_ILLUS
                                  ? "border-sendme bg-emerald-50/50 ring-1 ring-sendme/30"
                                  : "border-border-default hover:bg-surface-secondary"
                              }`}
                            >
                              <img src={SENDME_BANNER_EARNINGS_ILLUS} alt="Helmet" className="w-8 h-8 object-contain" />
                              <div className="text-left">
                                <p className="text-xs font-semibold text-text-primary">Rider Helmet &amp; Earnings</p>
                                <p className="text-[10px] text-text-muted">For drivers, payouts &amp; incentives</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rich Formatting Toolbar & Smart AI Paste */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-text-secondary block">
                        Email Message Body &amp; Layout <span className="text-danger">*</span>
                      </label>

                      {/* AI Format notification */}
                      {aiFormattedNotice && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                          <Sparkles size={11} /> AI Text Cleaned &amp; Formatted into SendMe Layout!
                        </span>
                      )}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-surface-secondary/70 border border-border-default rounded-t-xl text-xs">
                      <button
                        type="button"
                        onClick={() => insertFormatting("**", "**", "bold text")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-primary font-bold shadow-2xs flex items-center gap-1"
                        title="Bold (**text**)"
                      >
                        <Bold size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting("*", "*", "italic text")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-primary italic shadow-2xs flex items-center gap-1"
                        title="Italic (*text*)"
                      >
                        <Italic size={13} />
                      </button>

                      <div className="h-4 w-px bg-border-default mx-0.5" />

                      <button
                        type="button"
                        onClick={() => insertFormatting("### ", "", "Section Heading")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-primary font-bold shadow-2xs flex items-center gap-0.5 text-[11px]"
                        title="Section Heading (### )"
                      >
                        <Heading2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting("- ", "", "List item")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-primary shadow-2xs flex items-center gap-1"
                        title="Bullet List (- item)"
                      >
                        <List size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting("1. ", "", "Step one")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-primary shadow-2xs flex items-center gap-1"
                        title="Numbered Steps (1. step)"
                      >
                        <ListOrdered size={13} />
                      </button>

                      <div className="h-4 w-px bg-border-default mx-0.5" />

                      <button
                        type="button"
                        onClick={() => insertFormatting(":::box\n", "\n:::", "**Important Note:** Add your highlight details here.")}
                        className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-semibold shadow-2xs flex items-center gap-1 text-[11px]"
                        title="Highlight Callout Box"
                      >
                        <Gift size={12} className="text-emerald-700" />
                        <span>Box</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting(":::warning\n", "\n:::", "**Warning:** Action is required to keep your account active.")}
                        className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-semibold shadow-2xs flex items-center gap-1 text-[11px]"
                        title="Warning Box"
                      >
                        <AlertCircle size={12} className="text-amber-700" />
                        <span>Warning</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting("[button: ", " -> https://senndme.com]", "Explore SendMe")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-primary font-semibold shadow-2xs flex items-center gap-1 text-[11px]"
                        title="Action Button"
                      >
                        <ExternalLink size={12} />
                        <span>Button</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting("\n---\n")}
                        className="px-2 py-1 rounded bg-white hover:bg-border-light border border-border-light text-text-secondary text-[10px] font-mono shadow-2xs"
                        title="Divider Line"
                      >
                        ---
                      </button>

                      <div className="grow" />

                      {/* Smart AI Paste & Format Assistant */}
                      <button
                        type="button"
                        onClick={handleFormatAiText}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[11px] shadow-xs hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-1.5"
                        title="Paste text from ChatGPT / Claude and click to automatically format into SendMe email structure"
                      >
                        <Sparkles size={12} />
                        <span>Format AI Text</span>
                      </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={editorTextareaRef}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      rows={8}
                      placeholder="Hi Usman,&#10;&#10;### Special Announcement&#10;Write your email message here or paste copied text from an AI tool.&#10;&#10;:::box&#10;**Pro Tip:** Click 'Format AI Text' above to format raw AI output into clean cards and headers.&#10;:::&#10;&#10;[button: Claim Your Reward -> https://senndme.com]"
                      className="w-full border border-border-default border-t-0 rounded-b-xl px-3.5 py-3 text-[12.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme resize-y font-normal bg-white"
                    />

                    <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
                      <span>Supports Markdown: **bold**, *italic*, ### headings, lists, :::box, and [button: Label -&gt; URL]</span>
                      <button
                        type="button"
                        onClick={() => setEditorTab("preview")}
                        className="text-sendme hover:underline font-semibold flex items-center gap-1"
                      >
                        <Eye size={11} /> See live preview
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button Config (Optional) */}
                  <div className="p-3 bg-surface-secondary/50 rounded-xl border border-border-light space-y-2">
                    <p className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                      <ExternalLink size={12} className="text-sendme" />
                      <span>Footer Action Button (Optional)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="Button Text (e.g. Go Online & Earn)"
                        className="border border-border-default rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-sendme"
                      />
                      <input
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="Destination URL (e.g. https://senndme.com)"
                        className="border border-border-default rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-sendme"
                      />
                    </div>
                  </div>

                  {/* Target Audience row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary mb-1 block">Target Audience</label>
                      <select
                        value={formTarget}
                        onChange={(e) => { setFormTarget(e.target.value); setFormSub("all"); setFormEmails("") }}
                        className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white shadow-2xs"
                      >
                        {TARGET_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    {formTarget === "individuals" ? (
                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary mb-1 block">Email Addresses</label>
                        <input
                          value={formEmails}
                          onChange={(e) => setFormEmails(e.target.value)}
                          placeholder="e.g. a@x.com, b@y.com"
                          className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white shadow-2xs"
                        />
                        <p className="text-[9px] text-text-muted mt-1">Separate multiple emails with commas.</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary mb-1 block">Sub Audience</label>
                        <select
                          value={formSub}
                          onChange={(e) => setFormSub(e.target.value)}
                          className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white shadow-2xs"
                        >
                          {subOptions.map((s) => {
                            const count = audiences[formTarget]?.[s] ?? 0
                            return (
                              <option key={s} value={s}>
                                {SUB_LABELS[s] || s} ({count.toLocaleString()})
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Batch Architecture Preview (100 per batch) */}
                  {(() => {
                    const estCount = formTarget === "individuals"
                      ? formEmails.split(",").map((e) => e.trim()).filter(Boolean).length
                      : (audiences[formTarget]?.[formSub] ?? 0)
                    const estBatches = Math.max(1, Math.ceil(estCount / 100))

                    return (
                      <div className="bg-emerald-50/70 border border-sendme/20 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Layers size={14} className="text-sendme" />
                            <span className="text-xs font-bold text-sendme-dark">Batch Architecture (100 / batch)</span>
                          </div>
                          <span className="text-xs font-bold text-text-primary">
                            {estCount.toLocaleString()} Recipients · {estBatches} {estBatches === 1 ? "Batch" : "Batches"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Array.from({ length: estBatches }).map((_, idx) => {
                            const count = Math.min(100, Math.max(0, estCount - idx * 100))
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-sendme/30 text-sendme px-2.5 py-1 rounded-md shadow-2xs font-mono"
                              >
                                Batch {idx + 1}: {count} {count === 1 ? "email" : "emails"}
                              </span>
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          Recipients are dispatched sequentially in batches of 100 via SendByte Africa to avoid server timeouts.
                        </p>
                      </div>
                    )
                  })()}

                  {error && (
                    <div className="bg-danger-light border border-danger/20 rounded-lg p-3">
                      <p className="text-danger text-xs font-medium text-center">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Live Interactive Email Preview */}
              {editorTab === "preview" && (
                <div className="flex-1 flex flex-col bg-surface-secondary/40 overflow-hidden">
                  
                  {/* Viewport Control Bar */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-border-light text-xs shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-[11px]">Viewport Device:</span>
                      <div className="flex items-center bg-surface-secondary p-0.5 rounded-lg border border-border-light">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice("desktop")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                            previewDevice === "desktop" ? "bg-white text-sendme shadow-2xs" : "text-text-muted"
                          }`}
                        >
                          <Monitor size={12} />
                          <span>Desktop (580px)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice("mobile")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                            previewDevice === "mobile" ? "bg-white text-sendme shadow-2xs" : "text-text-muted"
                          }`}
                        >
                          <Smartphone size={12} />
                          <span>Mobile (375px)</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-text-muted flex items-center gap-2">
                      <span>Live SendMe Email Banner Shell</span>
                      <button
                        type="button"
                        onClick={() => setEditorTab("compose")}
                        className="text-sendme hover:underline font-semibold"
                      >
                        Edit Content &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Rendered sandboxed frame */}
                  <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                    <div
                      className={`w-full transition-all duration-300 bg-white rounded-2xl shadow-xl overflow-hidden border border-border-default ${
                        previewDevice === "mobile" ? "max-w-[390px] h-[640px]" : "max-w-[620px] h-[620px]"
                      }`}
                    >
                      {(() => {
                        const previewHtml = buildCampaignEmailHtml(
                          formSenderName || "SendMe Operations",
                          formatMessageToHtml(formMessage || "Hi Usman,\n\nWelcome to SendMe Delivery! Start typing in the Compose tab to see live preview updates.\n\n:::box\n**100% Earnings:** Zero commission deductions for riders.\n:::\n\n[button: Explore SendMe -> https://senndme.com]"),
                          {
                            subject: formName || "Official SendMe Announcement",
                            bannerBadge: bannerBadge || "SENDME DISPATCH",
                            bannerTitle: bannerTitle.trim() || formName || "Official SendMe Announcement",
                            bannerSubtitle: bannerSubtitle.trim() || undefined,
                            bannerImage,
                            ctaText: ctaText.trim() || undefined,
                            ctaUrl: ctaUrl.trim() || undefined,
                          }
                        )

                        return (
                          <iframe
                            title="SendMe Email Preview"
                            srcDoc={previewHtml}
                            className="w-full h-full border-0"
                            sandbox="allow-same-origin"
                          />
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Ready-to-Send Campaign Templates */}
              {editorTab === "templates" && (
                <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-surface-secondary/20">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">SendMe Pre-Built Email Templates</h3>
                    <p className="text-[11px] text-text-muted">
                      Select any optimized template below. It will automatically populate your email subject, modern banner, boxes, and action button.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {PRESET_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="bg-white p-4 rounded-xl border border-border-default hover:border-sendme transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tpl.badgeColor}`}>
                              {tpl.badgeText}
                            </span>
                            <span className="text-[10px] font-medium text-text-muted capitalize">
                              Target: {tpl.target}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-text-primary">{tpl.title}</h4>
                          <p className="text-[11px] text-text-muted leading-relaxed">{tpl.desc}</p>
                          <div className="p-2 bg-surface-secondary rounded-lg text-[10.5px] font-mono text-text-secondary truncate">
                            Subject: {tpl.subject}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="w-full py-2 bg-sendme-50 text-sendme hover:bg-sendme hover:text-white transition-colors text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-sendme/20"
                        >
                          <Edit3 size={13} />
                          <span>Use This Template</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-light bg-surface-secondary/30 shrink-0">
                <div className="flex items-center gap-2">
                  {editorTab !== "preview" ? (
                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className="px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary border border-border-default rounded-lg bg-white flex items-center gap-1"
                    >
                      <Eye size={12} /> Preview Email
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditorTab("compose")}
                      className="px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary border border-border-default rounded-lg bg-white flex items-center gap-1"
                    >
                      <Edit3 size={12} /> Return to Compose
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 text-[11px] font-medium text-text-muted border border-border-default rounded-lg hover:bg-surface-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={sending || !formName.trim() || !formSenderName.trim() || !formMessage.trim() || (formTarget === "individuals" && !formEmails.trim())}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs font-bold"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {sending ? "Preparing Batches..." : "Launch Campaign"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EmailCampaignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-sendme mx-auto" /></div>}>
      <EmailCampaignsContent />
    </Suspense>
  )
}
