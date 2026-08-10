"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

interface TransactionContextValue {
  balanceRefreshVersion: number
  operationRefreshVersion: number
  refreshBalances: (publicKey?: string) => void
  refreshOperations: (publicKey?: string) => void
  refreshAll: (publicKey?: string) => void
}

const TransactionContext = createContext<TransactionContextValue | null>(null)

export function BalanceRefreshProvider({ children }: { children: ReactNode }) {
  const [balanceRefreshVersion, setBalanceRefreshVersion] = useState(0)
  const [operationRefreshVersion, setOperationRefreshVersion] = useState(0)

  const refreshBalances = useCallback((_publicKey?: string) => {
    setBalanceRefreshVersion((v) => v + 1)
  }, [])

  const refreshOperations = useCallback((_publicKey?: string) => {
    setOperationRefreshVersion((v) => v + 1)
  }, [])

  const refreshAll = useCallback((_publicKey?: string) => {
    setBalanceRefreshVersion((v) => v + 1)
    setOperationRefreshVersion((v) => v + 1)
  }, [])

  return (
    <TransactionContext.Provider
      value={{
        balanceRefreshVersion,
        operationRefreshVersion,
        refreshBalances,
        refreshOperations,
        refreshAll,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export function useBalanceRefresh() {
  const ctx = useContext(TransactionContext)
  return ctx
}
