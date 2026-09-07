"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "kyc_unlocked"

export interface KycUnlock {
  isUnlocked: boolean
  requestUnlock: () => void
  otpOpen: boolean
  closeOtp: () => void
  handleUnlocked: () => void
}

/**
 * Session-wide KYC unlock. Once verified via step-up OTP, sensitive KYC data
 * stays unlocked until logout (persisted in sessionStorage so a browser
 * refresh keeps it unlocked). Clearing the session storage re-locks.
 */
export function useKycUnlock(): KycUnlock {
  const [unlocked, setUnlocked] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from sessionStorage once on mount (client only)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true)
    } catch {}
    setHydrated(true)
  }, [])

  const requestUnlock = useCallback(() => {
    if (!unlocked) setOtpOpen(true)
  }, [unlocked])

  const closeOtp = useCallback(() => setOtpOpen(false), [])
  const handleUnlocked = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {}
    setUnlocked(true)
    setOtpOpen(false)
  }, [])

  // isUnlocked only after hydration so we don't flash locked -> unlocked
  const isUnlocked = hydrated && unlocked

  return { isUnlocked, requestUnlock, otpOpen, closeOtp, handleUnlocked }
}

/** Clear the KYC unlock (call on logout). */
export function clearKycUnlock() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {}
}
