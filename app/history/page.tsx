"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAccountOperations } from "@/hooks/useAccountData"
import { TransactionHistory } from "@/components/transaction-history"

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

  const { operations, pagination, isLoading, refresh } = useAccountOperations(publicKey, {
    limit: 20,
    order,
    cursor,
  })

  const handleRefresh = () => {
    setCursor(undefined)
    refresh()
    toast({
      title: "Refreshing",
      description: "Fetching latest activity...",
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

  const truncateHash = (hash: string) => {
    if (!hash) return ""
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
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
                  {pagination ? `${operations.length} operation${operations.length !== 1 ? "s" : ""} loaded` : "Loading..."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {isLoading && operations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TransactionHistory operations={operations} isLoading={isLoading} />
            )}

            {pagination && operations.length > 0 && (
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

