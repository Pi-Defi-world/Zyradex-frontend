"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TokenCard } from "@/components/token-card"
import { TransactionHistory } from "@/components/transaction-history"
import { ActivityChart } from "@/components/activity-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, TrendingUp, Wallet, Activity, Droplets } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const [balances] = useState([
    { symbol: "PI", name: "Pi Network", balance: "1,234.56", value: "$2,469.12", change: "+5.2%" },
    { symbol: "PIUSD", name: "Pi USD", balance: "5,000.00", value: "$5,000.00", change: "+0.1%" },
    { symbol: "CUSTOM", name: "Custom Token", balance: "10,000", value: "$1,500.00", change: "+12.5%" },
  ])

  const stats = [
    { label: "Total Balance", value: "$8,969.12", icon: Wallet, change: "+8.2%" },
    { label: "Total Tokens", value: "3", icon: Coins, change: "+1" },
    { label: "Transactions", value: "47", icon: Activity, change: "+12" },
    { label: "Portfolio Growth", value: "+15.3%", icon: TrendingUp, change: "+2.1%" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary">{stat.change}</span> from last month
                </p>
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
                <Button className="w-full h-20 text-lg" size="lg">
                  <Coins className="mr-2 h-5 w-5" />
                  Mint Token
                </Button>
              </Link>
              <Link href="/liquidity">
                <Button className="w-full h-20 text-lg bg-transparent" size="lg" variant="outline">
                  <Droplets className="mr-2 h-5 w-5" />
                  Create Liquidity Pool
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Token Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Token Balances</CardTitle>
            <CardDescription>Your connected wallet balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {balances.map((token) => (
                <TokenCard key={token.symbol} {...token} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Section */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Activity Chart</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your transaction volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityChart />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your recent transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
