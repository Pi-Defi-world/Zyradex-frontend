import { axiosClient, toApiError } from '../api'

export interface StoreEncryptedSecretPayload {
  publicKey: string
  encryptedSecret: string
  iv: string
  salt: string
}

export interface StoreEncryptedSecretResponse {
  success: boolean
  message: string
}

export interface GetEncryptedSecretResponse {
  encryptedSecret: string
  iv: string
  salt: string
}

export interface HasStoredSecretResponse {
  hasStoredSecret: boolean
}

export interface PasswordAttemptsResponse {
  attempts: number
}

export interface AccountLockedResponse {
  locked: boolean
}

/**
 * Store encrypted secret on backend
 */
export const storeEncryptedSecret = async (payload: StoreEncryptedSecretPayload): Promise<StoreEncryptedSecretResponse> => {
  try {
    const { data } = await axiosClient.post<StoreEncryptedSecretResponse>('/encrypted-secret', payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * Get encrypted secret from backend
 */
export const getEncryptedSecret = async (publicKey: string): Promise<GetEncryptedSecretResponse | null> => {
  try {
    const { data } = await axiosClient.get<GetEncryptedSecretResponse>(`/encrypted-secret/${publicKey}`)
    return data
  } catch (error) {
    const apiError = toApiError(error)
    if (apiError.status === 404) {
      return null
    }
    throw apiError
  }
}

/**
 * Check if user has stored secret
 */
export const hasStoredSecret = async (publicKey: string): Promise<boolean> => {
  try {
    const { data } = await axiosClient.get<HasStoredSecretResponse>(`/encrypted-secret/${publicKey}/exists`)
    return data.hasStoredSecret
  } catch (error) {
    console.error('Error checking stored secret:', error)
    return false
  }
}

/**
 * Delete encrypted secret
 */
export const deleteEncryptedSecret = async (publicKey: string): Promise<void> => {
  try {
    await axiosClient.delete(`/encrypted-secret/${publicKey}`)
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * Store password attempts
 */
export const storePasswordAttempts = async (publicKey: string, attempts: number): Promise<void> => {
  try {
    await axiosClient.post(`/encrypted-secret/${publicKey}/attempts`, { attempts })
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * Get password attempts
 */
export const getPasswordAttempts = async (publicKey: string): Promise<number> => {
  try {
    const { data } = await axiosClient.get<PasswordAttemptsResponse>(`/encrypted-secret/${publicKey}/attempts`)
    return data.attempts
  } catch (error) {
    console.error('Error getting password attempts:', error)
    return 0 // Return 0 on error to allow retry
  }
}

/**
 * Reset password attempts
 */
export const resetPasswordAttempts = async (publicKey: string): Promise<void> => {
  try {
    await axiosClient.delete(`/encrypted-secret/${publicKey}/attempts`)
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * Check if account is locked
 */
export const isAccountLocked = async (publicKey: string): Promise<boolean> => {
  try {
    const { data } = await axiosClient.get<AccountLockedResponse>(`/encrypted-secret/${publicKey}/locked`)
    return data.locked
  } catch (error) {
    console.error('Error checking account lock status:', error)
    return false // Return false on error to allow retry
  }
}

