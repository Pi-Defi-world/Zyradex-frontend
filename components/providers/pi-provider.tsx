"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

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
  createPayment: (amount: number, memo: string, metadata?: any) => Promise<any>
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

    const savedToken = localStorage.getItem("pi_access_token")
    const savedUser = localStorage.getItem("pi_user")

    if (savedToken && savedUser) {
      try {
        const userData: PiUser = JSON.parse(savedUser)
        setUser(userData)
        setAccessToken(savedToken)
        setAuthResult({ accessToken: savedToken, user: userData })
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error restoring saved authentication:", error)
        localStorage.removeItem("pi_access_token")
        localStorage.removeItem("pi_user")
      }
    }
  }, [])

  const authenticate = async (): Promise<PiAuthResult> => {
    if (typeof window === "undefined") {
      throw new Error("Window not available. Please refresh the page.")
    }

    if (!window.Pi) {
      throw new Error("Pi SDK not available. Please open this app in Pi Browser.")
    }

    setIsLoading(true)
    try {
      window.Pi.init({ version: "2.0", sandbox: true })

      const onIncompletePaymentFound = (payment: any) => {
        console.log("⚠️ Incomplete payment found:", payment)
      }

      const auth = await window.Pi.authenticate(["username", "payments", "wallet_address"], onIncompletePaymentFound)

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
    }
  }

  const clearAuth = () => {
    console.log("🧹 Clearing all authentication data...")
    setUser(null)
    setAccessToken(null)
    setAuthResult(null)
    setIsAuthenticated(false)

    if (typeof window !== "undefined") {
      localStorage.removeItem("pi_access_token")
      localStorage.removeItem("pi_user")
      localStorage.removeItem("pi_has_authenticated")
    }
  }

  const createPayment = async (amount: number, memo: string, metadata?: any) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated")
    }

    if (typeof window === "undefined" || !window.Pi) {
      throw new Error("Pi SDK not available. Please open in Pi Browser.")
    }

    try {
      window.Pi.init({ version: "2.0", sandbox: true })

      return new Promise((resolve, reject) => {
        const callbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("Payment ready for approval:", paymentId)
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("Payment ready for completion:", paymentId, txid)
            resolve({ success: true, paymentId, txid })
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
