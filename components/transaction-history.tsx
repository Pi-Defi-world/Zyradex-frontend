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

const statusLabel = (op: AccountOperation) => {
  if (op.action?.includes("removed")) return "updated"
  if (op.action?.includes("added")) return "added"
  return "completed"
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
      {rows.map((op) => (
        <div
          key={op.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {actionIcon(op)}
            </div>
            <div>
              <p className="font-medium capitalize">{op.action || op.type}</p>
              <p className="text-xs text-muted-foreground">{op.transactionHash}</p>
              <p className="text-sm text-muted-foreground">{formatTimestamp(op.createdAt)}</p>
            </div>
          </div>
          <div className="text-right">
            {op.amount && op.asset && (
              <p className="font-semibold">
                {op.amount} {op.asset}
              </p>
            )}
            <Badge variant="secondary" className="mt-1">
              {statusLabel(op)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
