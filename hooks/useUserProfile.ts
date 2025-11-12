'use client'

import { useCallback, useEffect, useState } from "react"
import { usePi } from "@/components/providers/pi-provider"
import { signIn, type AdminUser } from "@/lib/api/auth"
import type { ApiError } from "@/lib/api"
import { toApiError } from "@/lib/api"

interface UseUserProfileReturn {
  profile: AdminUser | null
  isLoading: boolean
  error: ApiError | null
  refresh: () => Promise<AdminUser | undefined>
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { authenticate, authResult, user: piUser } = usePi()
  const [profile, setProfile] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

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

      const { user: backendUser } = await signIn(payload)
      setProfile(backendUser)
      return backendUser
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError)
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
