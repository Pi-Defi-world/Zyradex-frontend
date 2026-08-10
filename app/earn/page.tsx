"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageBackHeader } from "@/components/ui/page-back-header"
import { useSavingsProducts } from "@/hooks/useSavingsData"
import { useLendingPools } from "@/hooks/useLendingData"
import { listLiquidityPools } from "@/lib/api/liquidity"
import type { ILiquidityPool } from "@/lib/types"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"
import { Loader2, PiggyBank, Landmark, Droplets, Coins, TrendingUp, Clock, Percent, ArrowRight } from "lucide-react"

export default function EarnPage() {
  const router = useRouter()

  const { products: savingsProducts, isLoading: savingsLoading } = useSavingsProducts()
  const { pools: lendingPools, isLoading: lendingLoading } = useLendingPools()

  const [liquidityPools, setLiquidityPools] = useState<ILiquidityPool[]>([])
  const [liquidityLoading, setLiquidityLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLiquidityLoading(true)
    listLiquidityPools({ limit: 6 })
      .then((res) => {
        if (!cancelled) setLiquidityPools(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLiquidityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const totalLiquidityTVL = useMemo(() => {
    return liquidityPools.reduce((sum, pool) => {
      const reservesTotal = pool.reserves.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
      return sum + reservesTotal
    }, 0)
  }, [liquidityPools])

  const activeSavingsProducts = useMemo(
    () => savingsProducts.filter((p) => p.active),
    [savingsProducts]
  )

  const activeLendingPools = useMemo(
    () => lendingPools.filter((p) => p.active),
    [lendingPools]
  )

  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <PageBackHeader title="Earn" />

        <p className="text-slate-600 dark:text-slate-400 -mt-4 mb-2">
          Explore all yield and earning opportunities on ZyraDex
        </p>

        {/* Savings */}
        <Card className="bg-gradient-to-br from-white to-green-50/20 dark:from-slate-800 dark:to-slate-900 shadow-xl rounded-2xl border border-green-200/50 dark:border-green-900/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Savings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Fixed-term deposits with guaranteed returns</p>
              </div>
            </div>

            {savingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                <span className="ml-2 text-sm text-slate-500">Loading products...</span>
              </div>
            ) : activeSavingsProducts.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No savings products available</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Check back later for new offerings</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {activeSavingsProducts.slice(0, 3).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-300 flex items-center justify-center text-xs font-bold text-white">
                        {product.asset.code}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{product.asset.code}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            {product.apy}% APY
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {product.termDays}d
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Min {product.minAmount} {product.asset.code}
                    </p>
                  </div>
                ))}
                {activeSavingsProducts.length > 3 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    +{activeSavingsProducts.length - 3} more products
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={() => router.push("/savings")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/25 font-semibold gap-2"
            >
              Go to Savings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Lend & Borrow */}
        <Card className="bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-800 dark:to-slate-900 shadow-xl rounded-2xl border border-blue-200/50 dark:border-blue-900/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lend &amp; Borrow</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Supply assets to earn or borrow against collateral</p>
              </div>
            </div>

            {lendingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-slate-500">Loading pools...</span>
              </div>
            ) : activeLendingPools.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No lending pools available</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Check back later for new pools</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {activeLendingPools.slice(0, 3).map((pool) => (
                  <div
                    key={pool._id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-xs font-bold text-white">
                        {pool.asset.code}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{pool.asset.code}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-green-600 dark:text-green-400">
                            Supply {(Number(pool.supplyRate) * 100).toFixed(2)}%
                          </span>
                          <span className="text-orange-600 dark:text-orange-400">
                            Borrow {(Number(pool.borrowRate) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      CF {(Number(pool.collateralFactor) * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
                {activeLendingPools.length > 3 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    +{activeLendingPools.length - 3} more pools
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={() => router.push("/lending")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 font-semibold gap-2"
            >
              Go to Lending
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Liquidity Pools */}
        <Card className="bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-800 dark:to-slate-900 shadow-xl rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-400 flex items-center justify-center shadow">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Liquidity Pools</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Provide liquidity and earn trading fees</p>
              </div>
            </div>

            {liquidityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                <span className="ml-2 text-sm text-slate-500">Loading pools...</span>
              </div>
            ) : liquidityPools.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No liquidity pools available</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Be the first to create a pool</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {liquidityPools.slice(0, 3).map((pool) => {
                  const reservesDisplay = pool.reserves
                    .map((r) => {
                      const code = r.asset.split(":")[0] || r.asset
                      const amt = Number(r.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })
                      return `${amt} ${code}`
                    })
                    .join(" / ")

                  return (
                    <div
                      key={pool.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-300 flex items-center justify-center text-xs font-bold text-white">
                          LP
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {pool.reserves.map((r) => r.asset.split(":")[0] || r.asset).join("/")}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{reservesDisplay}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          Fee {(pool.fee_bp / 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {totalLiquidityTVL > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-3">
                Total TVL: {totalLiquidityTVL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            )}

            <Button
              onClick={() => router.push("/liquidity")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white hover:shadow-lg hover:shadow-purple-500/25 font-semibold gap-2"
            >
              Go to Liquidity
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Staking */}
        <Card className="bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-800 dark:to-slate-900 shadow-xl rounded-2xl border border-amber-200/50 dark:border-amber-900/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Staking</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Stake tokens and earn rewards</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Pi Network Staking</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Earn mining rewards by staking Pi</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Dynamic reward rate
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Flexible lock periods
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => router.push("/staking")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:shadow-lg hover:shadow-amber-500/25 font-semibold gap-2"
            >
              Go to Staking
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
