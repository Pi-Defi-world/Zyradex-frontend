'use client'

import React, { useState } from 'react'
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
import { validatePasswordStrength } from '@/lib/passkey/encryption'

interface PasswordSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasswordSet: (password: string) => Promise<void>
  isLoading?: boolean
}

export function PasswordSetupDialog({
  open,
  onOpenChange,
  onPasswordSet,
  isLoading = false,
}: PasswordSetupDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      setError('Password must be at least 6 characters long')
      return
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await onPasswordSet(password)
      // Reset form on success
      setPassword('')
      setConfirmPassword('')
      setError(null)
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to set up password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setPassword('')
      setConfirmPassword('')
      setError(null)
      onOpenChange(false)
    }
  }

  const isFormValid = password.length >= 6 && password === confirmPassword

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={!isSubmitting && !isLoading}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Set Up PIN/Password
          </DialogTitle>
          <DialogDescription>
            Create a PIN/password to secure your account. You'll need this to sign transactions.
            Make sure to remember it, as you'll need to re-import your account if you forget it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A PIN/password will be used to encrypt and protect your secret key. This is the primary authentication method.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password">PIN/Password (min. 6 characters)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your PIN/password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || isLoading}
              autoFocus
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              This will be used to encrypt your secret key. Make sure to remember it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm PIN/Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your PIN/password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || isLoading}
              autoComplete="new-password"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !isFormValid}
              className="w-full"
            >
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Set Up PIN/Password
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              Skip for Now
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

