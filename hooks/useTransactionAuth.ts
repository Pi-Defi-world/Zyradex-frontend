'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePasskeyAuthentication } from './usePasskey'
import { getSecretForTransaction } from '@/lib/passkey/transaction'
import { hasStoredSecret, getPasswordAttempts, storePasswordAttempts, resetPasswordAttempts, isAccountLocked } from '@/lib/passkey/storage'
import { isWebAuthnSupported } from '@/lib/passkey/webauthn'
import type { ApiError } from '@/lib/api'
import { toApiError } from '@/lib/api'

interface UseTransactionAuthReturn {
  getSecret: (publicKey: string, password?: string) => Promise<string>
  isLoading: boolean
  error: ApiError | null
  hasStoredSecret: boolean
  requiresPassword: boolean // True if WebAuthn not supported and stored secret exists
}

export const useTransactionAuth = (
  publicKey?: string,
  onPasswordPrompt?: () => Promise<string>
): UseTransactionAuthReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [hasStoredSecretValue, setHasStoredSecretValue] = useState(false)
  const [requiresPasswordValue, setRequiresPasswordValue] = useState(false)
  const { authenticate } = usePasskeyAuthentication()

  const checkStoredSecret = useCallback(async (pk: string) => {
    if (!pk) return false
    try {
      const hasSecret = await hasStoredSecret(pk)
      setHasStoredSecretValue(hasSecret)
      
      // Password is PRIMARY (99% use Pi Browser)
      // Always require password if secret exists
      setRequiresPasswordValue(hasSecret)
      
      return hasSecret
    } catch {
      setHasStoredSecretValue(false)
      setRequiresPasswordValue(false)
      return false
    }
  }, [])

  const getSecret = useCallback(async (pk: string, password?: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if stored secret is available
      const hasSecretAvailable = await checkStoredSecret(pk)
      
      if (!hasSecretAvailable) {
        throw new Error('No stored secret found. Please import your account and set up authentication, or enter your secret key manually.')
      }

      // Check if account is locked
      const locked = await isAccountLocked(pk)
      if (locked) {
        throw new Error('Account is locked due to too many failed password attempts. Please use the recovery option to reset your account.')
      }

      // Password is PRIMARY (99% use Pi Browser)
      // Always use password authentication first
      if (!password) {
        if (onPasswordPrompt) {
          // Prompt for password using callback
          password = await onPasswordPrompt()
        } else {
          throw new Error('Password is required. Please provide your PIN/password.')
        }
      }

      try {
        const secret = await getSecretForTransaction(pk, { type: 'password', password })
        // Reset password attempts on successful auth
        await resetPasswordAttempts(pk)
        return secret
      } catch (err: any) {
        // Increment failed attempts
        const currentAttempts = await getPasswordAttempts(pk)
        const newAttempts = currentAttempts + 1
        await storePasswordAttempts(pk, newAttempts)

        if (newAttempts >= 5) {
          throw new Error('Account locked due to too many failed password attempts. Please use the recovery option.')
        }

        const remaining = 5 - newAttempts
        throw new Error(`Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`)
      }
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [authenticate, checkStoredSecret, onPasswordPrompt])

  // Check stored secret availability when publicKey changes (only once per publicKey)
  const lastCheckedKey = useRef<string | null>(null)
  useEffect(() => {
    if (publicKey && publicKey !== lastCheckedKey.current) {
      lastCheckedKey.current = publicKey
      checkStoredSecret(publicKey).catch(() => undefined)
    } else if (!publicKey) {
      lastCheckedKey.current = null
      setHasStoredSecretValue(false)
      setRequiresPasswordValue(false)
    }
  }, [publicKey, checkStoredSecret])

  return {
    getSecret,
    isLoading,
    error,
    hasStoredSecret: hasStoredSecretValue,
    requiresPassword: requiresPasswordValue,
  }
}

