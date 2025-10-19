"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface PiUser {
  uid: string
  username: string
}

interface PiContextType {
  user: PiUser | null
  isAuthenticated: boolean
  authenticate: () => Promise<void>
  signOut: () => void
  createPayment: (amount: number, memo: string) => Promise<any>
}

const PiContext = createContext<PiContextType | undefined>(undefined)

export function PiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [piSdk, setPiSdk] = useState<any>(null)

  useEffect(() => {
    // Initialize Pi SDK
    const initPi = async () => {
      if (typeof window !== "undefined") {
        try {
          const Pi = (await import("@pi-network/sdk")).default
          const sdk = Pi.init({
            version: "2.0",
            sandbox: true, // Set to false for production
          })
          setPiSdk(sdk)
        } catch (error) {
          console.error("Failed to initialize Pi SDK:", error)
        }
      }
    }

    initPi()
  }, [])

  const authenticate = async () => {
    if (!piSdk) {
      throw new Error("Pi SDK not initialized")
    }

    try {
      const scopes = ["username", "payments"]
      const authResult = await piSdk.authenticate(scopes, onIncompletePaymentFound)
      setUser(authResult.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Authentication failed:", error)
      throw error
    }
  }

  const signOut = () => {
    if (piSdk) {
      piSdk.signOut()
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const createPayment = async (amount: number, memo: string) => {
    if (!piSdk || !isAuthenticated) {
      throw new Error("Not authenticated")
    }

    try {
      const paymentData = {
        amount,
        memo,
        metadata: { productId: "token_mint" },
      }

      const callbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("Payment ready for approval:", paymentId)
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log("Payment ready for completion:", paymentId, txid)
        },
        onCancel: (paymentId: string) => {
          console.log("Payment cancelled:", paymentId)
        },
        onError: (error: Error, payment?: any) => {
          console.error("Payment error:", error, payment)
        },
      }

      const payment = await piSdk.createPayment(paymentData, callbacks)
      return payment
    } catch (error) {
      console.error("Payment creation failed:", error)
      throw error
    }
  }

  const onIncompletePaymentFound = (payment: any) => {
    console.log("Incomplete payment found:", payment)
    // Handle incomplete payment
  }

  return (
    <PiContext.Provider
      value={{
        user,
        isAuthenticated,
        authenticate,
        signOut,
        createPayment,
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
