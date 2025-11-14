'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Lock, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getPasswordAttempts, isAccountLocked } from '@/lib/passkey/storage'

interface PasswordPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  publicKey: string
  onPasswordSubmit: (password: string) => Promise<void>
  onRecovery?: () => void
  error?: string | null
}

export function PasswordPromptDialog({
  open,
  onOpenChange,
  publicKey,
  onPasswordSubmit,
  onRecovery,
  error: externalError,
}: PasswordPromptDialogProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  // Check account status when dialog opens
  useEffect(() => {
    if (open && publicKey) {
      checkAccountStatus()
    }
  }, [open, publicKey])

  const checkAccountStatus = async () => {
    try {
      const locked = await isAccountLocked(publicKey)
      setIsLocked(locked)
      
      if (!locked) {
        const currentAttempts = await getPasswordAttempts(publicKey)
        setAttempts(currentAttempts)
      }
    } catch (err) {
      console.error('Error checking account status:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Please enter your PIN/password')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onPasswordSubmit(password)
      setPassword('')
      onOpenChange(false)
    } catch (err: any) {
      const errorMessage = err?.message || 'Authentication failed'
      setError(errorMessage)
      
      // Update attempts if error mentions attempts
      if (errorMessage.includes('attempt')) {
        await checkAccountStatus()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setPassword('')
      setError(null)
      onOpenChange(false)
    }
  }

  const displayError = externalError || error
  const remainingAttempts = 5 - attempts

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Enter PIN/Password
          </DialogTitle>
          <DialogDescription>
            Enter your PIN/password to authenticate this transaction
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {isLocked ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account is locked due to too many failed password attempts.
                {onRecovery && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={onRecovery}
                      className="underline font-medium"
                    >
                      Use recovery option
                    </button>
                    {' '}to reset your account.
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {attempts > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {remainingAttempts > 0
                      ? `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`
                      : 'Last attempt before account lockout'}
                  </AlertDescription>
                </Alert>
              )}

              {displayError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">PIN/Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your PIN/password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="current-password"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !password.trim()}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Authenticate
                </Button>

                {onRecovery && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onRecovery}
                    className="w-full text-sm"
                    disabled={isLoading}
                  >
                    Forgot password? Use recovery
                  </Button>
                )}
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

