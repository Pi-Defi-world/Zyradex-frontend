import { useEffect, useMemo, useState } from "react"
import { getPoolsForPair, quoteSwap } from "@/lib/api/swap"
import type { ApiError } from "@/lib/api"

export interface TokenPrice {
  tokenCode: string
  tokenIssuer?: string
  priceInPi: number | null // Price of 1 token in Pi, or null if no pool exists
  isLoading: boolean
  error: ApiError | null
}

export const useTokenPrice = (tokenCode: string, tokenIssuer?: string, enabled: boolean = true): TokenPrice => {
  const [priceInPi, setPriceInPi] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (!enabled || !tokenCode || tokenCode === "native") {
      setPriceInPi(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const fetchPrice = async () => {
      try {
        // Find pools between this token and native Pi
        const tokenDescriptor = tokenIssuer ? `${tokenCode}:${tokenIssuer}` : tokenCode
        const poolsResponse = await getPoolsForPair({
          tokenA: tokenDescriptor,
          tokenB: "native",
        })

        if (cancelled) return

        if (!poolsResponse.success || poolsResponse.pools.length === 0) {
          setPriceInPi(null)
          setIsLoading(false)
          return
        }

        // Use the first pool to get a quote for 1 unit of token
        const pool = poolsResponse.pools[0]
        try {
          const quote = await quoteSwap({
            poolId: pool.id,
            from: tokenDescriptor,
            to: "native",
            amount: "1",
            slippagePercent: 1,
          })

          if (cancelled) return

          if (quote.success && quote.expectedOutput) {
            const price = parseFloat(quote.expectedOutput)
            setPriceInPi(isNaN(price) ? null : price)
          } else {
            setPriceInPi(null)
          }
        } catch (quoteError) {
          // If quote fails, token has no price
          if (!cancelled) {
            setPriceInPi(null)
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err)
          setPriceInPi(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPrice()

    return () => {
      cancelled = true
    }
  }, [tokenCode, tokenIssuer, enabled])

  return {
    tokenCode,
    tokenIssuer,
    priceInPi,
    isLoading,
    error,
  }
}

export const useTokenPrices = (balances: Array<{ assetCode?: string; assetIssuer?: string; assetType?: string }>) => {
  const [prices, setPrices] = useState<Map<string, number | null>>(new Map())
  const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchPrices = async () => {
      const priceMap = new Map<string, number | null>()
      const loadingSet = new Set<string>()

      for (const balance of balances) {
        if (balance.assetType === "native") {
          priceMap.set("native", 1) // Native Pi is worth 1 Pi
          continue
        }

        if (!balance.assetCode) continue

        const tokenKey = balance.assetIssuer 
          ? `${balance.assetCode}:${balance.assetIssuer}` 
          : balance.assetCode

        loadingSet.add(tokenKey)

        try {
          const tokenDescriptor = balance.assetIssuer 
            ? `${balance.assetCode}:${balance.assetIssuer}` 
            : balance.assetCode

          const poolsResponse = await getPoolsForPair({
            tokenA: tokenDescriptor,
            tokenB: "native",
          })

          if (poolsResponse.success && poolsResponse.pools.length > 0) {
            const pool = poolsResponse.pools[0]
            try {
              const quote = await quoteSwap({
                poolId: pool.id,
                from: tokenDescriptor,
                to: "native",
                amount: "1",
                slippagePercent: 1,
              })

              if (quote.success && quote.expectedOutput) {
                const price = parseFloat(quote.expectedOutput)
                priceMap.set(tokenKey, isNaN(price) ? null : price)
              } else {
                priceMap.set(tokenKey, null)
              }
            } catch {
              priceMap.set(tokenKey, null)
            }
          } else {
            priceMap.set(tokenKey, null)
          }
        } catch {
          priceMap.set(tokenKey, null)
        } finally {
          loadingSet.delete(tokenKey)
        }
      }

      setPrices(priceMap)
      setLoadingTokens(loadingSet)
    }

    if (balances.length > 0) {
      fetchPrices()
    }
  }, [balances])

  const getPrice = (assetCode?: string, assetIssuer?: string, assetType?: string): number | null => {
    if (assetType === "native") return 1
    if (!assetCode) return null
    const key = assetIssuer ? `${assetCode}:${assetIssuer}` : assetCode
    return prices.get(key) ?? null
  }

  const isLoading = loadingTokens.size > 0

  return {
    prices,
    getPrice,
    isLoading,
  }
}

