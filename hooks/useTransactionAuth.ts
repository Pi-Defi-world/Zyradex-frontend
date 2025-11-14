'use client'

import { useState, useCallback } from 'react'
import { usePasskeyAuthentication } from './usePasskey'
import { getSecretForTransaction } from '@/lib/passkey/transaction'
import { hasStoredSecret } from '@/lib/passkey/storage'
import type { ApiError } from '@/lib/api'
import { toApiError } from '@/lib/api'

interface UseTransactionAuthReturn {
  getSecret: (publicKey: string) => Promise<string>
  isLoading: boolean
  error: ApiError | null
  hasPasskey: boolean
}

export const useTransactionAuth = (publicKey?: string): UseTransactionAuthReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [hasPasskey, setHasPasskey] = useState(false)
  const { authenticate } = usePasskeyAuthentication()

  const checkPasskey = useCallback(async (pk: string) => {
    if (!pk) return false
    try {
      const hasSecret = await hasStoredSecret(pk)
      setHasPasskey(hasSecret)
      return hasSecret
    } catch {
      setHasPasskey(false)
      return false
    }
  }, [])

  const getSecret = useCallback(async (pk: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if passkey is available
      const hasPasskeyAvailable = await checkPasskey(pk)
      
      if (hasPasskeyAvailable) {
        // Authenticate with passkey
        const { sessionToken } = await authenticate()
        
        // Get secret from IndexedDB
        const secret = await getSecretForTransaction(pk, sessionToken)
        return secret
      } else {
        throw new Error('No passkey found. Please import your account and set up a passkey, or enter your secret key manually.')
      }
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [authenticate, checkPasskey])

  // Check passkey availability when publicKey changes
  if (publicKey) {
    checkPasskey(publicKey).catch(() => undefined)
  }

  return {
    getSecret,
    isLoading,
    error,
    hasPasskey,
  }
}

