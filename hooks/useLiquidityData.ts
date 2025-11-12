import { useCallback, useEffect, useMemo, useState } from "react"
import {
  listLiquidityPools,
  getLiquidityPoolById,
  createLiquidityPool as createLiquidityPoolRequest,
  addLiquidity as addLiquidityRequest,
  withdrawLiquidity as withdrawLiquidityRequest,
  getUserLiquidityPools as getUserLiquidityPoolsRequest,
  getLiquidityReward as getLiquidityRewardRequest,
  type ListLiquidityPoolsParams,
  type ListLiquidityPoolsResponse,
  type LiquidityRewardParams,
  type LiquidityRewardResponse,
  type CreateLiquidityPoolPayload,
  type LiquidityTransactionResponse,
  type AddLiquidityPayload,
  type WithdrawLiquidityPayload,
  type UserLiquidityPoolSummary,
} from "@/lib/api/liquidity"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"
import type { ILiquidityPool } from "@/lib/types"

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

export const useLiquidityPools = (params?: ListLiquidityPoolsParams, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<ListLiquidityPoolsResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const paramsKey = JSON.stringify(params ?? {})
  const refreshKey = options?.refreshKey ?? null

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listLiquidityPools(params ?? {})
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
  }, [paramsKey, refreshKey])

  const pools = useMemo<ILiquidityPool[]>(() => data?.data ?? [], [data])
  const pagination = data?.pagination

  return {
    data,
    error,
    isLoading,
    pools,
    pagination,
  }
}

export const useLiquidityPool = (poolId?: string) => {
  const [data, setData] = useState<ILiquidityPool | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!poolId) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getLiquidityPoolById(poolId)
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
  }, [poolId])

  return {
    data,
    error,
    isLoading,
    pool: data,
  }
}

export const useCreateLiquidityPool = () => {
  const { mutate, data, error, isLoading } = useMutation<CreateLiquidityPoolPayload, LiquidityTransactionResponse>(createLiquidityPoolRequest)
  return { createLiquidityPool: mutate, data, error, isLoading }
}

export const useAddLiquidity = () => {
  const { mutate, data, error, isLoading } = useMutation<AddLiquidityPayload, LiquidityTransactionResponse>(addLiquidityRequest)
  return { addLiquidity: mutate, data, error, isLoading }
}

export const useWithdrawLiquidity = () => {
  const { mutate, data, error, isLoading } = useMutation<WithdrawLiquidityPayload, LiquidityTransactionResponse>(withdrawLiquidityRequest)
  return { withdrawLiquidity: mutate, data, error, isLoading }
}

export const useUserLiquidityPools = (publicKey?: string) => {
  const [data, setData] = useState<UserLiquidityPoolSummary[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!publicKey) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getUserLiquidityPoolsRequest(publicKey)
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
  }, [publicKey])

  return {
    data,
    error,
    isLoading,
    pools: data ?? [],
  }
}

export const useLiquidityRewards = (params?: LiquidityRewardParams) => {
  const [data, setData] = useState<LiquidityRewardResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!params?.poolId || !params?.userPublicKey) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getLiquidityRewardRequest(params)
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
  }, [params?.poolId, params?.userPublicKey])

  return {
    data,
    error,
    isLoading,
    reward: data,
  }
}
