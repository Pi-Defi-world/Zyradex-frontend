"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useOrderBook } from "@/hooks/useTrade"
import { AuthErrorDisplay } from "@/components/auth-error-display"

interface OrderbookProps {
  onBaseChange?: (base: string) => void
  onCounterChange?: (counter: string) => void
}

export function Orderbook({ onBaseChange, onCounterChange }: OrderbookProps) {
  const [base, setBase] = useState("native")
  const [counter, setCounter] = useState("")
  const { book, isLoading, error, isValidCounter } = useOrderBook(base, counter)

  const handleBaseChange = (value: string) => {
    setBase(value)
    onBaseChange?.(value)
  }

  const handleCounterChange = (value: string) => {
    setCounter(value)
    onCounterChange?.(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthErrorDisplay error={error} />
        <div className="space-y-2">
          <Label>Base Asset</Label>
          <Input
            placeholder="native or CODE:ISSUER"
            value={base}
            onChange={(e) => handleBaseChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Counter Asset</Label>
          <Input
            placeholder="CODE:ISSUER"
            value={counter}
            onChange={(e) => handleCounterChange(e.target.value)}
          />
        </div>

        {!base || !counter ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Enter base and counter assets to view order book
          </div>
        ) : !isValidCounter ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Counter asset must be in CODE:ISSUER format (e.g., Archimedes:GBP7HXY4QXLKZBKIUR75Y6I3OHB2CQLAUA2FV2LCNDRPP54TZLNBSENX)
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading order book...
          </div>
        ) : error && error.status !== 401 && error.status !== 403 ? (
          <div className="text-sm text-destructive py-8 text-center">
            {error.message || "Failed to load order book"}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bids (Buyers) */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-green-600">Bids (Buyers)</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {book.bids.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No bids</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {book.bids.map((bid, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="p-2 text-green-600">{bid.price.toFixed(6)}</td>
                            <td className="p-2 text-right">{bid.amount.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Asks (Sellers) */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-red-600">Asks (Sellers)</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {book.asks.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No asks</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {book.asks.map((ask, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="p-2 text-red-600">{ask.price.toFixed(6)}</td>
                            <td className="p-2 text-right">{ask.amount.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

