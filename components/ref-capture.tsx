"use client"

import { useEffect } from "react"

const REF_STORAGE_KEY = "zyradex_referral_ref"

/**
 * Captures ?ref= from URL on page load and stores in sessionStorage
 * so it can be passed to signin when the user authenticates.
 */
export function RefCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref && ref.trim() !== "") {
      sessionStorage.setItem(REF_STORAGE_KEY, ref.trim())
    }
  }, [])
  return null
}

export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(REF_STORAGE_KEY)
}

export function clearStoredRef(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(REF_STORAGE_KEY)
}
