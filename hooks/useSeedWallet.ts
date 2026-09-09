"use client"

import { useState, useCallback, useEffect } from "react"

const SEED_STORAGE_KEY = "zyradex-encrypted-seed"
const SEED_SALT_KEY = "zyradex-seed-salt"

/**
 * Simple AES-GCM-like encryption using Web Crypto API.
 * Encrypts the secret seed with a user password.
 */

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

async function encryptSeed(seed: string, password: string): Promise<{ encrypted: string; salt: string }> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(seed)
  )

  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.byteLength)

  return {
    encrypted: btoa(String.fromCharCode(...combined)),
    salt: btoa(String.fromCharCode(...salt)),
  }
}

async function decryptSeed(encrypted: string, salt: string, password: string): Promise<string> {
  const decoder = new TextDecoder()
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0))
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))

  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const key = await deriveKey(password, saltBytes)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  )

  return decoder.decode(decrypted)
}

export interface SeedWalletState {
  /** Whether the user has a stored encrypted seed */
  hasStoredSeed: boolean
  /** Set and encrypt the user's secret seed with a password */
  setSeed: (seed: string, password: string) => Promise<void>
  /** Decrypt and return the secret seed using the password */
  getSeed: (password: string) => Promise<string>
  /** Remove the stored encrypted seed */
  clearSeed: () => void
  /** Check and unlock ÔÇö returns decrypted seed if password is correct */
  unlock: (password: string) => Promise<string | null>
}

export function useSeedWallet(): SeedWalletState {
  const [hasStoredSeed, setHasStoredSeed] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SEED_STORAGE_KEY)
      setHasStoredSeed(!!stored)
    }
  }, [])

  const setSeed = useCallback(async (seed: string, password: string) => {
    if (!seed.startsWith("S")) {
      throw new Error("Invalid secret seed: must start with 'S'")
    }

    const { encrypted, salt } = await encryptSeed(seed, password)
    localStorage.setItem(SEED_STORAGE_KEY, encrypted)
    localStorage.setItem(SEED_SALT_KEY, salt)
    setHasStoredSeed(true)
  }, [])

  const getSeed = useCallback(async (password: string): Promise<string> => {
    const encrypted = localStorage.getItem(SEED_STORAGE_KEY)
    const salt = localStorage.getItem(SEED_SALT_KEY)

    if (!encrypted || !salt) {
      throw new Error("No stored seed found")
    }

    try {
      return await decryptSeed(encrypted, salt, password)
    } catch {
      throw new Error("Incorrect password")
    }
  }, [])

  const unlock = useCallback(async (password: string): Promise<string | null> => {
    try {
      return await getSeed(password)
    } catch {
      return null
    }
  }, [getSeed])

  const clearSeed = useCallback(() => {
    localStorage.removeItem(SEED_STORAGE_KEY)
    localStorage.removeItem(SEED_SALT_KEY)
    setHasStoredSeed(false)
  }, [])

  return {
    hasStoredSeed,
    setSeed,
    getSeed,
    clearSeed,
    unlock,
  }
}

export type SeedWalletHook = ReturnType<typeof useSeedWallet>
