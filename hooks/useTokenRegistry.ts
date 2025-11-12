import { useCallback, useEffect, useMemo, useState } from "react"
import {
  fetchTokens as fetchTokensRequest,
  establishTrustline,
  mintToken as mintTokenRequest,
  burnToken as burnTokenRequest,
  type FetchTokensResponse,
  type EstablishTrustlinePayload,
  type MintTokenPayload,
  type BurnTokenPayload,
  type TokenRecord,
  type TrustlineResponse,
  type BurnTokenResponse,
} from "@/lib/api/tokens"
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

export const useTokenRegistry = () => {
  const [data, setData] = useState<FetchTokensResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchTokensRequest()
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
  }, [])

  const tokens = useMemo<TokenRecord[]>(() => data?.tokens ?? [], [data])

  return {
    data,
    error,
    isLoading,
    tokens,
  }
}

export const useTrustline = () => {
  const { mutate, data, error, isLoading } = useMutation<EstablishTrustlinePayload, TrustlineResponse>(establishTrustline)
  return { establishTrustline: mutate, data, error, isLoading }
}

export const useMintToken = () => {
  const { mutate, data, error, isLoading } = useMutation<MintTokenPayload, TokenRecord>(mintTokenRequest)
  return { mintToken: mutate, data, error, isLoading }
}

export const useBurnToken = () => {
  const { mutate, data, error, isLoading } = useMutation<BurnTokenPayload, BurnTokenResponse>(burnTokenRequest)
  return { burnToken: mutate, data, error, isLoading }
}
