"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import type { AccountOperation } from "@/lib/api/account"

interface RecentSwapsProps {
  operations?: AccountOperation[]
  isLoading?: boolean
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

export function RecentSwaps({ operations = [], isLoading }: RecentSwapsProps) {
  const router = useRouter()
  const swaps = operations.filter(isSwapOperation).slice(0, 8)

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
        {swaps.map((swap) => {
          // Format swap display based on operation type
          const isPathPayment = swap.type?.toLowerCase().includes("path_payment")
          const displayAction = swap.action || swap.type || "swap"
          const displayAmount = swap.amount || "0"
          
          // Extract asset code only (remove issuer address)
          let displayAsset = swap.asset || (isPathPayment ? "tokens" : "")
          if (displayAsset && displayAsset.includes(":")) {
            // Extract just the code part before the colon
            displayAsset = displayAsset.split(":")[0]
          }
          // Handle "Test Pi" for native assets
          if (displayAsset === "Pi" || displayAsset === "native") {
            displayAsset = "Test Pi"
          }
          
          return (
            <div
              key={swap.id}
              className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm capitalize truncate">
                  {displayAction === "swap" ? "Swap" : displayAction}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(swap.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0 min-w-0">
                {displayAmount && displayAsset && (
                  <p className="text-sm font-semibold truncate max-w-[120px]">
                    {parseFloat(displayAmount).toLocaleString(undefined, { 
                      maximumFractionDigits: 6 
                    })} {displayAsset}
                  </p>
                )}
                {swap.transactionHash && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {swap.transactionHash.slice(0, 6)}...{swap.transactionHash.slice(-4)}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
        
        {swaps.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/history")}
            >
              View Full History
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
