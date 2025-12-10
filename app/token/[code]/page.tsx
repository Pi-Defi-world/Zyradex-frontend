"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, ArrowRightLeft, ArrowUpRight, ArrowDown, Loader2, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useAccountOperations } from "@/hooks/useAccountData"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useTokenPrice } from "@/hooks/useTokenPrice"
import { usePiPrice } from "@/hooks/usePiPrice"
import { ReceiveModal } from "@/components/receive-modal"
import { AuthErrorDisplay } from "@/components/auth-error-display"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function TokenDetailPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const { price: piPrice } = usePiPrice()

  const tokenCode = decodeURIComponent(params.code)
  const issuer = searchParams.get("issuer") || undefined

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

  const { balances, isLoading: balancesLoading, error: balancesError } = useAccountBalances(publicKey)
  const { operations, isLoading: operationsLoading, error: operationsError } = useAccountOperations(publicKey, {
    limit: 50,
  })

  // Find the token balance
  const tokenBalance = useMemo(() => {
    if (tokenCode === "native") {
      return balances.find((b) => b.assetType === "native")
    }
    return balances.find(
      (b) => b.assetCode === tokenCode && (issuer ? b.assetIssuer === issuer : !b.assetIssuer)
    )
  }, [balances, tokenCode, issuer])

  const amount = tokenBalance ? Number(tokenBalance.amount) : 0
  const isNative = tokenCode === "native"

  // Get token price in Pi
  const { priceInPi, isLoading: priceLoading } = useTokenPrice(
    isNative ? "" : tokenCode,
    issuer,
    !isNative
  )

  const valueInPi = useMemo(() => {
    if (isNative) return amount
    if (priceInPi === null || priceInPi === undefined) return null
    return amount * priceInPi
  }, [amount, priceInPi, isNative])

  const usdValue = useMemo(() => {
    if (!piPrice || valueInPi === null) return null
    return valueInPi * piPrice
  }, [piPrice, valueInPi])

  // Filter operations for this token
  const tokenOperations = useMemo(() => {
    if (!tokenBalance) return []
    const tokenAsset = isNative
      ? "native"
      : issuer
      ? `${tokenCode}:${issuer}`
      : tokenCode

    return operations.filter((op) => {
      // Check if operation involves this token
      const opAsset = op.asset || ""
      const opSelling = op.selling || ""
      const opBuying = op.buying || ""
      const opFrom = op.from || ""
      const opTo = op.to || ""

      if (isNative) {
        return (
          opAsset.includes("native") ||
          opSelling.includes("native") ||
          opBuying.includes("native") ||
          op.type === "payment" ||
          op.type === "createAccount"
        )
      }

      return (
        opAsset.includes(tokenCode) ||
        opSelling.includes(tokenCode) ||
        opBuying.includes(tokenCode) ||
        opFrom.includes(tokenAsset) ||
        opTo.includes(tokenAsset)
      )
    })
  }, [operations, tokenBalance, tokenCode, issuer, isNative])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copied", description: "Copied to clipboard" })
    } catch {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  const displayName = isNative ? "Test Pi" : tokenCode

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <AuthErrorDisplay error={balancesError || operationsError} />

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Token Header Card */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{displayName}</h1>
                  {!isNative && issuer && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground font-mono">
                        {issuer.slice(0, 8)}...{issuer.slice(-6)}
                      </p>
                      <button
                        onClick={() => handleCopy(issuer)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy issuer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Display */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Balance</p>
                {balancesLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <h2 className="text-4xl font-bold text-foreground">
                      {amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </h2>
                    {valueInPi !== null && (
                      <p className="text-lg text-muted-foreground">
                        ≈ {valueInPi.toLocaleString(undefined, { maximumFractionDigits: 4 })} Pi
                      </p>
                    )}
                    {usdValue !== null && (
                      <p className="text-base text-muted-foreground">
                        ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    )}
                    {!isNative && priceInPi === null && !priceLoading && (
                      <p className="text-sm text-muted-foreground">No pool available - price unknown</p>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                  onClick={() => {
                    const swapUrl = isNative
                      ? `/swap?from=native&to=`
                      : `/swap?from=${encodeURIComponent(tokenCode)}${issuer ? `&fromIssuer=${encodeURIComponent(issuer)}` : ""}&to=native`
                    router.push(swapUrl)
                  }}
                >
                  <ArrowRightLeft className="h-5 w-5" />
                  <span className="text-xs font-medium">Swap</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                  onClick={() => router.push("/swap")} // TODO: Create send page
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="text-xs font-medium">Send</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                  onClick={() => setReceiveModalOpen(true)}
                >
                  <ArrowDown className="h-5 w-5" />
                  <span className="text-xs font-medium">Receive</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Trades Card */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Trades</CardTitle>
            <CardDescription>All operations involving {displayName}</CardDescription>
          </CardHeader>
          <CardContent>
            {operationsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading operations...
              </div>
            ) : tokenOperations.length === 0 ? (
              <div className="text-sm text-muted-foreground py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                No operations found for this token
              </div>
            ) : (
              <div className="space-y-2">
                {tokenOperations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground capitalize">
                          {op.type.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        {op.action && (
                          <span className="text-xs text-muted-foreground">({op.action})</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {op.createdAt
                          ? new Date(op.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Unknown date"}
                      </p>
                      {op.amount && (
                        <p className="text-sm text-foreground mt-1">
                          Amount: {Number(op.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </p>
                      )}
                      {op.asset && <p className="text-xs text-muted-foreground mt-1">Asset: {op.asset}</p>}
                    </div>
                    {op.transactionHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(op.transactionHash)}
                        className="ml-4 shrink-0"
                        title="Copy transaction hash"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />
    </div>
  )
}

