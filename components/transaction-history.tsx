"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, Repeat } from "lucide-react"

const transactions = [
  {
    id: "1",
    type: "mint",
    asset: "CUSTOM",
    amount: "+10,000",
    status: "completed",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "trustline",
    asset: "PIUSD",
    amount: "5,000 limit",
    status: "completed",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "transfer",
    asset: "PI",
    amount: "-50.00",
    status: "completed",
    timestamp: "1 day ago",
  },
  {
    id: "4",
    type: "mint",
    asset: "MYTOKEN",
    amount: "+5,000",
    status: "completed",
    timestamp: "2 days ago",
  },
  {
    id: "5",
    type: "transfer",
    asset: "PIUSD",
    amount: "+100.00",
    status: "completed",
    timestamp: "3 days ago",
  },
]

export function TransactionHistory() {
  const getIcon = (type: string) => {
    switch (type) {
      case "mint":
        return <Repeat className="h-4 w-4" />
      case "transfer":
        return <ArrowUpRight className="h-4 w-4" />
      case "trustline":
        return <ArrowDownLeft className="h-4 w-4" />
      default:
        return <Repeat className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {getIcon(tx.type)}
            </div>
            <div>
              <p className="font-medium capitalize">{tx.type}</p>
              <p className="text-sm text-muted-foreground">{tx.timestamp}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {tx.amount} {tx.asset}
            </p>
            <Badge variant="secondary" className="mt-1">
              {tx.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
