import { getEncryptedSecret } from "./storage"
import { decryptSecret } from "./encryption"

// Store encryption keys in memory (in production, derive from passkey)
const encryptionKeys = new Map<string, CryptoKey>()

export const setEncryptionKey = (publicKey: string, key: CryptoKey) => {
  encryptionKeys.set(publicKey, key)
}

export interface TransactionAuthResult {
  secret: string
  sessionToken: string
}

export const getSecretForTransaction = async (
  publicKey: string,
  sessionToken: string
): Promise<string> => {
  try {
    // Get encrypted secret from IndexedDB
    const encryptedData = await getEncryptedSecret(publicKey)
    if (!encryptedData) {
      throw new Error("No encrypted secret found. Please re-import your account.")
    }
    
    // Get the encryption key (should be set during account import)
    const key = encryptionKeys.get(publicKey)
    if (!key) {
      throw new Error("Encryption key not found. Please re-import your account to set up passkey authentication.")
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

