"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const SwapCard = dynamic(() => import("@/components/swap/swap-card").then((m) => ({ default: m.SwapCard })), {
  loading: () => <PageLoader />,
  ssr: false,
})

const TradeForm = dynamic(() => import("@/components/trade/trade-form").then((m) => ({ default: m.TradeForm })), {
  loading: () => <PageLoader />,
  ssr: false,
})

const Orderbook = dynamic(() => import("@/components/trade/orderbook").then((m) => ({ default: m.Orderbook })), {
  loading: () => <PageLoader />,
  ssr: false,
})

const PriceChart = dynamic(() => import("@/components/swap/price-chart").then((m) => ({ default: m.PriceChart })), {
  loading: () => <PageLoader />,
  ssr: false,
})

const RecentSwaps = dynamic(() => import("@/components/swap/recent-swaps").then((m) => ({ default: m.RecentSwaps })), {
  loading: () => <PageLoader />,
  ssr: false,
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )
}

export function DynamicComponents({ page }: { page: string }) {
  switch (page) {
    case "swap":
      return <SwapCard />
    case "trade-form":
      return <TradeForm publicKey={undefined} />
    case "orderbook":
      return <Orderbook onBaseChange={() => {}} onCounterChange={() => {}} />
    case "price-chart":
      return <PriceChart />
    case "recent-swaps":
      return <RecentSwaps />
    default:
      return null
  }
}

export { SwapCard, TradeForm, Orderbook, PriceChart, RecentSwaps }
