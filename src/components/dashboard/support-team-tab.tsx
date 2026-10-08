"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Search, ShieldCheck, Key, Copy, Check, RefreshCw,
  Trash2, X, AlertTriangle, MessageSquare, Scale, StickyNote,
  MapPin, CheckCircle2, Loader2, Mail, Edit2, Bell
} from "lucide-react";
import { Card } from "@/components/ui/card";

export interface SupportTeamMember {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  access_code: string;
  permissions: string[];
  status: "active" | "suspended";
  created_at: string;
  last_active?: string | null;
  resolved_count: number;
}

const AVAILABLE_PERMISSIONS = [
  { id: "resolve_disputes", label: "Dispute Resolution", desc: "Resolve delivery & payment complaints" },
  { id: "live_chat", label: "Live Customer Chat", desc: "Direct 2-way chat with senders & riders" },
  { id: "internal_notes", label: "Internal Case Notes", desc: "Audit logs & confidential case notes" },
  { id: "telemetry_access", label: "Telemetry & Route Audit", desc: "Live GPS tracking & order route inspection" },
  { id: "sla_monitoring", label: "SLA Monitoring", desc: "Resolution tracking & performance" },
  { id: "receive_broadcast_alerts", label: "WhatsApp Broadcast Alerts", desc: "Immediate DM alerts with rider contact details on new orders" },
];

const ROLE_OPTIONS = [
  "Support Agent",
  "Dispute Resolution Specialist",
  "Senior Support Lead",
  "Customer Experience Executive",
];

export function SupportTeamTab() {
  const [members, setMembers] = useState<SupportTeamMember[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states - Add
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Support Agent");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "resolve_disputes",
    "live_chat",
    "internal_notes",
    "telemetry_access",
    "sla_monitoring",
    "receive_broadcast_alerts",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal states - Edit
  const [editingMember, setEditingMember] = useState<SupportTeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("Support Agent");
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Code Created Success Modal
  const [createdMember, setCreatedMember] = useState<SupportTeamMember | null>(null);
  const [copiedSuccessCode, setCopiedSuccessCode] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support-team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setStats(data.stats || { total: 0, active: 0, suspended: 0 });
      }
    } catch (err) {
      console.error("Failed to load support team members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch("/api/admin/support-team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle_status" }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleRegenerateCode = async (id: string, memberName: string) => {
    if (!confirm(`Generate a new 9-letter access code (XXX - XXX - XXX) for ${memberName}? Their previous code will immediately stop working.`)) return;
    try {
      const res = await fetch("/api/admin/support-team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "regenerate_code" }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`New Access Code for ${memberName}: ${data.member.access_code}`);
        fetchMembers();
      }
    } catch (err) {
      alert("Failed to regenerate code");
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the support team?`)) return;
    try {
      const res = await fetch(`/api/admin/support-team?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Agent name is required");
      return;
    }
    if (!phone.trim()) {
      setFormError("Phone number is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          role,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create support member");
        setSubmitting(false);
        return;
      }

      // Success
      setCreatedMember(data.member);
      setName("");
      setPhone("");
      setEmail("");
      setRole("Support Agent");
      setIsAddModalOpen(false);
      fetchMembers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (member: SupportTeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditPhone(member.phone);
    setEditEmail(member.email || "");
    setEditRole(member.role || "Support Agent");
    setEditStatus(member.status || "active");
    setEditPermissions(Array.isArray(member.permissions) ? [...member.permissions] : []);
    setEditError("");
  };

  const toggleEditPermission = (permId: string) => {
    setEditPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editName.trim()) {
      setEditError("Agent name is required");
      return;
    }
    if (!editPhone.trim()) {
      setEditError("Phone number is required");
      return;
    }

    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch("/api/admin/support-team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMember.id,
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || null,
          role: editRole,
          status: editStatus,
          permissions: editPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update member");
        setEditSubmitting(false);
        return;
      }

      setEditingMember(null);
      fetchMembers();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Network error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.access_code.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">Manage Support Team</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Create and manage support agents. Each member receives a unique 8-digit access code to log into the Support & Disputes portal.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-all shadow-xs"
        >
          <Plus size={15} /> Add Support Member
        </button>
      </div>

      {/* Scope & Capabilities Overview Cards */}
      <div className="bg-surface-secondary/60 border border-border-light rounded-xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2.5 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-sendme" /> Support & Dispute Portal Capabilities
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border border-border-light">
            <div className="flex items-center gap-2 mb-1">
              <Scale size={14} className="text-sendme" />
              <span className="text-xs font-bold text-text-primary">Dispute Resolution</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Investigate delivery and payment disputes. Update ticket status to Open, In Progress, Resolved, or Closed.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-border-light">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={14} className="text-info" />
              <span className="text-xs font-bold text-text-primary">Live 2-Way Chat</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Directly message senders and riders inside active complaint threads to resolve order issues in real time.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-border-light">
            <div className="flex items-center gap-2 mb-1">
              <StickyNote size={14} className="text-warning" />
              <span className="text-xs font-bold text-text-primary">Internal Notes</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Write confidential investigation logs and audit notes attached to complaints, visible only to team members.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-border-light">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-purple-600" />
              <span className="text-xs font-bold text-text-primary">Telemetry & Orders</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Inspect order pickup/dropoff points, live GPS coordinates, and rider assignments related to dispute cases.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3.5">
          <p className="text-[11px] text-text-muted">Total Support Team</p>
          <p className="text-xl font-bold text-text-primary mt-1">{stats.total}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-text-muted">Active Agents</p>
          <p className="text-xl font-bold text-sendme mt-1">{stats.active}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-text-muted">Suspended</p>
          <p className="text-xl font-bold text-text-muted mt-1">{stats.suspended}</p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-sm bg-surface-secondary border border-border-default rounded-lg px-3 py-1.5 shadow-xs">
        <Search size={14} className="text-text-muted shrink-0" />
        <input
          type="text"
          placeholder="Search by agent name, phone, code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-xs text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="text-xs text-text-muted hover:text-text-primary">
            ✕
          </button>
        )}
      </div>

      {/* Team Members Table */}
      <div className="bg-white border border-border-default rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-sendme" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <Users size={32} className="mx-auto mb-2 text-text-muted/40" />
            <p className="text-sm font-semibold text-text-primary">No support team members yet</p>
            <p className="text-xs text-text-muted mt-0.5">
              Click &quot;Add Support Member&quot; to register your first support specialist and generate their 8-digit access code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Role & Capabilities</th>
                  <th className="px-4 py-3 font-semibold">WhatsApp Access Code</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date Added</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredMembers.map((member) => {
                  const isCopied = copiedId === member.id;
                  const hasAlerts = member.permissions?.includes("receive_broadcast_alerts");

                  return (
                    <tr key={member.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-xs shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-text-primary">{member.name}</p>
                            <p className="text-[11px] text-text-muted font-mono">{member.phone}</p>
                            {member.email && (
                              <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                <Mail size={10} className="text-text-muted/60" /> {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[11px] font-semibold bg-surface-secondary text-text-primary px-2 py-0.5 rounded-full border border-border-light">
                            {member.role}
                          </span>
                          {hasAlerts && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-sendme border border-emerald-200" title="Receives WhatsApp alerts when new orders are broadcast to riders">
                              <Bell size={10} /> Order Alerts
                            </span>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp Access Code */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-text-primary bg-surface-secondary border border-border-default px-2.5 py-1 rounded-md tracking-wider shadow-2xs select-all">
                            {member.access_code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(member.access_code, member.id)}
                            className="p-1 text-text-muted hover:text-sendme hover:bg-surface-secondary rounded transition-colors"
                            title="Copy Access Code"
                          >
                            {isCopied ? <Check size={14} className="text-sendme" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            member.status === "active"
                              ? "bg-sendme-50 text-sendme"
                              : "bg-danger-light text-danger"
                          }`}
                        >
                          {member.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-xs text-text-primary">
                          {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 text-text-muted hover:text-sendme hover:bg-surface-secondary rounded transition-colors"
                            title="Edit Agent Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member.id)}
                            className="text-[11px] font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded border border-border-default hover:bg-surface-secondary transition-colors"
                            title={member.status === "active" ? "Suspend Agent" : "Activate Agent"}
                          >
                            {member.status === "active" ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleRegenerateCode(member.id, member.name)}
                            className="p-1 text-text-muted hover:text-warning hover:bg-surface-secondary rounded transition-colors"
                            title="Regenerate Access Code"
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-1 text-text-muted hover:text-danger hover:bg-danger-light rounded transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Support Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-default">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-surface-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sendme-50 text-sendme flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Add Support Team Member</h3>
                  <p className="text-[11px] text-text-muted">Generates a unique 9-letter access code (XXX - XXX - XXX) for WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-danger-light rounded-lg text-xs text-danger font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-sendme-50/70 border border-sendme/20 rounded-xl text-[11px] text-sendme-dark leading-relaxed">
                <span className="font-semibold">Note:</span> A team member can be any user type (marketer, sender, rider, org). They will activate and access support by sending this code to our WhatsApp bot.
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fatima Bello"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  WhatsApp Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678 or +234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Email Address <span className="text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. fatima@sendme.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Role / Title
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                >
                  <option value="Support Agent">Support Agent</option>
                  <option value="Dispute Resolution Specialist">Dispute Resolution Specialist</option>
                  <option value="Senior Support Lead">Senior Support Lead</option>
                  <option value="Customer Experience Executive">Customer Experience Executive</option>
                </select>
              </div>

              <div className="pt-2 border-t border-border-light">
                <p className="text-[11px] font-semibold text-text-muted mb-2">Granted Capabilities:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sendme" /> Dispute Resolution</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sendme" /> Live Customer Chat</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sendme" /> Internal Case Notes</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sendme" /> Order Route Audit</span>
                  <span className="flex items-center gap-1.5 col-span-2"><CheckCircle2 size={13} className="text-sendme" /> WhatsApp Broadcast Alerts (New Order Riders)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white text-xs font-semibold rounded-lg hover:bg-sendme-dark transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Generate Access Code & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Support Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-default">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-surface-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sendme-50 text-sendme flex items-center justify-center">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Edit Support Team Member</h3>
                  <p className="text-[11px] text-text-muted">Update agent details, role, status, and permissions</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="p-3 bg-danger-light rounded-lg text-xs text-danger font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  WhatsApp Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Email Address <span className="text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. agent@senndme.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Role / Team Type
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "active" | "suspended")}
                    className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-border-light">
                <p className="text-[11px] font-semibold text-text-muted mb-2">Granted Capabilities / Permissions:</p>
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        onClick={() => toggleEditPermission(perm.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-sendme-50/50 border-sendme/30 text-text-primary"
                            : "bg-surface-secondary/40 border-border-light text-text-muted hover:bg-surface-secondary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by label onClick
                          className="mt-0.5 rounded text-sendme focus:ring-sendme accent-sendme"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight">{perm.label}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white text-xs font-semibold rounded-lg hover:bg-sendme-dark transition-colors disabled:opacity-50"
                >
                  {editSubmitting && <Loader2 size={13} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Code Generated Success Modal */}
      {createdMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center border border-border-default">
            <div className="w-14 h-14 bg-sendme-50 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-sendme">
              <Key size={28} />
            </div>

            <h3 className="text-base font-bold text-text-primary">Support Agent Added!</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              A unique 9-letter access code has been generated for <span className="font-bold text-text-primary">{createdMember.name}</span>.
            </p>

            {/* Generated Code Display */}
            <div className="my-5 p-4 bg-surface-secondary rounded-xl border border-border-default">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                9-Letter WhatsApp Access Code
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-extrabold text-sendme tracking-widest select-all">
                  {createdMember.access_code}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdMember.access_code);
                    setCopiedSuccessCode(true);
                    setTimeout(() => setCopiedSuccessCode(false), 2000);
                  }}
                  className="p-1.5 bg-white border border-border-default rounded-lg text-text-secondary hover:text-sendme transition-colors"
                  title="Copy code"
                >
                  {copiedSuccessCode ? <Check size={16} className="text-sendme" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                Give this code to <span className="font-medium text-text-primary">{createdMember.name}</span>. They simply send this code to our WhatsApp bot from <span className="font-mono text-text-primary">{createdMember.phone}</span> to start their support session.
              </p>
            </div>

            <button
              onClick={() => {
                setCreatedMember(null);
                setCopiedSuccessCode(false);
              }}
              className="w-full py-2.5 bg-sendme text-white rounded-xl text-xs font-bold hover:bg-sendme-dark transition-colors shadow-xs"
            >
              Done & Return to Team List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
