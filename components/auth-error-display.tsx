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

  // Only show for auth-related errors
  const isAuthError = error?.status === 401 || error?.status === 403

  if (!error || !isAuthError) {
    return null
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{error.message || "Your session has expired. Please sign in again."}</p>
        {error.suggestion && (
          <p className="text-xs text-muted-foreground">{error.suggestion}</p>
        )}
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              Retry
            </Button>
          )}
          {!isAuthenticated && (
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

