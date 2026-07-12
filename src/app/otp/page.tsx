"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft, Mail } from "lucide-react"

export default function OTPPage() {
  const router = useRouter()
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [adminId, setAdminId] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const name = sessionStorage.getItem("otp_display_name")
    const email = sessionStorage.getItem("otp_masked_email")
    const id = sessionStorage.getItem("otp_admin_id")

    if (!id) {
      router.push("/login")
      return
    }

    setAdminId(id)
    if (name) setDisplayName(name)
    if (email) setMaskedEmail(email)

    inputRefs.current[0]?.focus()
  }, [router])

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
    setError("")

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
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
      setError("Enter the full 6-digit code")
      return
    }

    if (!adminId) {
      router.push("/login")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid code")
        setDigits(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        return
      }

      sessionStorage.removeItem("otp_admin_id")
      sessionStorage.removeItem("otp_display_name")
      sessionStorage.removeItem("otp_masked_email")
      router.push("/dashboard")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    if (adminId) {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, resend: true }),
      })
    }
    setResending(false)
    setDigits(["", "", "", "", "", ""])
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sendme-50 via-white to-sendme-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-sendme-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-sendme" />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Verify Your Identity</h1>
          {displayName && (
            <p className="text-text-muted text-sm mt-2">
              Hi <span className="font-medium text-text-secondary">{displayName}</span>, enter the code sent to
            </p>
          )}
          {maskedEmail && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-text-muted bg-surface-secondary rounded-full px-3 py-1.5 inline-flex">
              <Mail size={13} className="text-sendme" />
              <span>{maskedEmail}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border-default rounded-2xl p-8 shadow-sm space-y-6">
          {/* OTP Input */}
          <div className="text-center">
            <p className="text-text-muted text-xs font-medium mb-5">Verification Code</p>
            <div className="flex items-center justify-center gap-2.5">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
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
                  className={`w-11 h-13 text-center text-lg font-bold rounded-xl border-2 transition-all focus:outline-none ${
                    digit
                      ? "border-sendme bg-sendme-50 text-sendme"
                      : "border-border-default bg-white text-text-primary focus:border-sendme"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-xs font-medium text-center">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth>
            {loading ? "Verifying..." : "Verify & Access Dashboard"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-text-muted hover:text-sendme text-sm font-medium transition-colors disabled:opacity-40"
            >
              {resending ? "Resending..." : "Resend Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
