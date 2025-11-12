"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AccountOperation } from "@/lib/api/account"

interface RecentSwapsProps {
  operations?: AccountOperation[]
  isLoading?: boolean
}

const isSwapOperation = (operation: AccountOperation) =>
  operation.type.includes("offer") || (operation.action ?? "").toLowerCase().includes("swap")

export function RecentSwaps({ operations = [], isLoading }: RecentSwapsProps) {
  const swaps = operations.filter(isSwapOperation).slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Swaps</CardTitle>
        <CardDescription>Latest offer and swap-related operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && !swaps.length && (
          <div className="text-sm text-muted-foreground">Loading swap activity...</div>
        )}
        {!isLoading && !swaps.length && (
          <div className="text-sm text-muted-foreground">No swap activity detected on this account.</div>
        )}
        {swaps.map((swap) => (
          <div
            key={swap.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div>
              <p className="font-medium text-sm capitalize">{swap.action || swap.type}</p>
              <p className="text-xs text-muted-foreground">{new Date(swap.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              {swap.amount && swap.asset && (
                <p className="text-sm font-semibold">
                  {swap.amount} {swap.asset}
                </p>
              )}
              <Badge variant="outline" className="mt-1 text-xs">
                hash: {swap.transactionHash.slice(0, 6)}...
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
