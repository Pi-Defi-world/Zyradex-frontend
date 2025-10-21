"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface PiUser {
  uid: string
  username?: string
  wallet_address?: string
  authenticated_at?: Date
}

interface PiContextType {
  user: PiUser | null
  isAuthenticated: boolean
  isLoading: boolean
  authenticate: () => Promise<void>
  signOut: () => void
  createPayment: (amount: number, memo: string, metadata?: any) => Promise<any>
  clearAuth: () => void
}

const PiContext = createContext<PiContextType | undefined>(undefined)

export function PiProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = () => {
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('pi_access_token')
        const savedUser = localStorage.getItem('pi_user')
        
        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            setUser(userData)
            setIsAuthenticated(true)
            console.log('✅ Restored authentication from localStorage')
          } catch (error) {
            console.error('Error restoring saved authentication:', error)
            localStorage.removeItem('pi_access_token')
            localStorage.removeItem('pi_user')
          }
        }
      }
    }

    checkExistingAuth()
  }, [])

  const authenticate = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Window not available. Please refresh the page.')
    }

    if (!window.Pi) {
      throw new Error('Pi SDK not available. Please open this app in Pi Browser.')
    }

    setIsLoading(true)
    try {
      
      // Initialize Pi SDK directly
      window.Pi.init({ version: "2.0", sandbox: true })
      
      // Handle incomplete payments callback
      const onIncompletePaymentFound = (payment: any) => {
        console.log('⚠️ Incomplete payment found:', payment)
        // Handle incomplete payment if needed
      }
      
      // Authenticate with Pi Network directly using Pi SDK
      const auth = await window.Pi.authenticate(
        ["username", "payments", "wallet_address"],
        onIncompletePaymentFound
      )
      
      console.log('✅ Pi authentication completed successfully')
      
      // Since Pi SDK already authenticates, we can trust the result
      const userData = auth.user
      
      // Save authentication data locally
      setUser(userData)
      setIsAuthenticated(true)
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pi_access_token', auth.accessToken)
        localStorage.setItem('pi_user', JSON.stringify(userData))
      }
      
      console.log('💾 Authentication data saved to localStorage')
      
    } catch (error) {
      console.error('Pi Network authentication failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setIsAuthenticated(false)
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pi_access_token')
      localStorage.removeItem('pi_user')
    }
  }

  const clearAuth = () => {
    console.log('🧹 Clearing all authentication data...')
    setUser(null)
    setIsAuthenticated(false)
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pi_access_token')
      localStorage.removeItem('pi_user')
      localStorage.removeItem('pi_has_authenticated')
    }
  }

  const createPayment = async (amount: number, memo: string, metadata?: any) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated")
    }

    if (typeof window === 'undefined' || !window.Pi) {
      throw new Error('Pi SDK not available. Please open in Pi Browser.')
    }

    try {
      // Initialize Pi SDK if not already done
      window.Pi.init({ version: "2.0", sandbox: true })

      return new Promise((resolve, reject) => {
        const callbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('Payment ready for approval:', paymentId)
            // In a real app, you would call your backend to approve the payment
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('Payment ready for completion:', paymentId, txid)
            // In a real app, you would call your backend to complete the payment
            resolve({ success: true, paymentId, txid })
          },

          onCancel: (paymentId: string) => {
            console.log('Payment cancelled:', paymentId)
            reject(new Error('Payment was cancelled'))
          },

          onError: (error: Error, payment?: any) => {
            console.error('Payment error:', error, payment)
            reject(error)
          }
        }

        // Create the payment using Pi SDK
        window.Pi.createPayment({
          amount,
          memo,
          metadata: metadata || { productId: "token_mint" }
        }, callbacks)
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
