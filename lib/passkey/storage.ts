/**
 * Storage functions for encrypted secrets
 * Now using backend API instead of IndexedDB
 */

import * as api from '../api/encrypted-secret'

export const storeEncryptedSecret = async (
  publicKey: string,
  encryptedSecret: string,
  iv: string,
  salt: string
): Promise<void> => {
  try {
    console.log('📦 Storing encrypted secret to backend for:', publicKey)
    console.log('📦 Payload:', { 
      publicKey, 
      encryptedSecretLength: encryptedSecret.length,
      ivLength: iv.length,
      saltLength: salt.length 
    })
    const result = await api.storeEncryptedSecret({
      publicKey,
      encryptedSecret,
      iv,
      salt,
    })
    console.log('✅ Encrypted secret stored successfully on backend:', result)
  } catch (error: any) {
    console.error('❌ Error storing encrypted secret:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      status: error?.status,
      details: error?.details
    })
    throw error
  }
}

export const getEncryptedSecret = async (
  publicKey: string
): Promise<{ encryptedSecret: string; iv: string; salt: string } | null> => {
  try {
    const result = await api.getEncryptedSecret(publicKey)
    return result
  } catch (error) {
    console.error('Error retrieving encrypted secret:', error)
    throw error
  }
}

export const deleteEncryptedSecret = async (publicKey: string): Promise<void> => {
  try {
    await api.deleteEncryptedSecret(publicKey)
  } catch (error) {
    console.error('Error deleting encrypted secret:', error)
    throw error
  }
}

export const hasStoredSecret = async (publicKey: string): Promise<boolean> => {
  try {
    return await api.hasStoredSecret(publicKey)
  } catch (error) {
    console.error('Error checking stored secret:', error)
    return false
  }
}

// Password attempt tracking functions

export const storePasswordAttempts = async (
  publicKey: string,
  attempts: number
): Promise<void> => {
  try {
    await api.storePasswordAttempts(publicKey, attempts)
  } catch (error) {
    console.error('Error storing password attempts:', error)
    throw error
  }
}

export const getPasswordAttempts = async (publicKey: string): Promise<number> => {
  try {
    return await api.getPasswordAttempts(publicKey)
  } catch (error) {
    console.error('Error retrieving password attempts:', error)
    return 0 // Return 0 on error to allow retry
  }
}

export const resetPasswordAttempts = async (publicKey: string): Promise<void> => {
  try {
    await api.resetPasswordAttempts(publicKey)
  } catch (error) {
    console.error('Error resetting password attempts:', error)
    throw error
  }
}

export const isAccountLocked = async (publicKey: string): Promise<boolean> => {
  try {
    return await api.isAccountLocked(publicKey)
  } catch (error) {
    console.error('Error checking account lock status:', error)
    return false // Return false on error to allow retry
  }
}

