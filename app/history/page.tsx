"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, RefreshCw, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAccountTransactions } from "@/hooks/useAccountData"
import { formatDistanceToNow } from "date-fns"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function HistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { profile } = useUserProfile()
  const [localWallet, setLocalWallet] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const publicKey = profile?.public_key || localWallet || undefined

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = getStoredWallet()
      setLocalWallet(stored)
      if (profile?.public_key && stored !== profile.public_key) {
        localStorage.setItem("zyradex-wallet-address", profile.public_key)
        setLocalWallet(profile.public_key)
      }
    }
  }, [profile?.public_key])

  const { transactions, pagination, isLoading, error, refresh } = useAccountTransactions(publicKey, {
    limit: 20,
    order,
    cursor,
  })

  const handleRefresh = () => {
    setCursor(undefined)
    refresh()
    toast({
      title: "Refreshing",
      description: "Fetching latest transactions...",
    })
  }

  const handleNextPage = () => {
    if (pagination?.nextCursor) {
      setCursor(pagination.nextCursor)
    }
  }

  const handlePrevPage = () => {
    setCursor(undefined)
  }

  const handleToggleOrder = () => {
    setOrder(order === "desc" ? "asc" : "desc")
    setCursor(undefined)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const getTransactionType = (tx: any) => {
    if (tx.operationCount === 0) return "Unknown"
    if (tx.operationCount === 1) return "Single Operation"
    return `${tx.operationCount} Operations`
  }

  const getTransactionStatus = (tx: any) => {
    return tx.successful ? "Success" : "Failed"
  }

  const truncateHash = (hash: string) => {
    if (!hash) return ""
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  const viewOnExplorer = (hash: string) => {
    const explorerUrl = `https://testnet.minepi.com/explorer/transaction/${hash}`
    window.open(explorerUrl, "_blank")
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View your transaction history on Zyradex</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No wallet address found. Please import your account in the Profile page.
              </p>
              <Button onClick={() => router.push("/profile")} className="w-full">
                Go to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
              <p className="text-sm text-muted-foreground">
                View all transactions for {truncateHash(publicKey)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleOrder} disabled={isLoading}>
              {order === "desc" ? "Oldest First" : "Newest First"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Card className="border border-border/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Transactions</CardTitle>
                <CardDescription className="mt-1">
                  {pagination ? `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} loaded` : "Loading..."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {isLoading && transactions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Transactions will appear here once you start using your wallet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {getTransactionType(tx)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.successful
                              ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : "bg-red-500/20 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {getTransactionStatus(tx)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-0 flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Fee</p>
                        <p className="text-sm font-semibold">
                          {tx.fee ? (Number(tx.fee) / 10000000).toFixed(7) : "0"} Pi
                        </p>
                      </div>
                      {tx.hash && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => viewOnExplorer(tx.hash)}
                            title="View on explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination && transactions.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!cursor || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {cursor ? "2+" : "1"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

