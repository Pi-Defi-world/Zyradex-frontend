"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { listAllLiquidityPools } from "@/lib/api/liquidity"

interface PoolPrice {
  priceInPi: number | null
  updatedAt: number
}

interface PoolPriceContextValue {
  getPrice: (code: string, issuer?: string | null, piPrice?: number | null) => number | null
  isReady: boolean
}

// Known stablecoins: code -> USD price (1 USD = X of this stablecoin)
const STABLECOINS: Record<string, number> = {
  PUSD: 1,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  BUSD: 1,
  TUSD: 1,
  USDP: 1,
  GUSD: 1,
}

const PoolPriceContext = createContext<PoolPriceContextValue>({
  getPrice: () => null,
  isReady: false,
})

function isStablecoin(code: string): boolean {
  return code.toUpperCase() in STABLECOINS
}

const globalCache = new Map<string, PoolPrice>()
const CACHE_TTL = 5 * 60 * 1000

function priceFromPoolReserves(pool: any, tKey: string): number | null {
  try {
    const reserves = pool.reserves || []
    if (reserves.length < 2) return null
    const r0 = reserves[0]
    const r1 = reserves[1]
    if (r0.asset === tKey && r1.asset === "native") return parseFloat(r1.amount) / parseFloat(r0.amount)
    if (r1.asset === tKey && r0.asset === "native") return parseFloat(r0.amount) / parseFloat(r1.amount)
    return null
  } catch { return null }
}

function tokenKey(code: string, issuer?: string | null): string {
  if (!code || code === "native") return "native"
  return issuer ? `${code.toUpperCase()}:${issuer}` : code.toUpperCase()
}

// Normalize a pool reserve asset string to the canonical key format
function normalizeAssetKey(asset: string): string {
  if (!asset || asset === "native") return "native"
  const idx = asset.indexOf(":")
  if (idx === -1) return asset.toUpperCase()
  return `${asset.substring(0, idx).toUpperCase()}:${asset.substring(idx + 1)}`
}

export function PoolPriceProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(globalCache.size > 0)
  const fetching = useRef(false)

  const refresh = useCallback(async () => {
    if (fetching.current) return
    fetching.current = true
    try {
      console.log("[PoolPrice] Fetching all liquidity pools...")
      const res = await listAllLiquidityPools({ skipCache: false })
      const pools = res.data || []
      console.log(`[PoolPrice] Got ${pools.length} pools, computing prices...`)
      const now = Date.now()

      // Pass 1: Index all direct PI pools
      for (const pool of pools) {
        const reserves = pool.reserves || []
        if (reserves.length !== 2) continue
        const r0 = reserves[0]
        const r1 = reserves[1]
        const k0 = normalizeAssetKey(r0.asset)
        const k1 = normalizeAssetKey(r1.asset)

        if (r0.asset && k1 === "native") {
          const price = parseFloat(r1.amount) / parseFloat(r0.amount)
          if (!isNaN(price)) globalCache.set(k0, { priceInPi: price, updatedAt: now })
        }
        if (r1.asset && k0 === "native") {
          const price = parseFloat(r0.amount) / parseFloat(r1.amount)
          if (!isNaN(price)) globalCache.set(k1, { priceInPi: price, updatedAt: now })
        }
      }

      // Pass 2: Multi-hop
      for (const pool of pools) {
        const reserves = pool.reserves || []
        if (reserves.length !== 2) continue
        const r0 = reserves[0]
        const r1 = reserves[1]
        const k0 = normalizeAssetKey(r0.asset)
        const k1 = normalizeAssetKey(r1.asset)
        if (k0 === "native" || k1 === "native") continue

        const cp0 = globalCache.get(k0)
        const cp1 = globalCache.get(k1)

        if (cp1?.priceInPi && !globalCache.has(k0)) {
          const hopPrice = cp1.priceInPi * (parseFloat(r1.amount) / parseFloat(r0.amount))
          if (!isNaN(hopPrice)) globalCache.set(k0, { priceInPi: hopPrice, updatedAt: now })
        }
        if (cp0?.priceInPi && !globalCache.has(k1)) {
          const hopPrice = cp0.priceInPi * (parseFloat(r0.amount) / parseFloat(r1.amount))
          if (!isNaN(hopPrice)) globalCache.set(k1, { priceInPi: hopPrice, updatedAt: now })
        }
      }

      console.log(`[PoolPrice] Indexed ${globalCache.size} token prices`)
      setIsReady(true)
    } catch (e: any) {
      console.error("[PoolPrice] Failed to fetch pools:", e?.message || e)
    }
    fetching.current = false
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const getPrice = useCallback((code: string, issuer?: string | null, piPrice?: number | null): number | null => {
    const upper = code.toUpperCase()

    // Stablecoins: price = USD_peg / piPrice
    if (isStablecoin(upper) && piPrice && piPrice > 0) {
      return STABLECOINS[upper] / piPrice
    }

    const key = tokenKey(code, issuer)
    const cached = globalCache.get(key)
    if (cached && Date.now() - cached.updatedAt < CACHE_TTL) return cached.priceInPi
    return null
  }, [])

  // Periodic refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, CACHE_TTL)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <PoolPriceContext.Provider value={{ getPrice, isReady }}>
      {children}
    </PoolPriceContext.Provider>
  )
}

export function usePoolPrice() {
  return useContext(PoolPriceContext)
}
