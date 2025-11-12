import { useCallback, useEffect, useMemo, useState } from "react"
import {
  importAccount as importAccountRequest,
  getAccountBalances,
  getAccountOperations,
  type ImportAccountPayload,
  type ImportAccountResponse,
  type AccountBalancesResponse,
  type AccountOperationsParams,
  type PaginatedOperations,
  type AccountOperation,
} from "@/lib/api/account"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export interface UseAccountOperationsOptions {
  limit?: number
  order?: "asc" | "desc"
  cursor?: string
  skip?: boolean
}

export const useImportAccount = () => {
  const [data, setData] = useState<ImportAccountResponse | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const importAccount = useCallback(async (payload: ImportAccountPayload) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await importAccountRequest(payload)
      setData(response)
      return response
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    importAccount,
  }
}

export const useAccountBalances = (publicKey?: string) => {
  const [data, setData] = useState<AccountBalancesResponse | null>(null)
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

    getAccountBalances(publicKey)
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

  const balances = data?.balances ?? []
  const totalBalance = useMemo(
    () => balances.reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
    [balances]
  )

  return {
    data,
    error,
    isLoading,
    balances,
    totalBalance,
  }
}

export const useAccountOperations = (publicKey?: string, options: UseAccountOperationsOptions = {}) => {
  const [data, setData] = useState<PaginatedOperations | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { limit = 20, order = "desc", cursor, skip } = options

  useEffect(() => {
    if (!publicKey || skip) {
      if (!publicKey) {
        setData(null)
        setError(null)
      }
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const params: AccountOperationsParams = {
      publicKey,
      limit,
      order,
      cursor,
    }

    getAccountOperations(params)
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
  }, [publicKey, limit, order, cursor, skip])

  const operations = (data?.data ?? []) as AccountOperation[]
  const pagination = data?.pagination

  return {
    data,
    error,
    isLoading,
    operations,
    pagination,
  }
}
