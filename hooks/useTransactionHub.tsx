"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { getAccountOperations } from "@/lib/api/account"
import type { AccountOperation, PaginatedOperations } from "@/lib/api/account"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

const POLL_INTERVAL = 8000

const getStoredPublicKey = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

interface TransactionHubState {
  transactions: AccountOperation[]
  newTransactions: AccountOperation[]
  isLoading: boolean
  error: ApiError | null
  refresh: () => void
}

const TransactionHubContext = createContext<TransactionHubState | null>(null)

export function TransactionHubProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<AccountOperation[]>([])
  const [newTransactions, setNewTransactions] = useState<AccountOperation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const latestCursorRef = useRef<string | null>(null)
  const allTransactionIds = useRef<Set<string>>(new Set())
  const isFirstFetch = useRef(true)

  const publicKey = getStoredPublicKey()

  const fetchOps = useCallback(
    async (cursor?: string | null) => {
      if (!publicKey) return

      const params: {
        publicKey: string
        limit: number
        order: "asc" | "desc"
        cursor?: string
      } = {
        publicKey,
        limit: 20,
        order: "desc",
      }
      if (cursor) {
        params.cursor = cursor
      }

      try {
        const response = await getAccountOperations(params)
        return response
      } catch (err) {
        throw toApiError(err)
      }
    },
    [publicKey]
  )

  const refresh = useCallback(() => {
    setRefreshTrigger((v) => v + 1)
  }, [])

  useEffect(() => {
    if (!publicKey) {
      setTransactions([])
      setNewTransactions([])
      setIsLoading(false)
      setError(null)
      latestCursorRef.current = null
      allTransactionIds.current.clear()
      isFirstFetch.current = true
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const doFetch = async (isInitial: boolean) => {
      if (cancelled) return

      if (isInitial) {
        setIsLoading(true)
        setError(null)
      }

      try {
        const cursor = isInitial ? null : latestCursorRef.current
        const result = await fetchOps(cursor)
        if (cancelled || !result) return

        const ops = (result.data ?? []) as AccountOperation[]

        if (isInitial) {
          setTransactions(ops)
          setNewTransactions([])
          allTransactionIds.current.clear()
          ops.forEach((op) => allTransactionIds.current.add(op.id))
          if (ops.length > 0) {
            latestCursorRef.current = ops[ops.length - 1].pagingToken || ops[ops.length - 1].id
          }
        } else {
          if (ops.length > 0) {
            const fresh: AccountOperation[] = []
            for (const op of ops) {
              if (!allTransactionIds.current.has(op.id)) {
                fresh.push(op)
                allTransactionIds.current.add(op.id)
              }
            }

            if (fresh.length > 0) {
              setNewTransactions((prev) => [...fresh, ...prev].slice(0, 50))
              setTransactions((prev) => {
                const merged = [...fresh, ...prev]
                const seen = new Set<string>()
                return merged.filter((t) => {
                  if (seen.has(t.id)) return false
                  seen.add(t.id)
                  return true
                })
              })
            }

            latestCursorRef.current = ops[ops.length - 1].pagingToken || ops[ops.length - 1].id
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(toApiError(err))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    doFetch(true)
    isFirstFetch.current = false

    timer = setInterval(() => {
      doFetch(false)
    }, POLL_INTERVAL)

    return () => {
      cancelled = true
      if (timer !== null) clearInterval(timer)
    }
  }, [publicKey, refreshTrigger, fetchOps])

  return (
    <TransactionHubContext.Provider
      value={{ transactions, newTransactions, isLoading, error, refresh }}
    >
      {children}
    </TransactionHubContext.Provider>
  )
}

export function useTransactionHub() {
  const ctx = useContext(TransactionHubContext)
  if (!ctx) {
    throw new Error("useTransactionHub must be used within a TransactionHubProvider")
  }
  return ctx
}
