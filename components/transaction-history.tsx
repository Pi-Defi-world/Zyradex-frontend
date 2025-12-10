"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, Repeat, Coins } from "lucide-react"
import type { AccountOperation } from "@/lib/api/account"

interface TransactionHistoryProps {
  operations?: AccountOperation[]
  isLoading?: boolean
}

const formatTimestamp = (isoDate?: string) => {
  if (!isoDate) return "-"
  const date = new Date(isoDate)
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

const actionIcon = (op: AccountOperation) => {
  const type = op.action?.toLowerCase() ?? op.type
  if (type.includes("sent") || type.includes("merged")) return <ArrowUpRight className="h-4 w-4" />
  if (type.includes("received") || type.includes("trustline")) return <ArrowDownLeft className="h-4 w-4" />
  if (type.includes("offer")) return <Coins className="h-4 w-4" />
  return <Repeat className="h-4 w-4" />
}

export function TransactionHistory({ operations = [], isLoading }: TransactionHistoryProps) {
  const rows = useMemo(() => operations.slice(0, 20), [operations])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading recent activity...
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No recent operations found. Execute a transaction to see it here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((op) => {
        // Format display action
        const displayAction = op.action || op.type || "transaction"
        
        // Extract asset code only (remove issuer address)
        let displayAsset = op.asset || ""
        if (displayAsset && displayAsset.includes(":")) {
          displayAsset = displayAsset.split(":")[0]
        }
        // Handle "Test Pi" for native assets
        if (displayAsset === "Pi" || displayAsset === "native") {
          displayAsset = "Test Pi"
        }
        
        return (
          <div
            key={op.id}
            className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm capitalize truncate">
                {displayAction === "swap" ? "Swap" : displayAction}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {formatTimestamp(op.createdAt)}
              </p>
            </div>
            <div className="text-right flex-shrink-0 min-w-0">
              {op.amount && displayAsset && (
                <p className="text-sm font-semibold truncate max-w-[120px]">
                  {parseFloat(op.amount).toLocaleString(undefined, { 
                    maximumFractionDigits: 6 
                  })} {displayAsset}
                </p>
              )}
              {op.transactionHash && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {op.transactionHash.slice(0, 6)}...{op.transactionHash.slice(-4)}
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
