"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
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

const isSwapOperation = (operation: AccountOperation) => {
  const type = operation.type?.toLowerCase() || ""
  const action = (operation.action ?? "").toLowerCase()
  
  // Check for swap-related operation types
  if (type.includes("path_payment") || type.includes("pathpayment")) {
    return true
  }
  
  // Check for swap action
  if (action.includes("swap")) {
    return true
  }
  
  // Check for offer operations (which can be part of swaps)
  if (type.includes("offer") || type.includes("manage_sell") || type.includes("manage_buy")) {
    return true
  }
  
  return false
}

const viewOnExplorer = (hash: string) => {
  const explorerUrl = `https://testnet.minepi.com/explorer/transaction/${hash}`
  window.open(explorerUrl, "_blank")
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
        const isSwap = isSwapOperation(op)
        const isPathPayment = op.type?.toLowerCase().includes("path_payment")
        
        // For swaps, try to extract from/to tokens
        let fromAsset = op.asset || ""
        let toAsset = op.destinationAsset || ""
        let fromAmount = op.amount || ""
        let toAmount = op.destinationAmount || ""
        
        // Extract asset codes only (remove issuer address)
        if (fromAsset && fromAsset.includes(":")) {
          fromAsset = fromAsset.split(":")[0]
        }
        if (toAsset && toAsset.includes(":")) {
          toAsset = toAsset.split(":")[0]
        }
        
        // Handle "Test Pi" for native assets
        if (fromAsset === "Pi" || fromAsset === "native") {
          fromAsset = "Test Pi"
        }
        if (toAsset === "Pi" || toAsset === "native") {
          toAsset = "Test Pi"
        }
        
        // For non-swap operations, use single asset display
        let displayAsset = fromAsset || op.asset || ""
        if (displayAsset && displayAsset.includes(":")) {
          displayAsset = displayAsset.split(":")[0]
        }
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
            <div className="text-right flex-shrink-0 min-w-0 flex items-center gap-2">
              {isSwap && fromAsset && toAsset ? (
                <div className="text-right">
                  <p className="text-sm font-semibold truncate max-w-[150px]">
                    {fromAmount ? `${parseFloat(fromAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${fromAsset}` : fromAsset}
                    {" → "}
                    {toAmount ? `${parseFloat(toAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toAsset}` : toAsset}
                  </p>
                </div>
              ) : op.amount && displayAsset ? (
                <p className="text-sm font-semibold truncate max-w-[120px]">
                  {parseFloat(op.amount).toLocaleString(undefined, { 
                    maximumFractionDigits: 6 
                  })} {displayAsset}
                </p>
              ) : null}
              {op.transactionHash && (
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => viewOnExplorer(op.transactionHash)}
                  >
                    {op.transactionHash.slice(0, 6)}...{op.transactionHash.slice(-4)}
                  </Badge>
                  <button
                    onClick={() => viewOnExplorer(op.transactionHash)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
