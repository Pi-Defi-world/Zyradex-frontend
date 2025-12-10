"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"

/**
 * Global authentication handler that listens for auth expiration events
 * and provides user feedback when authentication fails
 */
export function AuthHandler() {
  const router = useRouter()
  const { toast } = useToast()
  const { clearAuth, isAuthenticated } = usePi()
  const { refresh } = useUserProfile()

  useEffect(() => {
    const handleAuthExpired = async (event: Event) => {
      const customEvent = event as CustomEvent
      const error = customEvent.detail?.error
      const message = customEvent.detail?.message || "Your session has expired"
      const code = customEvent.detail?.code

      // Show user-friendly error message with more details
      const errorMessage = code === "TOKEN_EXPIRED" 
        ? "Your session has expired. Refreshing..."
        : code === "INVALID_TOKEN"
        ? "Your session token is invalid. Refreshing..."
        : message || "Please sign in again to continue."

      toast({
        title: "Session Issue",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      })

      // Clear auth state
      clearAuth()

      // Try to refresh profile if user is still authenticated with Pi
      if (isAuthenticated) {
        try {
          await refresh()
          toast({
            title: "Session Restored",
            description: "Your session has been restored successfully.",
            variant: "default",
            duration: 3000,
          })
        } catch (err) {
          // If refresh fails, redirect to profile page for re-authentication
          toast({
            title: "Authentication Required",
            description: "Please sign in again to continue.",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/profile")
        }
      } else {
        // If not authenticated with Pi, redirect to profile
        router.push("/profile")
      }
    }

    const handleAuthRefreshing = (event: Event) => {
      const customEvent = event as CustomEvent
      const message = customEvent.detail?.message || "Refreshing your session..."
      
      toast({
        title: "Refreshing Session",
        description: message,
        variant: "default",
        duration: 3000,
      })
    }

    const handleAuthRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent
      const message = customEvent.detail?.message || "Session refreshed"
      
      toast({
        title: "Session Refreshed",
        description: message,
        variant: "default",
        duration: 2000,
      })
    }

    const handleAuthRefreshFailed = (event: Event) => {
      const customEvent = event as CustomEvent
      const message = customEvent.detail?.message || "Failed to refresh session"
      
      toast({
        title: "Refresh Failed",
        description: message + " Please try again or sign in.",
        variant: "destructive",
        duration: 5000,
      })
    }

    // Listen for auth events
    if (typeof window !== "undefined") {
      window.addEventListener("auth:expired", handleAuthExpired)
      window.addEventListener("auth:refreshing", handleAuthRefreshing)
      window.addEventListener("auth:refreshed", handleAuthRefreshed)
      window.addEventListener("auth:refresh-failed", handleAuthRefreshFailed)
      
      return () => {
        window.removeEventListener("auth:expired", handleAuthExpired)
        window.removeEventListener("auth:refreshing", handleAuthRefreshing)
        window.removeEventListener("auth:refreshed", handleAuthRefreshed)
        window.removeEventListener("auth:refresh-failed", handleAuthRefreshFailed)
      }
    }
  }, [toast, router, clearAuth, isAuthenticated, refresh])

  return null // This component doesn't render anything
}

