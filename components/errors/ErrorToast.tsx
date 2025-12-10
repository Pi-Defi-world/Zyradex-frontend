'use client'

import { useToast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api'
import { Clock, AlertCircle, XCircle, Info } from 'lucide-react'

interface ErrorToastProps {
  error: ApiError
  onRetry?: () => void
  onDismiss?: () => void
}

export function showErrorToast(
  error: ApiError,
  toast: ReturnType<typeof useToast>['toast'],
  onRetry?: () => void
) {
  const getIcon = () => {
    if (error.status === 429) return <Clock className="h-4 w-4" />
    if (error.status === 401 || error.status === 403) return <XCircle className="h-4 w-4" />
    if (error.status && error.status >= 500) return <AlertCircle className="h-4 w-4" />
    return <Info className="h-4 w-4" />
  }

  const getTitle = () => {
    if (error.status === 429) return 'Rate Limit Exceeded'
    if (error.status === 401) return 'Authentication Required'
    if (error.status === 403) return 'Access Denied'
    if (error.status === 404) return 'Not Found'
    if (error.status && error.status >= 500) return 'Server Error'
    return 'Error'
  }

  const actions = []

  if (error.canRetry && onRetry) {
    actions.push({
      label: 'Retry',
      onClick: onRetry,
    })
  }

  if (error.status === 401) {
    actions.push({
      label: 'Refresh',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      },
    })
  }

  toast({
    title: getTitle(),
    description: (
      <div className="space-y-1">
        <p>{error.message}</p>
        {error.suggestion && (
          <p className="text-xs text-muted-foreground">{error.suggestion}</p>
        )}
        {error.requestId && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-muted-foreground">Request ID: {error.requestId}</p>
        )}
      </div>
    ),
    variant: 'destructive',
    duration: error.status === 429 && error.retryAfter ? error.retryAfter * 1000 : 5000,
    action: actions.length > 0 ? (
      <div className="flex gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="rounded-md bg-destructive/20 px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/30"
          >
            {action.label}
          </button>
        ))}
      </div>
    ) : undefined,
  })
}

// Re-export for convenience
export { showErrorToast as useErrorToast }

