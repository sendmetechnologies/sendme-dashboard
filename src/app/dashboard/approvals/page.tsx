"use client"
import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import {
  Search, Filter, ChevronDown, X, MoreHorizontal, CheckCircle, XCircle, Clock,
  FileText, DollarSign, ShieldCheck, MessageSquare, Loader2, ChevronLeft, ChevronRight
} from "lucide-react"

interface ApprovalItem {
  id: string
  type: string
  status: string
  priority: string
  requested_by: string
  requested_by_role: string
  avatar: string
  created_at: string
  details: Record<string, any>
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  by_type: { driver_verification: number; org_verification: number; payout_request: number; marketer_verification: number }
}

const typeLabels: Record<string, string> = {
  driver_verification: "Driver Verification",
  org_verification: "Org Verification",
  payout_request: "Payout Request",
  marketer_verification: "Marketer Verification",
}

const typeColors: Record<string, string> = {
  driver_verification: "bg-blue-50 text-blue-600",
  org_verification: "bg-purple-50 text-purple-600",
  payout_request: "bg-green-50 text-green-600",
  marketer_verification: "bg-orange-50 text-orange-600",
}

const typeIcons: Record<string, any> = {
  driver_verification: ShieldCheck,
  org_verification: ShieldCheck,
  payout_request: DollarSign,
  marketer_verification: FileText,
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
}

const priorityColors: Record<string, string> = {
  high: "bg-red-50 text-red-600",
  medium: "bg-yellow-50 text-yellow-600",
  low: "bg-blue-50 text-blue-600",
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
}

function formatCurrency(n: number) {
  return "₦" + n.toLocaleString("en-NG")
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [selected, setSelected] = useState<ApprovalItem | null>(null)
  const [detailTab, setDetailTab] = useState("Details")
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [acting, setActing] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const fetchData = useCallback(async (page: number, tab: string, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (tab && tab !== "all") params.set("tab", tab)
    if (search) params.set("search", search)
    if (typeFilter) params.set("type", typeFilter)

    try {
      const res = await fetch(`/api/dashboard/approvals?${params.toString()}`)
      const data = await res.json()
      setItems(data.items || [])
      setStats(data.stats || null)
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch {
      console.error("Failed to fetch approvals")
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    fetchData(1, activeTab, searchQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchData(1, tab, searchQuery)
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, activeTab, q)
  }

  const handleAction = async (action: "approve" | "reject") => {
    if (!selected || acting) return
    setActing(true)
    try {
      const res = await fetch(`/api/dashboard/approvals/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? rejectReason : undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelected({ ...selected, status: data.status })
        setRejectReason("")
        fetchData(pagination.page, activeTab, searchQuery)
      }
    } catch {
      console.error("Failed to process approval")
    } finally {
      setActing(false)
    }
  }

  const tabCounts = {
    all: stats?.total || 0,
    pending: stats?.pending || 0,
    approved: stats?.approved || 0,
    rejected: stats?.rejected || 0,
  }

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Approvals</h1>
            <p className="text-xs text-text-muted mt-0.5">Review and approve pending actions and requests across the platform.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {[
            { label: "All Pending", value: stats?.pending || 0, icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
            { label: "Driver Verifications", value: stats?.by_type?.driver_verification || 0, icon: ShieldCheck, bg: "bg-blue-50", color: "text-blue-600" },
            { label: "Org Verifications", value: stats?.by_type?.org_verification || 0, icon: ShieldCheck, bg: "bg-purple-50", color: "text-purple-600" },
            { label: "Payout Requests", value: stats?.by_type?.payout_request || 0, icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
            { label: "Approved", value: stats?.approved || 0, icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
            { label: "Rejected", value: stats?.rejected || 0, icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
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

        {/* Search + Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5">
            <Search size={12} className="text-text-muted" />
            <input
              placeholder="Search by ID, name, or type..."
              className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); fetchData(1, activeTab, searchQuery) }}
          >
            <option value="">All Types</option>
            <option value="driver_verification">Driver Verification</option>
            <option value="org_verification">Org Verification</option>
            <option value="payout_request">Payout Request</option>
            <option value="marketer_verification">Marketer Verification</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-border-light mb-3">
          <div className="flex gap-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}
              >
                {t.label}
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"}`}>
                  ({tabCounts[t.key as keyof typeof tabCounts] || 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border-default overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <CheckCircle size={32} className="mb-2 opacity-40" />
              <p className="text-[11px]">No approval requests found</p>
            </div>
          ) : (
            <>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border-light text-text-muted">
                    <th className="text-left px-3 py-2.5 font-medium">Request</th>
                    <th className="text-left px-3 py-2.5 font-medium">Type</th>
                    <th className="text-left px-3 py-2.5 font-medium">Requested By</th>
                    <th className="text-left px-3 py-2.5 font-medium">Priority</th>
                    <th className="text-left px-3 py-2.5 font-medium">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium">Requested On</th>
                    <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const TI = typeIcons[r.type] || FileText
                    return (
                      <tr
                        key={r.id}
                        onClick={() => { setSelected(r); setDetailTab("Details") }}
                        className={`border-b border-border-light cursor-pointer hover:bg-surface-secondary transition-colors ${selected?.id === r.id ? "bg-sendme-50" : ""}`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${typeColors[r.type] || "bg-gray-50 text-gray-600"}`}><TI size={12} /></div>
                            <p className="font-medium text-text-primary">{r.id}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${typeColors[r.type] || "bg-gray-50 text-gray-600"}`}>{typeLabels[r.type] || r.type}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-[8px] font-semibold shrink-0">{r.avatar}</div>
                            <div>
                              <p className="font-medium text-text-primary">{r.requested_by}</p>
                              <p className="text-[9px] text-text-muted">{r.requested_by_role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${priorityColors[r.priority] || "bg-gray-50 text-gray-600"}`}>{r.priority}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${statusColors[r.status] || "bg-gray-50 text-gray-600"}`}>{r.status}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-text-primary">{formatDate(r.created_at)}</p>
                          <p className="text-[9px] text-text-muted">{formatTime(r.created_at)}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button className="p-1 hover:bg-surface-secondary rounded"><MoreHorizontal size={14} className="text-text-muted" /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-3 py-2 border-t border-border-light text-[10px] text-text-muted">
                <span>Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchData(pagination.page - 1, activeTab, searchQuery)}
                    className="px-2 py-1 border border-border-default rounded disabled:opacity-40"
                  ><ChevronLeft size={10} /></button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchData(p, activeTab, searchQuery)}
                      className={`px-2 py-1 border border-border-default rounded text-[9px] ${p === pagination.page ? "bg-sendme text-white" : ""}`}
                    >{p}</button>
                  ))}
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchData(pagination.page + 1, activeTab, searchQuery)}
                    className="px-2 py-1 border border-border-default rounded disabled:opacity-40"
                  ><ChevronRight size={10} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail sidebar */}
      {selected && (
        <div className="w-[360px] border-l border-border-light bg-white flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div>
              <p className="font-semibold text-sm text-text-primary">{selected.id}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-medium mt-0.5 capitalize ${statusColors[selected.status] || ""}`}>{selected.status}</span>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-surface-secondary rounded"><X size={16} className="text-text-muted" /></button>
          </div>
          <div className="flex gap-0 border-b border-border-light px-4">
            {["Details"].map((t) => (
              <button key={t} onClick={() => setDetailTab(t)} className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${detailTab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {detailTab === "Details" && (
              <>
                {/* Requester info */}
                <div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">{selected.type === "payout_request" ? "Organization" : "User"} Information</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-sendme-10 text-sendme flex items-center justify-center text-sm font-semibold">{selected.avatar}</div>
                    <div>
                      <p className="text-[12px] font-medium text-text-primary">{selected.requested_by}</p>
                      <p className="text-[10px] text-text-muted">Active • {selected.requested_by_role}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {selected.details?.phone && (
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Phone</span><span className="text-[11px] font-medium text-text-primary">{selected.details.phone}</span></div>
                    )}
                    {selected.details?.email && (
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Email</span><span className="text-[11px] font-medium text-text-primary">{selected.details.email}</span></div>
                    )}
                    {selected.details?.state && (
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">State</span><span className="text-[11px] font-medium text-text-primary">{selected.details.state}</span></div>
                    )}
                    {selected.details?.business_address && (
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Address</span><span className="text-[11px] font-medium text-text-primary text-right max-w-[200px] truncate">{selected.details.business_address}</span></div>
                    )}
                    {selected.details?.registration_number && (
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Reg. Number</span><span className="text-[11px] font-medium text-text-primary">{selected.details.registration_number}</span></div>
                    )}
                  </div>
                </div>

                {/* Payout-specific details */}
                {selected.type === "payout_request" && selected.details?.amount && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Payout Details</p>
                    <div className="p-3 bg-surface-secondary rounded-lg space-y-1.5">
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Amount</span><span className="text-[11px] font-bold text-text-primary">{formatCurrency(selected.details.amount)}</span></div>
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Bank</span><span className="text-[11px] font-medium text-text-primary">{selected.details.bank_name}</span></div>
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Account</span><span className="text-[11px] font-medium text-text-primary">{selected.details.account_number}</span></div>
                      <div className="flex justify-between"><span className="text-[11px] text-text-muted">Name</span><span className="text-[11px] font-medium text-text-primary">{selected.details.account_name}</span></div>
                    </div>
                  </div>
                )}

                {/* Driver ID details */}
                {selected.type === "driver_verification" && selected.details?.id_details && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">ID Details</p>
                    <div className="p-3 bg-surface-secondary rounded-lg space-y-1.5">
                      {typeof selected.details.id_details === "object" &&
                        Object.entries(selected.details.id_details).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-[11px] text-text-muted capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="text-[11px] font-medium text-text-primary">{String(v)}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Vehicle info */}
                {selected.details?.vehicle_info && typeof selected.details.vehicle_info === "object" && Object.keys(selected.details.vehicle_info).length > 0 && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Vehicle Information</p>
                    <div className="p-3 bg-surface-secondary rounded-lg space-y-1.5">
                      {Object.entries(selected.details.vehicle_info).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-[11px] text-text-muted capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="text-[11px] font-medium text-text-primary">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification documents */}
                {selected.details?.verification_documents && typeof selected.details.verification_documents === "object" && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Verification Documents</p>
                    <div className="space-y-2">
                      {Object.entries(selected.details.verification_documents).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-2 border border-border-default rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-text-muted" />
                            <span className="text-[11px] text-text-primary capitalize">{k.replace(/_/g, " ")}</span>
                          </div>
                          {v ? (
                            <a href={String(v)} target="_blank" rel="noopener noreferrer" className="text-[9px] text-sendme font-medium hover:underline">View</a>
                          ) : (
                            <span className="text-[9px] text-text-muted">Not uploaded</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review reason */}
                {selected.details?.review_reason && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Review Notes</p>
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <p className="text-[11px] text-text-secondary leading-relaxed">{selected.details.review_reason}</p>
                    </div>
                  </div>
                )}

                {/* Marketer-specific details */}
                {selected.type === "marketer_verification" && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Marketer Profile</p>
                    <div className="p-3 bg-surface-secondary rounded-lg space-y-1.5">
                      {selected.details?.city && (
                        <div className="flex justify-between"><span className="text-[11px] text-text-muted">City</span><span className="text-[11px] font-medium text-text-primary">{selected.details.city}</span></div>
                      )}
                      {selected.details?.occupation && (
                        <div className="flex justify-between"><span className="text-[11px] text-text-muted">Occupation</span><span className="text-[11px] font-medium text-text-primary">{selected.details.occupation}</span></div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[11px] text-text-muted">Sales Experience</span>
                        <span className={`text-[11px] font-medium ${selected.details?.has_sales_experience ? "text-green-600" : "text-text-muted"}`}>
                          {selected.details?.has_sales_experience ? "Yes" : "No"}
                        </span>
                      </div>
                      {selected.details?.experience_description && (
                        <div className="pt-1">
                          <span className="text-[10px] text-text-muted block mb-0.5">Experience</span>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{selected.details.experience_description}</p>
                        </div>
                      )}
                      {selected.details?.marketer_id && (
                        <div className="flex justify-between"><span className="text-[11px] text-text-muted">Marketer ID</span><span className="text-[11px] font-mono font-medium text-sendme">{selected.details.marketer_id}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions — only for pending */}
                {selected.status === "pending" && (
                  <div>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">Quick Actions</p>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={acting}
                          onClick={() => handleAction("approve")}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sendme text-white rounded-lg text-[11px] font-medium hover:bg-sendme/90 disabled:opacity-50"
                        >
                          {acting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                        </button>
                        <button
                          disabled={acting}
                          onClick={() => handleAction("reject")}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11px] font-medium hover:bg-red-100 disabled:opacity-50"
                        >
                          {acting ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                        </button>
                      </div>
                      {selected.status === "pending" && (
                        <input
                          type="text"
                          placeholder="Rejection reason (optional)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-lg text-[11px] placeholder:text-text-muted focus:outline-none focus:border-sendme"
                        />
                      )}
                    </div>
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
