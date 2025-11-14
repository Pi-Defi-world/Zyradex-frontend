"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { recoverAccount } from "@/lib/passkey/recovery"
import { useToast } from "@/hooks/use-toast"
import { PasswordSetupDialog } from "@/components/password-setup-dialog"
import { storeEncryptedSecret } from "@/lib/passkey/storage"
import { encryptSecret, deriveKeyFromPassword, generateSalt, validatePasswordStrength } from "@/lib/passkey/encryption"

interface RecoveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  publicKey: string
  onRecoveryComplete?: () => void
}

export function RecoveryDialog({
  open,
  onOpenChange,
  publicKey,
  onRecoveryComplete,
}: RecoveryDialogProps) {
  const { toast } = useToast()
  const [mnemonic, setMnemonic] = useState("")
  const [secret, setSecret] = useState("")
  const [isRecovering, setIsRecovering] = useState(false)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [recoveredSecret, setRecoveredSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsRecovering(true)

    try {
      if (!mnemonic.trim() && !secret.trim()) {
        setError("Please provide either a mnemonic phrase or secret key")
        setIsRecovering(false)
        return
      }

      const payload = {
        mnemonic: mnemonic.trim() || undefined,
        secret: secret.trim() || undefined,
      }

      const result = await recoverAccount(payload, publicKey)

      if (result.publicKey !== publicKey) {
        throw new Error("Account verification failed. The mnemonic/secret does not match this account.")
      }

      setRecoveredSecret(result.secret)
      setShowPasswordSetup(true)
      toast({
        title: "Account verified",
        description: "Please set up a new PIN/password to secure your account.",
      })
    } catch (err: any) {
      setError(err?.message || "Recovery failed. Please check your mnemonic/secret.")
      toast({
        title: "Recovery failed",
        description: err?.message || "Please check your mnemonic/secret.",
        variant: "destructive",
      })
    } finally {
      setIsRecovering(false)
    }
  }

  const handlePasswordSetup = async (password: string) => {
    if (!recoveredSecret || !publicKey) {
      throw new Error("Missing account information")
    }

    if (!validatePasswordStrength(password)) {
      throw new Error("Password must be at least 6 characters long")
    }

    try {
      // Generate salt and derive key from password
      const salt = generateSalt()
      const saltBase64 = btoa(String.fromCharCode(...salt))
      const key = await deriveKeyFromPassword(password, salt)

      // Encrypt secret with password-derived key
      const { encrypted, iv } = await encryptSecret(recoveredSecret, key)

      // Store encrypted secret with salt
      await storeEncryptedSecret(publicKey, encrypted, iv, saltBase64)

      // Clear state
      setRecoveredSecret(null)
      setMnemonic("")
      setSecret("")
      setShowPasswordSetup(false)
      onOpenChange(false)

      toast({
        title: "Account recovered",
        description: "Your account has been recovered and secured with a new PIN/password.",
      })

      if (onRecoveryComplete) {
        onRecoveryComplete()
      }
    } catch (err: any) {
      throw new Error(err?.message || "Failed to set up password. Please try again.")
    }
  }

  const handleClose = (open: boolean) => {
    if (!open && !isRecovering) {
      setMnemonic("")
      setSecret("")
      setError(null)
      setRecoveredSecret(null)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open && !showPasswordSetup} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Recover Locked Account</DialogTitle>
            <DialogDescription>
              Your account is locked due to too many failed password attempts.
              Re-import your account using your mnemonic phrase or secret key to reset the lockout.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecovery} className="space-y-4">
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Security Notice</p>
                <p className="text-xs mt-1">
                  You'll need to set up a new PIN/password after recovery. Make sure you remember it or keep your mnemonic/secret safe.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-mnemonic">Mnemonic Phrase (optional)</Label>
              <Input
                id="recovery-mnemonic"
                type="text"
                placeholder="word1 word2 word3 ..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                disabled={isRecovering}
              />
              <p className="text-xs text-muted-foreground">
                Enter your 12 or 24-word mnemonic phrase
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-secret">Secret Key (optional)</Label>
              <Input
                id="recovery-secret"
                type="password"
                placeholder="SXXXXXXXXXXXXXXXX"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={isRecovering}
              />
              <p className="text-xs text-muted-foreground">
                Enter your Stellar secret key
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isRecovering}>
              {isRecovering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRecovering ? "Recovering..." : "Recover Account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {showPasswordSetup && recoveredSecret && (
        <PasswordSetupDialog
          open={showPasswordSetup}
          onOpenChange={(open) => {
            if (!open) {
              setShowPasswordSetup(false)
              setRecoveredSecret(null)
            }
          }}
          onPasswordSet={handlePasswordSetup}
          isLoading={false}
        />
      )}
    </>
  )
}

