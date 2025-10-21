"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDown, Settings, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SwapPage() {
  const [fromToken, setFromToken] = useState("PI")
  const [toToken, setToToken] = useState("PIUSD")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")

  const tokens = [
    { symbol: "PI", name: "Pi Network", balance: "1,234.56" },
    { symbol: "PIUSD", name: "Pi USD", balance: "5,000.00" },
    { symbol: "PEPE", name: "Pepe Coin", balance: "10,000" },
    { symbol: "DOGE", name: "Doge Token", balance: "2,500" },
  ]

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Swaps are executed through liquidity pools. Make sure sufficient liquidity exists for your trading pair.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Swap</CardTitle>
            <CardDescription>Trade tokens at the best available rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <Label>From</Label>
              <div className="flex gap-2">
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Balance: {tokens.find((t) => t.symbol === fromToken)?.balance || "0"}
              </p>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button variant="outline" size="icon" className="rounded-full bg-transparent" onClick={handleSwapTokens}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex gap-2">
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Balance: {tokens.find((t) => t.symbol === toToken)?.balance || "0"}
              </p>
            </div>

            {/* Swap Details */}
            {fromAmount && toAmount && (
              <div className="p-4 rounded-lg bg-muted space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">
                    1 {fromToken} = 1.05 {toToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className="font-medium text-primary">0.12%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Liquidity Provider Fee</span>
                  <span className="font-medium">0.3%</span>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg">
              Swap Tokens
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Swaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { from: "PI", to: "PIUSD", amount: "100", time: "2 mins ago" },
                { from: "PEPE", to: "PI", amount: "500", time: "15 mins ago" },
                { from: "PIUSD", to: "DOGE", amount: "250", time: "1 hour ago" },
              ].map((swap, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {swap.amount} {swap.from} → {swap.to}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{swap.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
