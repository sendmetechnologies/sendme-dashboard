"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      sessionStorage.setItem("otp_admin_id", data.adminId);
      sessionStorage.setItem("otp_display_name", data.displayName);
      sessionStorage.setItem("otp_masked_email", data.maskedEmail);
      router.push("/otp");
    } catch {
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4">
      {/* Background Geometric Grid + Subtle Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#158A5E14_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#158A5E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Platform Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#158A5E]/10 overflow-hidden">
            <Image
              src="/icon.png"
              alt="SendMe"
              width={42}
              height={42}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Send<span className="text-[#158A5E]">Me</span>{" "}
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md align-middle border border-gray-200">
              Admin
            </span>
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-normal">
            Platform Command & Administration Center
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-7 shadow-xl shadow-gray-200/60 relative overflow-hidden">
          {/* Top Green Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#158A5E] via-[#1CA470] to-[#158A5E]" />

          <div className="text-center mb-5">
            <h2 className="text-gray-900 font-bold text-base">Welcome Back</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Sign in with your administrator credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your admin username"
              autoComplete="username"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secure password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 animate-fadeIn">
                <p className="text-red-700 text-xs font-medium text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="bg-[#158A5E] hover:bg-[#10704B] text-white shadow-md shadow-[#158A5E]/20 font-semibold text-xs py-3 mt-1"
            >
              Sign In to Command Center &rarr;
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck size={14} className="text-[#158A5E]" /> Multi-Factor Authentication & 2FA Protected
            </span>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-gray-400">
            SendMe Operations & Infrastructure Engine
          </p>
        </div>
      </div>
    </div>
  );
}
