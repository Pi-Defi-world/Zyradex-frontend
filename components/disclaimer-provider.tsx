"use client"

import { useEffect, useState } from "react"
import { DisclaimerPopup } from "@/components/disclaimer-popup"

export function DisclaimerProvider() {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Show disclaimer on every app load/refresh (once per browser session)
    // Check if it was already accepted in this session
    if (typeof window !== "undefined") {
      const disclaimerAccepted = sessionStorage.getItem("zyradex-disclaimer-accepted")
      if (!disclaimerAccepted) {
        // Small delay to ensure the app is fully loaded
        const timer = setTimeout(() => {
          setDisclaimerOpen(true)
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleDisclaimerClose = () => {
    setDisclaimerOpen(false)
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  return <DisclaimerPopup open={disclaimerOpen} onOpenChange={handleDisclaimerClose} />
}

