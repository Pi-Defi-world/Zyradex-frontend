// @ts-nocheck
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { approvePiPayment, completePiPayment, cancelPiPayment } from "@/lib/api/pi-payments"

interface PiUser {
  uid: string
  username?: string
  wallet_address?: string
  authenticated_at?: Date
}

interface PiAuthResult {
  accessToken: string
  user: PiUser
}

interface PiContextType {
  user: PiUser | null
  accessToken: string | null
  authResult: PiAuthResult | null
  isAuthenticated: boolean
  isLoading: boolean
  authenticate: () => Promise<PiAuthResult>
  signOut: () => void
  createPayment: (
    amount: number,
    memo: string,
    metadata?: any,
    donationData?: { userId: string; amount: number; memo: string; metadata?: Record<string, unknown> }
  ) => Promise<any>
  clearAuth: () => void
}

const PiContext = createContext<PiContextType | undefined>(undefined)


export function PiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [authResult, setAuthResult] = useState<PiAuthResult | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    // No auto-login: clear saved Pi auth so user must explicitly connect.
    // Do not clear zyradex-wallet-address - that can disrupt wallet display before re-auth.
    const savedToken = localStorage.getItem("pi_access_token")
    const savedUser = localStorage.getItem("pi_user")
    if (savedToken && savedUser) {
      try {
        JSON.parse(savedUser)
      } catch {
        // ignore
      }
      localStorage.removeItem("pi_access_token")
      localStorage.removeItem("pi_user")
    }
  }, [])

  const authenticate = async (): Promise<PiAuthResult> => {
    if (typeof window === "undefined") {
      throw new Error("Window not available. Please refresh the page.")
    }

    if (!window.Pi) {
      throw new Error("Pi SDK not available.")
    }

    setIsLoading(true)
    try {
      window.Pi.init({ version: "2.0" })

      const onIncompletePaymentFound = (payment: any) => {
        console.log("Incomplete payment found:", payment)
        // Fire-and-forget: don't block authenticate if cancel fails
        cancelPiPayment(payment.identifier).catch((err) =>
          console.error("Error cancelling incomplete payment:", err)
        )
      }

      const auth = await window.Pi.authenticate(["username", "payments", "wallet_address"], onIncompletePaymentFound)

      if (!auth?.accessToken) {
        throw new Error("No access token received from Pi SDK")
      }

      const userData: PiUser = auth.user
      const result: PiAuthResult = {
        accessToken: auth.accessToken,
        user: userData,
      }

      setUser(userData)
      setAccessToken(auth.accessToken)
      setAuthResult(result)
      setIsAuthenticated(true)

      if (typeof window !== "undefined") {
        localStorage.setItem("pi_access_token", auth.accessToken)
        localStorage.setItem("pi_user", JSON.stringify(userData))
      }

      return result
    } catch (error) {
      console.error("Pi Network authentication failed:", error)
      // Clear any stale auth data on error
      setUser(null)
      setAccessToken(null)
      setAuthResult(null)
      setIsAuthenticated(false)
      if (typeof window !== "undefined") {
        localStorage.removeItem("pi_access_token")
        localStorage.removeItem("pi_user")
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setAccessToken(null)
    setAuthResult(null)
    setIsAuthenticated(false)

    if (typeof window !== "undefined") {
      localStorage.removeItem("pi_access_token")
      localStorage.removeItem("pi_user")
      localStorage.removeItem("zyradex-wallet-address")
      localStorage.removeItem("bingepi-wallet-address")
      localStorage.removeItem("dex_user_token")
      localStorage.removeItem("dex_user_profile")
    }
  }

  const clearAuth = () => {
    console.log("Clearing all authentication data...")
    setUser(null)
    setAccessToken(null)
    setAuthResult(null)
    setIsAuthenticated(false)

    if (typeof window !== "undefined") {
      localStorage.removeItem("pi_access_token")
      localStorage.removeItem("pi_user")
      localStorage.removeItem("pi_has_authenticated")
      localStorage.removeItem("zyradex-wallet-address")
      localStorage.removeItem("bingepi-wallet-address")
      localStorage.removeItem("dex_user_token")
      localStorage.removeItem("dex_user_profile")
    }
  }

  const createPayment = async (
    amount: number,
    memo: string,
    metadata?: any,
    donationData?: { userId: string; amount: number; memo: string; metadata?: Record<string, unknown> }
  ) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated")
    }

    if (typeof window === "undefined" || !window.Pi) {
      throw new Error("Pi SDK not available.")
    }

    try {
      window.Pi.init({ version: "2.0" })

      return new Promise((resolve, reject) => {
        const callbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("Payment ready for approval:", paymentId)
            try {
              await approvePiPayment(paymentId)
            } catch (err) {
              console.error("Payment approval failed:", err)
              reject(err)
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("Payment ready for completion:", paymentId, txid)
            try {
              const dataToSend =
                donationData ||
                (user
                  ? {
                      userId: user.uid,
                      amount,
                      memo,
                      metadata: metadata || {},
                    }
                  : undefined)
              await completePiPayment(paymentId, txid, dataToSend)
              resolve({ success: true, paymentId, txid })
            } catch (err) {
              console.error("Payment completion failed:", err)
              reject(err)
            }
          },

          onCancel: (paymentId: string) => {
            console.log("Payment cancelled:", paymentId)
            reject(new Error("Payment was cancelled"))
          },

          onError: (error: Error, payment?: any) => {
            console.error("Payment error:", error, payment)
            reject(error)
          },
        }

        window.Pi.createPayment(
          {
            amount,
            memo,
            metadata: metadata || { productId: "token_mint" },
          },
          callbacks
        )
      })
    } catch (error) {
      console.error("Payment creation failed:", error)
      throw error
    }
  }

  return (
    <PiContext.Provider
      value={{
        user,
        accessToken,
        authResult,
        isAuthenticated,
        isLoading,
        authenticate,
        signOut,
        createPayment,
        clearAuth,
      }}
    >
      {children}
    </PiContext.Provider>
  )
}

export function usePi() {
  const context = useContext(PiContext)
  if (context === undefined) {
    throw new Error("usePi must be used within a PiProvider")
  }
  return context
}
