import { useEffect, useMemo, useState, useRef } from "react"
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
  const lastFetchRef = useRef<string | null>(null)
  const lastPriceRef = useRef<number | null>(null)

  // Create a stable key for this token
  const tokenKey = useMemo(() => {
    if (!tokenCode || tokenCode === "native") return null
    return tokenIssuer ? `${tokenCode}:${tokenIssuer}` : tokenCode
  }, [tokenCode, tokenIssuer])

  useEffect(() => {
    if (!enabled || !tokenKey) {
      setPriceInPi(null)
      setIsLoading(false)
      setError(null)
      lastFetchRef.current = null
      return
    }

    // Skip if we just fetched this token (prevent re-render loops)
    if (lastFetchRef.current === tokenKey && lastPriceRef.current !== null) {
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    lastFetchRef.current = tokenKey

    const fetchPrice = async () => {
      try {
        // Find pools between this token and native Pi (uses cache internally)
        const poolsResponse = await getPoolsForPair({
          tokenA: tokenKey,
          tokenB: "native",
        })

        if (cancelled) return

        if (!poolsResponse.success || poolsResponse.pools.length === 0) {
          lastPriceRef.current = null
          setPriceInPi(null)
          setIsLoading(false)
          return
        }

        // Use the first pool to get a quote for 1 unit of token
        const pool = poolsResponse.pools[0]
        try {
          const quote = await quoteSwap({
            poolId: pool.id,
            from: tokenKey,
            to: "native",
            amount: "1",
            slippagePercent: 1,
          })

          if (cancelled) return

          if (quote.success && quote.expectedOutput) {
            const price = parseFloat(quote.expectedOutput)
            const finalPrice = isNaN(price) ? null : price
            lastPriceRef.current = finalPrice
            setPriceInPi(finalPrice)
          } else {
            lastPriceRef.current = null
            setPriceInPi(null)
          }
        } catch (quoteError) {
          // If quote fails, token has no price
          if (!cancelled) {
            lastPriceRef.current = null
            setPriceInPi(null)
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err)
          lastPriceRef.current = null
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
  }, [tokenKey, enabled])

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
  const lastBalancesRef = useRef<string>("")

  // Create a stable key from balances to prevent unnecessary refetches
  const balancesKey = useMemo(() => {
    return balances
      .filter(b => b.assetCode)
      .map(b => `${b.assetCode}:${b.assetIssuer || ""}:${b.assetType || ""}`)
      .sort()
      .join("|")
  }, [balances])

  useEffect(() => {
    // Skip if balances haven't actually changed
    if (lastBalancesRef.current === balancesKey) {
      return
    }

    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(() => {
      const fetchPrices = async () => {
        lastBalancesRef.current = balancesKey
        const priceMap = new Map<string, number | null>()
        const loadingSet = new Set<string>()

        // Process tokens in batches to avoid rate limiting
        const tokensToFetch = balances.filter(
          (b) => b.assetType !== "native" && b.assetCode
        )

        // Process in smaller batches with delays
        const batchSize = 3
        for (let i = 0; i < tokensToFetch.length; i += batchSize) {
          const batch = tokensToFetch.slice(i, i + batchSize)
          
          await Promise.all(
            batch.map(async (balance) => {
              const tokenKey = balance.assetIssuer 
                ? `${balance.assetCode}:${balance.assetIssuer}` 
                : balance.assetCode!

              loadingSet.add(tokenKey)

              try {
                const tokenDescriptor = balance.assetIssuer 
                  ? `${balance.assetCode}:${balance.assetIssuer}` 
                  : balance.assetCode!

                // Use cached request (deduplicates and caches automatically)
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
            })
          )

          // Add delay between batches to avoid rate limiting (reduced since we have caching)
          if (i + batchSize < tokensToFetch.length) {
            await new Promise((resolve) => setTimeout(resolve, 300))
          }
        }

        // Set native price
        priceMap.set("native", 1)

        setPrices(priceMap)
        setLoadingTokens(loadingSet)
      }

      if (balances.length > 0) {
        fetchPrices()
      }
    }, 300) // Reduced debounce since we have caching

    return () => clearTimeout(timeoutId)
  }, [balancesKey, balances.length])

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

