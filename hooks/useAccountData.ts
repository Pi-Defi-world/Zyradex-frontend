import { useCallback, useEffect, useMemo, useState } from "react"
import {
  importAccount as importAccountRequest,
  getAccountBalances,
  getAccountOperations,
  getAccountTransactions,
  type ImportAccountPayload,
  type ImportAccountResponse,
  type AccountBalancesResponse,
  type AccountOperationsParams,
  type PaginatedOperations,
  type AccountOperation,
  type AccountTransactionsParams,
  type PaginatedTransactions,
  type AccountTransaction,
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    if (!publicKey) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

 
    const shouldRefresh = refreshTrigger > 0
    getAccountBalances(publicKey, shouldRefresh)
      .then((response) => {
        if (!cancelled) {
          setData(response)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const apiError = toApiError(err)
          const errorMessage = apiError.message?.toLowerCase() || ""
          const statusCode = (apiError as any)?.status || (err as any)?.response?.status
          
          if (statusCode === 404 || statusCode === 500 || errorMessage.includes("not found")) {
            setData({ publicKey, balances: [] })
            setError(null)
          } else {
            setError(apiError)
          }
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
  }, [publicKey, refreshTrigger])

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
    refresh,
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

export interface UseAccountTransactionsOptions {
  limit?: number
  order?: "asc" | "desc"
  cursor?: string
  skip?: boolean
  refresh?: boolean
}

export const useAccountTransactions = (publicKey?: string, options: UseAccountTransactionsOptions = {}) => {
  const [data, setData] = useState<PaginatedTransactions | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { limit = 20, order = "desc", cursor, skip, refresh } = options

  const refreshTransactions = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

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

    const params: AccountTransactionsParams = {
      publicKey,
      limit,
      order,
      cursor,
      refresh: refresh || refreshTrigger > 0,
    }

    getAccountTransactions(params)
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
  }, [publicKey, limit, order, cursor, skip, refresh, refreshTrigger])

  const transactions = (data?.data ?? []) as AccountTransaction[]
  const pagination = data?.pagination

  return {
    data,
    error,
    isLoading,
    transactions,
    pagination,
    refresh: refreshTransactions,
  }
}
