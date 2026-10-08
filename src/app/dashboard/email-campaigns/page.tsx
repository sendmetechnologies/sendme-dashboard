"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  Mail, Send, X, Loader2, Users, CheckCircle, AlertTriangle,
  ChevronRight, Megaphone, Eye, Ban, Clock, Layers,
  CheckCircle2, Play, RotateCcw
} from "lucide-react"

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
  const [formSenderName, setFormSenderName] = useState("")
  const [formMessage, setFormMessage] = useState("")
  const [formTarget, setFormTarget] = useState("all")
  const [formSub, setFormSub] = useState("all")
  const [formEmails, setFormEmails] = useState("")

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
            /* Create Form with Batch Architecture Preview */
            <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                <h2 className="text-base font-bold text-text-primary">Create Email Campaign</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-surface-secondary rounded-lg">
                  <X size={18} className="text-text-muted" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 block">Campaign Name / Subject</label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Verify your account to start earning"
                      className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 block">Sender Name</label>
                    <input
                      value={formSenderName}
                      onChange={(e) => setFormSenderName(e.target.value)}
                      placeholder="e.g. Kate"
                      className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme"
                    />
                    <p className="text-[9px] text-text-muted mt-1">Recipients will see &quot;{formSenderName || "Kate"} from SendMe&quot;</p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">Message</label>
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    rows={6}
                    placeholder="Write your campaign message..."
                    className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme resize-none"
                  />
                  <p className="text-[9px] text-text-muted mt-1">Line breaks are preserved in the email.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 block">Target Audience</label>
                    <select
                      value={formTarget}
                      onChange={(e) => { setFormTarget(e.target.value); setFormSub("all"); setFormEmails("") }}
                      className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white"
                    >
                      {TARGET_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  {formTarget === "individuals" ? (
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary mb-1 block">Email Addresses</label>
                      <input
                        value={formEmails}
                        onChange={(e) => setFormEmails(e.target.value)}
                        placeholder="e.g. a@x.com, b@y.com"
                        className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme"
                      />
                      <p className="text-[9px] text-text-muted mt-1">Separate multiple emails with commas.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary mb-1 block">Sub Audience</label>
                      <select
                        value={formSub}
                        onChange={(e) => setFormSub(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white"
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
                        Total user emails are automatically split into sequential batches of 100 (e.g. 230 emails = 3 batches: 100, 100, 30) to eliminate serverless timeouts and ensure 100% deliverability.
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
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-light">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-[11px] font-medium text-text-muted border border-border-default rounded-lg hover:bg-surface-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={sending || !formName.trim() || !formSenderName.trim() || !formMessage.trim() || (formTarget === "individuals" && !formEmails.trim())}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {sending ? "Preparing Batches..." : "Launch Campaign"}
                </button>
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
