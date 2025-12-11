'use client'

import { useCallback, useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { usePi } from "@/components/providers/pi-provider"
import { signIn, type AdminUser } from "@/lib/api/auth"
import type { ApiError } from "@/lib/api"
import { toApiError, setAuthToken, clearAuthToken } from "@/lib/api"

const USER_TOKEN_KEY = "dex_user_token"
const USER_PROFILE_KEY = "dex_user_profile"

interface TokenClaims {
  exp?: number
}

const isTokenExpired = (token: string) => {
  try {
    const claims = jwtDecode<TokenClaims>(token)
    if (!claims.exp) return false
    return claims.exp * 1000 < Date.now()
  } catch {
    return false
  }
}

interface UseUserProfileReturn {
  profile: AdminUser | null
  isLoading: boolean
  error: ApiError | null
  refresh: () => Promise<AdminUser | undefined>
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { authenticate, authResult, user: piUser, isAuthenticated: piAuthenticated } = usePi()
  const [profile, setProfile] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // Restore token and profile from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const savedToken = localStorage.getItem(USER_TOKEN_KEY)
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY)

    if (savedToken && savedProfile) {
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem(USER_TOKEN_KEY)
        localStorage.removeItem(USER_PROFILE_KEY)
        return
      }
      try {
        const parsedProfile: AdminUser = JSON.parse(savedProfile)
        setProfile(parsedProfile)
        setAuthToken(savedToken)
      } catch {
        localStorage.removeItem(USER_TOKEN_KEY)
        localStorage.removeItem(USER_PROFILE_KEY)
      }
    }
  }, [])

  // Clear auth if Pi authentication is lost
  useEffect(() => {
    if (!piAuthenticated) {
      setProfile(null)
      clearAuthToken()
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_TOKEN_KEY)
        localStorage.removeItem(USER_PROFILE_KEY)
        localStorage.removeItem("zyradex-wallet-address")
        localStorage.removeItem("bingepi-wallet-address")
      }
    }
  }, [piAuthenticated])

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let session = authResult
      if (!session?.accessToken) {
        session = await authenticate()
      }

      if (!session?.accessToken) {
        throw new Error("Missing Pi access token")
      }

      const payload = {
        authResult: {
          accessToken: session.accessToken,
          user: {
            username: session.user?.username || piUser?.username || "",
            uid: session.user?.uid || piUser?.uid || "",
          },
        },
      }

      let backendUser, token
      try {
        const result = await signIn(payload)
        backendUser = result.user
        token = result.token
      } catch (signInError: any) {
        const errorMessage = signInError?.message?.toLowerCase() || ""
        const statusCode = (signInError as any)?.status || signInError?.response?.status
        
        // Re-throw errors directly without retry logic
        throw signInError
      }

      if (isTokenExpired(token)) {
        throw new Error("Received an expired session token")
      }

      setProfile(backendUser)
      setAuthToken(token)

      // Persist token and profile to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_TOKEN_KEY, token)
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(backendUser))
      }

      return backendUser
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      
      // Clear local storage on signin errors (user not found, invalid token, etc.)
      // This fixes the issue where old cached data persists after user is cleared from DB
      if (typeof window !== "undefined") {
        const errorMessage = apiError.message?.toLowerCase() || ""
        const statusCode = (apiError as any)?.status || (err as any)?.response?.status
        const isPiApiError = (err as any)?.isPiApiError || errorMessage.includes("pi network api") || errorMessage.includes("pi api")
        
        // Don't clear storage for Pi API errors (503) - these are temporary and user might still be authenticated
        // Only clear for actual auth failures
        const isAuthError = 
          (statusCode === 401 || statusCode === 403) ||
          (statusCode === 500 && !isPiApiError) ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("unauthorized") ||
          (!isPiApiError && errorMessage.includes("internal server error")) ||
          errorMessage.includes("access token")
        
        if (isAuthError) {
          console.log("Clearing local storage due to authentication error")
          localStorage.removeItem(USER_TOKEN_KEY)
          localStorage.removeItem(USER_PROFILE_KEY)
          localStorage.removeItem("zyradex-wallet-address")
          localStorage.removeItem("bingepi-wallet-address")
          // Also clear Pi authentication tokens if access token is invalid
          if (errorMessage.includes("access token") || errorMessage.includes("invalid")) {
            localStorage.removeItem("pi_access_token")
            localStorage.removeItem("pi_user")
          }
          setProfile(null)
          clearAuthToken()
        }
      }
      
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [authResult, authenticate, piUser?.uid, piUser?.username])

  useEffect(() => {
    if (!piUser?.username) return
    loadProfile().catch(() => undefined)
  }, [piUser?.username, loadProfile])

  return {
    profile,
    isLoading,
    error,
    refresh: loadProfile,
  }
}
