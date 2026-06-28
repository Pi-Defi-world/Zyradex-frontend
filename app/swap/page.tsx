"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { PageBackHeader } from "@/components/ui/page-back-header"
import { PriceChart, type PricePoint } from "@/components/swap/price-chart"
import { RecentSwaps } from "@/components/swap/recent-swaps"
import { Button } from "@/components/ui/button"
import { useAccountOperations } from "@/hooks/useAccountData"
import { usePi } from "@/components/providers/pi-provider"
import { BarChart3, X } from "lucide-react"

const SwapCard = dynamic(() => import("@/components/swap/swap-card").then((m) => ({ default: m.SwapCard })), {
  ssr: false,
})

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

const computePriceSeries = (operations: ReturnType<typeof useAccountOperations>["operations"]): PricePoint[] => {
  const series = new Map<string, number>()
  operations
    .filter((op) => op.type.includes("offer"))
    .forEach((op) => {
      if (!op.createdAt) return
      const label = new Date(op.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      const amount = Number.parseFloat(op.amount || "0")
      if (!Number.isFinite(amount)) return
      series.set(label, (series.get(label) ?? 0) + amount)
    })
  return Array.from(series.entries())
    .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
}

export default function SwapPage() {
  const { user } = usePi()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const [showMobileChart, setShowMobileChart] = useState(false)

  useEffect(() => {
    setLocalWallet(getStoredWallet())
  }, [])

  const publicKey = user?.wallet_address || localWallet || undefined
  const { operations, isLoading } = useAccountOperations(publicKey, { limit: 40 })
  const chartSeries = useMemo(() => computePriceSeries(operations), [operations])

  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
        <div>
          <PageBackHeader title="Swap" />
          <p className="text-slate-600 dark:text-slate-400 mt-1">Trade tokens instantly at the best rates on Pi Network</p>
        </div>

        {/* Desktop: Swap card + Chart */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2">
            <SwapCard />
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <PriceChart series={chartSeries} isLoading={isLoading} />
            </div>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Recent Transactions</h2>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <RecentSwaps operations={operations} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Swap card + optional chart toggle */}
        <div className="lg:hidden space-y-6">
          <SwapCard />

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileChart(!showMobileChart)}
              className="gap-2"
            >
              {showMobileChart ? (
                <>
                  <X className="h-4 w-4" />
                  Hide Chart
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  View Chart
                </>
              )}
            </Button>
          </div>

          {showMobileChart && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <PriceChart series={chartSeries} isLoading={isLoading} />
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Recent Transactions</h2>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <RecentSwaps operations={operations} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
