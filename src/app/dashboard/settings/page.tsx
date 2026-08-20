"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Mail, Users, Save, Loader2, Plus, Trash2, X,
  ToggleLeft, ToggleRight, ChevronRight, Check, AlertTriangle, Key, DollarSign, Play, GripVertical
} from "lucide-react"

type Tab = "otp" | "referral" | "admins" | "fees" | "platform" | "howto"

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
  const [payoutEmail, setPayoutEmail] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings.otp_from_email) setEmail(settings.otp_from_email)
    if (settings.otp_from_name) setName(settings.otp_from_name)
    if (settings.payout_notification_email) setPayoutEmail(settings.payout_notification_email)
  }, [settings])

  const handleSave = async () => {
    await onSave("otp_from_email", email)
    await onSave("otp_from_name", name)
    await onSave("payout_notification_email", payoutEmail)
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

      <div className="border-t border-border-light pt-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Withdrawal Notifications</h3>
        <p className="text-xs text-text-muted mb-4">Email address notified when any user (driver, customer, or organization) requests a withdrawal.</p>
      </div>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">Notification Email</label>
          <input type="email" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} placeholder="sendmetechnologies@gmail.com"
            className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme transition-colors" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !email || !name || !payoutEmail}
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
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Withdrawal request emails are sent to the notification email above</li>
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

function WithdrawalFeeTab({ settings, onSave, saving }: { settings: Record<string, any>; onSave: (key: string, value: any) => Promise<void>; saving: boolean }) {
  const [fee, setFee] = useState("0")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings.withdrawal_fee !== undefined) {
      setFee(String(settings.withdrawal_fee || "0"))
    }
  }, [settings])

  const handleSave = async () => {
    const numFee = parseInt(fee, 10) || 0
    await onSave("withdrawal_fee", numFee)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Withdrawal Fee</h3>
        <p className="text-xs text-text-muted mb-4">Set a flat fee in Naira that is charged when a user withdraws from their wallet. Set to 0 for no fee.</p>
      </div>
      <div className="bg-white border border-border-default rounded-lg p-5 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-sendme-50 flex items-center justify-center">
            <DollarSign size={18} className="text-sendme" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Withdrawal Fee Amount</p>
            <p className="text-xs text-text-muted">This fee is deducted from the user's wallet on each withdrawal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-secondary border border-border-light rounded-lg px-3 py-2">
            <span className="text-sm font-semibold text-text-muted">₦</span>
            <input
              type="number"
              min="0"
              step="50"
              value={fee}
              onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-24 text-sm text-text-primary bg-transparent focus:outline-none font-semibold"
            />
          </div>
          <span className="text-xs text-text-muted">Naira (digits only)</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-sendme text-white rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving..." : "Save Fee"}
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-xs text-sendme font-medium mt-2"><Check size={14} /> Fee updated successfully</div>
        )}
      </div>
      <div className="bg-surface-secondary rounded-lg p-4 border border-border-light">
        <h4 className="text-xs font-semibold text-text-primary mb-2">How it works</h4>
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />When a user initiates a withdrawal, the fee is added to the total amount deducted from their wallet</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />The fee is logged as a separate debit transaction with the note "Withdrawal fee"</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Setting to ₦0 means no fee is charged on withdrawals</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />The fee applies to all user types: drivers, customers, and organizations</li>
        </ul>
      </div>
    </div>
  )
}

function FeeSettingsTab({ settings, onSave, saving }: { settings: Record<string, any>; onSave: (key: string, value: any) => Promise<void>; saving: boolean }) {
  const [commissionRate, setCommissionRate] = useState("15")
  const [marketerRate, setMarketerRate] = useState("2")
  const [insuranceRate, setInsuranceRate] = useState("5")
  const [walletFundingFee, setWalletFundingFee] = useState("30")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings.commission_rate !== undefined) setCommissionRate(String(Math.round(parseFloat(settings.commission_rate) * 100)))
    if (settings.marketer_commission_rate !== undefined) setMarketerRate(String(Math.round(parseFloat(settings.marketer_commission_rate) * 100)))
    if (settings.insurance_rate !== undefined) setInsuranceRate(String(Math.round(parseFloat(settings.insurance_rate) * 100)))
    if (settings.platform_funding_fee !== undefined) setWalletFundingFee(String(Math.round(parseFloat(settings.platform_funding_fee))))
  }, [settings])

  const handleSave = async () => {
    // These keys are read by the app from platform_settings — write there,
    // not to app_settings, or the app never sees the change.
    const keys = [
      { key: "commission_rate", value: (parseFloat(commissionRate) || 0) / 100 },
      { key: "marketer_commission_rate", value: (parseFloat(marketerRate) || 0) / 100 },
      { key: "insurance_rate", value: (parseFloat(insuranceRate) || 0) / 100 },
    ]
    for (const { key, value } of keys) {
      await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
    }
    // platform_funding_fee lives in app_settings (that's where the app reads it)
    await onSave("platform_funding_fee", parseFloat(walletFundingFee) || 30)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Platform Fee Settings</h3>
        <p className="text-xs text-text-muted mb-4">Configure how delivery fees are split between the platform, riders, and marketers. Changes apply to all new orders.</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="bg-white border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sendme-50 flex items-center justify-center">
              <DollarSign size={18} className="text-sendme" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Platform Commission</p>
              <p className="text-xs text-text-muted">Percentage of order total kept by SendMe</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" min="0" max="100" step="1" value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="15"
              className="w-24 text-sm text-text-primary bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme font-semibold" />
            <span className="text-sm text-text-muted">%</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">Rider receives {(100 - (parseFloat(commissionRate) || 0)).toFixed(0)}% of each order</p>
        </div>

        <div className="bg-white border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sendme-50 flex items-center justify-center">
              <Users size={18} className="text-sendme" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Marketer Commission</p>
              <p className="text-xs text-text-muted">Percentage of platform commission paid to marketers for referrals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" min="0" max="100" step="1" value={marketerRate}
              onChange={(e) => setMarketerRate(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="2"
              className="w-24 text-sm text-text-primary bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme font-semibold" />
            <span className="text-sm text-text-muted">% of commission</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">E.g. at {(parseFloat(commissionRate) || 15)}% platform commission, marketer earns ₦{((parseFloat(commissionRate) || 15) * (parseFloat(marketerRate) || 2) / 100).toFixed(2)} per ₦100 order (if referral exists)</p>
        </div>

        <div className="bg-white border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sendme-50 flex items-center justify-center">
              <DollarSign size={18} className="text-sendme" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Insurance Rate</p>
              <p className="text-xs text-text-muted">Percentage of declared goods value charged for full insurance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" min="0" max="100" step="0.5" value={insuranceRate}
              onChange={(e) => setInsuranceRate(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="5"
              className="w-24 text-sm text-text-primary bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme font-semibold" />
            <span className="text-sm text-text-muted">%</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">Split cover option charges half this rate. Set to 0 to disable insurance.</p>
        </div>

        <div className="bg-white border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sendme-50 flex items-center justify-center">
              <DollarSign size={18} className="text-sendme" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Wallet Funding Fee</p>
              <p className="text-xs text-text-muted">Flat fee in Naira deducted from wallet top-ups before crediting (Novac static account fee)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">₦</span>
            <input type="number" min="0" max="10000" step="10" value={walletFundingFee}
              onChange={(e) => setWalletFundingFee(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="30"
              className="w-24 text-sm text-text-primary bg-surface-secondary border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:border-sendme font-semibold" />
            <span className="text-sm text-text-muted">flat per top-up</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">E.g. on ₦10,000 top-up, user pays ₦{parseFloat(walletFundingFee) || 30} fee and receives ₦{(10000 - (parseFloat(walletFundingFee) || 30)).toLocaleString()} net.</p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 bg-sendme text-white rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? "Saved" : saving ? "Saving..." : "Save Fee Settings"}
      </button>
      {saved && (
        <div className="flex items-center gap-2 text-xs text-sendme font-medium"><Check size={14} /> Fee settings updated successfully</div>
      )}
      <div className="bg-surface-secondary rounded-lg p-4 border border-border-light">
        <h4 className="text-xs font-semibold text-text-primary mb-2">How fee splitting works</h4>
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />On wallet/card orders: rider gets (100% - commission), platform keeps commission %</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />On cash orders: rider gets full earnings, commission is tracked as outstanding balance</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Marketer gets marketer_commission % of the platform commission (only if sender was referred)</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Org-linked riders: earnings go to the organization wallet, not the rider&apos;s personal wallet</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />Riders with outstanding balance from 2+ cash orders are blocked from taking new orders</li>
          <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-sendme" />On wallet funding: flat fee is deducted from the top-up amount before crediting. Fee is set by admin in Naira.</li>
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

interface HelpTopic {
  id: string
  topic: string
  video_url: string
  duration: string
  description: string
  sort_order: number
  target_role: string
  created_at: string
}

const roleOptions = [
  { value: "all", label: "All Users" },
  { value: "customer", label: "Customers" },
  { value: "driver", label: "Drivers" },
  { value: "org", label: "Organizations" },
]

function HelpTopicsTab() {
  const [topics, setTopics] = useState<HelpTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<HelpTopic | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ topic: "", video_url: "", duration: "", description: "", target_role: "all", sort_order: 0 })

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/help-topics")
      const data = await res.json()
      setTopics(data.topics || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTopics() }, [fetchTopics])

  const openCreate = () => {
    setEditing(null)
    setForm({ topic: "", video_url: "", duration: "", description: "", target_role: "all", sort_order: topics.length + 1 })
    setShowForm(true)
  }

  const openEdit = (t: HelpTopic) => {
    setEditing(t)
    setForm({ topic: t.topic, video_url: t.video_url, duration: t.duration, description: t.description, target_role: t.target_role, sort_order: t.sort_order })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.topic || !form.video_url) return
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch("/api/admin/help-topics", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
        if (res.ok) {
          setTopics((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...form } : t).sort((a, b) => a.sort_order - b.sort_order))
        }
      } else {
        const res = await fetch("/api/admin/help-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.topic) {
          setTopics((prev) => [...prev, data.topic].sort((a, b) => a.sort_order - b.sort_order))
        }
      }
      setShowForm(false)
      setEditing(null)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return
    const res = await fetch(`/api/admin/help-topics?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setTopics((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/)
    return match?.[1] || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={20} className="animate-spin text-sendme" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">How to Use Topics</h3>
          <p className="text-xs text-text-muted">Manage the tutorial videos shown in the app's "How to Use" screen. Users filter by their role.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-sendme text-white rounded-lg text-xs font-medium hover:bg-sendme-600 transition-colors">
          <Plus size={14} />Add Topic
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border-default rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light bg-surface-secondary">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Order</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Topic</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Duration</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Video</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id} className="border-b border-border-light last:border-b-0 hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono font-semibold text-text-muted">{t.sort_order}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-text-primary">{t.topic}</p>
                  {t.description && <p className="text-[10px] text-text-muted mt-0.5 max-w-[280px] truncate">{t.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-medium text-text-secondary">{t.duration || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    t.target_role === "all" ? "bg-green-50 text-green-600" :
                    t.target_role === "customer" ? "bg-blue-50 text-blue-600" :
                    t.target_role === "driver" ? "bg-purple-50 text-purple-600" :
                    "bg-orange-50 text-orange-600"
                  }`}>
                    {roleOptions.find((r) => r.value === t.target_role)?.label || t.target_role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {extractVideoId(t.video_url) ? (
                    <a href={t.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-sendme hover:underline">
                      <Play size={10} />YouTube
                    </a>
                  ) : (
                    <span className="text-[10px] text-text-muted">No link</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-text-muted hover:text-sendme transition-colors" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-text-muted hover:text-danger transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-text-muted">No topics yet. Add your first tutorial.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null) } }}>
          <div className="bg-white rounded-xl border border-border-default shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
              <h3 className="text-sm font-semibold text-text-primary">{editing ? "Edit Topic" : "Add Topic"}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-1 text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Topic Title *</label>
                <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. How to Send a Package"
                  className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">YouTube URL *</label>
                <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme transition-colors" />
                {form.video_url && extractVideoId(form.video_url) && (
                  <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-black">
                    <iframe src={`https://www.youtube.com/embed/${extractVideoId(form.video_url)}`} className="w-full h-full" allowFullScreen title="Preview" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Duration</label>
                  <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3:45"
                    className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Role</label>
                  <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full text-sm text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme transition-colors">
                    {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description of what this tutorial covers"
                  className="w-full text-sm text-text-primary placeholder:text-text-muted bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme transition-colors resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-light">
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary border border-border-default rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.topic || !form.video_url}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-sendme rounded-lg hover:bg-sendme-600 transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}{editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
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
      const [settingsRes, platformRes, adminsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/platform-settings"),
        fetch("/api/admin/admins"),
      ])
      if (settingsRes.status === 403) { setAccessDenied(true); setLoading(false); return }
      const settingsData = await settingsRes.json()
      const platformData = await platformRes.json().catch(() => ({ settings: {} }))
      const adminsData = await adminsRes.json()
      // Merge platform_settings (what the app actually reads for fees) on top
      setSettings({ ...(settingsData.settings || {}), ...(platformData.settings || {}) })
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
    { key: "platform", label: "Fee Settings", icon: DollarSign },
    { key: "referral", label: "Referral System", icon: Users },
    { key: "fees", label: "Withdrawal Fee", icon: DollarSign },
    { key: "howto", label: "How To Use", icon: Play },
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
        {activeTab === "platform" && <FeeSettingsTab settings={settings} onSave={handleSave} saving={saving} />}
        {activeTab === "referral" && <ReferralTab settings={settings} onSave={handleSave} saving={saving} />}
        {activeTab === "fees" && <WithdrawalFeeTab settings={settings} onSave={handleSave} saving={saving} />}
        {activeTab === "howto" && <HelpTopicsTab />}
        {activeTab === "admins" && <AdminsTab admins={admins} />}
      </div>
    </div>
  )
}
