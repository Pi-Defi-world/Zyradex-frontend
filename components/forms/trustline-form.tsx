"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { Loader2, Lock } from "lucide-react"
import { useTrustline } from "@/hooks/useTokenRegistry"
import { useTransactionAuth } from "@/hooks/useTransactionAuth"
import { PasswordPromptDialog } from "@/components/password-prompt-dialog"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export function TrustlineForm() {
  const { toast } = useToast()
  const { addLog } = useLogger()
  const { user } = usePi()
  const { profile } = useUserProfile()
  const { establishTrustline, isLoading, error } = useTrustline()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordResolve, setPasswordResolve] = useState<((password: string) => void) | null>(null)
  const [passwordReject, setPasswordReject] = useState<((error: Error) => void) | null>(null)

  useEffect(() => {
    const stored = getStoredWallet()
    const address = profile?.public_key || stored || user?.wallet_address || null
    setWalletAddress(address)
  }, [profile?.public_key, user?.wallet_address])

  const handlePasswordPrompt = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPasswordResolve(() => (password: string) => resolve(password))
      setPasswordReject(() => (error: Error) => reject(error))
      setShowPasswordDialog(true)
    })
  }

  const { getSecret: getSecretFromAuth, hasStoredSecret } = useTransactionAuth(
    walletAddress || undefined,
    handlePasswordPrompt
  )

  const [formData, setFormData] = useState({
    userSecret: "",
    assetCode: "",
    issuer: "",
    limit: "100000000",
  })

  const handlePasswordSubmit = async (password: string) => {
    if (passwordResolve) {
      passwordResolve(password)
      setPasswordResolve(null)
      setPasswordReject(null)
      setShowPasswordDialog(false)
    }
  }

  const handlePasswordDialogClose = (open: boolean) => {
    if (!open) {
      setShowPasswordDialog(false)
      if (passwordReject) {
        passwordReject(new Error("Password prompt cancelled"))
        setPasswordResolve(null)
        setPasswordReject(null)
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      let secretToUse = formData.userSecret
      
      // If stored secret exists, always use password authentication
      if (hasStoredSecret && walletAddress) {
        try {
          secretToUse = await getSecretFromAuth(walletAddress)
        } catch (err) {
          const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Authentication failed"
          toast({ title: "Authentication failed", description: message, variant: "destructive" })
          return
        }
      } else if (!secretToUse) {
        toast({ 
          title: "Secret required", 
          description: "Enter the secret key to establish trustline, or import your account and set up authentication.",
          variant: "destructive" 
        })
        return
      }

      addLog("info", `Establishing trustline for ${formData.assetCode}`)
      await establishTrustline({
        userSecret: secretToUse,
        assetCode: formData.assetCode,
        issuer: formData.issuer,
        limit: formData.limit,
      })
      addLog("success", "Trustline established successfully")
      toast({ title: "Trustline established", description: `${formData.assetCode} is now trusted.` })
      setFormData({ userSecret: "", assetCode: "", issuer: "", limit: "100000000" })
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to establish trustline"
      addLog("error", message)
      toast({ title: "Trustline failed", description: message, variant: "destructive" })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!hasStoredSecret && (
          <div className="space-y-2">
            <Label htmlFor="userSecret">User Secret</Label>
            <Input
              id="userSecret"
              type="password"
              placeholder="S..."
              value={formData.userSecret}
              onChange={(event) => setFormData({ ...formData, userSecret: event.target.value })}
              required
            />
          </div>
        )}
        {hasStoredSecret && (
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>You'll be prompted for your PIN/password when you submit</span>
            </div>
          </div>
        )}

      <div className="space-y-2">
        <Label htmlFor="trustAssetCode">Asset Code</Label>
        <Input
          id="trustAssetCode"
          placeholder="e.g., PIUSD"
          value={formData.assetCode}
          onChange={(event) => setFormData({ ...formData, assetCode: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuer">Issuer Public Key</Label>
        <Input
          id="issuer"
          placeholder="G..."
          value={formData.issuer}
          onChange={(event) => setFormData({ ...formData, issuer: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Trust Limit</Label>
        <Input
          id="limit"
          type="number"
          placeholder="100000000"
          value={formData.limit}
          onChange={(event) => setFormData({ ...formData, limit: event.target.value })}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Establishing..." : "Establish Trustline"}
        </Button>
      </form>

      {walletAddress && (
        <PasswordPromptDialog
          open={showPasswordDialog}
          onOpenChange={handlePasswordDialogClose}
          publicKey={walletAddress}
          onPasswordSubmit={handlePasswordSubmit}
          error={null}
        />
      )}
    </>
  )
}
