"use client"

import { useEffect, useState } from "react"
import { TradeForm } from "@/components/trade/trade-form"
import { Orderbook } from "@/components/trade/orderbook"
import { ActiveOffers } from "@/components/trade/active-offers"
import { RecentTrades } from "@/components/trade/recent-trades"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { AuthErrorDisplay } from "@/components/auth-error-display"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function TradePage() {
  const { user, isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState("native")
  const [selectedCounter, setSelectedCounter] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      const stored = getStoredWallet()
      setLocalWallet(stored)
      // Also sync with profile public_key if available
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

  // Priority: profile.public_key (from DB) > user.wallet_address (from Pi SDK) > localWallet (from localStorage)
  const publicKey = isAuthenticated
    ? (profile?.public_key || user?.wallet_address || localWallet || undefined)
    : undefined

  // Get errors from hooks that might have auth errors
  const { error: profileError } = useUserProfile()

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <AuthErrorDisplay error={profileError} />
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Trading Form - Main Section */}
          <div className="lg:col-span-2">
            <TradeForm publicKey={publicKey} />
          </div>

          {/* Orderbook - Side Panel */}
          <div className="lg:col-span-1">
            <Orderbook 
              onBaseChange={setSelectedBase}
              onCounterChange={setSelectedCounter}
            />
          </div>
        </div>

        {/* Recent Trades - Show when assets are selected */}
        {selectedBase && selectedCounter && (
          <div>
            <RecentTrades base={selectedBase} counter={selectedCounter} />
          </div>
        )}

        {/* Active Offers */}
        {publicKey && (
          <div>
            <ActiveOffers account={publicKey} />
          </div>
        )}
      </div>
    </div>
  )
}


