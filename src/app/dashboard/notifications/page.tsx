"use client"
import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import {
  Bell, Package, DollarSign, Users, Truck, AlertTriangle,
  CheckCircle, Clock, Info, Eye, EyeOff, Trash2, Filter,
  ChevronDown, Search, Send, Megaphone, Shield, Tag, X, Loader2
} from "lucide-react"

interface Announcement {
  id: string
  title: string
  body: string
  type: string
  priority: string
  target_type: string
  target_value: string | null
  status: string
  total_count: number
  read_count: number
  sent_at: string | null
  created_at: string
}

interface NotificationStats {
  totalMessages: number
  unreadMessages: number
  sentToday: number
}

const typeConfig: Record<string, { icon: any; bg: string; color: string }> = {
  ADMIN: { icon: Megaphone, bg: "bg-emerald-50", color: "text-emerald-600" },
  ORDER: { icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
  PAYMENT: { icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
  DRIVER: { icon: Truck, bg: "bg-orange-50", color: "text-orange-600" },
  SYSTEM: { icon: Shield, bg: "bg-purple-50", color: "text-purple-600" },
  SECURITY: { icon: Shield, bg: "bg-red-50", color: "text-red-600" },
  MARKETING: { icon: Tag, bg: "bg-pink-50", color: "text-pink-600" },
  TASK: { icon: CheckCircle, bg: "bg-cyan-50", color: "text-cyan-600" },
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-600",
  CRITICAL: "bg-red-100 text-red-600",
}

export default function NotificationsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [stats, setStats] = useState<NotificationStats>({ totalMessages: 0, unreadMessages: 0, sentToday: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTab, setFilterTab] = useState("All")
  const [showCreate, setShowCreate] = useState(false)
  const [sending, setSending] = useState(false)

  // Create form state
  const [formTitle, setFormTitle] = useState("")
  const [formBody, setFormBody] = useState("")
  const [formType, setFormType] = useState("ADMIN")
  const [formPriority, setFormPriority] = useState("MEDIUM")
  const [formTargetType, setFormTargetType] = useState("all")
  const [formTargetValue, setFormTargetValue] = useState("")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/announcements")
      const data = await res.json()
      setAnnouncements(data.announcements || [])
      setStats(data.stats || { totalMessages: 0, unreadMessages: 0, sentToday: 0 })
    } catch (err) {
      console.error("Failed to fetch announcements:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSend = async () => {
    if (!formTitle.trim() || !formBody.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          body: formBody.trim(),
          type: formType,
          priority: formPriority,
          targetType: formTargetType,
          targetValue: formTargetType !== "all" ? formTargetValue.trim() : null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setFormTitle("")
        setFormBody("")
        setFormType("ADMIN")
        setFormPriority("MEDIUM")
        setFormTargetType("all")
        setFormTargetValue("")
        fetchData()
      } else {
        alert(data.error || "Failed to send")
      }
    } catch (err) {
      alert("Network error")
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return
    try {
      await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" })
      fetchData()
      if (selected?.id === id) setSelected(null)
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const filtered = announcements.filter((a) => {
    if (filterTab === "Sent") return a.status === "sent"
    if (filterTab === "Drafts") return a.status === "draft"
    if (filterTab === "Unread") return a.total_count > 0 && a.read_count < a.total_count
    return true
  }).filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
  })

  const statCards = [
    { label: "Total Messages", value: stats.totalMessages, icon: Bell, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Unread", value: stats.unreadMessages, icon: Eye, bg: "bg-red-50", color: "text-red-600" },
    { label: "Sent Today", value: stats.sentToday, icon: Clock, bg: "bg-green-50", color: "text-green-600" },
    { label: "Announcements", value: announcements.length, icon: Megaphone, bg: "bg-purple-50", color: "text-purple-600" },
  ]

  const tabs = ["All", "Sent", "Drafts", "Unread"]

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Notifications & Announcements</h1>
            <p className="text-xs text-text-muted mt-0.5">Send announcements and manage platform notifications.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-sendme text-white rounded-lg px-3 py-1.5 text-[11px] font-medium hover:bg-sendme/90"
          >
            <Send size={12} /> Create Announcement
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {statCards.map((s) => {
            const I = s.icon
            return (
              <Card key={s.label} className="p-3 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-[10px] text-text-muted truncate">{s.label}</p>
                  <div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14} /></div>
                </div>
                <p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p>
              </Card>
            )
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5">
            <Search size={12} className="text-text-muted" />
            <input
              placeholder="Search announcements..."
              className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center border-b border-border-light mb-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTab(t)}
              className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                filterTab === t
                  ? "border-sendme text-sendme"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-sendme" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Megaphone size={32} className="mb-2 opacity-40" />
            <p className="text-[11px] font-medium">No announcements yet</p>
            <p className="text-[10px] mt-1">Click &quot;Create Announcement&quot; to send your first notification.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border-default divide-y divide-border-light">
            {filtered.map((a) => {
              const tc = typeConfig[a.type] || typeConfig.ADMIN
              const I = tc.icon
              return (
                <div
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-secondary transition-colors ${
                    selected?.id === a.id ? "bg-sendme-50" : ""
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${tc.bg} ${tc.color} shrink-0 mt-0.5`}>
                    <I size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold text-text-primary truncate">{a.title}</p>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${priorityColors[a.priority] || ""}`}>
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{a.body}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-text-muted">
                        To: {a.target_type === "all" ? "All Users" : a.target_type === "role" ? `All ${a.target_value}s` : a.target_value}
                      </span>
                      {a.total_count > 0 && (
                        <span className="text-[9px] text-sendme font-medium">
                          {a.total_count} sent{a.read_count > 0 ? ` · ${a.read_count} read` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-text-muted">
                      {a.sent_at
                        ? new Date(a.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "Draft"}
                    </p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                      a.status === "sent" ? "bg-green-100 text-green-600" :
                      a.status === "sending" ? "bg-yellow-100 text-yellow-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-[360px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div className="flex items-center gap-2">
              {(() => { const tc = typeConfig[selected.type] || typeConfig.ADMIN; const I = tc.icon; return <div className={`p-1.5 rounded-lg ${tc.bg} ${tc.color}`}><I size={14} /></div> })()}
              <div>
                <p className="font-semibold text-sm text-text-primary">{selected.title}</p>
                <p className="text-[9px] text-text-muted">
                  {selected.sent_at ? new Date(selected.sent_at).toLocaleString() : "Draft"}
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-surface-secondary rounded">
              <span className="text-text-muted text-sm">✕</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Content</p>
              <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Target</p>
              <div className="p-3 border border-border-default rounded-lg">
                <p className="text-[11px] font-medium text-text-primary">
                  {selected.target_type === "all" ? "All Users" :
                   selected.target_type === "role" ? `All ${selected.target_value}s` :
                   selected.target_value}
                </p>
                <p className="text-[9px] text-text-muted mt-0.5 capitalize">{selected.target_type} targeting</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Delivery Stats</p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Total Sent</span>
                  <span className="text-[11px] font-medium text-text-primary">{selected.total_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Read</span>
                  <span className="text-[11px] font-medium text-sendme">{selected.read_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Unread</span>
                  <span className="text-[11px] font-medium text-orange-500">{selected.total_count - selected.read_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Read Rate</span>
                  <span className="text-[11px] font-medium text-text-primary">
                    {selected.total_count > 0 ? Math.round((selected.read_count / selected.total_count) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Details</p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Type</span>
                  <span className="text-[11px] font-medium text-text-primary">{selected.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Priority</span>
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Status</span>
                  <span className={`text-[11px] font-medium capitalize ${selected.status === "sent" ? "text-green-600" : "text-text-muted"}`}>{selected.status}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Actions</p>
              <button
                onClick={() => handleDelete(selected.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50"
              >
                <Trash2 size={12} /> Delete Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <h2 className="text-base font-bold text-text-primary">Create Announcement</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X size={18} className="text-text-muted" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-[11px] font-medium text-text-secondary mb-1 block">Title</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. New features available!"
                  className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-[11px] font-medium text-text-secondary mb-1 block">Message</label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={4}
                  placeholder="Write your announcement message..."
                  className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme resize-none"
                />
              </div>

              {/* Type + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SYSTEM">System</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="SECURITY">Security</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="text-[11px] font-medium text-text-secondary mb-1 block">Send To</label>
                <select
                  value={formTargetType}
                  onChange={(e) => { setFormTargetType(e.target.value); setFormTargetValue("") }}
                  className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="role">By User Role</option>
                  <option value="email">Specific Email</option>
                </select>
              </div>

              {/* Target Value (conditional) */}
              {formTargetType === "role" && (
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">User Role</label>
                  <select
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(e.target.value)}
                    className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme bg-white"
                  >
                    <option value="">Select role...</option>
                    <option value="customer">Senders (Customers)</option>
                    <option value="driver">Riders (Drivers)</option>
                    <option value="organization">Organizations</option>
                  </select>
                </div>
              )}
              {formTargetType === "email" && (
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">Email Address</label>
                  <input
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(e.target.value)}
                    placeholder="user@example.com"
                    type="email"
                    className="w-full border border-border-default rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-sendme/30 focus:border-sendme"
                  />
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
                onClick={handleSend}
                disabled={sending || !formTitle.trim() || !formBody.trim() || (formTargetType === "role" && !formTargetValue) || (formTargetType === "email" && !formTargetValue)}
                className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {sending ? "Sending..." : "Send Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
