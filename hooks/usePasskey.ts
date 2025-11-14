'use client'

import { useCallback, useState } from 'react'
import {
  startPasskeyRegistration,
  verifyPasskeyRegistration,
  startPasskeyAuthentication,
  verifyPasskeyAuthentication,
  listPasskeys,
  deletePasskey,
  type PasskeyRecord,
} from '@/lib/api/passkey'
import {
  createPasskey,
  getPasskey,
  convertAttestationResponse,
  convertAssertionResponse,
  isWebAuthnSupported,
} from '@/lib/passkey/webauthn'
import type { ApiError } from '@/lib/api'
import { toApiError } from '@/lib/api'

interface UsePasskeyRegistrationReturn {
  register: () => Promise<{ credentialId: string }>
  isLoading: boolean
  error: ApiError | null
}

interface UsePasskeyAuthenticationReturn {
  authenticate: () => Promise<{ sessionToken: string; credentialId: string }>
  isLoading: boolean
  error: ApiError | null
}

interface UsePasskeyManagementReturn {
  passkeys: PasskeyRecord[]
  isLoading: boolean
  error: ApiError | null
  refresh: () => Promise<void>
  deletePasskeyById: (credentialId: string) => Promise<void>
}

export const usePasskeyRegistration = (): UsePasskeyRegistrationReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const register = useCallback(async () => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser')
    }

    setIsLoading(true)
    setError(null)

    try {
      const { options, sessionId } = await startPasskeyRegistration()
      const response = await createPasskey(options)
      const credential = convertAttestationResponse(response)
      const result = await verifyPasskeyRegistration({
        credential,
        sessionId,
      })

      if (!result.verified) {
        throw new Error('Passkey registration verification failed')
      }

      return { credentialId: result.credentialId }
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    register,
    isLoading,
    error,
  }
}

export const usePasskeyAuthentication = (): UsePasskeyAuthenticationReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const authenticate = useCallback(async () => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser')
    }

    setIsLoading(true)
    setError(null)

    try {
      const { options, sessionId } = await startPasskeyAuthentication()
      const { credential: credentialObj, response } = await getPasskey(options)
      
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credentialObj.rawId)))
      const credential = convertAssertionResponse(response, credentialId)
      
      const result = await verifyPasskeyAuthentication({
        credential,
        sessionId,
      })

      if (!result.verified) {
        throw new Error('Passkey authentication verification failed')
      }

      return {
        sessionToken: result.sessionToken,
        credentialId: result.credentialId,
      }
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    authenticate,
    isLoading,
    error,
  }
}

export const usePasskeyManagement = (): UsePasskeyManagementReturn => {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await listPasskeys()
      setPasskeys(result.passkeys)
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deletePasskeyById = useCallback(async (credentialId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await deletePasskey(credentialId)
      await refresh()
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  return {
    passkeys,
    isLoading,
    error,
    refresh,
    deletePasskeyById,
  }
}

