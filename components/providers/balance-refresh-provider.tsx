"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

interface BalanceRefreshContextValue {
  /** Increment to trigger all useAccountBalances subscribers to refetch. */
  balanceRefreshVersion: number
  /** Call after any transaction that affects balance (send, swap, liquidity, mint, etc.). Optionally pass publicKey(s) to target; without args, all balance consumers refetch. */
  refreshBalances: (publicKey?: string) => void
}

const BalanceRefreshContext = createContext<BalanceRefreshContextValue | null>(null)

export function BalanceRefreshProvider({ children }: { children: ReactNode }) {
  const [balanceRefreshVersion, setBalanceRefreshVersion] = useState(0)

  const refreshBalances = useCallback((_publicKey?: string) => {
    setBalanceRefreshVersion((v) => v + 1)
  }, [])

  return (
    <BalanceRefreshContext.Provider
      value={{ balanceRefreshVersion, refreshBalances }}
    >
      {children}
    </BalanceRefreshContext.Provider>
  )
}

export function useBalanceRefresh() {
  const ctx = useContext(BalanceRefreshContext)
  return ctx
}
