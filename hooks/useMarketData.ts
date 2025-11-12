import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getOrderBook as getOrderBookRequest,
  getOffersByAccount as getOffersByAccountRequest,
} from "@/lib/api/market"
import {
  createSellOffer as createSellOfferRequest,
  createBuyOffer as createBuyOfferRequest,
  cancelOffer as cancelOfferRequest,
  type CreateSellOfferPayload,
  type CreateBuyOfferPayload,
  type CancelOfferPayload,
  type TradeResponse,
} from "@/lib/api/trade"
import {
  listPairs as listPairsRequest,
  registerPair as registerPairRequest,
  verifyPair as verifyPairRequest,
  deletePair as deletePairRequest,
  type RegisterPairPayload,
  type VerifyPairPayload,
  type ListPairsResponse,
  type RegisterPairResponse,
  type VerifyPairResponse,
  type DeletePairResponse,
} from "@/lib/api/pairs"
import type { OrderBookParams, OrderBookResponse, OffersResponse } from "@/lib/api/market"
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

export const useOrderBook = (params?: OrderBookParams) => {
  const [data, setData] = useState<OrderBookResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!params?.base || !params?.counter) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getOrderBookRequest(params)
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
  }, [params?.base, params?.counter])

  return {
    data,
    error,
    isLoading,
    book: data?.book,
  }
}

export const useOffersByAccount = (account?: string) => {
  const [data, setData] = useState<OffersResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!account) {
      setData(null)
      setError(null)
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

  return {
    data,
    error,
    isLoading,
    offers: data?.offers ?? [],
  }
}

export const useSellOffer = () => {
  const { mutate, data, error, isLoading } = useMutation<CreateSellOfferPayload, TradeResponse>(createSellOfferRequest)
  return { createSellOffer: mutate, data, error, isLoading }
}

export const useBuyOffer = () => {
  const { mutate, data, error, isLoading } = useMutation<CreateBuyOfferPayload, TradeResponse>(createBuyOfferRequest)
  return { createBuyOffer: mutate, data, error, isLoading }
}

export const useCancelOffer = () => {
  const { mutate, data, error, isLoading } = useMutation<CancelOfferPayload, TradeResponse>(cancelOfferRequest)
  return { cancelOffer: mutate, data, error, isLoading }
}

export const usePairs = () => {
  const [data, setData] = useState<ListPairsResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listPairsRequest()
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

  const pairs = useMemo(() => data?.pairs ?? [], [data])

  return {
    data,
    error,
    isLoading,
    pairs,
  }
}

export const useRegisterPair = () => {
  const { mutate, data, error, isLoading } = useMutation<RegisterPairPayload, RegisterPairResponse>(registerPairRequest)
  return { registerPair: mutate, data, error, isLoading }
}

export const useVerifyPair = () => {
  const { mutate, data, error, isLoading } = useMutation<VerifyPairPayload, VerifyPairResponse>(verifyPairRequest)
  return { verifyPair: mutate, data, error, isLoading }
}

export const useDeletePair = () => {
  const { mutate, data, error, isLoading } = useMutation<string, DeletePairResponse>(deletePairRequest)
  return { deletePair: mutate, data, error, isLoading }
}
