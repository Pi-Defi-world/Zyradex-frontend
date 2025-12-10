// @ts-nocheck
"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Droplets, TrendingUp, Users, Search, Shield, User } from "lucide-react"
import type React from "react"
import Link from "next/link"

import { useToast } from "@/hooks/use-toast"
import {
  useLiquidityPools,
  useCreateLiquidityPool,
  useAddLiquidity,
  useWithdrawLiquidity,
} from "@/hooks/useLiquidityData"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { getUserTokens, getPlatformPools, quoteAddLiquidity, type PoolExistsError } from "@/lib/api/liquidity"
import type { ILiquidityPool } from "@/lib/types"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

interface LiquidityFormState {
  userSecret: string
  tokenACode: string
  tokenAIssuer: string
  tokenBCode: string
  tokenBIssuer: string
  amountA: string
  amountB: string
}

interface DepositFormState {
  userSecret: string
  amountA: string
  amountB: string
}

interface WithdrawFormState {
  userSecret: string
  shareAmount: string
}

const defaultCreateForm: LiquidityFormState = {
  userSecret: "",
  tokenACode: "",
  tokenAIssuer: "",
  tokenBCode: "",
  tokenBIssuer: "",
  amountA: "",
  amountB: "",
}

const defaultDepositForm: DepositFormState = {
  userSecret: "",
  amountA: "",
  amountB: "",
}

const defaultWithdrawForm: WithdrawFormState = {
  userSecret: "",
  shareAmount: "",
}

const parseAsset = (asset: string) => {
  if (asset === "native") {
    return { symbol: "PI", issuer: "native" }
  }
  const [code, issuer] = asset.split(":")
  return { symbol: code, issuer }
}

const formatPool = (pool: ILiquidityPool) => {
  const [reserveA, reserveB] = pool.reserves
  const assetA = reserveA ? parseAsset(reserveA.asset) : { symbol: "?", issuer: "" }
  const assetB = reserveB ? parseAsset(reserveB.asset) : { symbol: "?", issuer: "" }
  return {
    ...pool,
    assetA,
    assetB,
    pair: `${assetA.symbol}/${assetB.symbol}`,
    liquidity: Number.parseFloat(pool.total_shares || "0"),
    trustlines: Number.parseFloat(pool.total_trustlines || "0"),
    volume: (Number.parseFloat(reserveA?.amount ?? "0") + Number.parseFloat(reserveB?.amount ?? "0")),
  }
}

export default function LiquidityPage() {
  const { toast } = useToast()
  const { user } = usePi()
  const { profile } = useUserProfile()
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(Date.now())

  const walletAddress = profile?.public_key || getStoredWallet() || user?.wallet_address || null

  // Fetch user tokens when wallet address is available
  useEffect(() => {
    if (walletAddress) {
      setLoadingUserTokens(true)
      getUserTokens(walletAddress)
        .then((data) => {
          const tokens = data.tokens.map((t: any) => {
            const isNative = t.assetType === 'native' || (!t.code && !t.issuer) || t.code === 'Test Pi'
            return {
              code: isNative ? 'native' : (t.code || ''),
              issuer: isNative ? '' : (t.issuer || ''),
              amount: t.amount,
              assetType: t.assetType,
            }
          })
          setUserTokens(tokens)
        })
        .catch((err) => {
          console.error("Failed to fetch user tokens:", err)
        })
        .finally(() => {
          setLoadingUserTokens(false)
        })
    } else {
      setUserTokens([])
    }
  }, [walletAddress])

  // Fetch platform pools
  useEffect(() => {
    setLoadingPlatformPools(true)
    getPlatformPools()
      .then((data) => {
        setPlatformPools(data.pools)
      })
      .catch((err) => {
        console.error("Failed to fetch platform pools:", err)
      })
      .finally(() => {
        setLoadingPlatformPools(false)
      })
  }, [refreshKey])


  const { pools, isLoading, error } = useLiquidityPools({ limit: 30 }, { refreshKey })
  const { createLiquidityPool, isLoading: creating } = useCreateLiquidityPool()
  const { addLiquidity, isLoading: adding } = useAddLiquidity()
  const { withdrawLiquidity, isLoading: withdrawing } = useWithdrawLiquidity()

  const [createForm, setCreateForm] = useState<LiquidityFormState>(defaultCreateForm)
  const [depositForm, setDepositForm] = useState<DepositFormState>(defaultDepositForm)
  const [withdrawForm, setWithdrawForm] = useState<WithdrawFormState>(defaultWithdrawForm)
  const [activePool, setActivePool] = useState<ILiquidityPool | null>(null)
  const [userTokens, setUserTokens] = useState<Array<{ code: string; issuer: string; amount: number; assetType?: string }>>([])
  const [loadingUserTokens, setLoadingUserTokens] = useState(false)
  const [platformPools, setPlatformPools] = useState<any[]>([])
  const [loadingPlatformPools, setLoadingPlatformPools] = useState(false)
  const [poolExistsError, setPoolExistsError] = useState<PoolExistsError | null>(null)
  const [hasStoredSecret, setHasStoredSecret] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [quoteData, setQuoteData] = useState<{ totalFee?: string; platformFee?: string; baseFee?: string } | null>(null)


  const displayPools = useMemo(() => {
    const formatted = pools.map(formatPool)
    if (!searchQuery.trim()) return formatted
    const query = searchQuery.trim().toUpperCase()
    return formatted.filter((pool) =>
      pool.assetA.symbol.toUpperCase().includes(query) || pool.assetB.symbol.toUpperCase().includes(query)
    )
  }, [pools, searchQuery])

  const resetForms = () => {
    setCreateForm(defaultCreateForm)
    setDepositForm(defaultDepositForm)
    setWithdrawForm(defaultWithdrawForm)
    setActivePool(null)
  }

  const handleCreatePool = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive" 
      })
      return
    }
    try {
      await createLiquidityPool({
        userSecret: createForm.userSecret.trim(),
        tokenA: { code: createForm.tokenACode, issuer: createForm.tokenAIssuer },
        tokenB: { code: createForm.tokenBCode, issuer: createForm.tokenBIssuer },
        amountA: createForm.amountA,
        amountB: createForm.amountB,
      })
      toast({ title: "Liquidity pool created", description: "Liquidity was deposited successfully." })
      resetForms()
      setPoolExistsError(null)
      setRefreshKey(Date.now())
      setCreateForm(defaultCreateForm) // Clear secret
    } catch (err: any) {
      // Handle pool exists error
      if (err.poolExists && err.poolId) {
        setPoolExistsError(err)
        toast({
          title: "Pool already exists",
          description: err.suggestion || "Use the deposit option to add liquidity to the existing pool",
          variant: "destructive",
        })
      } else {
        // Extract error message and suggestion
        const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to create pool"
        const suggestion = err && typeof err === "object" && "suggestion" in err ? (err as any).suggestion : undefined
        
        // Combine message and suggestion for better user experience
        const description = suggestion ? `${message}\n\n${suggestion}` : message
        
        toast({ 
          title: "Could not create pool", 
          description: description,
          variant: "destructive",
          duration: suggestion ? 8000 : 5000, // Show longer if there's a suggestion
        })
      }
    }
  }

  const handleDeposit = async (event: React.FormEvent<HTMLFormElement>, pool: ILiquidityPool) => {
    event.preventDefault()
    if (!depositForm.userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive" 
      })
      return
    }
    try {
      await addLiquidity({
        userSecret: depositForm.userSecret.trim(),
        poolId: pool.id,
        amountA: depositForm.amountA,
        amountB: depositForm.amountB,
      })
      toast({ title: "Liquidity added", description: `${pool.id} updated successfully.` })
      resetForms()
      setRefreshKey(Date.now())
      setDepositForm(defaultDepositForm) // Clear secret
    } catch (err: any) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to add liquidity"
      const suggestion = err && typeof err === "object" && "suggestion" in err ? (err as any).suggestion : undefined
      const description = suggestion ? `${message}\n\n${suggestion}` : message
      
      toast({ 
        title: "Could not add liquidity", 
        description: description,
        variant: "destructive",
        duration: suggestion ? 8000 : 5000,
      })
    }
  }

  const handleWithdraw = async (event: React.FormEvent<HTMLFormElement>, pool: ILiquidityPool) => {
    event.preventDefault()
    if (!withdrawForm.userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive" 
      })
      return
    }
    try {
      await withdrawLiquidity({
        userSecret: withdrawForm.userSecret.trim(),
        poolId: pool.id,
        amount: withdrawForm.shareAmount,
      })
      toast({ title: "Liquidity withdrawn", description: `${pool.id} updated successfully.` })
      resetForms()
      setRefreshKey(Date.now())
      setWithdrawForm(defaultWithdrawForm) // Clear secret
    } catch (err: any) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to withdraw"
      const suggestion = err && typeof err === "object" && "suggestion" in err ? (err as any).suggestion : undefined
      const description = suggestion ? `${message}\n\n${suggestion}` : message
      
      toast({ 
        title: "Could not withdraw liquidity", 
        description: description,
        variant: "destructive",
        duration: suggestion ? 8000 : 5000,
      })
    }
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Liquidity Pools</h1>
            <p className="text-sm text-muted-foreground">Discover and manage liquidity pools on the Pi testnet DEX.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="btn-gradient-primary" disabled={creating}>
                <Plus className="mr-2 h-4 w-4" />
                Create Pool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pool</DialogTitle>
                <DialogDescription>Provide the asset pair, amounts, and secret to initialise the pool.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreatePool}>
                <div className="space-y-2">
                  <Label htmlFor="create-userSecret">Secret Seed (Required)</Label>
                  <Input
                    id="create-userSecret"
                    type="password"
                    placeholder="Enter your secret seed (starts with S...)"
                    value={createForm.userSecret}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, userSecret: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter your secret seed to sign this transaction. We don't store your secret seed.</p>
                </div>
                {poolExistsError && (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                          Pool already exists
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          {poolExistsError.suggestion}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Pool ID: {poolExistsError.poolId}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (poolExistsError.existingPool) {
                            setActivePool(poolExistsError.existingPool)
                            setPoolExistsError(null)
                          }
                        }}
                      >
                        Add Liquidity
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tokenA-select">Token A</Label>
                    {walletAddress ? (
                      <Select
                        value={createForm.tokenACode === "native" ? "native" : (createForm.tokenACode && createForm.tokenAIssuer ? `${createForm.tokenACode}:${createForm.tokenAIssuer}` : "")}
                        onValueChange={(value: string) => {
                          if (value === "native") {
                            setCreateForm((prev) => ({ ...prev, tokenACode: "native", tokenAIssuer: "" }))
                          } else {
                            const [code, issuer] = value.split(":")
                            setCreateForm((prev) => ({ ...prev, tokenACode: code, tokenAIssuer: issuer || "" }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select token A" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="native">Native (Test Pi)</SelectItem>
                          {userTokens
                            .filter((t) => t.code !== "native")
                            .map((token) => (
                              <SelectItem
                                key={`${token.code}:${token.issuer}`}
                                value={`${token.code}:${token.issuer}`}
                              >
                                {token.code} {token.issuer ? `(${token.issuer.slice(0, 8)}...)` : ""} - {token.amount.toFixed(4)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          id="tokenA-code"
                          placeholder="e.g. PI or native"
                          value={createForm.tokenACode}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenACode: event.target.value }))}
                          required
                        />
                        {createForm.tokenACode !== "native" && (
                          <Input
                            id="tokenA-issuer"
                            placeholder="Issuer public key (leave empty for native)"
                            value={createForm.tokenAIssuer}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenAIssuer: event.target.value }))}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenB-select">Token B</Label>
                    {walletAddress ? (
                      <Select
                        value={createForm.tokenBCode === "native" ? "native" : (createForm.tokenBCode && createForm.tokenBIssuer ? `${createForm.tokenBCode}:${createForm.tokenBIssuer}` : "")}
                        onValueChange={(value: string) => {
                          if (value === "native") {
                            setCreateForm((prev) => ({ ...prev, tokenBCode: "native", tokenBIssuer: "" }))
                          } else {
                            const [code, issuer] = value.split(":")
                            setCreateForm((prev) => ({ ...prev, tokenBCode: code, tokenBIssuer: issuer || "" }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select token B" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="native">Native (Test Pi)</SelectItem>
                          {userTokens
                            .filter((t) => t.code !== "native")
                            .map((token) => (
                              <SelectItem
                                key={`${token.code}:${token.issuer}`}
                                value={`${token.code}:${token.issuer}`}
                              >
                                {token.code} {token.issuer ? `(${token.issuer.slice(0, 8)}...)` : ""} - {token.amount.toFixed(4)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          id="tokenB-code"
                          placeholder="e.g. PIUSD"
                          value={createForm.tokenBCode}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenBCode: event.target.value }))}
                          required
                        />
                        {createForm.tokenBCode !== "native" && (
                          <Input
                            id="tokenB-issuer"
                            placeholder="Issuer public key"
                            value={createForm.tokenBIssuer}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenBIssuer: event.target.value }))}
                            required
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {loadingUserTokens && (
                  <p className="text-xs text-muted-foreground">Loading your tokens...</p>
                )}
                {!loadingUserTokens && userTokens.length === 0 && walletAddress && (
                  <p className="text-xs text-muted-foreground">No tokens found. You need to own tokens to create a pool.</p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amountA">Amount A</Label>
                    <Input
                      id="amountA"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={createForm.amountA}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, amountA: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amountB">Amount B</Label>
                    <Input
                      id="amountB"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={createForm.amountB}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, amountB: event.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Transaction Fee</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                      ~0.01 Test Pi
                    </span>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-gradient-primary" disabled={creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Pool
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pools by token code"
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        {platformPools.length > 0 && (
          <Card className="border border-border/50 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Platform Pools</CardTitle>
              <CardDescription className="mt-1">Pools created on this platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlatformPools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {platformPools.map((platformPool) => {
                    // Convert platform pool to ILiquidityPool format if pool data exists
                    const poolForInteraction = platformPool.pool ? {
                      id: platformPool.poolId,
                      reserves: platformPool.pool.reserves,
                      total_shares: platformPool.pool.total_shares,
                      fee_bp: platformPool.pool.fee_bp,
                      last_modified_time: platformPool.pool.last_modified_time,
                      total_trustlines: "0",
                    } as ILiquidityPool : null;
                    const formattedPool = poolForInteraction ? formatPool(poolForInteraction) : null;
                    
                    return (
                    <div
                      key={platformPool.poolId}
                        className="flex flex-col gap-3 p-3 rounded-lg border bg-card"
                    >
                        <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {platformPool.baseToken}/{platformPool.quoteToken}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pool ID: {platformPool.poolId.slice(0, 16)}...
                        </div>
                            {platformPool.pool && formattedPool && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                <div>Total Shares: {parseFloat(platformPool.pool.total_shares || "0").toFixed(2)}</div>
                                <div className="flex gap-4">
                                  <span>
                                    {formattedPool.assetA.symbol}: <span className="font-semibold">{Number.parseFloat(formattedPool.reserves[0]?.amount ?? "0").toLocaleString()}</span>
                                  </span>
                                  <span>
                                    {formattedPool.assetB.symbol}: <span className="font-semibold">{Number.parseFloat(formattedPool.reserves[1]?.amount ?? "0").toLocaleString()}</span>
                                  </span>
                                </div>
                              </div>
                            )}
                            {platformPool.error && (
                              <div className="text-xs text-destructive mt-1">
                                {platformPool.error}
                          </div>
                        )}
                      </div>
                      <Badge variant={platformPool.verified ? "default" : "secondary"}>
                        {platformPool.verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                        {formattedPool && poolForInteraction && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                          onClick={() => {
                            setActivePool(poolForInteraction)
                            setDepositForm(defaultDepositForm)
                            setQuoteData(null)
                          }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Liquidity
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Liquidity to {formattedPool.pair}</DialogTitle>
                                  <DialogDescription>Deposit matching amounts to increase the pool depth.</DialogDescription>
                                </DialogHeader>
                                <form className="space-y-4" onSubmit={(event) => handleDeposit(event, poolForInteraction)}>
                                  <div className="space-y-2">
                                    <Label htmlFor="deposit-userSecret">Secret Seed (Required)</Label>
                                    <Input
                                      id="deposit-userSecret"
                                      type="password"
                                      placeholder="Enter your secret seed (starts with S...)"
                                      value={depositForm.userSecret}
                                      onChange={(event) => setDepositForm((prev) => ({ ...prev, userSecret: event.target.value }))}
                                      required
                                    />
                                    <p className="text-xs text-muted-foreground">Enter your secret seed to sign this transaction. We don't store your secret seed.</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>{formattedPool.assetA.symbol} Amount</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={depositForm.amountA}
                                      onChange={async (event) => {
                                        const amountA = event.target.value
                                        setDepositForm((prev) => ({ ...prev, amountA }))
                                        
                                        // Fetch quote when amountA is entered
                                        if (amountA && parseFloat(amountA) > 0) {
                                          setLoadingQuote(true)
                                          try {
                                            const quote = await quoteAddLiquidity({
                                              poolId: poolForInteraction.id,
                                              amountA,
                                            })
                                            setDepositForm((prev) => ({ ...prev, amountB: quote.amountB }))
                                            setQuoteData({ totalFee: quote.totalFee, platformFee: quote.platformFee, baseFee: quote.baseFee })
                                          } catch (err) {
                                            console.error("Failed to fetch quote:", err)
                                            setDepositForm((prev) => ({ ...prev, amountB: "" }))
                                            setQuoteData(null)
                                          } finally {
                                            setLoadingQuote(false)
                                          }
                                        } else {
                                          setDepositForm((prev) => ({ ...prev, amountB: "" }))
                                          setQuoteData(null)
                                        }
                                      }}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>{formattedPool.assetB.symbol} Amount (Calculated)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={depositForm.amountB}
                                      readOnly
                                      className="bg-muted"
                                      placeholder={loadingQuote ? "Calculating..." : "Enter amount above"}
                                    />
                                    {loadingQuote && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Calculating required amount...
                                      </p>
                                    )}
                                    {!loadingQuote && depositForm.amountB && (
                                      <p className="text-xs text-muted-foreground">
                                        This amount is calculated based on the pool's current ratio
                                      </p>
                                    )}
                                  </div>
                                  {depositForm.amountA && !loadingQuote && quoteData && (
                                    <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 backdrop-blur-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Fee</span>
                                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                                          ~{parseFloat(quoteData.totalFee || "0").toFixed(7)} Test Pi
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <Button type="submit" className="w-full btn-gradient-primary" disabled={adding || !depositForm.amountA || !depositForm.amountB}>
                                    {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Add Liquidity
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Link href={`/swap?from=${formattedPool.assetA.symbol}&to=${formattedPool.assetB.symbol}`}>
                              <Button variant="outline" size="sm">
                                Trade
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border/50 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Liquidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayPools
                  .reduce((total, pool) => total + pool.volume, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visible Pools</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayPools.length}</div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trustlines</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayPools
                  .reduce((total, pool) => total + pool.trustlines, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Available Pools</CardTitle>
            <CardDescription className="mt-1">Browse and manage liquidity pools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading pools...
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive">{error.message}</div>
            )}
            {!isLoading && !displayPools.length && !error && (
              <div className="text-sm text-muted-foreground">No pools match your search.</div>
            )}
            <div className="space-y-4">
                {displayPools.map((pool) => (
                <div
                  key={pool.id}
                  className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{pool.pair}</h3>
                        {pool.trustlines > 50 && <Badge variant="secondary" className="text-xs">Active</Badge>}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                          {pool.assetA.symbol}: <span className="font-semibold text-foreground">{Number.parseFloat(pool.reserves[0]?.amount ?? "0").toLocaleString()}</span>
                        </span>
                        <span>
                          {pool.assetB.symbol}: <span className="font-semibold text-foreground">{Number.parseFloat(pool.reserves[1]?.amount ?? "0").toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActivePool(pool)
                            setDepositForm(defaultDepositForm)
                            setQuoteData(null)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Liquidity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Liquidity to {pool.pair}</DialogTitle>
                          <DialogDescription>Deposit matching amounts to increase the pool depth.</DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={(event) => handleDeposit(event, pool)}>
                          <div className="space-y-2">
                            <Label htmlFor="deposit-userSecret">Secret Seed (Required)</Label>
                            <Input
                              id="deposit-userSecret"
                              type="password"
                              placeholder="Enter your secret seed (starts with S...)"
                              value={depositForm.userSecret}
                              onChange={(event) => setDepositForm((prev) => ({ ...prev, userSecret: event.target.value }))}
                              required
                            />
                            <p className="text-xs text-muted-foreground">Enter your secret seed to sign this transaction. We don't store your secret seed.</p>
                          </div>
                          <div className="space-y-2">
                            <Label>{pool.assetA.symbol} Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={depositForm.amountA}
                              onChange={async (event) => {
                                const amountA = event.target.value
                                setDepositForm((prev) => ({ ...prev, amountA }))
                                
                                // Fetch quote when amountA is entered
                                if (amountA && parseFloat(amountA) > 0) {
                                  setLoadingQuote(true)
                                  try {
                                    const quote = await quoteAddLiquidity({
                                      poolId: pool.id,
                                      amountA,
                                    })
                                    setDepositForm((prev) => ({ ...prev, amountB: quote.amountB }))
                                    setQuoteData({ totalFee: quote.totalFee, platformFee: quote.platformFee, baseFee: quote.baseFee })
                                  } catch (err) {
                                    console.error("Failed to fetch quote:", err)
                                    setDepositForm((prev) => ({ ...prev, amountB: "" }))
                                    setQuoteData(null)
                                  } finally {
                                    setLoadingQuote(false)
                                  }
                                } else {
                                  setDepositForm((prev) => ({ ...prev, amountB: "" }))
                                  setQuoteData(null)
                                }
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{pool.assetB.symbol} Amount (Calculated)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={depositForm.amountB}
                              readOnly
                              className="bg-muted"
                              placeholder={loadingQuote ? "Calculating..." : "Enter amount above"}
                            />
                            {loadingQuote && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Calculating required amount...
                              </p>
                            )}
                            {!loadingQuote && depositForm.amountB && (
                              <p className="text-xs text-muted-foreground">
                                This amount is calculated based on the pool's current ratio
                              </p>
                            )}
                          </div>
                          {depositForm.amountA && !loadingQuote && quoteData && (
                            <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 backdrop-blur-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Fee</span>
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                                  ~{parseFloat(quoteData.totalFee || "0").toFixed(7)} Test Pi
                                </span>
                              </div>
                            </div>
                          )}
                          <Button type="submit" className="w-full btn-gradient-primary" disabled={adding || !depositForm.amountA || !depositForm.amountB}>
                            {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Add Liquidity
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActivePool(pool)
                            setWithdrawForm(defaultWithdrawForm)
                          }}
                        >
                            <span className="mr-2">−</span>
                            Withdraw
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Withdraw from {pool.pair}</DialogTitle>
                          <DialogDescription>Redeem liquidity by providing your pool share percentage.</DialogDescription>
                          </DialogHeader>
                        <form className="space-y-4" onSubmit={(event) => handleWithdraw(event, pool)}>
                          {!hasStoredSecret && (
                            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3">
                              <div className="flex items-start gap-2">
                                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                    Account Required
                                  </p>
                                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                    You need to import your account and set up authentication to withdraw liquidity. This allows you to use PIN/password instead of entering your secret key manually.
                                  </p>
                                </div>
                              </div>
                              <Link href="/profile" className="block">
                                <Button type="button" variant="outline" className="w-full" size="sm">
                                  <User className="mr-2 h-4 w-4" />
                                  Go to Profile to Import Account
                                </Button>
                              </Link>
                            </div>
                          )}
                          {hasStoredSecret && (
                            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                <span>You'll be prompted for your PIN/password when you submit</span>
                              </div>
                            </div>
                          )}
                            <div className="space-y-2">
                            <Label>Pool Share to Withdraw</Label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Enter pool share amount"
                              value={withdrawForm.shareAmount}
                              onChange={(event) => setWithdrawForm((prev) => ({ ...prev, shareAmount: event.target.value }))}
                              required
                            />
                            </div>
                          <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 backdrop-blur-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Fee</span>
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                                ~10.01 Test Pi
                              </span>
                            </div>
                          </div>
                          <Button type="submit" className="w-full" variant="destructive" disabled={withdrawing}>
                            {withdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Withdraw Liquidity
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
