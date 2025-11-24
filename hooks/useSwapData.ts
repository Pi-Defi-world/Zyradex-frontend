import { useCallback, useEffect, useMemo, useState } from "react"
import {
  quoteSwap as quoteSwapRequest,
  getPoolsForPair as getPoolsForPairRequest,
  executeSwap as executeSwapRequest,
  swapToken as swapTokenRequest,
  distributeFees as distributeFeesRequest,
  type SwapQuoteParams,
  type SwapQuoteResponse,
  type PoolsForPairParams,
  type PoolsForPairResponse,
  type ExecuteSwapPayload,
  type ExecuteSwapResponse,
  type SwapTokenPayload,
  type SwapTokenResponse,
  type DistributeFeesPayload,
  type DistributeFeesResponse,
} from "@/lib/api/swap"
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

export const useSwapQuote = (params?: SwapQuoteParams) => {
  const [data, setData] = useState<SwapQuoteResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quoteTimestamp, setQuoteTimestamp] = useState<number | null>(null)

  const fetchQuote = useCallback(async () => {
    if (!params?.poolId) {
      setData(null)
      setError(null)
      setQuoteTimestamp(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await quoteSwapRequest(params)
      setData(response)
      setQuoteTimestamp(Date.now())
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setIsLoading(false)
    }
  }, [params?.poolId, params?.amount, params?.from, params?.to, params?.slippagePercent])

  useEffect(() => {
    if (!params?.poolId) {
      setData(null)
      setError(null)
      setQuoteTimestamp(null)
      return
    }

    // Initial fetch
    fetchQuote()

    // Set up auto-refresh every 20 seconds
    const interval = setInterval(() => {
      fetchQuote()
    }, 20000) // 20 seconds

    return () => {
      clearInterval(interval)
    }
  }, [fetchQuote, params?.poolId, params?.amount, params?.from, params?.to, params?.slippagePercent])

  // Calculate time until next refresh (20 seconds from last quote)
  const timeUntilRefresh = useMemo(() => {
    if (!quoteTimestamp) return null
    const elapsed = Date.now() - quoteTimestamp
    const remaining = Math.max(0, 20000 - elapsed)
    return Math.ceil(remaining / 1000) // Return seconds
  }, [quoteTimestamp])

  return {
    data,
    error,
    isLoading,
    quote: data,
    timeUntilRefresh,
    refreshQuote: fetchQuote,
  }
}

export const usePoolsForPair = (params?: PoolsForPairParams) => {
  const [data, setData] = useState<PoolsForPairResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!params?.tokenA || !params?.tokenB) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getPoolsForPairRequest(params)
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
  }, [params?.tokenA, params?.tokenB])

  const pools = useMemo(() => data?.pools ?? [], [data])

  return {
    data,
    error,
    isLoading,
    pools,
  }
}

export const useExecuteSwap = () => {
  const { mutate, data, error, isLoading } = useMutation<ExecuteSwapPayload, ExecuteSwapResponse>(executeSwapRequest)
  return { executeSwap: mutate, data, error, isLoading }
}

export const useDirectSwap = () => {
  const { mutate, data, error, isLoading } = useMutation<SwapTokenPayload, SwapTokenResponse>(swapTokenRequest)
  return { swapToken: mutate, data, error, isLoading }
}

export const useDistributeSwapFees = () => {
  const { mutate, data, error, isLoading } = useMutation<DistributeFeesPayload, DistributeFeesResponse>(distributeFeesRequest)
  return { distributeFees: mutate, data, error, isLoading }
}
