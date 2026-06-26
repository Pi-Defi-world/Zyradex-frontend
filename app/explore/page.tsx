"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Compass,
  ArrowRightLeft,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Droplets,
  Loader2,
  Star,
  ChevronRight,
  Send,
  History,
  Shield,
} from "lucide-react"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"

export default function ExplorePage() {
  const router = useRouter()
  const { tokens, isLoading: tokensLoading, error: tokensError } = useTokenRegistry()

  const filteredTokens = tokens
    .filter(token =>
      token.assetCode && token.assetCode.trim() !== ""
    )
    .slice(0, 12)

  const exploreCategories = [
    {
      title: "Swap",
      description: "Trade tokens instantly at the best rates",
      icon: ArrowRightLeft,
      href: "/swap",
      color: "from-green-600 to-mint-500",
    },
    {
      title: "Send",
      description: "Transfer tokens to any wallet",
      icon: Send,
      href: "/send",
      color: "from-blue-600 to-cyan-500",
    },
    {
      title: "Savings",
      description: "Earn yield with time-locked deposits",
      icon: PiggyBank,
      href: "/savings",
      color: "from-purple-600 to-pink-500",
    },
    {
      title: "Borrow & Lend",
      description: "Supply assets or borrow against collateral",
      icon: CreditCard,
      href: "/lending",
      color: "from-amber-600 to-orange-500",
    },
    {
      title: "Launchpad",
      description: "Discover and participate in new launches",
      icon: TrendingUp,
      href: "/invest",
      color: "from-teal-600 to-cyan-500",
    },
    {
      title: "Liquidity",
      description: "Provide liquidity and earn fees",
      icon: Droplets,
      href: "/liquidity",
      color: "from-indigo-600 to-blue-500",
    },
    {
      title: "History",
      description: "View your transaction history",
      icon: History,
      href: "/history",
      color: "from-slate-600 to-slate-500",
    },
    {
      title: "Manage Tokens",
      description: "Add tokens and setup trustlines",
      icon: Shield,
      href: "/trustlines",
      color: "from-rose-600 to-red-500",
    },
  ]

  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Compass className="h-8 w-8 text-green-600" />
            Explore
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Discover tokens, trading tools, and earning opportunities</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exploreCategories.map((cat) => (
            <Link key={cat.href} href={cat.href}>
              <Card className="h-full hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800/50 group">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-sm`}>
                    <cat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {cat.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Token Discovery */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Available Tokens</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Discover tokens on the network</p>
          </div>

          {tokensLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading tokens...</span>
            </div>
          ) : tokensError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-slate-500">Unable to load tokens right now.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => router.refresh()}>Try again</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTokens.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-slate-500">No tokens available yet.</p>
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <Link
                    key={`${token.assetCode}-${token.issuer || ""}`}
                    href={`/token/${encodeURIComponent(token.assetCode)}${token.issuer ? `?issuer=${encodeURIComponent(token.issuer)}` : ''}`}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800/50 group cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-green-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0">
                          <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-green-600 transition-colors">
                            {token.assetCode}
                          </p>
                          {token.name && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{token.name}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-green-500 transition-colors shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
