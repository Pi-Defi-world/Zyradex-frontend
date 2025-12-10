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

      console.log("Auth expired event received:", message)

      // Show user-friendly error message
      toast({
        title: "Session Expired",
        description: message || "Please sign in again to continue.",
        variant: "destructive",
        duration: 5000,
      })

      // Clear auth state
      clearAuth()

      // Try to refresh profile if user is still authenticated with Pi
      if (isAuthenticated) {
        try {
          console.log("Attempting to refresh user profile...")
          await refresh()
          toast({
            title: "Session Restored",
            description: "Your session has been restored successfully.",
            variant: "default",
          })
        } catch (err) {
          console.error("Failed to refresh profile:", err)
          // If refresh fails, redirect to profile page for re-authentication
          router.push("/profile")
        }
      } else {
        // If not authenticated with Pi, redirect to profile
        router.push("/profile")
      }
    }

    // Listen for auth expiration events
    if (typeof window !== "undefined") {
      window.addEventListener("auth:expired", handleAuthExpired)
      
      return () => {
        window.removeEventListener("auth:expired", handleAuthExpired)
      }
    }
  }, [toast, router, clearAuth, isAuthenticated, refresh])

  return null // This component doesn't render anything
}

