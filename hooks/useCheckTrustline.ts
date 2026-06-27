import { useCallback, useEffect, useState } from "react"
import { getAccountBalances } from "@/lib/api/account"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

export const useCheckTrustline = (
  publicKey: string | undefined,
  assetCode: string,
  issuer?: string,
  enabled: boolean = true
) => {
  const [hasTrustline, setHasTrustline] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const check = useCallback(() => {
    if (!enabled || !publicKey || !assetCode) {
      setHasTrustline(null)
      setIsLoading(false)
      return
    }

    if (assetCode === "native" || assetCode.toLowerCase() === "pi") {
      setHasTrustline(true)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getAccountBalances(publicKey)
      .then((response) => {
        if (cancelled) return
        const hasToken = response.balances.some((balance) => {
          if (balance.assetType === "native") return false
          const codeMatch = balance.assetCode === assetCode
          const issuerMatch = issuer ? balance.assetIssuer === issuer : !balance.assetIssuer
          return codeMatch && issuerMatch
        })
        setHasTrustline(hasToken)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(toApiError(err))
          setHasTrustline(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [publicKey, assetCode, issuer, enabled])

  useEffect(() => {
    const cleanup = check()
    return cleanup
  }, [check])

  return { hasTrustline, isLoading, error, refresh: check }
}

