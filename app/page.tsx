"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ArrowDown, TrendingUp, ArrowRightLeft, Loader2, Copy, Wallet, ArrowUpRight, Zap, BarChart3, Plus } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances, useAccountOperations } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePiPrice } from "@/hooks/usePiPrice"
import { useUserProfile } from "@/hooks/useUserProfile"
import { usePoolPrice } from "@/components/providers/pool-price-provider"
import { TokenIcon } from "@/components/token-icon"
import { ReceiveModal } from "@/components/receive-modal"
import { TransactionHistory } from "@/components/transaction-history"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

interface HoldingItem {
  key: string
  code: string
  name: string
  issuer?: string | null
  image?: string | null
  amount: number
  usdValue: number | null
  isNative: boolean
  isPlatform: boolean
}
export { HoldingItem }

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("holdings")
  const { price: piPrice, isLoading: priceLoading } = usePiPrice()
  const { tokens: platformTokens } = useTokenRegistry()

  useEffect(() => {
    if (isAuthenticated) {
      const stored = getStoredWallet()
      setLocalWallet(stored)
      if (profile?.public_key && stored !== profile.public_key) {
        if (typeof window !== "undefined") {
          localStorage.setItem("zyradex-wallet-address", profile.public_key)
        }
        setLocalWallet(profile.public_key)
      }
    } else {
      setLocalWallet(null)
    }
  }, [isAuthenticated, profile?.public_key])

  const publicKey = isAuthenticated
    ? (profile?.public_key || user?.wallet_address || localWallet || undefined)
    : undefined
  const { balances, totalBalance: nativeBalanceOnly, isLoading: balancesLoading } = useAccountBalances(publicKey)
  const { getPrice } = usePoolPrice()
  const { operations, isLoading: operationsLoading } = useAccountOperations(publicKey, {
    limit: 20,
    order: "desc",
  })

  const totalBalance = useMemo(() => {
    let total = nativeBalanceOnly
    balances.forEach((balance) => {
      if (balance.assetType === "native") return
      const priceInPi = getPrice(balance.assetCode, balance.assetIssuer || null, piPrice)
      if (priceInPi !== null && priceInPi !== undefined) {
        total += (Number(balance.amount) || 0) * priceInPi
      }
    })
    return total
  }, [nativeBalanceOnly, balances, getPrice, piPrice])

  const usdBalance = useMemo(() => {
    if (!piPrice || !totalBalance || piPrice <= 0) return null
    const calculated = totalBalance * piPrice
    return isNaN(calculated) || !isFinite(calculated) ? null : calculated
  }, [piPrice, totalBalance])

  const holdings = useMemo<HoldingItem[]>(() => {
    const result: HoldingItem[] = []
    const balanceMap = new Map<string, { amount: number; issuer: string | null }>()

    for (const b of balances) {
      const key = b.assetType === "native" ? "native" : `${b.assetCode}:${b.assetIssuer || ""}`
      balanceMap.set(key, { amount: Number(b.amount), issuer: b.assetIssuer || null })
    }

    // 1. Pi native always first
    const nativeBalance = balanceMap.get("native")
    result.push({
      key: "native",
      code: "PI",
      name: "Pi",
      issuer: null,
      amount: nativeBalance ? nativeBalance.amount : 0,
      usdValue: piPrice ? (nativeBalance ? nativeBalance.amount : 0) * piPrice : null,
      isNative: true,
      isPlatform: true,
    })

    const seenCodes = new Set(["native"])

    // 2. Platform tokens
    for (const token of platformTokens) {
      const key = `${token.assetCode}:${token.issuer}`
      if (seenCodes.has(key)) continue
      seenCodes.add(key)

      const bal = balanceMap.get(key)
      const amount = bal ? bal.amount : 0
      const priceInPi = getPrice(token.assetCode, token.issuer, piPrice)
      const usd = piPrice && priceInPi !== null ? amount * priceInPi * piPrice : null

      result.push({
        key,
        code: token.assetCode,
        name: token.tomlName || token.name || token.assetCode,
        issuer: token.issuer,
        image: token.image,
        amount,
        usdValue: usd,
        isNative: false,
        isPlatform: true,
      })
    }

    // 3. Other balances (non-platform, non-native)
    for (const b of balances) {
      if (b.assetType === "native") continue
      const key = `${b.assetCode}:${b.assetIssuer || ""}`
      if (seenCodes.has(key)) continue
      seenCodes.add(key)

      const amount = Number(b.amount)
      const priceInPi = getPrice(b.assetCode, b.assetIssuer || null, piPrice)
      const usd = piPrice && priceInPi !== null ? amount * priceInPi * piPrice : null

      result.push({
        key,
        code: b.assetCode,
        name: b.assetCode,
        issuer: b.assetIssuer || null,
        amount,
        usdValue: usd,
        isNative: false,
        isPlatform: false,
      })
    }

    return result
  }, [balances, platformTokens, piPrice, getPrice])

  const handleSwap = () => router.push("/swap")
  const handleSend = () => router.push("/send")
  const handleExplore = () => router.push("/explore")
  const handleEarn = () => router.push("/earn")
  const handleManageTokens = () => router.push("/trustlines")
  const handleCopy = async () => {
    const key = publicKey || ""
    try {
      await navigator.clipboard.writeText(key)
      toast({ title: "Copied", description: "Wallet address copied to clipboard" })
    } catch {
      toast({ title: "Copy failed", description: key, variant: "destructive" })
    }
  }

  const truncatedKey = useMemo(() => {
    if (!publicKey) return ""
    return `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
  }, [publicKey])

  const handleTokenClick = (item: HoldingItem) => {
    if (item.isNative) {
      router.push("/token/native")
    } else if (item.code) {
      router.push(`/token/${encodeURIComponent(item.code)}${item.issuer ? `?issuer=${encodeURIComponent(item.issuer)}` : ''}`)
    }
  }

  // UNAUTHENTICATED: Welcome screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen premium-gradient pt-20 pb-24 lg:pb-6 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl mx-auto">
              <Image
                src="/logo.jpg"
                alt="ZyraDex Logo"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome to ZyraDex
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              A decentralized exchange on Pi Network. Swap tokens instantly, earn yield, and maintain complete control of your assets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-green-200/30 dark:border-green-900/20">
              <ArrowRightLeft className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <span className="font-medium text-slate-900 dark:text-white">Swap Instantly</span>
              <p className="text-xs mt-1">Best rates, no middlemen</p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-green-200/30 dark:border-green-900/20">
              <BarChart3 className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <span className="font-medium text-slate-900 dark:text-white">Earn Yield</span>
              <p className="text-xs mt-1">Savings & liquidity pools</p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-green-200/30 dark:border-green-900/20">
              <Zap className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <span className="font-medium text-slate-900 dark:text-white">Full Control</span>
              <p className="text-xs mt-1">Your keys, your assets</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/swap")}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-green-600 to-mint-500 text-white hover:shadow-lg hover:shadow-green-500/25"
            >
              Start Trading
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              <button onClick={() => router.push("/explore")} className="underline hover:text-slate-700 dark:hover:text-slate-300">Browse tokens</button> or{" "}
              <button onClick={() => router.push("/profile")} className="underline hover:text-slate-700 dark:hover:text-slate-300">connect your wallet</button> to track holdings and execute trades
            </p>
          </div>
        </div>
      </div>
    )
  }

  // AUTHENTICATED: Full dashboard
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-green-200/50 dark:border-green-900/40 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-mint-500 flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Wallet</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white font-mono">{truncatedKey || "Not connected"}</span>
              </div>
            </div>
            {publicKey && (
              <button onClick={handleCopy} className="p-2.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 transition-all" title="Copy address">
                <Copy className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="space-y-2 mb-8">
            {balancesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-green-600 to-mint-500 bg-clip-text text-transparent">
                  {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </h1>
                {usdBalance !== null && (
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                    ≈ ${usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                  </p>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handleSwap}
              className="h-14 flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-mint-500 text-white hover:shadow-lg hover:shadow-green-500/25 font-semibold"
            >
              <ArrowRightLeft className="h-5 w-5" />
              <span className="text-xs">Swap</span>
            </Button>
            <Button
              onClick={handleSend}
              variant="outline"
              className="h-14 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            >
              <ArrowUpRight className="h-5 w-5" />
              <span className="text-xs font-semibold">Send</span>
            </Button>
            <Button
              onClick={() => setReceiveModalOpen(true)}
              variant="outline"
              className="h-14 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            >
              <ArrowDown className="h-5 w-5" />
              <span className="text-xs font-semibold">Receive</span>
            </Button>
            <Button
              onClick={handleEarn}
              variant="outline"
              className="h-14 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-semibold">Earn</span>
            </Button>
          </div>
        </div>

        {/* Holdings List */}
        <Card className="bg-gradient-to-br from-white to-green-50/20 dark:from-slate-800 dark:to-slate-900 shadow-xl rounded-2xl border border-green-200/50 dark:border-green-900/40">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Holdings</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Track all your assets</p>
                </div>
                <Button
                  onClick={handleManageTokens}
                  variant="outline"
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Tokens</span>
                </Button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab(activeTab === "holdings" ? "activity" : "holdings")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "holdings"
                        ? "bg-gradient-to-r from-green-600 to-mint-500 text-white shadow"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === "activity" ? "holdings" : "activity")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "activity"
                        ? "bg-gradient-to-r from-green-600 to-mint-500 text-white shadow"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    Activity
                  </button>
                </div>
              </div>

              <TabsContent value="holdings" className="mt-0">
                <div className="space-y-2">
                  {balancesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      <span className="ml-2 text-sm text-slate-500">Loading holdings...</span>
                    </div>
                  ) : holdings.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-green-100/50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto">
                        <Wallet className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No holdings yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Ready for your first swap?</p>
                      <Button onClick={handleSwap} variant="outline" size="sm" className="gap-1.5">
                        <ArrowRightLeft className="h-4 w-4" />
                        Start Trading
                      </Button>
                    </div>
                  ) : (
                    holdings.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleTokenClick(item)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-700/50 dark:to-slate-800/50 hover:from-slate-100 hover:to-green-50/50 dark:hover:from-slate-700 dark:hover:to-slate-700 border border-slate-200/50 dark:border-slate-700/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <TokenIcon
                            image={item.image}
                            code={item.code}
                            issuer={item.issuer}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-base text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{item.name}</p>
                              {item.isPlatform && !item.isNative && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">P</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {item.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              {item.isNative && " Pi"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          {item.usdValue !== null ? (
                            <p className="font-bold text-base text-green-600 dark:text-green-400">
                              ${item.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          ) : (
                            <p className="font-medium text-sm text-slate-500 dark:text-slate-400">—</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                {operationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500">Loading activity...</span>
                  </div>
                ) : (
                  <TransactionHistory operations={operations} isLoading={operationsLoading} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ReceiveModal open={receiveModalOpen} onOpenChange={setReceiveModalOpen} />
    </div>
  )
}
