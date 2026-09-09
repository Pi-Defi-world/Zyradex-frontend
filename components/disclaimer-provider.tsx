"use client"

import { useEffect, useState } from "react"
import { DisclaimerPopup } from "@/components/disclaimer-popup"

export function DisclaimerProvider() {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      const disclaimerAccepted = sessionStorage.getItem("zyradex-disclaimer-accepted")
      if (!disclaimerAccepted) {
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

  if (!mounted) {
    return null
  }

  return <DisclaimerPopup open={disclaimerOpen} onOpenChange={handleDisclaimerClose} />
}

