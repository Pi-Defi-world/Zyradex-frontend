"use client"

import { useCallback, useEffect, useState } from "react"
import {
  listLaunches,
  getLaunch,
  getMyPiPower,
  commitPi,
  transitionLaunchStatus,
  closeParticipationWindow,
  runAllocation,
  createEscrow,
  executeTge,
  type Launch,
  type ListLaunchesParams,
  type PiPowerResponse,
  type CommitPiPayload,
  type ListLaunchesResponse,
} from "@/lib/api/launchpad"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export const useLaunches = (params?: ListLaunchesParams, options?: { refreshKey?: unknown }) => {
  const [data, setData] = useState<ListLaunchesResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const paramsKey = JSON.stringify(params ?? {})
  const refreshKey = options?.refreshKey ?? null

  const refetch = useCallback(() => {
    let cancelled = false
    setError(null)
    setIsLoading(true)
    listLaunches(params ?? {})
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
    listLaunches(params ?? {})
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

  const launches = data?.data ?? []
  return { data, launches, error, isLoading, refetch }
}

export const useLaunch = (launchId: string | undefined) => {
  const [data, setData] = useState<Launch | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!launchId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getLaunch(launchId)
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
  }, [launchId])

  return { data: data ?? undefined, launch: data, error, isLoading }
}

export const useMyPiPower = (launchId: string | undefined, userId?: string) => {
  const [data, setData] = useState<PiPowerResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!launchId) {
      setData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    setIsLoading(true)
    getMyPiPower(launchId, userId)
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
  }, [launchId, userId])

  return { data: data ?? undefined, piPower: data, error, isLoading }
}

export const useLaunchCommit = (launchId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof commitPi>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: CommitPiPayload) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await commitPi(launchId, body)
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
  return { commitPi: mutate, data, error, isLoading }
}

export const useLaunchTransitionStatus = (launchId: string) => {
  const [data, setData] = useState<Launch | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: { status: string }) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await transitionLaunchStatus(launchId, body)
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
  return { transitionStatus: mutate, data, error, isLoading }
}

export const useLaunchCloseWindow = (launchId: string) => {
  const [data, setData] = useState<Launch | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await closeParticipationWindow(launchId)
      setData(result)
      return result
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [launchId])
  return { closeWindow: mutate, data, error, isLoading }
}

export const useLaunchRunAllocation = (launchId: string) => {
  const [data, setData] = useState<Launch | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await runAllocation(launchId)
      setData(result)
      return result
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [launchId])
  return { runAllocation: mutate, data, error, isLoading }
}

export const useLaunchCreateEscrow = (launchId: string) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof createEscrow>> | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await createEscrow(launchId)
      setData(result)
      return result
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [launchId])
  return { createEscrow: mutate, data, error, isLoading }
}

export const useLaunchExecuteTge = (launchId: string) => {
  const [data, setData] = useState<Launch | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(
    async (body: { escrowSecret: string }) => {
      setError(null)
      setIsLoading(true)
      try {
        const result = await executeTge(launchId, body)
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
  return { executeTge: mutate, data, error, isLoading }
}
