"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Wallet, Activity, Coins, TrendingUp, Droplets, Shield, Loader2 } from "lucide-react"

import { TokenCard, type TokenSummary } from "@/components/token-card"
import { TransactionHistory } from "@/components/transaction-history"
import { ActivityChart, type ActivityPoint } from "@/components/activity-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances, useAccountOperations } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { useAdminAuth } from "@/hooks/useAdminAuth"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("bingepi-wallet-address")
}

const formatBalanceCard = (asset: {
  assetType: string
  assetCode: string
  assetIssuer: string | null
  amount: number
  asset: string
}): TokenSummary => ({
  code: asset.assetType === "native" ? "native" : asset.assetCode,
  issuer: asset.assetIssuer ?? undefined,
  totalSupply: asset.amount,
  description: asset.assetType === "native" ? "Pi Testnet" : asset.asset,
})

const formatMintedToken = (token: TokenSummary): TokenSummary => ({
  code: token.code,
  issuer: token.issuer,
  name: token.name,
  totalSupply: token.totalSupply,
  description: token.description,
})

const buildActivitySeries = (operations: ReturnType<typeof useAccountOperations>["operations"]): ActivityPoint[] => {
  if (!operations.length) return []

  const aggregation = new Map<string, number>()

  operations.forEach((op) => {
    if (!op.createdAt) return
    const date = new Date(op.createdAt)
    const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    const amount = Number.parseFloat(op.amount || "0")
    const signedAmount = op.action?.includes("sent") || op.action?.includes("merged") ? -Math.abs(amount) : Math.abs(amount)
    aggregation.set(label, (aggregation.get(label) ?? 0) + (Number.isFinite(signedAmount) ? signedAmount : 0))
  })

  return Array.from(aggregation.entries())
    .map(([date, volume]) => ({ date, volume: Number(volume.toFixed(3)) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export default function DashboardPage() {
  const { user, isAuthenticated } = usePi()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const { isAdmin, signIn: signInAdmin, isLoading: adminLoading } = useAdminAuth()

  useEffect(() => {
    setLocalWallet(getStoredWallet())
  }, [])

  const publicKey = user?.wallet_address || localWallet || undefined

  const {
    balances,
    totalBalance,
    isLoading: balancesLoading,
    error: balancesError,
  } = useAccountBalances(publicKey)
  const {
    operations,
    pagination,
    isLoading: operationsLoading,
    error: operationsError,
  } = useAccountOperations(publicKey, { limit: 50 })
  const { tokens: mintedTokens, isLoading: tokensLoading } = useTokenRegistry()

  const balanceCards = useMemo<TokenSummary[]>(
    () => balances.map((balance) => formatBalanceCard(balance)),
    [balances]
  )

  const mintedSummaries = useMemo<TokenSummary[]>(
    () => (isAdmin ? mintedTokens.map((token) => formatMintedToken({
          code: token.assetCode,
          issuer: token.issuer,
          name: token.name,
          totalSupply: token.totalSupply,
          description: token.description,
        })) : []),
    [mintedTokens, isAdmin]
  )

  const activitySeries = useMemo(() => buildActivitySeries(operations), [operations])

  const stats = [
    {
      label: "Tracked Balance",
      value: totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      icon: Wallet,
      hint: publicKey ? "Total units across all assets" : "Connect a wallet to track balances",
    },
    {
      label: "Assets",
      value: `${balances.length}`,
      icon: Coins,
      hint: "Assets with balance above threshold",
    },
    {
      label: "Operations",
      value: `${operations.length}`,
      icon: Activity,
      hint: pagination?.hasMore ? "Showing latest 50 operations" : "Latest ledger operations",
    },
    {
      label: "Minted Tokens",
      value: isAdmin ? `${mintedSummaries.length}` : "Admin only",
      icon: TrendingUp,
      hint: isAdmin ? "Registered platform tokens" : "Requires admin session",
    },
  ]

  const showWalletCta = !publicKey

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <stat.icon className="h-4 w-4" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Perform common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/mint">
                  <Button className="w-full h-20 text-lg btn-gradient-primary" size="lg">
                    <Coins className="mr-2 h-5 w-5" />
                    Mint Token
                  </Button>
                </Link>
                <Link href="/liquidity">
                  <Button className="w-full h-20 text-lg bg-transparent" size="lg" variant="outline">
                    <Droplets className="mr-2 h-5 w-5" />
                    Manage Liquidity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {showWalletCta ? (
            <Card>
              <CardHeader>
                <CardTitle>Connect a wallet to get started</CardTitle>
                <CardDescription>
                  Authenticate with Pi Browser or enter a wallet address from your profile to load balances and activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/profile">
                  <Button className="btn-gradient-primary">Open Profile</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Token Balances</CardTitle>
                <CardDescription>Your connected wallet balances</CardDescription>
              </CardHeader>
              <CardContent>
                {balancesError ? (
                  <p className="text-destructive text-sm">{balancesError.message}</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {balancesLoading && !balanceCards.length && (
                      <p className="text-sm text-muted-foreground">Loading balances...</p>
                    )}
                    {balanceCards.map((token, idx) => (
                      <TokenCard key={`${token.code}-${idx}`} token={token} index={idx} />
                    ))}
                    {!balancesLoading && !balanceCards.length && (
                      <p className="text-sm text-muted-foreground">No balances above the display threshold.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Activity Chart</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Transaction flow aggregated by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityChart
                    series={activitySeries}
                    isLoading={operationsLoading && !activitySeries.length}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Latest ledger operations for this account</CardDescription>
                </CardHeader>
                <CardContent>
                  {operationsError ? (
                    <p className="text-destructive text-sm">{operationsError.message}</p>
                  ) : (
                    <TransactionHistory operations={operations} isLoading={operationsLoading} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Platform Tokens
              </CardTitle>
              <CardDescription>Tokens issued through the DEX toolkit</CardDescription>
            </CardHeader>
            <CardContent>
              {!isAdmin ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Sign in as an admin to view and manage minted tokens.</p>
                  <Button variant="outline" size="sm" onClick={signInAdmin} disabled={adminLoading}>
                    {adminLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in as admin
                  </Button>
                </div>
              ) : tokensLoading && !mintedSummaries.length ? (
                <p className="text-sm text-muted-foreground">Loading token registry...</p>
              ) : mintedSummaries.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mintedSummaries.map((token, idx) => (
                    <TokenCard key={`${token.code}-${idx}`} token={token} index={idx} variant="compact" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No platform tokens found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
