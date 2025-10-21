"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Droplets, TrendingUp, Users, Minus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchPools } from "@/lib/store/slices/liquidityPoolsSlice"
import type { ILiquidityPool } from "@/lib/types"

// Helper to parse asset string to { symbol, issuer }
function parseAsset(asset: string) {
  if (asset === "native") {
    return { symbol: "Test-Pi", issuer: "" }
  }
  const [code, issuer] = asset.split(":")
  return { symbol: code, issuer }
}

// Format last modified time for display
function formatLastModified(time: string) {
  const date = new Date(time)
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Derive display fields for a pool
function getDisplayPool(pool: ILiquidityPool) {
  const [reserveA, reserveB] = pool.reserves
  const tokenA = parseAsset(reserveA.asset)
  const tokenB = parseAsset(reserveB.asset)

  // Pair name
  const pair = `${tokenA.symbol}/${tokenB.symbol}`

  // Liquidity: use total_shares as a proxy, or sum of reserves
  // For demo, just sum the reserves' amounts (not accurate USD, but placeholder)
  const liquidity =
    Number.parseFloat(reserveA.amount) + Number.parseFloat(reserveB.amount)

  // No volume in ILiquidityPool, so use placeholder
  const volume24h = 0

  // No user share info, so always hide
  const yourShare = null
  const yourLiquidity = null

  // Use last_modified_time for display
  const lastModified = pool.last_modified_time

  return {
    ...pool,
    pair,
    tokenA: { symbol: tokenA.symbol, amount: reserveA.amount },
    tokenB: { symbol: tokenB.symbol, amount: reserveB.amount },
    liquidity,
    volume24h,
    lastModified,
    yourShare,
    yourLiquidity,
  }
}

export default function LiquidityPage() {
  const dispatch = useAppDispatch()
  const { pools, loading, error } = useAppSelector((state) => state.liquidityPools)

  useEffect(() => {
    dispatch(fetchPools({ limit: 12 }))
  }, [dispatch])

  // Memoize display pools
  const displayPools = useMemo(() => pools.map(getDisplayPool), [pools])

  const totalLiquidity = displayPools.reduce((sum, pool) => sum + pool.liquidity, 0)
  const totalVolume = displayPools.reduce((sum, pool) => sum + pool.volume24h, 0)

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="btn-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create Pool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pool</DialogTitle>
                <DialogDescription>Set up a new liquidity pool</DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="token1">Token 1</Label>
                    <Input id="token1" placeholder="e.g., PI" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token2">Token 2</Label>
                    <Input id="token2" placeholder="e.g., PIUSD" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount1">Amount 1</Label>
                    <Input id="amount1" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount2">Amount 2</Label>
                    <Input id="amount2" type="number" placeholder="0.00" />
                  </div>
                </div>
                <Button type="submit" className="w-full btn-gradient-primary">
                  Create Pool
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Liquidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalLiquidity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary">+12.3%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalVolume.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary">+8.7%</span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Pools</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayPools.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary">+1</span> new this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Existing Pools */}
        <Card>
          <CardHeader>
            <CardTitle>Available Pools</CardTitle>
            <CardDescription>Browse and manage liquidity pools</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">{error}</p>
              </div>
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
                        {pool.yourShare && pool.yourShare !== "0%" && <Badge variant="secondary">Your Pool</Badge>}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {pool.tokenA.symbol}: <span className="font-semibold">{pool.tokenA.amount}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {pool.tokenB.symbol}: <span className="font-semibold">{pool.tokenB.amount}</span>
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Liquidity: {pool.liquidity.toLocaleString()}</span>
                        <span>Volume: {pool.volume24h.toLocaleString()}</span>
                        <span className="text-primary">
                          Last Modified: {formatLastModified(pool.lastModified)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pool.yourShare && pool.yourShare !== "0%" && (
                      <div className="flex-1 text-sm text-muted-foreground">
                        Your liquidity: {pool.yourLiquidity} ({pool.yourShare})
                      </div>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Liquidity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Liquidity to {pool.pair}</DialogTitle>
                          <DialogDescription>Deposit tokens to earn trading fees</DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4">
                          <div className="space-y-2">
                            <Label>{pool.tokenA.symbol} Amount</Label>
                            <Input type="number" placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <Label>{pool.tokenB.symbol} Amount</Label>
                            <Input type="number" placeholder="0.00" />
                          </div>
                          <Button type="submit" className="w-full btn-gradient-primary">
                            Add Liquidity
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {pool.yourShare && pool.yourShare !== "0%" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Minus className="mr-2 h-4 w-4" />
                            Withdraw
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Withdraw from {pool.pair}</DialogTitle>
                            <DialogDescription>Remove your liquidity from the pool</DialogDescription>
                          </DialogHeader>
                          <form className="space-y-4">
                            <div className="space-y-2">
                              <Label>Amount to Withdraw (%)</Label>
                              <Input type="number" placeholder="0-100" max="100" />
                              <p className="text-xs text-muted-foreground">Your liquidity: {pool.yourLiquidity}</p>
                            </div>
                            <Button type="submit" className="w-full" variant="destructive">
                              Withdraw Liquidity
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
