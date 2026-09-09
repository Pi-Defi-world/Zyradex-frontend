"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Compass,
  ArrowRightLeft,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Droplets,
  Loader2,
  ChevronRight,
  Send,
  History,
  Shield,
  Search,
  ChevronDown,
} from "lucide-react"
import { useNetworkTokens } from "@/hooks/useNetworkTokens"
import { TokenIcon } from "@/components/token-icon"

const PAGE_SIZE = 15

export default function ExplorePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const {
    tokens,
    isLoading,
    isLoadingMore,
    error: tokensError,
    hasMore,
    loadMore,
    refresh,
  } = useNetworkTokens({ searchQuery, limit: PAGE_SIZE })

  const displayTokens = useMemo(() =>
    tokens.filter(token => token.assetCode && token.assetCode.trim() !== ""),
    [tokens]
  )

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Available Tokens</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {displayTokens.length > 0
                  ? `Showing ${displayTokens.length} token${displayTokens.length !== 1 ? "s" : ""}`
                  : "Discover tokens on the network"}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading tokens...</span>
            </div>
          ) : tokensError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-slate-500">Unable to load tokens right now.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>Try again</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayTokens.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-slate-500">
                      {searchQuery.trim() ? "No tokens match your search" : "No tokens available yet."}
                    </p>
                  </div>
                ) : (
                  displayTokens.map((token) => (
                    <Link
                      key={`${token.assetCode}-${token.issuer || ""}`}
                      href={`/token/${encodeURIComponent(token.assetCode)}${token.issuer ? `?issuer=${encodeURIComponent(token.issuer)}` : ''}`}
                    >
                      <Card className="h-full hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800/50 group cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <TokenIcon
                            image={token.image}
                            code={token.assetCode}
                            issuer={token.issuer}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-green-600 transition-colors">
                              {token.assetCode}
                            </p>
                            {token.name ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{token.name}</p>
                            ) : null}
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-green-500 transition-colors shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>

              {hasMore && !searchQuery.trim() && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="gap-2 rounded-xl"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {isLoadingMore ? "Loading..." : "Load more tokens"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
