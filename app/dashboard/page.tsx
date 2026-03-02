"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Wallet, Activity, Coins, TrendingUp, Droplets, PiggyBank, CreditCard, AlertTriangle } from "lucide-react"

import { TokenCard, type TokenSummary } from "@/components/token-card"
import { TransactionHistory } from "@/components/transaction-history"
import { ActivityChart, type ActivityPoint } from "@/components/activity-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useAccountBalances, useAccountOperations } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { useLaunches } from "@/hooks/useLaunchpadData"
import { useSavingsPositions } from "@/hooks/useSavingsData"
import { useLendingPositions } from "@/hooks/useLendingData"

const formatBalanceCard = (asset: {
  assetCode: string
  assetIssuer: string | null
  amount: number
  assetType: string
}): TokenSummary => ({
  code: asset.assetCode,
  issuer: asset.assetIssuer ?? undefined,
  totalSupply: asset.amount,
  description: asset.assetType === "native" ? "Pi Testnet" : asset.assetType,
})

const formatMintedToken = (token: TokenSummary): TokenSummary => ({
  code: token.code,
  issuer: token.issuer,
  name: token.name,
  totalSupply: token.totalSupply,
  liquidityPools: token.liquidityPools,
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
  const { user } = useCurrentUser()
  const publicKey = user?.public_key?.trim() || undefined
  const userId = user?.id ?? undefined

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
  const { tokens: mintedTokens, isLoading: tokensLoading, error: tokensError } = useTokenRegistry()
  const { launches } = useLaunches({ limit: 10 })
  const { positions: savingsPositions } = useSavingsPositions(userId)
  const { supplyPositions, borrowPositions } = useLendingPositions(userId)

  const balanceCards = useMemo<TokenSummary[]>(
    () => balances.map((balance) => formatBalanceCard(balance)),
    [balances]
  )

  const mintedSummaries = useMemo<TokenSummary[]>(
    () =>
      mintedTokens.map((token) => ({
        code: token.assetCode,
        issuer: token.issuer,
        name: token.name,
        totalSupply: token.totalSupply,
        description: token.description,
      })),
    [mintedTokens]
  )

  const activitySeries = useMemo(() => buildActivitySeries(operations), [operations])

  const openLaunchesCount = useMemo(() => launches.filter((l) => l.status === "participation_open" || l.status === "tge_open").length, [launches])
  const lockedSavingsCount = useMemo(() => savingsPositions.filter((p) => p.status === "locked").length, [savingsPositions])
  const nextUnlock = useMemo(() => {
    const locked = savingsPositions.filter((p) => p.status === "locked")
    if (!locked.length) return null
    const dates = locked.map((p) => new Date(p.unlockedAt).getTime())
    return new Date(Math.min(...dates)).toLocaleDateString()
  }, [savingsPositions])
  const borrowsAtRisk = useMemo(
    () => borrowPositions.filter((b) => b.healthFactor != null && parseFloat(b.healthFactor) < 1),
    [borrowPositions]
  )

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
      value: `${mintedSummaries.length}`,
      icon: TrendingUp,
      hint: tokensLoading ? "Loading minted tokens" : "Registered platform tokens",
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
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Link href="/invest">
                  <Button className="w-full h-20 text-lg bg-transparent" size="lg" variant="outline">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Invest
                  </Button>
                </Link>
                <Link href="/savings">
                  <Button className="w-full h-20 text-lg bg-transparent" size="lg" variant="outline">
                    <PiggyBank className="mr-2 h-5 w-5" />
                    Savings
                  </Button>
                </Link>
                <Link href="/lending">
                  <Button className="w-full h-20 text-lg bg-transparent" size="lg" variant="outline">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Borrow
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/mint">
                    <Button className="w-full h-20 text-lg btn-gradient-primary" size="lg">
                      <Coins className="mr-2 h-5 w-5" />
                      Mint Token
                    </Button>
                  </Link>
                )}
                <Link href="/liquidity">
                  <Button className="w-full h-20 text-lg bg-transparent" size="lg" variant="outline">
                    <Droplets className="mr-2 h-5 w-5" />
                    Liquidity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products & positions</CardTitle>
              <CardDescription>Investments, savings, and lending at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/invest">
                  <Card className="border-border hover:border-primary/30 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Invest</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {openLaunchesCount} open launch{openLaunchesCount !== 1 ? "es" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/savings">
                  <Card className="border-border hover:border-primary/30 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Savings</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lockedSavingsCount} locked position{lockedSavingsCount !== 1 ? "s" : ""}
                        {nextUnlock && ` · Next unlock ${nextUnlock}`}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/lending">
                  <Card className="border-border hover:border-primary/30 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Borrow & lend</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {supplyPositions.length} supply · {borrowPositions.length} borrow
                        {borrowsAtRisk.length > 0 && (
                          <span className="text-amber-600 flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {borrowsAtRisk.length} at risk
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>

          {showWalletCta ? (
            <Card>
              <CardHeader>
                <CardTitle>Connect a wallet to get started</CardTitle>
                <CardDescription>
                  Connect with Pi and link a wallet from your profile to load balances and activity.
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
                <CardTitle>Wallet</CardTitle>
                <CardDescription className="font-mono text-xs break-all">
                  {publicKey}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Token Balances</h3>
                  <p className="text-xs text-muted-foreground">Your connected wallet balances</p>
                </div>
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
              <CardTitle>Platform Tokens</CardTitle>
              <CardDescription>Tokens issued through the DEX toolkit</CardDescription>
            </CardHeader>
            <CardContent>
              {tokensError ? (
                <p className="text-destructive text-sm">{tokensError.message}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tokensLoading && !mintedSummaries.length && (
                    <p className="text-sm text-muted-foreground">Loading token registry...</p>
                  )}
                  {mintedSummaries.map((token, idx) => (
                    <TokenCard key={`${token.code}-${idx}`} token={token} index={idx} variant="compact" />
                  ))}
                  {!tokensLoading && !mintedSummaries.length && (
                    <p className="text-sm text-muted-foreground">No platform tokens found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
