"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Loader2, ChevronRight, Users, Copy } from "lucide-react"

interface TreeNode {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  role: string
  state: string | null
  username: string | null
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

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard")
  } catch {
    toast.error("Copy failed")
  }
}

function waLink(phone: string) {
  let digits = (phone || "").replace(/\D/g, "")
  if (digits.startsWith("0")) digits = "234" + digits.slice(1)
  else if (digits.length === 10) digits = "234" + digits
  return `https://wa.me/${digits}`
}

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function TreeNodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface-secondary/50 transition-colors ${depth > 0 ? "border-l-2 border-border-light pl-3 ml-2" : ""}`}
        onClick={() => setDetailsOpen(!detailsOpen)}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded(!expanded) }}
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

      {detailsOpen && (
        <div className="mb-2 ml-6 p-3 bg-surface-secondary rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-text-muted mb-0.5">Email</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-text-primary truncate">{node.email}</span>
                <button
                  type="button"
                  onClick={() => copyText(node.email)}
                  className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-border-light transition-colors shrink-0"
                  title="Copy email"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-text-muted mb-0.5">Phone</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-text-primary truncate">{node.phone}</span>
                <button
                  type="button"
                  onClick={() => copyText(node.phone)}
                  className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-border-light transition-colors shrink-0"
                  title="Copy phone"
                >
                  <Copy size={12} />
                </button>
                <a
                  href={waLink(node.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-sendme-50 text-sendme hover:bg-sendme/20 transition-colors shrink-0"
                  title="Message on WhatsApp"
                >
                  <WhatsAppIcon size={14} />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
            <span>Role: <span className="font-semibold text-text-primary">{roleLabel(node.role)}</span></span>
            {verificationLabel(node.verificationStatus) && (
              <span>Verification: <span className="font-semibold text-text-primary">{verificationLabel(node.verificationStatus)}</span></span>
            )}
            {node.state && <span>State: <span className="font-semibold text-text-primary">{node.state}</span></span>}
            {node.username && <span>Username: <span className="font-semibold text-text-primary">{node.username}</span></span>}
            <span>Joined: <span className="font-semibold text-text-primary">{formatDate(node.joinedAt)}</span></span>
            {node.convertedAt && <span>Converted: <span className="font-semibold text-text-primary">{formatDate(node.convertedAt)}</span></span>}
            {node.commissionAmount > 0 && (
              <span>
                Commission: <span className="font-semibold text-sendme">₦{node.commissionAmount.toLocaleString()}</span>
                <span className="text-text-muted"> ({node.commissionPaid ? "paid" : "unpaid"})</span>
              </span>
            )}
          </div>
        </div>
      )}

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
