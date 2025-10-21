"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftRight, Clock, Loader2 } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"

interface SwapHistory {
  id: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  timestamp: string
  status: "completed" | "pending" | "failed"
}

export function RecentSwaps() {
  const { isAuthenticated } = usePi()
  const [swaps, setSwaps] = useState<SwapHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's swap history
  useEffect(() => {
    if (!isAuthenticated) {
      setSwaps([])
      return
    }

    const fetchSwapHistory = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch('/api/swaps/user-history', {
        //   headers: {
        //     'Authorization': `Bearer ${accessToken}`,
        //   },
        // })
        // const data = await response.json()
        
        // Mock empty response for now
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSwaps([])
      } catch (err) {
        setError('Failed to load swap history')
        console.error('Error fetching swap history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSwapHistory()
  }, [isAuthenticated])

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const swapTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - swapTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getStatusColor = (status: SwapHistory['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm shadow-2xl">
      {/* Premium gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-lg p-px">
        <div className="h-full w-full rounded-lg bg-background/95 backdrop-blur-sm" />
      </div>

      <div className="relative">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Recent Swaps
          </CardTitle>
          <CardDescription>
            Your recent trading activity
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading swap history...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">
              <span>{error}</span>
            </div>
          ) : swaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No swaps yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your swap history will appear here once you start trading tokens.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {swaps.map((swap) => (
                <div
                  key={swap.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                      <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(swap.timestamp)}</span>
                        <span className={`text-xs font-medium ${getStatusColor(swap.status)}`}>
                          {swap.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      ${(parseFloat(swap.fromAmount) * 0.5).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ ${(parseFloat(swap.toAmount) * 0.5).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
