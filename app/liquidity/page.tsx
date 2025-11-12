"use client"

import { useMemo, useState } from "react"
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
import { Loader2, Plus, Droplets, TrendingUp, Users, Minus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useLiquidityPools,
  useCreateLiquidityPool,
  useAddLiquidity,
  useWithdrawLiquidity,
} from "@/hooks/useLiquidityData"
import type { ILiquidityPool } from "@/lib/types"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(Date.now())

  const { pools, isLoading, error } = useLiquidityPools({ limit: 30 }, { refreshKey })
  const { createLiquidityPool, isLoading: creating } = useCreateLiquidityPool()
  const { addLiquidity, isLoading: adding } = useAddLiquidity()
  const { withdrawLiquidity, isLoading: withdrawing } = useWithdrawLiquidity()

  const [createForm, setCreateForm] = useState<LiquidityFormState>(defaultCreateForm)
  const [depositForm, setDepositForm] = useState<DepositFormState>(defaultDepositForm)
  const [withdrawForm, setWithdrawForm] = useState<WithdrawFormState>(defaultWithdrawForm)
  const [activePool, setActivePool] = useState<ILiquidityPool | null>(null)

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
    try {
      await createLiquidityPool({
        userSecret: createForm.userSecret,
        tokenA: { code: createForm.tokenACode, issuer: createForm.tokenAIssuer },
        tokenB: { code: createForm.tokenBCode, issuer: createForm.tokenBIssuer },
        amountA: createForm.amountA,
        amountB: createForm.amountB,
      })
      toast({ title: "Liquidity pool created", description: "Liquidity was deposited successfully." })
      resetForms()
      setRefreshKey(Date.now())
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to create pool"
      toast({ title: "Could not create pool", description: message, variant: "destructive" })
    }
  }

  const handleDeposit = async (event: React.FormEvent<HTMLFormElement>, pool: ILiquidityPool) => {
    event.preventDefault()
    try {
      await addLiquidity({
        userSecret: depositForm.userSecret,
        poolId: pool.id,
        amountA: depositForm.amountA,
        amountB: depositForm.amountB,
      })
      toast({ title: "Liquidity added", description: `${pool.id} updated successfully.` })
      resetForms()
      setRefreshKey(Date.now())
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to add liquidity"
      toast({ title: "Could not add liquidity", description: message, variant: "destructive" })
    }
  }

  const handleWithdraw = async (event: React.FormEvent<HTMLFormElement>, pool: ILiquidityPool) => {
    event.preventDefault()
    try {
      await withdrawLiquidity({
        userSecret: withdrawForm.userSecret,
        poolId: pool.id,
        amount: withdrawForm.shareAmount,
      })
      toast({ title: "Liquidity withdrawn", description: `${pool.id} updated successfully.` })
      resetForms()
      setRefreshKey(Date.now())
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to withdraw"
      toast({ title: "Could not withdraw liquidity", description: message, variant: "destructive" })
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
                  <Label htmlFor="create-secret">User Secret</Label>
                  <Input
                    id="create-secret"
                    placeholder="SXXXXXXXXXXXXXXXX"
                    value={createForm.userSecret}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, userSecret: event.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tokenA-code">Token A Code</Label>
                    <Input
                      id="tokenA-code"
                      placeholder="e.g. PI"
                      value={createForm.tokenACode}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenACode: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenA-issuer">Token A Issuer</Label>
                    <Input
                      id="tokenA-issuer"
                      placeholder="Issuer public key"
                      value={createForm.tokenAIssuer}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenAIssuer: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenB-code">Token B Code</Label>
                    <Input
                      id="tokenB-code"
                      placeholder="e.g. PIUSD"
                      value={createForm.tokenBCode}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenBCode: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenB-issuer">Token B Issuer</Label>
                    <Input
                      id="tokenB-issuer"
                      placeholder="Issuer public key"
                      value={createForm.tokenBIssuer}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, tokenBIssuer: event.target.value }))}
                      required
                    />
                  </div>
                </div>
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
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
              <p className="text-xs text-muted-foreground mt-1">Sum of reserves across visible pools</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visible Pools</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayPools.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Filtered by your search query</p>
            </CardContent>
          </Card>
          <Card>
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
              <p className="text-xs text-muted-foreground mt-1">Aggregate trustlines for visible pools</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Pools</CardTitle>
            <CardDescription>Browse and manage liquidity pools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{pool.pair}</h3>
                        {pool.trustlines > 50 && <Badge variant="secondary">Active</Badge>}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {pool.assetA.symbol}: <span className="font-semibold">{Number.parseFloat(pool.reserves[0]?.amount ?? "0").toLocaleString()}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {pool.assetB.symbol}: <span className="font-semibold">{Number.parseFloat(pool.reserves[1]?.amount ?? "0").toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Liquidity: {pool.liquidity.toLocaleString()}</span>
                        <span>Trustlines: {pool.trustlines.toLocaleString()}</span>
                        <span className="text-primary">Last Modified: {new Date(pool.last_modified_time).toLocaleString()}</span>
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
                            <Label htmlFor="deposit-secret">User Secret</Label>
                            <Input
                              id="deposit-secret"
                              value={depositForm.userSecret}
                              onChange={(event) => setDepositForm((prev) => ({ ...prev, userSecret: event.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{pool.assetA.symbol} Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={depositForm.amountA}
                              onChange={(event) => setDepositForm((prev) => ({ ...prev, amountA: event.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{pool.assetB.symbol} Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={depositForm.amountB}
                              onChange={(event) => setDepositForm((prev) => ({ ...prev, amountB: event.target.value }))}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full btn-gradient-primary" disabled={adding}>
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
                            <Minus className="mr-2 h-4 w-4" />
                            Withdraw
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Withdraw from {pool.pair}</DialogTitle>
                          <DialogDescription>Redeem liquidity by providing your pool share percentage.</DialogDescription>
                          </DialogHeader>
                        <form className="space-y-4" onSubmit={(event) => handleWithdraw(event, pool)}>
                          <div className="space-y-2">
                            <Label htmlFor="withdraw-secret">User Secret</Label>
                            <Input
                              id="withdraw-secret"
                              value={withdrawForm.userSecret}
                              onChange={(event) => setWithdrawForm((prev) => ({ ...prev, userSecret: event.target.value }))}
                              required
                            />
                          </div>
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
