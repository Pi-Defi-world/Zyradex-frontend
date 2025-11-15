import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getOrderBook as getOrderBookRequest,
  getOffersByAccount as getOffersByAccountRequest,
  searchAssets as searchAssetsRequest,
  type OrderBookResponse,
  type UserOffersResponse,
  type AssetSearchResponse,
} from "@/lib/api/orderbook"
import {
  createSellOffer,
  createBuyOffer,
  cancelOffer,
  type CreateSellOfferPayload,
  type CreateBuyOfferPayload,
  type CancelOfferPayload,
  type TradeResponse,
} from "@/lib/api/trade"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

interface MutationState<T> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
}

const useMutation = <Payload, Result>(perform: (payload: Payload) => Promise<Result>) => {
  const [state, setState] = useState<MutationState<Result>>({ data: null, error: null, isLoading: false })

  const mutate = useCallback(async (payload: Payload) => {
    setState({ data: null, error: null, isLoading: true })
    try {
      const data = await perform(payload)
      setState({ data, error: null, isLoading: false })
      return data
    } catch (err) {
      const apiError = toApiError(err)
      setState({ data: null, error: apiError, isLoading: false })
      throw apiError
    }
  }, [perform])

  return { mutate, ...state }
}

export const useOrderBook = (base?: string, counter?: string) => {
  const [data, setData] = useState<OrderBookResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!base || !counter) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getOrderBookRequest(base, counter)
      .then((response) => {
        if (!cancelled) {
          setData(response)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(toApiError(err))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [base, counter, refreshTrigger])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!base || !counter) return

    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1)
    }, 10000)

    return () => clearInterval(interval)
  }, [base, counter])

  const book = useMemo(() => data?.book ?? { bids: [], asks: [] }, [data])

  return {
    data,
    error,
    isLoading,
    book,
  }
}

export const useUserOffers = (account?: string) => {
  const [data, setData] = useState<UserOffersResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!account) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getOffersByAccountRequest(account)
      .then((response) => {
        if (!cancelled) {
          setData(response)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(toApiError(err))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [account])

  const offers = useMemo(() => data?.offers ?? [], [data])

  return {
    data,
    error,
    isLoading,
    offers,
  }
}

export const useSearchAssets = (code?: string, limit: number = 10) => {
  const [data, setData] = useState<AssetSearchResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!code || code.trim() === "") {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchAssetsRequest(code, limit)
        .then((response) => {
          if (!cancelled) {
            setData(response)
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(toApiError(err))
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false)
          }
        })
    }, 300) // 300ms debounce

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [code, limit])

  const assets = useMemo(() => data?.assets ?? [], [data])

  return {
    data,
    error,
    isLoading,
    assets,
  }
}

export const useCreateSellOffer = () => {
  const { mutate, data, error, isLoading } = useMutation<CreateSellOfferPayload, TradeResponse>(createSellOffer)
  return { createSellOffer: mutate, data, error, isLoading }
}

export const useCreateBuyOffer = () => {
  const { mutate, data, error, isLoading } = useMutation<CreateBuyOfferPayload, TradeResponse>(createBuyOffer)
  return { createBuyOffer: mutate, data, error, isLoading }
}

export const useCancelOffer = () => {
  const { mutate, data, error, isLoading } = useMutation<CancelOfferPayload, TradeResponse>(cancelOffer)
  return { cancelOffer: mutate, data, error, isLoading }
}

