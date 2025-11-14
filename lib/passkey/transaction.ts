import { getEncryptedSecret, isAccountLocked } from "./storage"
import { decryptSecret, deriveKeyFromPassword } from "./encryption"

// Store encryption keys in memory (for passkey-based authentication)
const encryptionKeys = new Map<string, CryptoKey>()

export const setEncryptionKey = (publicKey: string, key: CryptoKey) => {
  encryptionKeys.set(publicKey, key)
}

export interface TransactionAuthResult {
  secret: string
  sessionToken: string
}

/**
 * Get secret for transaction using either passkey (sessionToken) or password
 * @param publicKey - The public key of the account
 * @param authMethod - Either 'passkey' with sessionToken or 'password' with password string
 */
export const getSecretForTransaction = async (
  publicKey: string,
  authMethod: { type: 'passkey'; sessionToken: string } | { type: 'password'; password: string }
): Promise<string> => {
  try {
    // Check if account is locked
    const locked = await isAccountLocked(publicKey)
    if (locked) {
      throw new Error("Account is locked due to too many failed password attempts. Please use the recovery option to reset your account.")
    }

    // Get encrypted secret from IndexedDB
    const encryptedData = await getEncryptedSecret(publicKey)
    if (!encryptedData) {
      throw new Error("No encrypted secret found. Please re-import your account.")
    }

    let key: CryptoKey

    if (authMethod.type === 'passkey') {
      // Use in-memory key from passkey authentication
      key = encryptionKeys.get(publicKey)
      if (!key) {
        throw new Error("Encryption key not found. Please re-authenticate with passkey.")
      }
    } else {
      // Derive key from password
      if (!encryptedData.salt) {
        throw new Error("Salt not found. Please re-import your account to set up password authentication.")
      }
      
      const salt = Uint8Array.from(atob(encryptedData.salt), (c) => c.charCodeAt(0))
      key = await deriveKeyFromPassword(authMethod.password, salt)
    }
    
    // Decrypt the secret
    const secret = await decryptSecret(
      encryptedData.encryptedSecret,
      encryptedData.iv,
      key
    )
    
    return secret
  } catch (error) {
    throw error
  }
}

