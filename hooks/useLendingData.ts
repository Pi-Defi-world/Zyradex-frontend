"use client"

import { useCallback, useEffect, useState } from "react"
import {
  listPools,
  getPool,
  getPositions,
  getCreditScore,
  getPrices,
  getFeeDestination,
  supply,
  withdraw as withdrawLending,
  borrow,
  repay,
  liquidate,
  setCreditScore,
  type LendingPool,
  type ListPoolsParams,
  type ListPoolsResponse,
  type GetPositionsResponse,
  type CreditScoreResponse,
  type SupplyPayload,
  type WithdrawPayload,
  type BorrowPayload,
} from "@/lib/api/lending"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export const useLendingPools = (params?: ListPoolsParams, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<ListPoolsResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const paramsKey = JSON.stringify(params ?? {})
  const refreshKey = options?.refreshKey ?? null

  const refetch = useCallback(() => {
    let cancelled = false
    setError(null)
    setIsLoading(true)
    listPools(params ?? {})
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [paramsKey])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setIsLoading(true)
    listPools(params ?? {})
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [paramsKey, refreshKey])

  const pools = data?.data ?? []
  return { data, pools, error, isLoading, refetch }
}

export const useLendingPool = (poolId: string | undefined) => {
  const [data, setData] = useState<LendingPool | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!poolId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getPool(poolId)
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [poolId])

  return { data: data ?? undefined, pool: data, error, isLoading }
}

export const useLendingPositions = (userId?: string, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<GetPositionsResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const refreshKey = options?.refreshKey ?? null

  const refetch = useCallback(() => {
    if (!userId) return
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getPositions(userId)
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getPositions(userId)
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  const supplyPositions = data?.supply ?? []
  const borrowPositions = data?.borrow ?? []
  return { data, supplyPositions, borrowPositions, error, isLoading, refetch }
}

export const useCreditScore = (userId?: string, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<CreditScoreResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const refreshKey = options?.refreshKey ?? null

  const refetch = useCallback(() => {
    if (!userId) return
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getCreditScore(userId)
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getCreditScore(userId)
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  return { data: data ?? undefined, score: data?.score ?? null, canBorrow: data?.canBorrow ?? false, error, isLoading, refetch }
}

export const useLendingPrices = (assets?: string[]) => {
  const [data, setData] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const assetsKey = assets?.join(",") ?? ""

  useEffect(() => {
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getPrices(assets?.length ? assets : undefined)
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assetsKey])

  return { data: data ?? undefined, prices: data ?? {}, error, isLoading }
}

export const useFeeDestination = () => {
  const [data, setData] = useState<{ platformFeePublicKey: string | null } | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getFeeDestination()
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data: data ?? undefined, platformFeePublicKey: data?.platformFeePublicKey ?? null, error, isLoading }
}

export const useLendingSupply = (poolId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof supply>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: SupplyPayload) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await supply(poolId, body)
        setData(result)
        return result
      } catch (err) {
        const apiError = toApiError(err)
        setError(apiError)
        throw apiError
      } finally {
        setIsLoading(false)
      }
    },
    [poolId]
  )
  return { supply: mutate, data, error, isLoading }
}

export const useLendingWithdraw = (poolId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof withdrawLending>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: WithdrawPayload) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await withdrawLending(poolId, body)
        setData(result)
        return result
      } catch (err) {
        const apiError = toApiError(err)
        setError(apiError)
        throw apiError
      } finally {
        setIsLoading(false)
      }
    },
    [poolId]
  )
  return { withdraw: mutate, data, error, isLoading }
}

export const useLendingBorrow = (poolId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof borrow>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: BorrowPayload) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await borrow(poolId, body)
        setData(result)
        return result
      } catch (err) {
        const apiError = toApiError(err)
        setError(apiError)
        throw apiError
      } finally {
        setIsLoading(false)
      }
    },
    [poolId]
  )
  return { borrow: mutate, data, error, isLoading }
}

export const useLendingRepay = (borrowPositionId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof repay>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: { amount: string }) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await repay(borrowPositionId, body)
        setData(result)
        return result
      } catch (err) {
        const apiError = toApiError(err)
        setError(apiError)
        throw apiError
      } finally {
        setIsLoading(false)
      }
    },
    [borrowPositionId]
  )
  return { repay: mutate, data, error, isLoading }
}

export const useLendingLiquidate = (borrowPositionId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof liquidate>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: { repayAmount: string; userId?: string }) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await liquidate(borrowPositionId, body)
        setData(result)
        return result
      } catch (err) {
        const apiError = toApiError(err)
        setError(apiError)
        throw apiError
      } finally {
        setIsLoading(false)
      }
    },
    [borrowPositionId]
  )
  return { liquidate: mutate, data, error, isLoading }
}

export const useSetCreditScore = () => {
  const [data, setData] = useState<{ userId: string; score: number } | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async (body: { userId: string; score: number }) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await setCreditScore(body)
      setData(result)
      return result
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [])
  return { setCreditScore: mutate, data, error, isLoading }
}
