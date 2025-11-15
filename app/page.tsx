"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, Home, ArrowRightLeft, Loader2, Copy, Wallet, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePiPrice } from "@/hooks/usePiPrice"
import { useUserProfile } from "@/hooks/useUserProfile"
import { ReceiveModal } from "@/components/receive-modal"
import { DisclaimerPopup } from "@/components/disclaimer-popup"

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
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
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

  useEffect(() => {
    const disclaimerAccepted = localStorage.getItem("zyradex-disclaimer-accepted")
    if (!disclaimerAccepted) {
      setDisclaimerOpen(true)
    }
  }, [])

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

  const handleSend = () => {
    toast({
      title: "Coming Soon",
      description: "Send functionality will be available soon.",
    })
  }

  const handleSwap = () => {
    router.push("/swap")
  }

  const handleDisclaimerClose = () => {
    localStorage.setItem("zyradex-disclaimer-accepted", "true")
    setDisclaimerOpen(false)
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-2xl">
        {/* Balance Header */}
        <div className="space-y-4 pt-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-foreground">
                {balancesLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : (
                  `${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Test Pi`
                )}
              </h1>
              {usdBalance !== null && piPrice && (
                <p className="text-lg text-muted-foreground">
                  ${usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </p>
              )}
              {priceLoading && usdBalance === null && piPrice === null && (
                <p className="text-sm text-muted-foreground">Loading price...</p>
              )}
              {!priceLoading && piPrice === null && totalBalance > 0 && (
                <p className="text-xs text-muted-foreground">Price unavailable</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setReceiveModalOpen(true)}
              className="flex flex-col items-center gap-1 h-auto py-2 btn-gradient-primary"
              variant="default"
              size="sm"
            >
              <ArrowDown className="h-4 w-4" />
              <span className="text-xs">Receive</span>
            </Button>
            <Button
              onClick={handleSend}
              className="flex flex-col items-center gap-1 h-auto py-2"
              variant="outline"
              size="sm"
              disabled
            >
              <Home className="h-4 w-4" />
              <span className="text-xs">Send</span>
            </Button>
            <Button
              onClick={handleSwap}
              className="flex flex-col items-center gap-1 h-auto py-2 btn-gradient-primary"
              variant="default"
              size="sm"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="text-xs">Swap</span>
            </Button>
          </div>
        </div>

        {/* Holdings Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Holdings
                </CardTitle>
                <CardDescription>Your token balances</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {}}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {balancesLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading balances...
              </div>
            ) : balances.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                {publicKey ? "No balances found" : "Connect a wallet to view your holdings"}
              </div>
            ) : (
              <div className="space-y-3">
                {balances.map((balance, index) => {
                  const isNative = balance.assetType === "native"
                  const displayName = isNative ? "Test Pi" : balance.assetCode
                  const amount = Number(balance.amount)
                  const usdValue = piPrice && isNative ? amount * piPrice : null

                  return (
                    <div
                      key={`${balance.asset}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
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
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minted Tokens Section */}
        {mintedTokens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Minted Tokens
              </CardTitle>
              <CardDescription>Tokens you've created</CardDescription>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading tokens...
                </div>
              ) : mintedTokens.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  You haven't minted any tokens yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {mintedTokens.map((token, index) => (
                    <div
                      key={`${token.assetCode}-${token.issuer}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {token.name || token.assetCode}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {token.assetCode} • {token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}
                        </p>
                        {token.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {token.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-foreground">
                          {token.totalSupply?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0"}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Supply</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Connect Wallet CTA */}
        {!publicKey && (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Connect a wallet to view your balance and holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/profile")} className="w-full btn-gradient-primary">
                Go to Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />
      <DisclaimerPopup open={disclaimerOpen} onOpenChange={handleDisclaimerClose} />
    </div>
  )
}
