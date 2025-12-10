"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, TrendingUp, ArrowRightLeft, Loader2, Copy, Wallet, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePiPrice } from "@/hooks/usePiPrice"
import { useUserProfile } from "@/hooks/useUserProfile"
import { ReceiveModal } from "@/components/receive-modal"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const { price: piPrice, isLoading: priceLoading } = usePiPrice()

  useEffect(() => {
    // Only restore wallet if user is authenticated
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
  const { balances, totalBalance, isLoading: balancesLoading } = useAccountBalances(publicKey)
  const { tokens, isLoading: tokensLoading } = useTokenRegistry()

  // Calculate USD equivalent
  const usdBalance = useMemo(() => {
    if (!piPrice || !totalBalance || piPrice <= 0) return null
    const calculated = totalBalance * piPrice
    return isNaN(calculated) || !isFinite(calculated) ? null : calculated
  }, [piPrice, totalBalance])

  // Format native balance (Test Pi)
  const nativeBalance = useMemo(() => {
    const native = balances.find((b) => b.assetType === "native")
    return native ? Number(native.amount) : 0
  }, [balances])

  // All users can see minted tokens
  const mintedTokens = useMemo(() => {
    return tokens
  }, [tokens])

  const handleTrade = () => router.push("/trade")
  const handleSwap = () => router.push("/swap")
  const handleManageTokens = () => router.push("/profile")
  const handleCopy = async () => {
    const key = publicKey || ""
    try {
      await navigator.clipboard.writeText(key)
      toast({ title: "Copied", description: "Public key copied to clipboard" })
    } catch {
      toast({ title: "Copy failed", description: key, variant: "destructive" })
    }
  }

  const truncatedKey = useMemo(() => {
    if (!publicKey) return ""
    return `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
  }, [publicKey])


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card className="bg-slate-900/80 border border-slate-800 shadow-2xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Wallet</p>
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <span>{truncatedKey || "No wallet connected"}</span>
                  {publicKey && (
                    <button
                      onClick={handleCopy}
                      className="text-slate-400 hover:text-slate-100 transition-colors"
                      title="Copy public key"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-100" onClick={() => setReceiveModalOpen(true)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-100" onClick={handleSwap}>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <h1 className="text-4xl font-bold">
                  {balancesLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Pi`}
                </h1>
                {usdBalance !== null && piPrice && (
                  <span className="text-sm text-emerald-400">
                    ${usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              {priceLoading && usdBalance === null && piPrice === null && (
                <p className="text-xs text-slate-500">Loading price...</p>
              )}
              {!priceLoading && piPrice === null && totalBalance > 0 && (
                <p className="text-xs text-slate-500">Price unavailable</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => setReceiveModalOpen(true)} className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-50">
                Receive
              </Button>
              <Button onClick={handleTrade} className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-50">
                Trade
              </Button>
              <Button onClick={handleSwap} className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
                Swap
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Wallet className="h-4 w-4" />
                  <span>Tokens</span>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-full border-slate-700" onClick={handleManageTokens}>
                  <Plus className="h-4 w-4 mr-1" />
                  Manage token list
                </Button>
              </div>

              <div className="space-y-2">
                {balancesLoading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading balances...
                  </div>
                ) : balances.length === 0 ? (
                  <div className="text-sm text-slate-400 py-6 text-center border border-slate-800 rounded-xl">
                    {publicKey ? "No balances found" : "Connect a wallet to view your holdings"}
                  </div>
                ) : (
                  balances.map((balance, index) => {
                    const isNative = balance.assetType === "native"
                    const displayName = isNative ? "Test Pi" : balance.assetCode
                    const amount = Number(balance.amount)
                    const usdValue = piPrice && isNative ? amount * piPrice : null

                    return (
                      <div
                        key={`${balance.asset}-${index}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-800 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100 truncate">{displayName}</p>
                          {!isNative && balance.assetIssuer && (
                            <p className="text-xs text-slate-500 truncate">
                              {balance.assetIssuer.slice(0, 8)}...{balance.assetIssuer.slice(-6)}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-slate-100">
                            {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </p>
                          {usdValue !== null && (
                            <p className="text-xs text-slate-500">
                              ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!publicKey && (
          <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Connect a wallet to view your balance and holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/profile")} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                Go to Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />
    </div>
  )
}
