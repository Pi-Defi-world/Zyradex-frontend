"use client"

import { SwapCard } from "@/components/swap/swap-card"
import { PriceChart } from "@/components/swap/price-chart"
import { RecentSwaps } from "@/components/swap/recent-swaps"

export default function SwapPage() {
  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Desktop Layout: Chart left (60%) + Swap card right (40%) */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6 lg:mb-6">
          <div className="lg:col-span-3">
            <PriceChart />
          </div>
          <div className="lg:col-span-2">
            <SwapCard />
          </div>
        </div>

        {/* Mobile Layout: Vertical stack */}
        <div className="lg:hidden space-y-6">
          <SwapCard />
          <PriceChart />
            </div>

        {/* Recent Swaps - Full width below both layouts */}
        <div className="mt-6">
          <RecentSwaps />
        </div>
      </div>
    </div>
  )
}