"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowDown, TrendingUp, ArrowRightLeft, Loader2, Copy, Wallet, Plus, ArrowUpRight, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePiPrice } from "@/hooks/usePiPrice"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useTokenPrices } from "@/hooks/useTokenPrice"
import { ReceiveModal } from "@/components/receive-modal"
import { TrustlineForm } from "@/components/forms/trustline-form"
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
  const { balances, totalBalance: nativeBalanceOnly, isLoading: balancesLoading, error: balancesError } = useAccountBalances(publicKey)
  const { tokens, isLoading: tokensLoading, error: tokensError, retry: retryTokens } = useTokenRegistry()
  const { getPrice, isLoading: pricesLoading } = useTokenPrices(
    balances.map(b => ({ 
      assetCode: b.assetCode, 
      assetIssuer: b.assetIssuer || undefined, 
      assetType: b.assetType 
    }))
  )
  const [trustlineDialogOpen, setTrustlineDialogOpen] = useState(false)

  // Calculate total balance: native Pi + tokens with pools (valued in Pi)
  const totalBalance = useMemo(() => {
    let total = nativeBalanceOnly // Start with native Pi
    
    // Add token values in Pi for tokens that have pools
    balances.forEach((balance) => {
      if (balance.assetType === "native") return
      
      const priceInPi = getPrice(balance.assetCode, balance.assetIssuer || undefined, balance.assetType)
      if (priceInPi !== null && priceInPi !== undefined) {
        const tokenAmount = Number(balance.amount) || 0
        total += tokenAmount * priceInPi
      }
    })
    
    return total
  }, [nativeBalanceOnly, balances, getPrice])

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

  const handleTrade = () => router.push("/trade")
  const handleSwap = () => router.push("/swap")
  const handleManageTokens = () => setTrustlineDialogOpen(true)
  const handleSend = () => router.push("/swap") // TODO: Create send page/component
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


  const handleTokenClick = (balance: any) => {
    if (balance.assetType === "native") {
      router.push("/token/native")
    } else if (balance.assetCode) {
      const tokenCode = balance.assetCode
      router.push(`/token/${encodeURIComponent(tokenCode)}${balance.assetIssuer ? `?issuer=${encodeURIComponent(balance.assetIssuer)}` : ''}`)
    }
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
        <AuthErrorDisplay error={balancesError || tokensError} onRetry={retryTokens} />
        
        {/* Wallet Header Card */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Wallet</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{truncatedKey || "No wallet connected"}</span>
                  {publicKey && (
                    <button
                      onClick={handleCopy}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                      title="Copy public key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Total Balance - Large Display */}
            <div className="text-center space-y-2 mb-8">
              <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
              <div className="space-y-1">
                {balancesLoading || pricesLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-5xl font-bold text-foreground tracking-tight">
                      {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} Pi
                    </h1>
                    {usdBalance !== null && piPrice && (
                      <p className="text-lg text-muted-foreground">
                        ${usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    )}
                    {priceLoading && usdBalance === null && piPrice === null && (
                      <p className="text-sm text-muted-foreground">Loading price...</p>
                    )}
                    {!priceLoading && piPrice === null && totalBalance > 0 && (
                      <p className="text-sm text-muted-foreground">Price unavailable</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons - Wallet Style */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                onClick={() => setReceiveModalOpen(true)}
              >
                <ArrowDown className="h-5 w-5" />
                <span className="text-xs font-medium">Receive</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                onClick={handleSend}
              >
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-xs font-medium">Send</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                onClick={handleSwap}
              >
                <ArrowRightLeft className="h-5 w-5" />
                <span className="text-xs font-medium">Swap</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                onClick={handleTrade}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs font-medium">Trade</span>
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Tokens List Card */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl font-bold">Tokens</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 rounded-full" 
                onClick={handleManageTokens}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Manage token list
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {balancesLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading balances...
                </div>
              ) : balances.length === 0 ? (
                <div className="text-sm text-muted-foreground py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                  {publicKey ? "No balances found" : "Connect a wallet to view your holdings"}
                </div>
              ) : (
                balances.map((balance, index) => {
                  const isNative = balance.assetType === "native"
                  const displayName = isNative ? "Test Pi" : balance.assetCode
                  const amount = Number(balance.amount)
                  const priceInPi = getPrice(balance.assetCode, balance.assetIssuer || undefined, balance.assetType)
                  const valueInPi = priceInPi !== null ? amount * priceInPi : null
                  const usdValue = piPrice && (isNative || valueInPi !== null) 
                    ? (isNative ? amount : valueInPi!) * piPrice 
                    : null

                  return (
                    <button
                      key={`${balance.asset}-${index}`}
                      onClick={() => handleTokenClick(balance)}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/60 hover:border-border transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-foreground truncate">{displayName}</p>
                          {valueInPi !== null && !isNative && (
                            <span className="text-xs text-muted-foreground">
                              ≈ {valueInPi.toLocaleString(undefined, { maximumFractionDigits: 4 })} Pi
                            </span>
                          )}
                        </div>
                        {!isNative && balance.assetIssuer && (
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            {balance.assetIssuer.slice(0, 8)}...{balance.assetIssuer.slice(-6)}
                          </p>
                        )}
                        {priceInPi === null && !isNative && (
                          <p className="text-xs text-muted-foreground mt-1">No pool available</p>
                        )}
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="font-bold text-lg text-foreground">
                          {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </p>
                        {usdValue !== null && (
                          <p className="text-xs text-muted-foreground">
                            ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1 group-hover:text-foreground transition-colors" />
                      </div>
                    </button>
                  )
                })
              )}
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

      {/* Trustline Dialog */}
      <Dialog open={trustlineDialogOpen} onOpenChange={setTrustlineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Token List</DialogTitle>
            <DialogDescription>
              Establish a trustline to add a token to your wallet.
            </DialogDescription>
          </DialogHeader>
          <TrustlineForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
