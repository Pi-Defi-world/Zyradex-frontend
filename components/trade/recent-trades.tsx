"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTrades } from "@/hooks/useTrade"

interface RecentTradesProps {
  base?: string
  counter?: string
  limit?: number
}

// Format asset for display
const formatAsset = (assetType: string, assetCode: string | null) => {
  if (assetType === "native") return "Test Pi"
  return assetCode || "Unknown"
}

// Format account address (truncate)
const formatAccount = (account: string) => {
  if (!account) return "Unknown"
  return `${account.slice(0, 6)}...${account.slice(-4)}`
}

// Format timestamp
const formatTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  } catch {
    return timestamp
  }
}

export function RecentTrades({ base, counter, limit = 20 }: RecentTradesProps) {
  const { trades, isLoading, error } = useTrades(base, counter, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>
          {base && counter ? `Trades for ${formatAsset("", base.split(":")[0] || base)} / ${formatAsset("", counter.split(":")[0] || counter)}` : "Select assets to view trades"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!base || !counter ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Enter base and counter assets to view recent trades
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading trades...
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-8 text-center">
            {error.message || "Failed to load trades"}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No recent trades found
          </div>
        ) : (
          <div className="space-y-2">
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left text-xs">Time</th>
                      <th className="p-2 text-left text-xs">Price</th>
                      <th className="p-2 text-right text-xs">Amount</th>
                      <th className="p-2 text-left text-xs">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const baseAsset = formatAsset(trade.base_asset_type, trade.base_asset_code)
                      const counterAsset = formatAsset(trade.counter_asset_type, trade.counter_asset_code)
                      const isBuy = !trade.base_is_seller
                      const price = trade.price.price
                      const amount = parseFloat(trade.base_amount)

                      return (
                        <tr key={trade.id} className="border-t hover:bg-muted/50">
                          <td className="p-2 text-xs text-muted-foreground">
                            {formatTime(trade.ledger_close_time)}
                          </td>
                          <td className="p-2 font-medium">
                            {price.toFixed(6)}
                          </td>
                          <td className="p-2 text-right">
                            {amount.toFixed(6)} {baseAsset}
                          </td>
                          <td className="p-2">
                            <span className={`text-xs px-2 py-1 rounded ${isBuy ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"}`}>
                              {isBuy ? "BUY" : "SELL"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

