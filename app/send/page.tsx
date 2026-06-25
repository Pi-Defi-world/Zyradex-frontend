"use client"

import { useEffect, useState } from "react"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { SendForm } from "@/components/send/send-form"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function SendPage() {
  const { user, isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const [localWallet, setLocalWallet] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      const stored = getStoredWallet()
      setLocalWallet(stored)
      if (profile?.public_key && stored !== profile.public_key) {
        if (typeof window !== "undefined") {
          localStorage.setItem("zyradex-wallet-address", profile.public_key)
        }
        setLocalWallet(profile.public_key)
      }
    } else {
      setLocalWallet(null)
    }
  }, [isAuthenticated, profile?.public_key])

  const publicKey = isAuthenticated
    ? (profile?.public_key || user?.wallet_address || localWallet || undefined)
    : undefined

  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Send</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Transfer tokens to any Pi Network wallet</p>
        </div>
        <SendForm publicKey={publicKey} />
      </div>
    </div>
  )
}

