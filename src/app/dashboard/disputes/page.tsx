"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Search, Filter, Download, ChevronDown, X, MoreHorizontal, MessageSquare,
  Clock, AlertTriangle, AlertCircle, CheckCircle, Ban, Send, Tag, UserPlus,
  Loader2, ChevronLeft, ChevronRight, StickyNote, RefreshCw
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────

interface Complaint {
  id: string
  user_id: string
  user_role: string
  status: string
  category: string
  subject: string
  description: string
  order_id?: string
  assigned_admin_id?: string
  assigned_admin_name?: string
  auto_close_at: string
  created_at: string
  updated_at: string
  last_message_at: string
  unread_count_user: number
  unread_count_admin: number
  user?: { id: string; full_name: string; phone: string; email: string; avatar_url?: string; role?: string }
}

interface ChatMessage {
  id: string
  complaint_id: string
  sender_id: string
  sender_type: "user" | "admin"
  sender_name: string
  message: string
  is_read: boolean
  created_at: string
}

interface AdminNote {
  id: string
  complaint_id: string
  admin_id: string
  admin_name: string
  note: string
  created_at: string
}

interface Stats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  by_role: { customer: number; driver: number; organization: number }
  by_category: Record<string, number>
}

// ─── Helpers ───────────────────────────────────────────────

function statusColor(s: string) {
  const map: Record<string, string> = {
    open: "bg-amber-50 text-amber-600",
    in_progress: "bg-blue-50 text-blue-600",
    resolved: "bg-green-50 text-green-600",
    closed: "bg-gray-100 text-gray-500",
  }
  return map[s] || "bg-gray-100 text-gray-500"
}

function categoryColor(c: string) {
  const map: Record<string, string> = {
    order: "bg-blue-50 text-blue-600",
    payment: "bg-orange-50 text-orange-600",
    driver: "bg-purple-50 text-purple-600",
    app: "bg-cyan-50 text-cyan-600",
    other: "bg-gray-100 text-gray-500",
  }
  return map[c] || "bg-gray-100 text-gray-500"
}

function roleColor(r: string) {
  const map: Record<string, string> = {
    customer: "bg-sendme-50 text-sendme",
    driver: "bg-blue-50 text-blue-600",
    organization: "bg-purple-50 text-purple-600",
  }
  return map[r] || "bg-gray-100 text-gray-500"
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

// ─── Main Component ────────────────────────────────────────

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState("All Tickets")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [detailTab, setDetailTab] = useState("Messages")
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  // Detail panel state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newNote, setNewNote] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const tabToStatus: Record<string, string> = {
    "All Tickets": "",
    Open: "open",
    "In Progress": "in_progress",
    Resolved: "resolved",
    Closed: "closed",
  }

  const fetchComplaints = useCallback(async (page: number, status: string, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (status) params.set("status", status)
    if (search) params.set("search", search)
    if (categoryFilter) params.set("category", categoryFilter)
    if (roleFilter) params.set("role", roleFilter)

    try {
      const res = await fetch(`/api/dashboard/complaints?${params.toString()}`)
      const data = await res.json()
      setComplaints(data.complaints || [])
      setStats(data.stats || null)
      setTabCounts(data.tabCounts || {})
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch {
      console.error("Failed to fetch complaints")
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, roleFilter])

  useEffect(() => {
    fetchComplaints(1, tabToStatus[activeTab] || "", searchQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchComplaints(1, tabToStatus[tab] || "", searchQuery)
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchComplaints(1, tabToStatus[activeTab] || "", q)
  }

  const handlePageChange = (page: number) => {
    fetchComplaints(page, tabToStatus[activeTab] || "", searchQuery)
  }

  // Fetch detail data when complaint is selected
  const fetchDetail = useCallback(async (complaintId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/dashboard/complaints/${complaintId}`)
      const data = await res.json()
      setMessages(data.messages || [])
      setNotes(data.notes || [])
    } catch {
      console.error("Failed to fetch complaint detail")
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedComplaint) {
      fetchDetail(selectedComplaint.id)
      setDetailTab("Messages")
    }
  }, [selectedComplaint?.id, fetchDetail])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Send admin message
  const handleSendMessage = async () => {
    if (!selectedComplaint || !newMessage.trim() || isSending) return
    setIsSending(true)
    try {
      const res = await fetch(`/api/dashboard/complaints/${selectedComplaint.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
        // Refresh complaint status
        fetchComplaints(pagination.page, tabToStatus[activeTab] || "", searchQuery)
      }
    } catch {
      console.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  // Add admin note
  const handleAddNote = async () => {
    if (!selectedComplaint || !newNote.trim() || isAddingNote) return
    setIsAddingNote(true)
    try {
      const res = await fetch(`/api/dashboard/complaints/${selectedComplaint.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [data.note, ...prev])
        setNewNote("")
      }
    } catch {
      console.error("Failed to add note")
    } finally {
      setIsAddingNote(false)
    }
  }

  // Update complaint status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedComplaint) return
    try {
      await fetch(`/api/dashboard/complaints/${selectedComplaint.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      setSelectedComplaint({ ...selectedComplaint, status: newStatus })
      fetchComplaints(pagination.page, tabToStatus[activeTab] || "", searchQuery)
      if (detailTab === "Messages") fetchDetail(selectedComplaint.id)
    } catch {
      console.error("Failed to update status")
    }
  }

  const statusOptions = [
    { value: "open", label: "Reopen", color: "text-amber-600 hover:bg-amber-50" },
    { value: "in_progress", label: "Mark In Progress", color: "text-blue-600 hover:bg-blue-50" },
    { value: "resolved", label: "Resolve", color: "text-green-600 hover:bg-green-50" },
    { value: "closed", label: "Close", color: "text-red-600 hover:bg-red-50" },
  ]

  const tabs = ["All Tickets", "Open", "In Progress", "Resolved", "Closed"]

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Disputes & Support</h1>
            <p className="text-xs text-text-muted mt-0.5">Manage user complaints and support tickets across the platform.</p>
          </div>
          <button
            onClick={() => fetchComplaints(pagination.page, tabToStatus[activeTab] || "", searchQuery)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-white border border-border-default rounded-lg hover:bg-surface-hover transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {[
              { label: "Open", value: stats.open, icon: AlertCircle, bg: "bg-amber-50", color: "text-amber-600" },
              { label: "In Progress", value: stats.in_progress, icon: Clock, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "Resolved", value: stats.resolved, icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
              { label: "Closed", value: stats.closed, icon: Ban, bg: "bg-gray-100", color: "text-gray-500" },
              { label: "Customers", value: stats.by_role?.customer || 0, icon: UserPlus, bg: "bg-sendme-50", color: "text-sendme" },
              { label: "Drivers", value: stats.by_role?.driver || 0, icon: AlertTriangle, bg: "bg-purple-50", color: "text-purple-600" },
            ].map((s) => {
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
        )}

        {/* Search + Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5">
            <Search size={12} className="text-text-muted" />
            <input
              placeholder="Search by subject, customer, or ticket ID..."
              className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => handleSearch("")}><X size={12} className="text-text-muted" /></button>
            )}
          </div>
          <select
            className="bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-text-secondary focus:outline-none"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); fetchComplaints(1, tabToStatus[activeTab] || "", searchQuery) }}
          >
            <option value="">All Categories</option>
            <option value="order">Order</option>
            <option value="payment">Payment</option>
            <option value="driver">Driver</option>
            <option value="app">App</option>
            <option value="other">Other</option>
          </select>
          <select
            className="bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-text-secondary focus:outline-none"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); fetchComplaints(1, tabToStatus[activeTab] || "", searchQuery) }}
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="driver">Drivers</option>
            <option value="organization">Organizations</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-border-light mb-3">
          <div className="flex gap-0">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                  activeTab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"
                }`}
              >
                {t}
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === t ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                }`}>
                  {(tabCounts[t] || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-xl border border-border-default overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-sendme" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-text-muted">No complaints found</p>
              </div>
            ) : (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border-light text-text-muted">
                    <th className="text-left px-3 py-2.5 font-medium">Ticket</th>
                    <th className="text-left px-3 py-2.5 font-medium">User</th>
                    <th className="text-left px-3 py-2.5 font-medium">Category</th>
                    <th className="text-left px-3 py-2.5 font-medium">Role</th>
                    <th className="text-left px-3 py-2.5 font-medium">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium">Updated</th>
                    <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`border-b border-border-light cursor-pointer hover:bg-surface-secondary transition-colors ${
                        selectedComplaint?.id === c.id ? "bg-sendme-50" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-text-primary">{c.subject}</p>
                        <p className="text-[9px] text-text-muted font-mono">#{c.id.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[9px] font-semibold shrink-0">
                            {c.user?.full_name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{c.user?.full_name || "Unknown"}</p>
                            <p className="text-[9px] text-text-muted">{c.user?.phone || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${categoryColor(c.category)}`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${roleColor(c.user_role)}`}>
                          {c.user_role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${statusColor(c.status)}`}>
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-text-muted">{timeAgo(c.updated_at || c.created_at)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.unread_count_admin > 0 && (
                            <span className="text-[9px] font-bold bg-danger text-white px-1.5 py-0.5 rounded-full">
                              {c.unread_count_admin}
                            </span>
                          )}
                          <button className="p-1 hover:bg-surface-secondary rounded">
                            <MoreHorizontal size={14} className="text-text-muted" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && complaints.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border-light text-[10px] text-text-muted">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === pagination.page ? "bg-sendme text-white" : "text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sidebar */}
      {selectedComplaint && (
        <div className="w-[380px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          {/* Detail Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text-primary truncate">{selectedComplaint.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-medium ${statusColor(selectedComplaint.status)}`}>
                  {selectedComplaint.status.replace("_", " ")}
                </span>
                <span className="text-[9px] text-text-muted font-mono">#{selectedComplaint.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
            <button onClick={() => setSelectedComplaint(null)} className="p-1 hover:bg-surface-secondary rounded ml-2">
              <X size={16} className="text-text-muted" />
            </button>
          </div>

          {/* Detail Tabs */}
          <div className="flex gap-0 border-b border-border-light px-4">
            {["Messages", "Details", "Notes", "Activity"].map((t) => (
              <button
                key={t}
                onClick={() => setDetailTab(t)}
                className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                  detailTab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"
                }`}
              >
                {t}
                {t === "Messages" && messages.length > 0 && (
                  <span className="ml-1 text-[9px] bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">
                    {messages.length}
                  </span>
                )}
                {t === "Notes" && notes.length > 0 && (
                  <span className="ml-1 text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                    {notes.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {detailLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin text-sendme" />
              </div>
            ) : (
              <>
                {/* Messages Tab */}
                {detailTab === "Messages" && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-3 overflow-y-auto mb-3" style={{ maxHeight: "calc(100vh - 300px)" }}>
                      {messages.map((m) => (
                        <div key={m.id} className={`flex gap-2 ${m.sender_type === "admin" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${
                            m.sender_type === "admin" ? "bg-sendme text-white" : "bg-surface-secondary text-text-muted"
                          }`}>
                            {m.sender_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className={`max-w-[260px] ${m.sender_type === "admin" ? "text-right" : ""}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-medium text-text-primary">
                                {m.sender_type === "admin" ? `rep ${m.sender_name}` : m.sender_name}
                              </span>
                              <span className="text-[8px] text-text-muted">{formatTime(m.created_at)}</span>
                            </div>
                            <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                              m.sender_type === "admin"
                                ? "bg-sendme text-white rounded-tr-sm"
                                : "bg-surface-secondary text-text-secondary rounded-tl-sm"
                            }`}>
                              {m.message}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    {selectedComplaint.status !== "closed" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border-light">
                        <input
                          className="flex-1 text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                          placeholder="Type a message as admin..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className="bg-sendme text-white p-2 rounded-lg disabled:opacity-50"
                        >
                          {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                      </div>
                    )}

                    {/* Status Quick Actions */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {statusOptions
                        .filter((s) => s.value !== selectedComplaint.status)
                        .map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleStatusChange(s.value)}
                            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border border-border-default hover:bg-surface-secondary transition-colors ${s.color}`}
                          >
                            {s.label}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {detailTab === "Details" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">User Information</p>
                      <div className="space-y-1.5">
                        {[
                          { label: "Name", value: selectedComplaint.user?.full_name || "Unknown" },
                          { label: "Phone", value: selectedComplaint.user?.phone || "—" },
                          { label: "Email", value: selectedComplaint.user?.email || "—" },
                          { label: "Role", value: selectedComplaint.user_role },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between">
                            <span className="text-[11px] text-text-muted">{row.label}</span>
                            <span className="text-[11px] font-medium text-text-primary">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Ticket Information</p>
                      <div className="space-y-1.5">
                        {[
                          { label: "Category", value: selectedComplaint.category },
                          { label: "Priority", value: selectedComplaint.status === "open" ? "Normal" : "High" },
                          { label: "Created", value: formatDate(selectedComplaint.created_at) },
                          { label: "Auto-closes", value: formatDate(selectedComplaint.auto_close_at) },
                          { label: "Order ID", value: selectedComplaint.order_id || "—" },
                          { label: "Assigned To", value: selectedComplaint.assigned_admin_name || "Unassigned" },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between">
                            <span className="text-[11px] text-text-muted">{row.label}</span>
                            <span className="text-[11px] font-medium text-text-primary">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Description</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed bg-surface-secondary rounded-lg p-3">
                        {selectedComplaint.description}
                      </p>
                    </div>

                    {/* Status Actions */}
                    <div>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {statusOptions
                          .filter((s) => s.value !== selectedComplaint.status)
                          .map((s) => (
                            <button
                              key={s.value}
                              onClick={() => handleStatusChange(s.value)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium hover:bg-surface-secondary transition-colors"
                            >
                              {s.value === "resolved" && <CheckCircle size={12} className="text-green-600" />}
                              {s.value === "closed" && <Ban size={12} className="text-red-600" />}
                              {s.value === "in_progress" && <Clock size={12} className="text-blue-600" />}
                              {s.value === "open" && <AlertCircle size={12} className="text-amber-600" />}
                              {s.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Tab (Admin Internal) */}
                {detailTab === "Notes" && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-[11px] font-medium text-amber-700 flex items-center gap-1.5">
                        <StickyNote size={12} /> Internal Notes
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">These notes are only visible to admins, never to the user.</p>
                    </div>

                    {/* Add Note Input */}
                    <div className="flex items-start gap-2">
                      <textarea
                        className="flex-1 text-[11px] border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme resize-none"
                        placeholder="Add an internal note for other admins..."
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isAddingNote}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-[11px] font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {isAddingNote ? <Loader2 size={12} className="animate-spin" /> : <StickyNote size={12} />}
                      Add Note
                    </button>

                    {/* Notes List */}
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div key={n.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-text-primary">{n.admin_name}</span>
                            <span className="text-[9px] text-text-muted">{formatDate(n.created_at)} {formatTime(n.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{n.note}</p>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <p className="text-[11px] text-text-muted text-center py-4">No internal notes yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {detailTab === "Activity" && (
                  <div className="space-y-3">
                    {[
                      { action: "Ticket created", detail: `${selectedComplaint.user?.full_name || "User"} submitted: ${selectedComplaint.subject}`, time: selectedComplaint.created_at, color: "text-blue-600" },
                      { action: "Last updated", detail: `Status: ${selectedComplaint.status.replace("_", " ")}`, time: selectedComplaint.updated_at, color: "text-gray-500" },
                      { action: "Auto-close scheduled", detail: `Will auto-close on ${formatDate(selectedComplaint.auto_close_at)}`, time: selectedComplaint.auto_close_at, color: "text-amber-500" },
                      ...(selectedComplaint.assigned_admin_name ? [{ action: "Assigned", detail: `Assigned to ${selectedComplaint.assigned_admin_name}`, time: selectedComplaint.updated_at, color: "text-purple-600" }] : []),
                    ].map((a, i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className={`mt-0.5 ${a.color}`}>
                          <Clock size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-medium text-text-primary">{a.action}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{a.detail}</p>
                          <p className="text-[9px] text-text-muted mt-0.5">{timeAgo(a.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
