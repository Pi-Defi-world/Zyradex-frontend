"use client"

import { useCallback, useEffect, useState } from "react"
import {
  listProducts,
  listPositions,
  deposit,
  withdraw,
  type SavingsProduct,
  type SavingsPosition,
  type ListProductsParams,
  type ListProductsResponse,
  type ListPositionsParams,
  type ListPositionsResponse,
  type DepositPayload,
  type DepositResponse,
} from "@/lib/api/savings"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export const useSavingsProducts = (params?: ListProductsParams, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<ListProductsResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const paramsKey = JSON.stringify(params ?? {})
  const refreshKey = options?.refreshKey ?? null

  const refetch = useCallback(() => {
    let cancelled = false
    setError(null)
    setIsLoading(true)
    listProducts(params ?? {})
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
    listProducts(params ?? {})
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

  const products = data?.data ?? []
  return { data, products, error, isLoading, refetch }
}

export const useSavingsPositions = (userId?: string, params?: Omit<ListPositionsParams, "userId">, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<ListPositionsResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const paramsKey = JSON.stringify({ userId, ...params })
  const refreshKey = options?.refreshKey ?? null

  const refetch = useCallback(() => {
    if (!userId) return
    let cancelled = false
    setError(null)
    setIsLoading(true)
    listPositions({ userId, ...params })
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
  }, [userId, paramsKey])

  useEffect(() => {
    if (!userId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    listPositions({ userId, ...params })
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
  }, [userId, paramsKey, refreshKey])

  const positions = data?.data ?? []
  return { data, positions, error, isLoading, refetch }
}

export const useSavingsDeposit = () => {
  const [data, setData] = useState<DepositResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async (body: DepositPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await deposit(body)
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
  return { deposit: mutate, data, error, isLoading }
}

export const useSavingsWithdraw = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof withdraw>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async (positionId: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await withdraw(positionId)
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
  return { withdraw: mutate, data, error, isLoading }
}
