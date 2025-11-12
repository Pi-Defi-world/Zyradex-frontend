import { useCallback, useEffect, useMemo, useState } from "react"
import {
  fetchFees as fetchFeesRequest,
  createFee as createFeeRequest,
  updateFee as updateFeeRequest,
  type FetchFeesResponse,
  type CreateFeePayload,
  type CreateFeeResponse,
  type UpdateFeePayload,
  type UpdateFeeResponse,
} from "@/lib/api/fees"
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

export const usePlatformFees = () => {
  const [data, setData] = useState<FetchFeesResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchFeesRequest()
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

  const fees = useMemo(() => data?.fees ?? [], [data])

  return {
    data,
    error,
    isLoading,
    fees,
  }
}

export const useCreatePlatformFee = () => {
  const { mutate, data, error, isLoading } = useMutation<CreateFeePayload, CreateFeeResponse>(createFeeRequest)
  return {
    createFee: mutate,
    data,
    error,
    isLoading,
  }
}

export const useUpdatePlatformFee = () => {
  const { mutate, data, error, isLoading } = useMutation<{ key: string; updates: UpdateFeePayload }, UpdateFeeResponse>(
    ({ key, updates }) => updateFeeRequest(key, updates)
  )

  const updateFee = useCallback(
    (key: string, updates: UpdateFeePayload) => mutate({ key, updates }),
    [mutate]
  )

  return {
    updateFee,
    data,
    error,
    isLoading,
  }
}
