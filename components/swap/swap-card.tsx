// @ts-nocheck
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowDown, Settings, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useToast } from "@/hooks/use-toast"
import { usePoolsForPair, useSwapQuote, useExecuteSwap } from "@/hooks/useSwapData"
import { useAccountBalances } from "@/hooks/useAccountData"
import { listLiquidityPools } from "@/lib/api/liquidity"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

// Parse token string (e.g., "native" or "CODE:ISSUER" or just "CODE") into { code, issuer }
const parseToken = (token: string): { code: string; issuer?: string } => {
  if (!token || token.trim() === "") return { code: "" }
  const trimmed = token.trim()
  if (trimmed === "native") {
    return { code: "native" }
  }
  const parts = trimmed.split(":")
  if (parts.length === 2) {
    return { code: parts[0].trim(), issuer: parts[1].trim() }
  }
  return { code: trimmed }
}

// Convert token to descriptor string for quote API
const tokenToDescriptor = (token: { code: string; issuer?: string }): string => {
  if (token.code === "native") return "native"
  if (token.issuer) return `${token.code}:${token.issuer}`
  return token.code
}

export function SwapCard() {
  const { user } = usePi()
  const { profile } = useUserProfile()
  const { toast } = useToast()
  const [localWallet, setLocalWallet] = useState<string | null>(null)

  useEffect(() => {
    const stored = getStoredWallet()
    const address = profile?.public_key || stored || user?.wallet_address || null
    setLocalWallet(address)
  }, [profile?.public_key, user?.wallet_address])

  // Get user balances for Token A dropdown
  const publicKey = profile?.public_key || localWallet || user?.wallet_address || undefined
  const { balances, refresh: refreshBalances } = useAccountBalances(publicKey)

  // Token input state
  const [tokenA, setTokenA] = useState<string>("")
  const [tokenB, setTokenB] = useState<string>("")
  const [fromAmount, setFromAmount] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState<string>("")
  const [slippagePercent, setSlippagePercent] = useState<number>(1)
  const [pairedTokens, setPairedTokens] = useState<string[]>([])
  const [loadingPairedTokens, setLoadingPairedTokens] = useState(false)
  
  const walletAddress = localWallet || profile?.public_key || user?.wallet_address
  const [userSecret, setUserSecret] = useState<string>("")
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Parse tokens
  const fromToken = useMemo(() => {
    if (!tokenA) return null
    return parseToken(tokenA)
  }, [tokenA])

  const toToken = useMemo(() => {
    if (!tokenB) return null
    return parseToken(tokenB)
  }, [tokenB])

  
  const poolsEnabled = Boolean(
    fromToken && 
    toToken && 
    fromToken.code && 
    toToken.code && 
    fromToken.code !== toToken.code
  )
  
  const { pools, isLoading: loadingPools, error: poolsError } = usePoolsForPair(
    poolsEnabled && fromToken && toToken
      ? {
          tokenA: fromToken.code === "native" ? "native" : fromToken.code.toUpperCase(),
          tokenB: toToken.code === "native" ? "native" : toToken.code.toUpperCase(),
        }
      : undefined
  )

  // Auto-select first pool if available and none selected
  useEffect(() => {
    if (pools.length > 0 && !selectedPoolId) {
      setSelectedPoolId(pools[0].id)
    } else if (pools.length === 0) {
      setSelectedPoolId("")
    }
  }, [pools, selectedPoolId])

  // Get selected pool
  const selectedPool = useMemo(() => {
    return pools.find((p) => p.id === selectedPoolId)
  }, [pools, selectedPoolId])

  // Fetch quote when pool and amount are available
  const quoteEnabled = Boolean(selectedPoolId && fromAmount && Number(fromAmount) > 0 && fromToken && toToken)
  const fromDescriptor = fromToken ? tokenToDescriptor(fromToken) : ""
  const toDescriptor = toToken ? tokenToDescriptor(toToken) : ""

  const { quote, isLoading: quoting, error: quoteError, timeUntilRefresh } = useSwapQuote(
    quoteEnabled
      ? {
          poolId: selectedPoolId,
          from: fromDescriptor,
          to: toDescriptor,
          amount: fromAmount,
          slippagePercent,
        }
      : undefined
  )

  // Local state for countdown display (updates every second)
  const [displayCountdown, setDisplayCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (timeUntilRefresh === null) {
      setDisplayCountdown(null)
      return
    }

    setDisplayCountdown(timeUntilRefresh)

    const interval = setInterval(() => {
      setDisplayCountdown((prev) => {
        if (prev === null || prev <= 0) return null
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeUntilRefresh])

  const { executeSwap, isLoading: executing } = useExecuteSwap()

  // Fetch paired tokens when Token A is selected
  useEffect(() => {
    if (!fromToken?.code || fromToken.code === "") {
      setPairedTokens([])
      setTokenB("")
      return
    }

    const fetchPairedTokens = async () => {
      setLoadingPairedTokens(true)
      try {
        // Fetch all pools and filter those containing Token A
        const poolsResponse = await listLiquidityPools({ limit: 100 })
        const pools = poolsResponse.data || []

        // Extract tokens paired with Token A
        const tokenACode = fromToken.code === "native" ? "native" : fromToken.code.toUpperCase()
        const paired = new Set<string>()

        pools.forEach((pool) => {
          if (!pool.reserves || pool.reserves.length < 2) return
          
          const assets = pool.reserves.map((r: any) => {
            const assetStr = r.asset || ""
            if (assetStr === "native") return "native"
            return assetStr.split(":")[0].toUpperCase()
          })

          if (assets.includes(tokenACode)) {
            // Find the other token in the pair
            const otherToken = assets.find((a: string) => a !== tokenACode)
            if (otherToken) {
              // Try to find full format from reserves
              const otherReserve = pool.reserves.find((r: any) => {
                const code = r.asset === "native" ? "native" : r.asset.split(":")[0].toUpperCase()
                return code === otherToken
              })
              if (otherReserve) {
                paired.add(otherReserve.asset === "native" ? "native" : otherReserve.asset)
              } else {
                paired.add(otherToken)
              }
            }
          }
        })

        setPairedTokens(Array.from(paired))
      } catch (err) {
        console.error("Failed to fetch paired tokens:", err)
        setPairedTokens([])
      } finally {
        setLoadingPairedTokens(false)
      }
    }

    fetchPairedTokens()
  }, [fromToken?.code])

  const handleTokenAChange = (value: string) => {
    setTokenA(value)
    setTokenB("")
    setSelectedPoolId("")
    setFromAmount("")
    setSlippagePercent(1) // Reset to default
  }

  const handleTokenBChange = (value: string) => {
    setTokenB(value)
    setSelectedPoolId("")
    setFromAmount("")
    setSlippagePercent(1) // Reset to default
  }

  const handleSwapTokens = () => {
    const temp = tokenA
    setTokenA(tokenB)
    setTokenB(temp)
    setSelectedPoolId("")
    setFromAmount("")
  }

  const handleSwapClick = () => {
    if (!selectedPoolId) {
      toast({ title: "No pool available", description: "No pools found for this token pair.", variant: "destructive" })
      return
    }
    if (!fromToken || !toToken) {
      toast({ title: "Invalid pair", description: "Please enter both tokens to create a trading pair.", variant: "destructive" })
      return
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({ title: "Amount required", description: "Please enter an amount to swap.", variant: "destructive" })
      return
    }
    setShowSecretDialog(true)
  }

  const handleSubmit = async () => {
    if (!userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive" 
      })
      return
    }
    
    try {
      const result = await executeSwap({
        userSecret: userSecret.trim(),
        poolId: selectedPoolId,
        from: fromToken,
        to: toToken,
        sendAmount: fromAmount,
        slippagePercent,
      })
      
      if (result?.success && result?.data?.txHash) {
        toast({ 
          title: "Swap executed successfully", 
            description: `Transaction submitted to the network`,
            variant: "default"
        })
        setFromAmount("")
        setUserSecret("") // Clear secret after successful transaction
        setShowSecretDialog(false) // Close dialog
        // Refresh balances after successful swap to show updated amounts
        // Backend already clears cache, but we refresh to get the latest data
        setTimeout(() => {
          refreshBalances()
        }, 2000) // Wait 2 seconds for transaction to be processed
      } else {
        toast({ 
          title: "Swap submitted", 
          description: "Transaction submitted to the network",
          variant: "default"
        })
        setShowSecretDialog(false) // Close dialog
      }
    } catch (err: any) {
      let errorMessage = "Swap failed"
      let errorTitle = "Swap failed"
      
      if (err) {
        // Check for API error response
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (typeof err === "object" && "message" in err) {
          errorMessage = (err as any).message
        } else if (typeof err === "string") {
          errorMessage = err
        }
        
        // Check for specific error types
        if (errorMessage.toLowerCase().includes("insufficient balance") || 
            errorMessage.toLowerCase().includes("underfunded")) {
          errorTitle = "Insufficient Balance"
        } else if (errorMessage.toLowerCase().includes("trustline")) {
          errorTitle = "Trustline Required"
        } else if (errorMessage.toLowerCase().includes("pool") && errorMessage.toLowerCase().includes("not found")) {
          errorTitle = "Pool Not Found"
        } else if (errorMessage.toLowerCase().includes("slippage")) {
          errorTitle = "Slippage Exceeded"
        }
      }
      
      console.error("Swap error:", err)
      toast({ 
        title: errorTitle, 
        description: errorMessage, 
        variant: "destructive",
        duration: 5000 // Show for 5 seconds so user can read it
      })
    }
  }


  const poolSummary = () => {
    if (!tokenA || !tokenB) return "Enter both tokens to check for pools."
    if (fromToken?.code === toToken?.code) return "Tokens must be different."
    if (loadingPools) return "Checking for pools..."
    if (poolsError) return `Error: ${poolsError.message}`
    if (!pools?.length) {
      const tokenAStr = fromToken?.code || tokenA
      const tokenBStr = toToken?.code || tokenB
      return `No pools found for ${tokenAStr}/${tokenBStr}`
    }
    return `${pools.length} pool${pools.length > 1 ? "s" : ""} available`
  }

  const fromTokenDisplay = fromToken?.code === "native" ? "Test Pi" : (tokenA.includes(":") ? tokenA.split(":")[0] : tokenA)
  const toTokenDisplay = toToken?.code === "native" ? "Test Pi" : (tokenB.includes(":") ? tokenB.split(":")[0] : tokenB)

  return (
    <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
      <div className="relative">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Swap</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* You Pay Section */}
            <div className="relative">
              <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">You pay</div>
              <div className="flex items-center gap-2 bg-muted/30 rounded-2xl p-4 pt-8 pb-12 border border-border/50">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(event) => setFromAmount(event.target.value)}
                  className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                />
            <Select value={tokenA} onValueChange={handleTokenAChange}>
                  <SelectTrigger className="w-auto min-w-[120px] border-0 bg-muted hover:bg-muted/80 h-12 rounded-xl">
                    <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((balance) => {
                  const isNative = balance.assetType === "native"
                  const displayName = isNative ? "Test Pi" : balance.assetCode
                  const value = isNative ? "native" : (balance.assetIssuer ? `${balance.assetCode}:${balance.assetIssuer}` : balance.assetCode)
                  const amount = Number(balance.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })
                  return (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{displayName}</span>
                        <span className="text-xs text-muted-foreground ml-2">{amount}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
              </div>
              {tokenA && (
                <div className="absolute bottom-3 left-4 text-xs text-muted-foreground">
                  Balance: {balances.find(b => {
                    const isNative = b.assetType === "native"
                    const value = isNative ? "native" : (b.assetIssuer ? `${b.assetCode}:${b.assetIssuer}` : b.assetCode)
                    return value === tokenA
                  })?.amount || "0.00"}
          </div>
              )}
          </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-3 relative z-20">
            <Button
              variant="outline"
              size="icon"
                className="h-10 w-10 rounded-full bg-background border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all shadow-md"
              onClick={handleSwapTokens}
              disabled={!tokenA || !tokenB}
            >
                <ArrowDown className="h-5 w-5" />
            </Button>
          </div>

            {/* You Receive Section */}
            <div className="relative">
              <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">You receive</div>
              <div className="flex items-center gap-2 bg-muted/30 rounded-2xl p-4 pt-8 pb-12 border border-border/50">
                {quote && quote.expectedOutput ? (
                  <div className="flex-1 text-2xl font-semibold text-foreground">
                    {quote.expectedOutput}
                  </div>
                ) : (
                  <div className="flex-1 text-2xl font-semibold text-muted-foreground">
                    0.0
                  </div>
                )}
                {!tokenA ? (
                  <div className="w-auto min-w-[120px] h-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground text-sm">
                    Select token
                  </div>
                ) : loadingPairedTokens ? (
                  <div className="w-auto min-w-[120px] h-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                    <Select value={tokenB} onValueChange={handleTokenBChange}>
                    <SelectTrigger className="w-auto min-w-[120px] border-0 bg-muted hover:bg-muted/80 h-12 rounded-xl">
                      <SelectValue placeholder={pairedTokens.length > 0 ? "Select" : "No pairs"} />
                      </SelectTrigger>
                      <SelectContent>
                      {pairedTokens.length > 0 ? (
                        pairedTokens.map((token) => {
                          const isNative = token === "native"
                          const displayName = isNative ? "Test Pi" : (token.includes(":") ? token.split(":")[0] : token)
                          return (
                            <SelectItem key={token} value={token}>
                              {displayName}
                            </SelectItem>
                          )
                        })
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No pairs found
                        </div>
                      )}
                      </SelectContent>
                    </Select>
                )}
              </div>
              {tokenB && quote && (
                <div className="absolute bottom-3 left-4 text-xs text-muted-foreground">
                  ≈ ${(parseFloat(quote.expectedOutput || "0") * 1).toFixed(2)}
                </div>
            )}
          </div>
            {/* Quote Display - Eye-catching colors */}
            {quote && quote.expectedOutput && (
              <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 space-y-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Estimated Output</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                    {quote.expectedOutput} {toTokenDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Min Received</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{quote.minOut}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
                  <span className="text-muted-foreground">Total Fee</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-500">
                    {quote.totalFee ? `${quote.totalFee.toFixed(2)}%` : `${quote.fee}%`}
                  </span>
                </div>
                </div>
              )}

            {/* Transaction Details - Collapsible */}
            {quote && quote.expectedOutput && (
              <div className="border-t border-border/50 pt-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Transaction Details</span>
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showDetails && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage</span>
                      <span>{quote.slippagePercent}%</span>
                          </div>
                    {selectedPool && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pool Fee</span>
                        <span>{(selectedPool.fee_bp / 100).toFixed(2)}%</span>
                </div>
              )}
                  </div>
                )}
                </div>
              )}

            {/* Swap Button */}
            <Button
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSwapClick}
              disabled={executing || quoting || !quoteEnabled || !tokenA || !tokenB || !selectedPoolId}
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Executing...
                </>
              ) : quoting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fetching quote...
                </>
              ) : !tokenA || !tokenB ? (
                "Select tokens"
              ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
                "Enter amount"
              ) : (
                "Swap"
              )}
            </Button>

            {/* Error Messages */}
            {poolsError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="font-medium">Error fetching pools:</div>
                <div className="text-xs mt-1">{poolsError.message}</div>
                    </div>
                  )}

            {quoteError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="font-medium">Failed to fetch quote:</div>
                <div className="text-xs mt-1">{quoteError.message || "Unknown error"}</div>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Secret Seed Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Swap</DialogTitle>
            <DialogDescription>
              Enter your secret seed to sign and execute the swap transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
          <div className="space-y-2">
              <label className="text-sm font-medium">Secret Seed</label>
            <Input
              type="password"
              placeholder="Enter your secret seed (starts with S...)"
              value={userSecret}
              onChange={(event) => setUserSecret(event.target.value)}
                className="font-mono"
                autoFocus
            />
            <p className="text-xs text-muted-foreground">
                We don't store your secret seed. It's only used to sign this transaction.
            </p>
          </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSecretDialog(false)
                  setUserSecret("")
                }}
              >
                Cancel
              </Button>
          <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            onClick={handleSubmit}
                disabled={executing || !userSecret.trim()}
          >
            {executing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
                  "Confirm Swap"
            )}
          </Button>
            </div>
      </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

