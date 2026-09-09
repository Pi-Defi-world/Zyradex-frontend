import { useEffect, useMemo, useState, useRef } from "react"
import { getPoolsForPair, quoteSwap } from "@/lib/api/swap"
import type { ApiError } from "@/lib/api"

export interface TokenPrice {
  tokenCode: string
  tokenIssuer?: string
  priceInPi: number | null
  isLoading: boolean
  error: ApiError | null
}

function tokenKey(code: string, issuer?: string | null): string {
  if (!code || code === "native") return "native"
  const upper = code.toUpperCase()
  return issuer ? `${upper}:${issuer}` : upper
}

function toQuoteDescriptor(k: string): string {
  if (k === "native") return "native"
  if (!k.includes(":")) return `${k}:`
  return k
}

function priceFromReserves(pool: any, tKey: string): number | null {
  try {
    const reserves = pool.reserves || []
    if (reserves.length < 2) return null
    const r0 = reserves[0]
    const r1 = reserves[1]
    const is0 = r0.asset === tKey || r0.asset?.toUpperCase() === tKey?.toUpperCase()
    const is1 = r1.asset === tKey || r1.asset?.toUpperCase() === tKey?.toUpperCase()
    if (is0 && r1.asset === "native") return parseFloat(r1.amount) / parseFloat(r0.amount)
    if (is1 && r0.asset === "native") return parseFloat(r0.amount) / parseFloat(r1.amount)
    return null
  } catch { return null }
}

export const useTokenPrice = (tokenCode: string, tokenIssuer?: string, enabled: boolean = true): TokenPrice => {
  const [priceInPi, setPriceInPi] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const lastFetchRef = useRef<string | null>(null)
  const lastPriceRef = useRef<number | null>(null)

  const tKey = useMemo(() => {
    if (!tokenCode || tokenCode === "native") return null
    return tokenKey(tokenCode, tokenIssuer)
  }, [tokenCode, tokenIssuer])

  useEffect(() => {
    if (!enabled || !tKey) {
      setPriceInPi(null); setIsLoading(false); setError(null); return
    }
    if (lastFetchRef.current === tKey && lastPriceRef.current !== null) return

    let cancelled = false
    setIsLoading(true); setError(null)
    lastFetchRef.current = tKey

    const resolve = async () => {
      try {
        const directPools = await getPoolsForPair({ tokenA: tKey, tokenB: "native" })
        if (cancelled) return

        if (directPools.success && directPools.pools.length > 0) {
          const pool = directPools.pools[0]
          let foundPrice: number | null = null
          try {
            const quote = await quoteSwap({
              poolId: pool.id, from: toQuoteDescriptor(tKey), to: "native", amount: "1", slippagePercent: 1,
            })
            if (quote.success && quote.expectedOutput) {
              const price = parseFloat(quote.expectedOutput)
              foundPrice = isNaN(price) ? null : price
            }
          } catch {}
          if (foundPrice === null) foundPrice = priceFromReserves(pool, tKey)
          if (!cancelled && foundPrice !== null) {
            lastPriceRef.current = foundPrice
            setPriceInPi(foundPrice); setIsLoading(false); return
          }
        }

        if (!cancelled) { setPriceInPi(null); setIsLoading(false) }
      } catch (err: any) {
        if (!cancelled) { setError(err); setPriceInPi(null); setIsLoading(false) }
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [tKey, enabled])

  return { tokenCode, tokenIssuer, priceInPi, isLoading, error }
}

export const useTokenPrices = (balances: Array<{ assetCode?: string; assetIssuer?: string; assetType?: string }>) => {
  const [prices, setPrices] = useState<Map<string, number | null>>(new Map())
  const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set())
  const lastBalancesRef = useRef<string>("")

  const balancesKey = useMemo(() =>
    balances.filter(b => b.assetCode).map(b => `${b.assetCode}:${b.assetIssuer || ""}:${b.assetType || ""}`).sort().join("|"),
    [balances]
  )

  useEffect(() => {
    if (lastBalancesRef.current === balancesKey) return
    const timeoutId = setTimeout(() => {
      const fetchPrices = async () => {
        lastBalancesRef.current = balancesKey
        const priceMap = new Map<string, number | null>()
        const loadingSet = new Set<string>()
        const tokensToFetch = balances.filter(b => b.assetType !== "native" && b.assetCode)
        priceMap.set("native", 1)

        if (tokensToFetch.length === 0) { setPrices(priceMap); return }

        // Fetch prices sequentially to avoid overwhelming the API (already cached after first call)
        for (const balance of tokensToFetch) {
          const code = balance.assetCode!
          const issuer = balance.assetIssuer || undefined
          const tKey = tokenKey(code, issuer)
          loadingSet.add(tKey)

          try {
            const directRes = await getPoolsForPair({ tokenA: tKey, tokenB: "native" }).catch(() => ({ success: false, pools: [] }))
            if (directRes.success && directRes.pools.length > 0) {
              const pool = directRes.pools[0]
              let foundPrice: number | null = null
              try {
                const quote = await quoteSwap({
                  poolId: pool.id, from: toQuoteDescriptor(tKey), to: "native", amount: "1", slippagePercent: 1,
                })
                if (quote.success && quote.expectedOutput) {
                  const price = parseFloat(quote.expectedOutput)
                  foundPrice = isNaN(price) ? null : price
                }
              } catch {}
              if (foundPrice === null) foundPrice = priceFromReserves(pool, tKey)
              priceMap.set(tKey, foundPrice)
            } else {
              priceMap.set(tKey, null)
            }
          } catch {
            priceMap.set(tKey, null)
          } finally {
            loadingSet.delete(tKey)
          }
        }

        setPrices(priceMap); setLoadingTokens(loadingSet)
      }
      if (balances.length > 0) fetchPrices()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [balancesKey, balances.length])

  const getPrice = (assetCode?: string, assetIssuer?: string, assetType?: string): number | null => {
    if (assetType === "native") return 1
    if (!assetCode) return null
    return prices.get(tokenKey(assetCode, assetIssuer || undefined)) ?? null
  }

  return { prices, getPrice, isLoading: loadingTokens.size > 0 }
}
