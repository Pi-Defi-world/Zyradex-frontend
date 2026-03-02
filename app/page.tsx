"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowDown, TrendingUp, ArrowRightLeft, Loader2, Copy, Wallet, Plus, ArrowUpRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances, useAccountOperations } from "@/hooks/useAccountData"
import { formatDistanceToNow } from "date-fns"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePiPrice } from "@/hooks/usePiPrice"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useTokenPrices } from "@/hooks/useTokenPrice"
import { ReceiveModal } from "@/components/receive-modal"
import { TransactionHistory } from "@/components/transaction-history"

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
  const [activeTab, setActiveTab] = useState("tokens")
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
  const { tokens, isLoading: tokensLoading, error: tokensError } = useTokenRegistry()
  const { getPrice, isLoading: pricesLoading } = useTokenPrices(
    balances.map(b => ({ 
      assetCode: b.assetCode, 
      assetIssuer: b.assetIssuer || undefined, 
      assetType: b.assetType 
    }))
  )
  const { operations, isLoading: operationsLoading } = useAccountOperations(publicKey, {
    limit: 20,
    order: "desc",
  })

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

  const handleSavings = () => router.push("/savings")
  const handleSwap = () => router.push("/swap")
  const handleManageTokens = () => router.push("/trustlines")
  const handleSend = () => router.push("/send")
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const getTransactionType = (tx: any) => {
    if (tx.operationCount === 0) return "Unknown"
    if (tx.operationCount === 1) return "Transaction"
    return `${tx.operationCount} Operations`
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-3xl">
        {/* Wallet Header - Compact Mobile Design */}
        <div className="space-y-4">
          {/* Wallet Address */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Wallet</span>
              <span className="text-sm font-medium text-foreground">{truncatedKey || "No wallet connected"}</span>
              {publicKey && (
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                  title="Copy public key"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Balance Display - Centered, Pi Primary */}
          <div className="space-y-1 text-center">
            {balancesLoading || pricesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} Pi
                </h1>
                {usdBalance !== null && piPrice && (
                  <p className="text-sm text-muted-foreground">
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

          {/* Action Buttons - Wallet Style Compact */}
          <div className="grid grid-cols-4 gap-1.5">
            <Button
              variant="outline"
              className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all py-1 px-2"
              onClick={() => setReceiveModalOpen(true)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium leading-tight">Receive</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all py-1 px-2"
              onClick={handleSend}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium leading-tight">Send</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all py-1 px-2"
              onClick={handleSwap}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium leading-tight">Swap</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all py-1 px-2"
              onClick={handleSavings}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium leading-tight">Save</span>
            </Button>
          </div>
        </div>

        {/* Tokens List with Tabs */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="w-fit">
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleManageTokens}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <TabsContent value="tokens" className="mt-0">
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
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer"
                        >
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-semibold text-base text-foreground truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              {!isNative && balance.assetCode && ` ${balance.assetCode}`}
                              {isNative && " Test Pi"}
                            </p>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            {usdValue !== null ? (
                              <>
                                <p className="font-semibold text-base text-foreground">
                                  ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                                {valueInPi !== null && !isNative && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    ≈ {valueInPi.toLocaleString(undefined, { maximumFractionDigits: 4 })} Pi
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="font-semibold text-base text-foreground">
                                {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="space-y-2">
                  {operationsLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading activity...
                    </div>
                  ) : !publicKey ? (
                    <div className="text-sm text-muted-foreground py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                      Connect a wallet to view transaction history
                    </div>
                  ) : (
                    <TransactionHistory operations={operations} isLoading={operationsLoading} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
