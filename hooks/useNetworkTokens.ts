import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { fetchTokens, lookupTokenMetadata, type TokenRecord } from "@/lib/api/tokens"
import { fetchListedAssets, searchAssets, type ListedAsset } from "@/lib/api/orderbook"
import { toApiError } from "@/lib/api"
import type { ApiError } from "@/lib/api"

export interface NetworkToken {
  assetCode: string
  issuer: string
  numAccounts: number
  liquidityPools: number
  circulatingSupply: number
  tomlUrl: string | null
  image?: string
  name?: string
  description?: string
  isPlatformToken: boolean
}

const PAGE_SIZE = 15

// In-memory enrichment cache: key = "CODE:ISSUER", value = { image, name, description }
const enrichmentCache = new Map<string, { image?: string; name?: string; description?: string } | null>()
const pendingEnrichments = new Map<string, Promise<{ image?: string; name?: string; description?: string } | null>>()

async function enrichBatch(assets: ListedAsset[]): Promise<void> {
  const toFetch = assets.filter(
    (a) => a.toml_url && !enrichmentCache.has(`${a.asset_code}:${a.asset_issuer}`)
  )

  if (toFetch.length === 0) return

  // Fetch concurrently with max 5 in-flight
  const batchSize = 5
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (asset) => {
        const key = `${asset.asset_code}:${asset.asset_issuer}`
        if (pendingEnrichments.has(key)) {
          await pendingEnrichments.get(key)
          return
        }
        const promise = lookupTokenMetadata(asset.asset_code, asset.asset_issuer)
          .then((meta) => {
            const result = meta ? {
              image: meta.image,
              name: meta.tomlName,
              description: meta.tomlDescription,
            } : null
            enrichmentCache.set(key, result)
            pendingEnrichments.delete(key)
            return result
          })
          .catch(() => {
            enrichmentCache.set(key, null)
            pendingEnrichments.delete(key)
            return null
          })
        pendingEnrichments.set(key, promise)
        await promise
      })
    )
  }
}

export function useNetworkTokens(options?: { searchQuery?: string; limit?: number }) {
  const { searchQuery = "", limit = PAGE_SIZE } = options || {}
  const [platformTokens, setPlatformTokens] = useState<TokenRecord[]>([])
  const [networkPages, setNetworkPages] = useState<ListedAsset[][]>([])
  const [, setEnrichVersion] = useState(0) // triggers re-render after enrichment
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const nextCursor = useRef<string | null>(null)
  const platformLoaded = useRef(false)

  const loadPlatform = useCallback(async () => {
    if (platformLoaded.current) return
    try {
      const res = await fetchTokens().catch(() => ({ tokens: [] as TokenRecord[] }))
      setPlatformTokens(res.tokens || [])
      platformLoaded.current = true
    } catch {
      // platform tokens fail silently
    }
  }, [])

  const loadNetwork = useCallback(async (reset: boolean) => {
    if (reset) {
      setIsLoading(true)
      setNetworkPages([])
      nextCursor.current = null
      setHasMore(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const q = searchQuery.trim()
      let res: { assets: ListedAsset[]; next: string | null }

      if (q) {
        const searchRes = await searchAssets(q, limit)
        res = {
          assets: (searchRes.assets || []).map((a) => ({
            asset_type: a.asset_type,
            asset_code: a.asset_code,
            asset_issuer: a.asset_issuer,
            num_accounts: a.num_accounts ?? 0,
            num_liquidity_pools: a.num_liquidity_pools ?? 0,
            balances: a.balances ?? { authorized: "0" },
            flags: a.flags ?? {},
            toml_url: a.toml_url ?? null,
            paging_token: a.paging_token,
          } as ListedAsset)),
          next: null,
        }
        setHasMore(false)
      } else {
        res = await fetchListedAssets({ cursor: nextCursor.current ?? undefined, limit })
        nextCursor.current = res.next
        setHasMore(res.next !== null && res.assets.length === limit)
      }

      setNetworkPages((prev) => reset ? [res.assets] : [...prev, res.assets])

      // Batch-enrich in background
      enrichBatch(res.assets).then(() => setEnrichVersion((v) => v + 1))
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [searchQuery, limit])

  useEffect(() => {
    loadPlatform()
  }, [loadPlatform])

  useEffect(() => {
    loadNetwork(true)
  }, [loadNetwork])

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !searchQuery.trim()) {
      loadNetwork(false)
    }
  }, [isLoadingMore, hasMore, searchQuery, loadNetwork])

  const allTokens = useMemo<NetworkToken[]>(() => {
    const platformSet = new Set<string>()
    const merged: NetworkToken[] = []

    for (const token of platformTokens) {
      const key = `${token.assetCode}:${token.issuer}`
      platformSet.add(key)
      merged.push({
        assetCode: token.assetCode,
        issuer: token.issuer,
        numAccounts: token.holders ?? 0,
        liquidityPools: token.liquidityPools ?? 0,
        circulatingSupply: token.circulatingSupply ?? token.totalSupply,
        tomlUrl: null,
        image: token.image,
        name: token.tomlName || token.name,
        description: token.tomlDescription || token.description,
        isPlatformToken: true,
      })
    }

    for (const page of networkPages) {
      for (const asset of page) {
        const key = `${asset.asset_code}:${asset.asset_issuer}`
        if (platformSet.has(key)) continue
        platformSet.add(key)

        const enriched = enrichmentCache.get(key)
        merged.push({
          assetCode: asset.asset_code,
          issuer: asset.asset_issuer,
          numAccounts: asset.num_accounts ?? 0,
          liquidityPools: asset.num_liquidity_pools ?? 0,
          circulatingSupply: parseFloat(asset.balances?.authorized ?? "0"),
          tomlUrl: asset.toml_url,
          image: enriched?.image ?? undefined,
          name: enriched?.name ?? undefined,
          description: enriched?.description ?? undefined,
          isPlatformToken: false,
        })
      }
    }

    return merged
  }, [platformTokens, networkPages])

  return {
    tokens: allTokens,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh: () => loadNetwork(true),
  }
}
