import { useEffect, useMemo, useState } from "react"
import { fetchTokens, type TokenRecord } from "@/lib/api/tokens"
import { searchAssets, type AssetSearchResult } from "@/lib/api/orderbook"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export interface AvailableToken {
  assetCode: string
  issuer: string
  name?: string
  description?: string
  numAccounts?: number
  isPlatformToken: boolean
  homeDomain?: string
}

export interface UseAvailableTokensOptions {
  searchQuery?: string
  limit?: number
  enabled?: boolean
}

export const useAvailableTokens = (options: UseAvailableTokensOptions = {}) => {
  const { searchQuery = "", limit = 50, enabled = true } = options
  const [platformTokens, setPlatformTokens] = useState<TokenRecord[]>([])
  const [networkTokens, setNetworkTokens] = useState<AssetSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // Fetch platform tokens
  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const fetchPlatformTokens = async () => {
      try {
        const response = await fetchTokens()
        if (!cancelled) {
          setPlatformTokens(response.tokens || [])
        }
      } catch (err) {
        if (!cancelled) {
          const apiError = toApiError(err)
          setError(apiError)
          setPlatformTokens([])
        }
      }
    }

    fetchPlatformTokens()

    return () => {
      cancelled = true
    }
  }, [enabled])

  // Fetch network tokens (only if search query provided)
  useEffect(() => {
    if (!enabled || !searchQuery.trim()) {
      setNetworkTokens([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const timeoutId = setTimeout(() => {
      searchAssets(searchQuery.trim(), limit)
        .then((response) => {
          if (!cancelled) {
            setNetworkTokens(response.assets || [])
            setIsLoading(false)
          }
        })
        .catch((err) => {
          if (!cancelled) {
            const apiError = toApiError(err)
            setError(apiError)
            setNetworkTokens([])
            setIsLoading(false)
          }
        })
    }, 300) // Debounce search

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [searchQuery, limit, enabled])

  // Combine and rank tokens
  const availableTokens = useMemo<AvailableToken[]>(() => {
    const tokens: AvailableToken[] = []

    // Add platform tokens first
    platformTokens.forEach((token) => {
      tokens.push({
        assetCode: token.assetCode,
        issuer: token.issuer,
        name: token.name,
        description: token.description,
        isPlatformToken: true,
        homeDomain: token.homeDomain,
      })
    })

    // Add network tokens, sorted by num_accounts (descending)
    const sortedNetworkTokens = [...networkTokens].sort(
      (a, b) => (b.num_accounts || 0) - (a.num_accounts || 0)
    )

    sortedNetworkTokens.forEach((asset) => {
      // Skip if already in platform tokens
      const isDuplicate = tokens.some(
        (t) => t.assetCode === asset.asset_code && t.issuer === asset.asset_issuer
      )
      if (!isDuplicate) {
        tokens.push({
          assetCode: asset.asset_code,
          issuer: asset.asset_issuer,
          numAccounts: asset.num_accounts,
          isPlatformToken: false,
        })
      }
    })

    return tokens
  }, [platformTokens, networkTokens])

  return {
    tokens: availableTokens,
    isLoading,
    error,
  }
}

