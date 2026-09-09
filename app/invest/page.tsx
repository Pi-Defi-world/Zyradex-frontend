"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Wrench } from "lucide-react"
import Link from "next/link"

export default function InvestPage() {
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50">
          <Wrench className="w-10 h-10 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Coming Soon</h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Launchpad launches and equity-style investments are being built. Check back soon for new opportunities.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <TrendingUp className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
