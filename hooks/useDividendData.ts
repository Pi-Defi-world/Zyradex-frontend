"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getRound,
  getHolders,
  createDividendRound,
  runSnapshot,
  recordClaim,
  type DividendRound,
  type DividendHolderSnapshot,
  type CreateDividendRoundPayload,
  type GetHoldersParams,
  type GetHoldersResponse,
} from "@/lib/api/dividends"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export const useDividendRound = (roundId: string | undefined) => {
  const [data, setData] = useState<DividendRound | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!roundId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getRound(roundId)
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
  }, [roundId])

  return { data: data ?? undefined, round: data, error, isLoading }
}

export const useDividendHolders = (
  roundId: string | undefined,
  params?: GetHoldersParams,
  options?: { refreshKey?: unknown }
) => {
  const [data, setData] = useState<GetHoldersResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const paramsKey = JSON.stringify({ roundId, ...params })
  const refreshKey = options?.refreshKey ?? null

  useEffect(() => {
    if (!roundId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getHolders(roundId, params ?? {})
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
  }, [roundId, paramsKey, refreshKey])

  const holders = data?.data ?? []
  const nextCursor = data?.nextCursor
  return { data, holders, nextCursor, error, isLoading }
}

export const useCreateDividendRound = (launchId: string) => {
  const [data, setData] = useState<DividendRound | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: CreateDividendRoundPayload) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await createDividendRound(launchId, body)
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
    [launchId]
  )
  return { createRound: mutate, data, error, isLoading }
}

export const useRunDividendSnapshot = (roundId: string) => {
  const [data, setData] = useState<{ totalEligibleSupply: string; eligibleHoldersCount: number } | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await runSnapshot(roundId)
      setData(result)
      return result
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [roundId])
  return { runSnapshot: mutate, data, error, isLoading }
}

export const useRecordDividendClaim = (roundId: string) => {
  const [data, setData] = useState<DividendHolderSnapshot | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: { publicKey: string; txHash: string }) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await recordClaim(roundId, body)
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
    [roundId]
  )
  return { recordClaim: mutate, data, error, isLoading }
}
