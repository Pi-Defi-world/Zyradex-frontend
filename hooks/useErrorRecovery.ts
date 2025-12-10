'use client'

import { useState, useCallback } from 'react'
import { ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { showErrorToast } from '@/components/errors/ErrorToast'

interface UseErrorRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: () => Promise<void>
  showToast?: boolean
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    showToast = true,
  } = options

  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const { toast } = useToast()

  const handleError = useCallback(
    (error: ApiError, customRetry?: () => Promise<void>) => {
      const retryFn = customRetry || onRetry

      if (showToast) {
        showErrorToast(error, toast, retryFn ? () => retry() : undefined)
      }

      // Auto-retry for retryable errors if retry function is provided
      if (error.canRetry && retryFn && retryCount < maxRetries) {
        // Don't auto-retry rate limits - user should wait
        if (error.status === 429) {
          return
        }

        // Auto-retry after delay
        setTimeout(() => {
          retry()
        }, retryDelay * Math.pow(2, retryCount)) // Exponential backoff
      }
    },
    [retryCount, maxRetries, retryDelay, onRetry, showToast, toast]
  )

  const retry = useCallback(async () => {
    if (!onRetry || isRetrying || retryCount >= maxRetries) {
      return
    }

    setIsRetrying(true)
    setRetryCount((prev) => prev + 1)

    try {
      await onRetry()
      setRetryCount(0) // Reset on success
    } catch (error) {
      // Error will be handled by handleError if called
      if (retryCount >= maxRetries - 1) {
        toast({
          title: 'Max retries reached',
          description: 'Please try again later or refresh the page.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, isRetrying, retryCount, maxRetries, toast])

  const reset = useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  return {
    handleError,
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  }
}

