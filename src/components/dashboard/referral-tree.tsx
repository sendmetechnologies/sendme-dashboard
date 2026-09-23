"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Loader2, ChevronRight, Users } from "lucide-react"

interface TreeNode {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  role: string
  referralStatus: string | null
  verificationStatus: string | null
  convertedAt: string | null
  commissionAmount: number
  commissionPaid: boolean
  joinedAt: string
  isMarketer: boolean
  children: TreeNode[]
}

interface TreeData {
  marketer: { id: string; name: string; marketerId: string | null }
  totalDirect: number
  tree: TreeNode[]
}

function roleLabel(role: string) {
  if (role === "driver") return "Courier"
  if (role === "organization") return "Org"
  return "Customer"
}

function roleColor(role: string) {
  if (role === "driver") return "bg-blue-50 text-blue-700"
  if (role === "organization") return "bg-purple-50 text-purple-700"
  return "bg-green-50 text-green-700"
}

function verificationLabel(status: string | null) {
  if (!status) return null
  const map: Record<string, string> = {
    verified: "Verified",
    under_review: "Under review",
    pending: "Pending",
    rejected: "Rejected",
    approved: "Approved",
    suspended: "Suspended",
  }
  return map[status] || status
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function TreeNodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div className={`flex items-center gap-2.5 py-2 ${depth > 0 ? "border-l-2 border-border-light pl-3 ml-2" : ""}`}>
        <button
          type="button"
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-4 h-4 flex items-center justify-center text-text-muted shrink-0 ${hasChildren ? "" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight size={14} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
        <div className="w-8 h-8 bg-sendme-50 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-sendme">{(node.name || "?")[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-text-primary truncate">{node.name}</p>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${roleColor(node.role)}`}>
              {roleLabel(node.role)}
            </span>
            {node.isMarketer && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sendme-50 text-sendme">Marketer</span>
            )}
          </div>
          <p className="text-[10px] text-text-muted truncate">{node.email} {node.phone ? `• ${node.phone}` : ""}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-text-muted">Joined {formatDate(node.joinedAt)}</p>
          {node.commissionAmount > 0 && (
            <p className="text-[10px] font-semibold text-sendme">₦{node.commissionAmount.toLocaleString()}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {verificationLabel(node.verificationStatus) && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-muted">
              {verificationLabel(node.verificationStatus)}
            </span>
          )}
          {node.referralStatus && node.referralStatus !== "converted" && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-warning-light text-warning">
              {node.referralStatus}
            </span>
          )}
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeView key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ReferralTreeModal({ marketerId, onClose }: { marketerId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TreeData | null>(null)

  useEffect(() => {
    if (!marketerId) return
    setLoading(true)
    fetch(`/api/dashboard/marketers/${marketerId}/tree`)
      .then((r) => r.json())
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [marketerId])

  return (
    <Modal isOpen onClose={onClose} title="Referral Tree" size="xl">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-sendme" />
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-xs text-text-muted">Failed to load referral tree</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
            <div className="w-10 h-10 bg-sendme-50 rounded-lg flex items-center justify-center text-sendme font-bold">
              {(data.marketer.name || "?")[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-text-primary">{data.marketer.name}</p>
              <p className="text-[11px] text-text-muted">{data.marketer.marketerId || "No marketer ID"}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-text-primary">{data.totalDirect}</p>
              <p className="text-[9px] text-text-muted">Direct referrals</p>
            </div>
          </div>

          {data.tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Users size={24} className="text-text-muted/30 mb-2" />
              <p className="text-xs text-text-muted">No referrals yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.tree.map((node) => (
                <TreeNodeView key={node.id} node={node} depth={0} />
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
