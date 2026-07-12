"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Send } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      sessionStorage.setItem("otp_admin_id", data.adminId)
      sessionStorage.setItem("otp_display_name", data.displayName)
      sessionStorage.setItem("otp_masked_email", data.maskedEmail)
      router.push("/otp")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sendme-50 via-white to-sendme-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-sendme rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sendme/20">
            <Send size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Send<span className="text-sendme">Me</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border-default rounded-2xl p-8 shadow-sm space-y-5">
          <div className="text-center mb-2">
            <h2 className="text-text-primary font-semibold text-lg">Welcome back</h2>
            <p className="text-text-muted text-sm mt-1">Sign in to your admin account</p>
          </div>

          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-xs font-medium text-center">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth>
            Sign In
          </Button>
        </form>

        <p className="text-center text-text-muted text-xs mt-6">
          Secure Admin Access Only
        </p>
      </div>
    </div>
  )
}
