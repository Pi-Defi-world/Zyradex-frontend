"use client"

import { useMemo, useState, useEffect } from "react"
import { PageBackHeader } from "@/components/ui/page-back-header"
import { SwapCard } from "@/components/swap/swap-card"
import { PriceChart, type PricePoint } from "@/components/swap/price-chart"
import { RecentSwaps } from "@/components/swap/recent-swaps"
import { useAccountOperations } from "@/hooks/useAccountData"
import { usePi } from "@/components/providers/pi-provider"

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

  useEffect(() => {
    setLocalWallet(getStoredWallet())
  }, [])

  const publicKey = user?.wallet_address || localWallet || undefined
  const { operations, isLoading, error: operationsError } = useAccountOperations(publicKey, { limit: 40 })

  const chartSeries = useMemo(() => computePriceSeries(operations), [operations])

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <PageBackHeader title="Swap" />
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6 lg:mb-6">
          <div className="lg:col-span-3">
            <PriceChart series={chartSeries} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <SwapCard />
          </div>
        </div>

        <div className="lg:hidden space-y-6">
          <SwapCard />
          {/* <PriceChart series={chartSeries} isLoading={isLoading} /> */}
        </div>

        <div className="mt-6">
          <RecentSwaps operations={operations} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}