/**
 * Recovery functions for locked accounts
 * Allows users to reset password attempts by re-importing their account
 */

import { resetPasswordAttempts, deleteEncryptedSecret } from './storage'
import { importAccount } from '@/lib/api/account'
import type { ImportAccountPayload } from '@/lib/api/account'

/**
 * Verify account ownership by importing with mnemonic/secret
 * This proves the user owns the account
 */
export const verifyAccountOwnership = async (
  payload: ImportAccountPayload
): Promise<{ publicKey: string; verified: boolean }> => {
  try {
    const result = await importAccount(payload)
    return {
      publicKey: result.publicKey,
      verified: true,
    }
  } catch (err) {
    return {
      publicKey: '',
      verified: false,
    }
  }
}

/**
 * Recover a locked account by re-importing with mnemonic/secret
 * This resets password attempts and allows the user to set a new PIN/password
 */
export const recoverAccount = async (
  payload: ImportAccountPayload,
  publicKey: string
): Promise<{ publicKey: string; secret: string }> => {
  try {
    // Verify ownership by importing
    const result = await importAccount(payload)
    
    // Verify the public key matches
    if (result.publicKey !== publicKey) {
      throw new Error('Account verification failed. The mnemonic/secret does not match this account.')
    }
    
    // Reset password attempts
    await resetPasswordAttempts(publicKey)
    
    // Delete old encrypted secret (user will need to set up new PIN/password)
    await deleteEncryptedSecret(publicKey)
    
    return {
      publicKey: result.publicKey,
      secret: result.secret,
    }
  } catch (err: any) {
    throw new Error(err?.message || 'Account recovery failed. Please check your mnemonic/secret.')
  }
}

