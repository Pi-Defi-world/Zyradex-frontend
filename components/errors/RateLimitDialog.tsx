'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, RefreshCw } from 'lucide-react'

interface RateLimitDialogProps {
  open: boolean
  retryAfter?: number
  onRetry?: () => void
}

export function RateLimitDialog({ open, retryAfter = 60, onRetry }: RateLimitDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState(retryAfter)

  useEffect(() => {
    if (!open) {
      setTimeRemaining(retryAfter)
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, retryAfter])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive" />
            <DialogTitle>Rate Limit Exceeded</DialogTitle>
          </div>
          <DialogDescription>
            You've made too many requests. Please wait before trying again.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-center gap-2 text-2xl font-semibold">
            <Clock className="h-6 w-6" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Time remaining before you can try again
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={onRetry}
            disabled={timeRemaining > 0}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {timeRemaining > 0 ? `Retry in ${formatTime(timeRemaining)}` : 'Try Again'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

