import { useCallback, useMemo, useRef } from "react"
import { useTokenRegistry } from "./useTokenRegistry"
import { lookupTokenMetadata } from "@/lib/api/tokens"

function makeKey(assetCode: string, issuer?: string | null): string {
  return `${assetCode}:${issuer || ""}`
}

export interface TokenLookup {
  image?: string
  name?: string
  holders?: number
  liquidityPools?: number
  circulatingSupply?: number
  totalSupply?: number
  description?: string
}

const pendingRequests = new Map<string, Promise<TokenLookup | null>>()

export function useTokenMetadataMap() {
  const { tokens } = useTokenRegistry()
  const fetchedCache = useRef(new Map<string, TokenLookup | null>())

  const tokenMap = useMemo(() => {
    const map = new Map<string, TokenLookup>()
    for (const token of tokens) {
      const key = makeKey(token.assetCode, token.issuer)
      if (!map.has(key)) {
        map.set(key, {
          image: token.image,
          name: token.tomlName || token.name,
          holders: token.holders,
          liquidityPools: token.liquidityPools,
          circulatingSupply: token.circulatingSupply,
          totalSupply: token.totalSupply,
          description: token.tomlDescription || token.description,
        })
      }
    }
    return map
  }, [tokens])

  const lookup = (assetCode: string, issuer?: string | null): TokenLookup | undefined => {
    const key = makeKey(assetCode, issuer)
    const platform = tokenMap.get(key)
    if (platform && platform.image) return platform
    const fetched = fetchedCache.current.get(key)
    if (fetched?.image) return fetched
    if (platform) return platform
    if (fetched !== undefined) return fetched ?? undefined
    return undefined
  }

  const fetchMetadata = useCallback(async (assetCode: string, issuer?: string | null): Promise<TokenLookup | null> => {
    if (!assetCode || !issuer) return null
    const key = makeKey(assetCode, issuer)

    const platform = tokenMap.get(key)
    if (platform && platform.image) return platform

    const cached = fetchedCache.current.get(key)
    if (cached !== undefined) return cached

    const pending = pendingRequests.get(key)
    if (pending) return pending

    const promise = lookupTokenMetadata(assetCode, issuer).then((meta) => {
      const result: TokenLookup | null = meta ? {
        image: meta.image,
        name: meta.tomlName,
        holders: meta.holders,
        liquidityPools: meta.liquidityPools,
        circulatingSupply: meta.circulatingSupply,
        description: meta.tomlDescription,
      } : null
      fetchedCache.current.set(key, result)
      pendingRequests.delete(key)
      return result
    }).catch(() => {
      fetchedCache.current.set(key, null)
      pendingRequests.delete(key)
      return null
    })

    pendingRequests.set(key, promise)
    return promise
  }, [tokenMap])

  return { lookup, fetchMetadata, tokenMap }
}
