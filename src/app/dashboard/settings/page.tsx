"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Mail, Users, Save, Loader2, Plus, Trash2, X,
  ToggleLeft, ToggleRight, ChevronRight, Check, AlertTriangle, Key
} from "lucide-react"

type Tab = "otp" | "referral" | "admins"

interface AdminUser {
  id: string
  username: string
  email: string
  display_name: string
  role: string
  phone: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

function OTPTab({ settings, onSave, saving }: { settings: Record<string, any>; onSave: (key: string, value: any) => Promise<void>; saving: boolean }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings.otp_from_email) setEmail(settings.otp_from_email)
    if (settings.otp_from_name) setName(settings.otp_from_name)
  }, [settings])

  const handleSave = async () => {
    await onSave("otp_from_email", email)
    await onSave("otp_from_name", name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">OTP Sender Email</h3>
        <p className="text-xs text-text-muted mb-4">This email address is used as the sender when sending verification codes to admins during login.</p>
      </div>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">Sender Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@sendme.com"
            className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme transition-colors" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">Sender Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="SendMe"
            className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme transition-colors" />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving || !email || !name}
        className="flex items-center gap-2 px-4 py-2.5 bg-sendme text-white rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? "Saved" : saving ? "Saving..." : "Save Changes"}
      </button>
      <div className="bg-surface-secondary rounded-lg p-4 border border-border-light">
        <h4 className="text-xs font-semibold text-text-primary mb-2">How it works</h4>
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />When an admin logs in, a 6-digit OTP is sent from this email address</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Make sure the email domain has proper DNS records (SPF, DKIM) to avoid spam folders</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />The same sender is used for new admin account verification emails</li>
        </ul>
      </div>
    </div>
  )
}

function ReferralTab({ settings, onSave, saving }: { settings: Record<string, any>; onSave: (key: string, value: any) => Promise<void>; saving: boolean }) {
  const [enabled, setEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings.referral_enabled !== undefined) {
      setEnabled(settings.referral_enabled === true || settings.referral_enabled === "true")
    }
  }, [settings])

  const handleToggle = async () => {
    const next = !enabled
    setEnabled(next)
    await onSave("referral_enabled", next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Referral System</h3>
        <p className="text-xs text-text-muted mb-4">Control whether the referral feature is visible and active in the SendMe mobile app.</p>
      </div>
      <div className="bg-white border border-border-default rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? "bg-sendme-50" : "bg-surface-secondary"}`}>
              <Users size={18} className={enabled ? "text-sendme" : "text-text-muted"} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Referral Feature</p>
              <p className="text-xs text-text-muted">
                {enabled ? "Active \u2014 Users can see and use the referral screen" : "Disabled \u2014 Referral screen is hidden from users"}
              </p>
            </div>
          </div>
          <button onClick={handleToggle} disabled={saving} className="relative">
            {enabled ? <ToggleRight size={40} className="text-sendme" /> : <ToggleLeft size={40} className="text-text-muted" />}
          </button>
        </div>
      </div>
      {saved && (
        <div className="flex items-center gap-2 text-xs text-sendme font-medium"><Check size={14} /> Setting updated successfully</div>
      )}
      <div className="bg-surface-secondary rounded-lg p-4 border border-border-light">
        <h4 className="text-xs font-semibold text-text-primary mb-2">About the referral system</h4>
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />When enabled, users see a referral screen in the app where they can share their referral code</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />When disabled, the referral screen and prompts are hidden from the mobile app</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Existing referral data is preserved when the feature is toggled off</li>
        </ul>
      </div>
    </div>
  )
}

function AdminsTab({ admins }: { admins: AdminUser[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState<"form" | "otp">("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [newAdminId, setNewAdminId] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"admin" | "super_admin">("admin")
  const [otp, setOtp] = useState("")

  const resetForm = () => {
    setUsername(""); setEmail(""); setPassword(""); setDisplayName("")
    setPhone(""); setRole("admin"); setOtp(""); setStep("form")
    setNewAdminId(""); setError(""); setShowCreate(false)
  }

  const handleCreate = async () => {
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, display_name: displayName, role, phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      const otpRes = await fetch("/api/admin/admins/create-send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: data.admin.id }),
      })
      const otpData = await otpRes.json()
      if (!otpRes.ok) { setError(otpData.error); setLoading(false); return }
      setNewAdminId(data.admin.id); setStep("otp"); setLoading(false)
    } catch { setError("Network error"); setLoading(false) }
  }

  const handleVerify = async () => {
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/admin/admins/create-verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: newAdminId, code: otp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      resetForm(); window.location.reload()
    } catch { setError("Network error"); setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this admin account?")) return
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" })
    if (res.ok) window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Admin Accounts</h3>
          <p className="text-xs text-text-muted">Manage admin accounts that can access this dashboard.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors">
          <Plus size={14} /> Create Admin
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <h3 className="text-sm font-bold text-text-primary">{step === "form" ? "Create New Admin" : "Verify OTP"}</h3>
              <button onClick={resetForm} className="p-1 text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <div className="px-5 py-4">
              {error && (
                <div className="mb-4 p-3 bg-danger-light rounded-lg text-xs text-danger font-medium flex items-center gap-2">
                  <AlertTriangle size={14} />{error}
                </div>
              )}
              {step === "form" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary mb-1 block">Username</label>
                      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe"
                        className="w-full text-sm text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary mb-1 block">Display Name</label>
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="John Doe"
                        className="w-full text-sm text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 block">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@sendme.com"
                      className="w-full text-sm text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary mb-1 block">Password</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars"
                        className="w-full text-sm text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary mb-1 block">Phone</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..."
                        className="w-full text-sm text-text-primary placeholder:text-text-muted bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 block">Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as any)}
                      className="w-full text-sm text-text-primary bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme">
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-sendme-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Key size={20} className="text-sendme" />
                    </div>
                    <p className="text-xs text-text-muted">
                      A 6-digit code has been sent to <span className="font-semibold text-text-primary">{email}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 block">Enter OTP Code</label>
                    <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000"
                      maxLength={6}
                      className="w-full text-sm text-text-primary text-center tracking-[8px] placeholder:text-text-muted placeholder:tracking-normal bg-surface-secondary border border-border-light rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme font-mono" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-border-light flex gap-3">
              <button onClick={resetForm}
                className="flex-1 px-3 py-2.5 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
                Cancel
              </button>
              <button
                onClick={step === "form" ? handleCreate : handleVerify}
                disabled={loading || (step === "form" ? !username || !email || !password || !displayName || !phone : otp.length !== 6)}
                className="flex-1 px-3 py-2.5 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                {loading && <Loader2 size={12} className="animate-spin" />}
                {step === "form" ? "Create & Send OTP" : "Verify & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-border-default rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light bg-surface-secondary">
              <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Admin</th>
              <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Role</th>
              <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Status</th>
              <th className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Last Login</th>
              <th className="text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold shrink-0">
                      {admin.display_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{admin.display_name}</p>
                      <p className="text-[10px] text-text-muted">@{admin.username} &middot; {admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    admin.role === "super_admin" ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    admin.is_active ? "bg-sendme-50 text-sendme" : "bg-warning-light text-warning"
                  }`}>
                    {admin.is_active ? "Active" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[10px] text-text-muted">
                    {admin.last_login ? new Date(admin.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(admin.id)} className="p-1.5 text-text-muted hover:text-danger transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-text-muted">No admins found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("otp")
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, adminsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/admins"),
      ])
      if (settingsRes.status === 403) { setAccessDenied(true); setLoading(false); return }
      const settingsData = await settingsRes.json()
      const adminsData = await adminsRes.json()
      setSettings(settingsData.settings || {})
      setAdmins(adminsData.admins || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (key: string, value: any) => {
    setSaving(true)
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-sendme" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">Configure your dashboard preferences.</p>
        </div>
        <div className="bg-white border border-border-default rounded-lg p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={40} className="text-warning mb-3" />
          <p className="text-sm font-semibold text-text-primary">Access Restricted</p>
          <p className="text-xs text-text-muted mt-1">Only Super Admins can access settings.</p>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: "otp", label: "OTP & Email", icon: Mail },
    { key: "referral", label: "Referral System", icon: Users },
    { key: "admins", label: "Admin Management", icon: Users },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Configure your dashboard preferences.</p>
      </div>

      <div className="flex gap-1 bg-white border border-border-default rounded-lg p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.key ? "bg-sendme text-white" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
              }`}>
              <Icon size={14} />{tab.label}
            </button>
          )
        })}
      </div>

      <div className="bg-white border border-border-default rounded-lg p-6">
        {activeTab === "otp" && <OTPTab settings={settings} onSave={handleSave} saving={saving} />}
        {activeTab === "referral" && <ReferralTab settings={settings} onSave={handleSave} saving={saving} />}
        {activeTab === "admins" && <AdminsTab admins={admins} />}
      </div>
    </div>
  )
}
