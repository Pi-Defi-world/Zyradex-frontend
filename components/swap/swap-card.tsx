"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, Settings, Loader2, Lock } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { useToast } from "@/hooks/use-toast"
import { usePoolsForPair, useSwapQuote, useExecuteSwap } from "@/hooks/useSwapData"
import { useTransactionAuth } from "@/hooks/useTransactionAuth"
import { PasswordPromptDialog } from "@/components/password-prompt-dialog"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("bingepi-wallet-address")
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
  const { toast } = useToast()
  const [localWallet, setLocalWallet] = useState<string | null>(null)

  useEffect(() => {
    setLocalWallet(getStoredWallet())
  }, [])

  // Token input state
  const [tokenA, setTokenA] = useState<string>("")
  const [tokenB, setTokenB] = useState<string>("")
  const [fromAmount, setFromAmount] = useState("")
  const [userSecret, setUserSecret] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState<string>("")
  const [slippagePercent, setSlippagePercent] = useState<number>(1)
  
  const walletAddress = localWallet || user?.wallet_address
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

  // Fetch pools for the entered pair - only when both tokens have codes
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

  const { quote, isLoading: quoting, error: quoteError } = useSwapQuote(
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

  const { executeSwap, isLoading: executing } = useExecuteSwap()

  const handleTokenAChange = (value: string) => {
    setTokenA(value)
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
            <Label className="text-sm font-medium text-muted-foreground">Token A</Label>
            <Input
              placeholder="e.g., zyra, wpi, native, or CODE:ISSUER"
              value={tokenA}
              onChange={(event) => handleTokenAChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter token code (e.g., "zyra") or full format (e.g., "CODE:ISSUER")
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
            <Label className="text-sm font-medium text-muted-foreground">Token B</Label>
            <Input
              placeholder="e.g., zyra, wpi, native, or CODE:ISSUER"
              value={tokenB}
              onChange={(event) => handleTokenBChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter token code (e.g., "wpi") or full format (e.g., "CODE:ISSUER")
            </p>
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

