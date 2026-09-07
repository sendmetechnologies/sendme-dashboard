"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { toast } from "sonner"
import { X, Shield, Mail, Loader2 } from "lucide-react"

interface OtpUnlockModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlocked: () => void
}

export function OtpUnlockModal({ isOpen, onClose, onUnlocked }: OtpUnlockModalProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const sendOtp = async () => {
    setSending(true)
    try {
      const res = await fetch("/api/auth/reverify/send", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to send code")
        return false
      }
      setMaskedEmail(data.maskedEmail || "")
      setSent(true)
      setDigits(["", "", "", "", "", ""])
      toast.success("Verification code sent to your email")
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
      return true
    } catch {
      toast.error("Network error. Please try again.")
      return false
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSent(false)
      setMaskedEmail("")
      setDigits(["", "", "", "", "", ""])
      // Auto-send once when first opened; reopening after close requires manual resend
      sendOtp()
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6)
      const newDigits = [...digits]
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newDigits[index + i] = pasted[i]
      }
      setDigits(newDigits)
      const nextIndex = Math.min(index + pasted.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }
    if (value && !/^\d$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const code = digits.join("")
    if (code.length !== 6) {
      toast.error("Enter the full 6-digit code")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reverify/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Invalid or expired code")
        setDigits(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        return
      }
      toast.success("KYC access verified")
      onUnlocked()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sendme-50 rounded-lg text-sendme">
              <Shield size={16} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Verify to view sensitive data</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs text-text-muted mb-1">
            Enter the 6-digit code sent to your admin email to unlock KYC details, documents, and images for this session.
          </p>
          {maskedEmail ? (
            <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-secondary rounded-full px-3 py-1.5 inline-flex mb-4">
              <Mail size={13} className="text-sendme" />
              <span>{maskedEmail}</span>
            </div>
          ) : (
            <p className="text-xs text-text-muted mb-4">{sending ? "Sending code…" : sent ? "Code sent" : ""}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  autoFocus={index === 0}
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => {
                    e.preventDefault()
                    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
                    const newDigits = [...digits]
                    for (let i = 0; i < pasted.length; i++) {
                      if (i < 6) newDigits[i] = pasted[i]
                    }
                    setDigits(newDigits)
                    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
                  }}
                  className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 transition-all focus:outline-none ${
                    digit
                      ? "border-sendme bg-sendme-50 text-sendme"
                      : "border-border-default bg-white text-text-primary focus:border-sendme"
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? "Verifying..." : "Unlock KYC Data"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => sendOtp()}
                disabled={sending}
                className="text-text-muted hover:text-sendme text-xs font-medium transition-colors disabled:opacity-40"
              >
                {sending ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
