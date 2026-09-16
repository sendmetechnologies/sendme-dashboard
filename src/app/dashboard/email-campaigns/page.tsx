"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import {
  Mail, Send, X, Loader2, Users, CheckCircle, AlertTriangle,
  RefreshCw, ChevronRight, Megaphone, Eye, Ban, Clock
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

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [audiences, setAudiences] = useState<AudienceData>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [detail, setDetail] = useState<{ campaign: Campaign; recipients: Recipient[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const [formName, setFormName] = useState("")
  const [formSenderName, setFormSenderName] = useState("")
  const [formMessage, setFormMessage] = useState("")
  const [formTarget, setFormTarget] = useState("all")
  const [formSub, setFormSub] = useState("all")
  const [formEmails, setFormEmails] = useState("")

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

  const handleCreate = async () => {
    if (!formName.trim() || !formSenderName.trim() || !formMessage.trim()) return
    setSending(true)
    setError("")
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
      if (res.ok) {
        setShowCreate(false)
        setFormName("")
        setFormSenderName("")
        setFormMessage("")
        setFormTarget("all")
        setFormSub("all")
        setFormEmails("")
        fetchCampaigns()
      } else {
        setError(data.error || "Failed to launch campaign")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setSending(false)
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

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
                className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {sending ? "Launching..." : "Launch Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
