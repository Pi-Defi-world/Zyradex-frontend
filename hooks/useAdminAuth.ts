import { useCallback, useEffect, useMemo, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { usePi } from "@/components/providers/pi-provider"
import { signIn, getCurrentUser, type AdminUser } from "@/lib/api/auth"
import { setAuthToken, clearAuthToken, toApiError, type ApiError } from "@/lib/api"

const ADMIN_TOKEN_KEY = "dex_admin_token"
const ADMIN_USER_KEY = "dex_admin_user"

interface TokenClaims {
  exp?: number
}

const isTokenExpired = (token: string) => {
  try {
    const claims = jwtDecode<TokenClaims>(token)
    if (!claims.exp) return false
    return claims.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

interface UseAdminAuthReturn {
  adminUser: AdminUser | null
  token: string | null
  isAdmin: boolean
  isLoading: boolean
  error: ApiError | null
  signIn: () => Promise<AdminUser | undefined>
  signOut: () => void
  refreshUser: () => Promise<AdminUser | undefined>
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const { authenticate, authResult, user: piUser, isAuthenticated: piAuthenticated } = usePi()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY)
    const savedUser = localStorage.getItem(ADMIN_USER_KEY)

    if (savedToken && savedUser) {
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        localStorage.removeItem(ADMIN_USER_KEY)
        return
      }
      try {
        const parsedUser: AdminUser = JSON.parse(savedUser)
        setToken(savedToken)
        setAdminUser(parsedUser)
        setAuthToken(savedToken)
      } catch {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        localStorage.removeItem(ADMIN_USER_KEY)
      }
    }
  }, [])

  const handleSignOut = useCallback(() => {
    setToken(null)
    setAdminUser(null)
    clearAuthToken()
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_USER_KEY)
    }
  }, [])

  useEffect(() => {
    if (!piAuthenticated) {
      handleSignOut()
    }
  }, [piAuthenticated, handleSignOut])

  const refreshUser = useCallback(async () => {
    const t = token ?? (typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null)
    if (!t || isTokenExpired(t)) return undefined
    try {
      setAuthToken(t)
      const { user } = await getCurrentUser()
      setAdminUser(user)
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
      }
      return user
    } catch {
      return undefined
    }
  }, [token])

  const handleSignIn = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let session = authResult
      if (!session || !session.accessToken) {
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

      const { token: adminToken, user: admin } = await signIn(payload)

      if (isTokenExpired(adminToken)) {
        throw new Error("Received an expired session token")
      }

      setToken(adminToken)
      setAdminUser(admin)
      setAuthToken(adminToken)

      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken)
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin))
      }

      return admin
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [authResult, authenticate, piUser])

  const isAdmin = useMemo(() => Boolean(token && adminUser && adminUser.role === "admin"), [token, adminUser])

  return {
    adminUser,
    token,
    isAdmin,
    isLoading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser,
  }
}
