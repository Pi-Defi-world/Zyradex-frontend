"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { ApiError } from "@/lib/api"
import { usePi } from "@/components/providers/pi-provider"

interface AuthErrorDisplayProps {
  error: ApiError | null | undefined
  className?: string
  onRetry?: () => void
}

/**
 * Reusable component for displaying authentication errors consistently across all pages
 */
export function AuthErrorDisplay({ error, className = "", onRetry }: AuthErrorDisplayProps) {
  const router = useRouter()
  const { isAuthenticated } = usePi()

  // Show for auth-related errors and Pi API errors
  const isAuthError = error?.status === 401 || error?.status === 403
  const isPiApiError = error?.status === 503 || 
    error?.message?.toLowerCase().includes("pi network api") ||
    error?.message?.toLowerCase().includes("pi api")

  if (!error || (!isAuthError && !isPiApiError)) {
    return null
  }

  // Determine alert variant and title based on error type
  const alertVariant = isPiApiError ? "default" : "destructive"
  const alertTitle = isPiApiError 
    ? "Pi Network API Temporarily Unavailable" 
    : "Authentication Required"

  return (
    <Alert variant={alertVariant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{alertTitle}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {isPiApiError 
            ? "Pi Network's API is temporarily unavailable. This is usually a temporary issue. Please wait a moment and try again."
            : error.message || "Your session has expired. Please sign in again."
          }
        </p>
        {error.suggestion && (
          <p className="text-xs text-muted-foreground">{error.suggestion}</p>
        )}
        {isPiApiError && (
          <p className="text-xs text-muted-foreground">
            The error is on Pi Network's side, not with your account. Your authentication should still be valid once Pi Network's API is back online.
          </p>
        )}
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              {isPiApiError ? "Retry Now" : "Retry"}
            </Button>
          )}
          {!isAuthenticated && !isPiApiError && (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/profile")}
              className="h-8"
            >
              Sign In
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

