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
import { AuthErrorDisplay } from "@/components/auth-error-display"

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
  const { balances, totalBalance, isLoading: balancesLoading, error: balancesError } = useAccountBalances(publicKey)
  const { tokens, isLoading: tokensLoading, error: tokensError, retry: retryTokens } = useTokenRegistry()

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
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
        <AuthErrorDisplay error={balancesError || tokensError} onRetry={retryTokens} />
        <Card className="shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Wallet</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">{truncatedKey || "No wallet connected"}</span>
                {publicKey && (
                  <button
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy public key"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <h1 className="text-4xl font-bold text-foreground">
                  {balancesLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Pi`}
                </h1>
                {usdBalance !== null && piPrice && (
                  <span className="text-sm text-muted-foreground">
                    ${usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              {priceLoading && usdBalance === null && piPrice === null && (
                <p className="text-xs text-muted-foreground">Loading price...</p>
              )}
              {!priceLoading && piPrice === null && totalBalance > 0 && (
                <p className="text-xs text-muted-foreground">Price unavailable</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 rounded-xl"
                onClick={() => setReceiveModalOpen(true)}
                title="Receive"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 rounded-xl"
                onClick={handleTrade}
                title="Trade"
              >
                <TrendingUp className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 rounded-xl"
                onClick={handleSwap}
                title="Swap"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  <span className="text-foreground">Tokens</span>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={handleManageTokens}>
                  <Plus className="h-4 w-4 mr-1" />
                  Manage token list
                </Button>
              </div>

              <div className="space-y-2">
                {balancesLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading balances...
                  </div>
                ) : balances.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center border border-border rounded-xl">
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
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{displayName}</p>
                          {!isNative && balance.assetIssuer && (
                            <p className="text-xs text-muted-foreground truncate">
                              {balance.assetIssuer.slice(0, 8)}...{balance.assetIssuer.slice(-6)}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-foreground">
                            {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </p>
                          {usdValue !== null && (
                            <p className="text-xs text-muted-foreground">
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
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Connect a wallet to view your balance and holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/profile")} className="w-full h-12 btn-gradient-primary rounded-xl">
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
