"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Search, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight,
  Trophy, ImageIcon, MessageSquareText
} from "lucide-react"
import { toast } from "sonner"

interface Review {
  id: string
  user_id: string
  task_id: string
  status: string
  progress: Record<string, any>
  completed_at: string | null
  created_at: string
  updated_at: string
  task?: {
    id: string
    title: string
    description: string | null
    type: string
    points_reward: number
    criteria: Record<string, any>
    icon?: string
  }
  user?: {
    id: string
    full_name: string
    phone: string
    email: string
    role: string
  }
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    pending_review: "bg-amber-50 text-amber-600",
    completed: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-600",
  }
  return map[s] || "bg-gray-100 text-gray-500"
}

function roleColor(r: string) {
  const map: Record<string, string> = {
    customer: "bg-sendme-50 text-sendme",
    driver: "bg-blue-50 text-blue-600",
    organization: "bg-purple-50 text-purple-600",
  }
  return map[r] || "bg-gray-100 text-gray-500"
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const statusLabels: Record<string, string> = {
  pending_review: "Pending Review",
  completed: "Approved",
  rejected: "Rejected",
}

export default function RewardsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending_review")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})

  const fetchReviews = useCallback(async (tab: string, p: number, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab, page: String(p), limit: "20" })
      if (q) params.set("search", q)
      const res = await fetch(`/api/dashboard/rewards?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setReviews(data.reviews || [])
      setTabCounts(data.tabCounts || {})
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err: any) {
      toast.error(err.message || "Failed to load reward submissions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews(activeTab, page, search)
  }, [activeTab, page, fetchReviews])

  const handleAction = async (review: Review, action: "approve" | "reject") => {
    setActingId(review.id)
    try {
      const res = await fetch(`/api/dashboard/rewards/${review.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: action === "reject" ? rejectNote[review.id] || undefined : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      toast.success(action === "approve" ? "Submission approved — points credited" : "Submission rejected")
      fetchReviews(activeTab, page, search)
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    } finally {
      setActingId(null)
    }
  }

  const tabs = [
    { key: "pending_review", label: "Pending Review" },
    { key: "completed", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reward Submissions</h1>
        <p className="text-sm text-text-muted mt-1">
          Review proof-based task submissions. Automatic tasks are credited automatically from order completions.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by task, name, or phone..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border-default rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sendme/30"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-sendme text-sendme"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-text-muted">({tabCounts[t.key] || 0})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-sendme" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No submissions in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: task + user */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">
                      {review.task?.title || "Unknown task"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(review.status)}`}>
                      {statusLabels[review.status] || review.status}
                    </span>
                    {review.user?.role && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColor(review.user.role)}`}>
                        {review.user.role}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-muted mt-1">
                    {review.user?.full_name || "Unknown user"} · {review.user?.phone || "—"} · {review.user?.email || "—"}
                  </p>

                  {/* Submitted proof */}
                  {review.progress && Object.keys(review.progress).length > 0 && (
                    <div className="mt-3 bg-surface-hover rounded-lg p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1">
                        <MessageSquareText size={12} /> Submitted Proof
                      </p>
                      {Object.entries(review.progress)
                        .filter(([k]) => !["admin_note"].includes(k))
                        .map(([key, value]) => {
                          const isUrl = typeof value === "string" && /^https?:\/\//.test(value)
                          return (
                            <div key={key} className="text-xs">
                              <span className="text-text-muted capitalize">{key.replace(/_/g, " ")}: </span>
                              {isUrl ? (
                                <a href={value} target="_blank" rel="noopener noreferrer" className="text-sendme underline inline-flex items-center gap-1">
                                  <ImageIcon size={12} /> View proof
                                </a>
                              ) : (
                                <span className="text-text-primary">{String(value)}</span>
                              )}
                            </div>
                          )
                        })}
                      {review.progress.admin_note && (
                        <p className="text-xs text-text-muted italic">Admin note: {review.progress.admin_note}</p>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-text-muted mt-2">
                    Submitted {formatDate(review.created_at)} {formatTime(review.created_at)} · Points: +{review.task?.points_reward || 0}
                  </p>
                </div>

                {/* Right: actions */}
                {review.status === "pending_review" && (
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction(review, "approve")}
                        disabled={actingId === review.id}
                        className="bg-sendme text-white hover:bg-sendme/90 text-xs px-3 py-1.5"
                      >
                        {actingId === review.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAction(review, "reject")}
                        disabled={actingId === review.id}
                        className="text-danger border-danger/30 hover:bg-danger/5 text-xs px-3 py-1.5"
                      >
                        {actingId === review.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </Button>
                    </div>
                    <input
                      value={rejectNote[review.id] || ""}
                      onChange={(e) => setRejectNote((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      placeholder="Rejection reason (optional)"
                      className="w-48 text-xs border border-border-default rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-sendme/30"
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs px-3 py-1.5"
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs px-3 py-1.5"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
