"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, Settings, Loader2, Lock } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useToast } from "@/hooks/use-toast"
import { usePoolsForPair, useSwapQuote, useExecuteSwap } from "@/hooks/useSwapData"
import { useTransactionAuth } from "@/hooks/useTransactionAuth"
import { PasswordPromptDialog } from "@/components/password-prompt-dialog"
import { useAccountBalances } from "@/hooks/useAccountData"
import { listLiquidityPools } from "@/lib/api/liquidity"
import { useRouter } from "next/navigation"
import { useSearchAssets } from "@/hooks/useTrade"
import { Search } from "lucide-react"

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
  const router = useRouter()
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
  const [userSecret, setUserSecret] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState<string>("")
  const [slippagePercent, setSlippagePercent] = useState<number>(1)
  const [pairedTokens, setPairedTokens] = useState<string[]>([])
  const [loadingPairedTokens, setLoadingPairedTokens] = useState(false)
  const [tokenBSearch, setTokenBSearch] = useState<string>("")
  const [tokenBInputMode, setTokenBInputMode] = useState<"dropdown" | "search">("dropdown")
  
  const walletAddress = localWallet || profile?.public_key || user?.wallet_address
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordResolve, setPasswordResolve] = useState<((password: string) => void) | null>(null)
  const [passwordReject, setPasswordReject] = useState<((error: Error) => void) | null>(null)
  
  const handlePasswordPrompt = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPasswordResolve(() => (password: string) => resolve(password))
      setPasswordReject(() => (error: Error) => reject(error))
      setShowPasswordDialog(true)
    })
  }

  const { getSecret: getSecretFromAuth, isLoading: authLoading, hasStoredSecret, requiresPassword } = useTransactionAuth(
    walletAddress || undefined,
    handlePasswordPrompt
  )

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
    setTokenBSearch("")
    setSelectedPoolId("")
    setFromAmount("")
    setSlippagePercent(1) // Reset to default
  }

  // Search for assets when user types Token B
  const tokenBSearchCode = useMemo(() => {
    if (!tokenBSearch || tokenBSearch.trim() === "") return undefined
    const trimmed = tokenBSearch.trim()
    // If it's "native", return it
    if (trimmed.toLowerCase() === "native") return "native"
    // If it contains ":", extract just the code part for search
    if (trimmed.includes(":")) {
      return trimmed.split(":")[0].trim()
    }
    return trimmed
  }, [tokenBSearch])

  const { assets: searchedAssets, isLoading: searchingAssets } = useSearchAssets(
    tokenBSearchCode && tokenBInputMode === "search" ? tokenBSearchCode : undefined,
    10
  )

  const handleSwapTokens = () => {
    const temp = tokenA
    setTokenA(tokenB)
    setTokenB(temp)
    setSelectedPoolId("")
    setFromAmount("")
  }

  const handleSubmit = async () => {
    if (!selectedPoolId) {
      toast({ title: "No pool available", description: "No pools found for this token pair.", variant: "destructive" })
      return
    }
    if (!fromToken || !toToken) {
      toast({ title: "Invalid pair", description: "Please enter both tokens to create a trading pair.", variant: "destructive" })
      return
    }
    
    let secretToUse = userSecret
    
    // If stored secret exists, always use password authentication (don't allow manual entry)
    if (hasStoredSecret && walletAddress) {
      try {
        secretToUse = await getSecretFromAuth(walletAddress)
      } catch (err) {
        const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Authentication failed"
        toast({ title: "Authentication failed", description: message, variant: "destructive" })
        return
      }
    } else if (!secretToUse) {
      // Only allow manual entry if no stored secret exists
      toast({ 
        title: "Secret required", 
        description: "Enter the secret key to sign the swap transaction, or import your account and set up authentication.",
        variant: "destructive" 
      })
      return
    }
    
    try {
      const result = await executeSwap({
        userSecret: secretToUse,
        poolId: selectedPoolId,
        from: fromToken,
        to: toToken,
        sendAmount: fromAmount,
        slippagePercent,
      })
      toast({ 
        title: "Swap executed successfully", 
        description: result.data?.txHash 
          ? `Transaction hash: ${result.data.txHash}` 
          : "Transaction submitted to the network" 
      })
      setFromAmount("")
      setUserSecret("")
      // Refresh balances after successful swap to show updated amounts
      // Backend already clears cache, but we refresh to get the latest data
      setTimeout(() => {
        refreshBalances()
      }, 2000) // Wait 2 seconds for transaction to be processed
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Swap failed"
      toast({ title: "Swap failed", description: message, variant: "destructive" })
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    if (passwordResolve) {
      passwordResolve(password)
      setPasswordResolve(null)
      setPasswordReject(null)
      setShowPasswordDialog(false)
    }
  }

  const handlePasswordDialogClose = (open: boolean) => {
    if (!open) {
      setShowPasswordDialog(false)
      // Reject the promise if dialog is closed without submitting
      if (passwordReject) {
        passwordReject(new Error("Password prompt cancelled"))
        setPasswordResolve(null)
        setPasswordReject(null)
      }
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

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-lg p-px">
        <div className="h-full w-full rounded-lg bg-background/95 backdrop-blur-sm" />
      </div>
      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Swap
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50" disabled>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{poolSummary()}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Token A (You're Selling)</Label>
            <Select value={tokenA} onValueChange={handleTokenAChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a token you own" />
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
                        <span>{displayName}</span>
                        <span className="text-xs text-muted-foreground ml-2">{amount}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a token from your balance
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={fromAmount}
              onChange={(event) => setFromAmount(event.target.value)}
            />
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 border-0 hover:scale-105 transition-transform shadow-lg hover:shadow-green-500/25"
              onClick={handleSwapTokens}
              disabled={!tokenA || !tokenB}
            >
              <ArrowDown className="h-4 w-4 text-white" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Token B (You're Buying)</Label>
              {tokenA && pairedTokens.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setTokenBInputMode(tokenBInputMode === "dropdown" ? "search" : "dropdown")
                    setTokenBSearch("")
                    setTokenB("")
                  }}
                >
                  {tokenBInputMode === "dropdown" ? (
                    <>
                      <Search className="h-3 w-3 mr-1" />
                      Search
                    </>
                  ) : (
                    "Use Dropdown"
                  )}
                </Button>
              )}
            </div>
            {!tokenA ? (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm text-muted-foreground">
                Select Token A first to see available pairs
              </div>
            ) : loadingPairedTokens ? (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding available pairs...
              </div>
            ) : pairedTokens.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm space-y-2">
                  <p className="text-muted-foreground">No liquidity pools found for this token.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/liquidity")}
                    className="w-full"
                  >
                    Create a Pool
                  </Button>
                </div>
                {/* Allow search even when no pools exist */}
                <div className="space-y-2">
                  <Input
                    placeholder="Type token code (e.g., ARCHIMEDES) or CODE:ISSUER"
                    value={tokenBSearch}
                    onChange={(e) => {
                      setTokenBSearch(e.target.value)
                      setTokenBInputMode("search")
                    }}
                  />
                  {tokenBSearch && searchingAssets && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Searching...
                    </div>
                  )}
                  {tokenBSearch && !searchingAssets && searchedAssets.length > 0 && (
                  <div className="rounded-lg border border-border/40 bg-muted/20 p-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchedAssets.map((asset) => {
                      const assetValue = asset.asset_type === "native" 
                        ? "native" 
                        : `${asset.asset_code}:${asset.asset_issuer}`
                      const displayName = asset.asset_type === "native" ? "Test Pi" : asset.asset_code
                      return (
                        <button
                          key={assetValue}
                          onClick={() => {
                            handleTokenBChange(assetValue)
                            setTokenBSearch("")
                          }}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm"
                        >
                          <div className="font-medium">{displayName}</div>
                          {asset.asset_type !== "native" && (
                            <div className="text-xs text-muted-foreground truncate">
                              {asset.asset_issuer.slice(0, 8)}...{asset.asset_issuer.slice(-6)}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                {/* Allow manual entry for "native" */}
                {tokenBSearch && tokenBSearch.toLowerCase() === "native" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleTokenBChange("native")
                      setTokenBSearch("")
                    }}
                    className="w-full"
                  >
                    Use "Test Pi" (native)
                  </Button>
                )}
                {tokenBSearch && !searchingAssets && searchedAssets.length === 0 && tokenBSearchCode && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground p-2">
                      No assets found for "{tokenBSearchCode}". You can still enter the full format (CODE:ISSUER) or select from available pairs below.
                    </div>
                    {/* Allow manual entry if user types full format */}
                    {tokenBSearch.includes(":") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleTokenBChange(tokenBSearch)
                          setTokenBSearch("")
                        }}
                        className="w-full"
                      >
                        Use "{tokenBSearch}"
                      </Button>
                    )}
                  </div>
                )}
                </div>
              </div>
            ) : tokenBInputMode === "search" ? (
              <div className="space-y-2">
                <Input
                  placeholder="Type token code (e.g., ARCHIMEDES) or CODE:ISSUER"
                  value={tokenBSearch}
                  onChange={(e) => setTokenBSearch(e.target.value)}
                />
                {tokenBSearch && searchingAssets && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching...
                  </div>
                )}
                {tokenBSearch && !searchingAssets && searchedAssets.length > 0 && (
                  <div className="rounded-lg border border-border/40 bg-muted/20 p-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchedAssets.map((asset) => {
                      const assetValue = asset.asset_type === "native" 
                        ? "native" 
                        : `${asset.asset_code}:${asset.asset_issuer}`
                      const displayName = asset.asset_type === "native" ? "Test Pi" : asset.asset_code
                      return (
                        <button
                          key={assetValue}
                          onClick={() => {
                            handleTokenBChange(assetValue)
                            setTokenBSearch("")
                          }}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm"
                        >
                          <div className="font-medium">{displayName}</div>
                          {asset.asset_type !== "native" && (
                            <div className="text-xs text-muted-foreground truncate">
                              {asset.asset_issuer.slice(0, 8)}...{asset.asset_issuer.slice(-6)}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                {/* Allow manual entry for "native" */}
                {tokenBSearch && tokenBSearch.toLowerCase() === "native" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleTokenBChange("native")
                      setTokenBSearch("")
                    }}
                    className="w-full"
                  >
                    Use "Test Pi" (native)
                  </Button>
                )}
                  {tokenBSearch && !searchingAssets && searchedAssets.length === 0 && tokenBSearchCode && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground p-2">
                        No assets found for "{tokenBSearchCode}". You can still enter the full format (CODE:ISSUER) or select from available pairs below.
                      </div>
                      {/* Allow manual entry if user types full format */}
                      {tokenBSearch.includes(":") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleTokenBChange(tokenBSearch)
                            setTokenBSearch("")
                          }}
                          className="w-full"
                        >
                          Use "{tokenBSearch}"
                        </Button>
                      )}
                    </div>
                  )}
                {/* Show paired tokens as fallback suggestions */}
                {pairedTokens.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Or select from available pairs:</p>
                    <Select value={tokenB} onValueChange={handleTokenBChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select from available pairs" />
                      </SelectTrigger>
                      <SelectContent>
                        {pairedTokens.map((token) => {
                          const isNative = token === "native"
                          const displayName = isNative ? "Test Pi" : (token.includes(":") ? token.split(":")[0] : token)
                          return (
                            <SelectItem key={token} value={token}>
                              {displayName}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <Select value={tokenB} onValueChange={handleTokenBChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a token to swap to" />
                </SelectTrigger>
                <SelectContent>
                  {pairedTokens.map((token) => {
                    const isNative = token === "native"
                    const displayName = isNative ? "Test Pi" : (token.includes(":") ? token.split(":")[0] : token)
                    return (
                      <SelectItem key={token} value={token}>
                        {displayName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
            {tokenA && pairedTokens.length > 0 && tokenBInputMode === "dropdown" && (
              <p className="text-xs text-muted-foreground">
                Tokens available in liquidity pools with {fromToken?.code === "native" ? "Test Pi" : fromToken?.code}
              </p>
            )}
          </div>

          {tokenA && tokenB && fromToken?.code && toToken?.code && fromToken.code !== toToken.code && (
            <>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{tokenA}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{tokenB}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-border/20">
                  <span>Searching for:</span>
                  <span className="font-mono">{fromToken.code} / {toToken.code}</span>
                </div>
              </div>

              {poolsError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="font-medium mb-1">Error fetching pools:</div>
                  <div>{poolsError.message}</div>
                  {poolsError.status && (
                    <div className="text-xs mt-1">Status: {poolsError.status}</div>
                  )}
                </div>
              )}

              {pools.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Select Pool</Label>
                  <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a pool" />
                    </SelectTrigger>
                    <SelectContent>
                      {pools.map((pool) => (
                        <SelectItem key={pool.id} value={pool.id}>
                          <div className="flex flex-col">
                            <span>Pool {pool.id.slice(0, 8)}...</span>
                            <span className="text-xs text-muted-foreground">
                              Fee: {(pool.fee_bp / 100).toFixed(2)}% | Shares: {pool.total_shares}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedPool && (
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pool ID</span>
                    <span className="font-mono text-xs">{selectedPool.id.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pool Fee</span>
                    <span className="font-medium">{(selectedPool.fee_bp / 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Shares</span>
                    <span className="font-medium">{selectedPool.total_shares}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Slippage Tolerance</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="1"
                      value={slippagePercent}
                      onChange={(event) => {
                        const value = parseFloat(event.target.value)
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          setSlippagePercent(value)
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground self-center">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum acceptable price slippage (default: 1%)
                  </p>
                </div>

                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
                  {quoting ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground">Fetching quote...</span>
                    </div>
                  ) : quoteError ? (
                    <div className="text-sm text-destructive">
                      Failed to fetch quote: {quoteError.message || "Unknown error"}
                    </div>
                  ) : quote ? (
                    <>
                      {displayCountdown !== null && displayCountdown > 0 && (
                        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-yellow-600 dark:text-yellow-400">
                              Quote expires in:
                            </span>
                            <span className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">
                              {displayCountdown}s
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Quote will automatically refresh
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Output</span>
                        <span className="font-medium">
                          {quote.expectedOutput} {toToken?.code ?? ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Received</span>
                        <span className="font-medium text-green-500">{quote.minOut}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pool Fee</span>
                        <span className="font-medium">{quote.fee}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Slippage</span>
                        <span className="font-medium">{quote.slippagePercent}%</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Enter an amount to see quote
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Only show secret input if no stored secret exists */}
          {!hasStoredSecret && (
            <div className="space-y-2">
              <Label htmlFor="swap-secret" className="text-sm font-medium text-muted-foreground">
                User Secret
              </Label>
              <Input
                id="swap-secret"
                type="password"
                placeholder="SXXXXXXXXXXXXXXXX"
                value={userSecret}
                onChange={(event) => setUserSecret(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the secret key to sign the swap transaction, or import your account and set up authentication.
              </p>
            </div>
          )}
          
          {hasStoredSecret && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>You'll be prompted for your PIN/password when you click Swap</span>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 btn-gradient-primary font-semibold shadow-lg"
            onClick={handleSubmit}
            disabled={executing || quoting || !quoteEnabled || !tokenA || !tokenB || !selectedPoolId}
          >
            {executing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : quoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching quote...
              </>
            ) : (
              "Swap"
            )}
          </Button>
        </CardContent>
      </div>

      {walletAddress && (
        <PasswordPromptDialog
          open={showPasswordDialog}
          onOpenChange={handlePasswordDialogClose}
          publicKey={walletAddress}
          onPasswordSubmit={handlePasswordSubmit}
          error={null}
        />
      )}
    </Card>
  )
}

