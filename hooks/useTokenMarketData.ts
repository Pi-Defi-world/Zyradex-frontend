import { useEffect, useState } from "react"
import { getTradeAggregations } from "@/lib/api/orderbook"

export interface TokenMarketData {
  volume24h: number | null
  isLoading: boolean
}

export function useTokenMarketData(assetCode: string, issuer?: string): TokenMarketData {
  const [volume24h, setVolume24h] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!assetCode || assetCode === "native") return

    let cancelled = false
    setIsLoading(true)

    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const tokenKey = issuer ? `${assetCode}:${issuer}` : assetCode

    getTradeAggregations(tokenKey, "native", 3600000, startTime, endTime, 24)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.aggregations?.length > 0) {
          const totalBaseVolume = res.aggregations.reduce(
            (sum: number, a: any) => sum + parseFloat(a.base_volume || "0"),
            0
          )
          setVolume24h(totalBaseVolume)
        } else {
          setVolume24h(0)
        }
      })
      .catch(() => {
        if (!cancelled) setVolume24h(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [assetCode, issuer])

  return { volume24h, isLoading }
}
