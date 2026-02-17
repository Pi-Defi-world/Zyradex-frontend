"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, Check, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { importAccount, linkWallet } from "@/lib/api/account"
import { toApiError } from "@/lib/api"

interface CollectWalletProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWalletCollected?: (walletAddress: string) => void
}

const STELLAR_PUBKEY_REGEX = /^G[A-Z0-9]{55}$/

export function CollectWallet({ open, onOpenChange, onWalletCollected }: CollectWalletProps) {
  const { adminUser, token, refreshUser } = useAdminAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState<"paste" | "import">("paste")
  const [walletAddress, setWalletAddress] = useState("")
  const [mnemonic, setMnemonic] = useState("")
  const [secret, setSecret] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [linking, setLinking] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingWalletAddress, setPendingWalletAddress] = useState("")

  const existingWallet = adminUser?.public_key?.trim() || null

  useEffect(() => {
    if (open) {
      setWalletAddress(existingWallet ?? "")
      setIsValid(!!existingWallet && STELLAR_PUBKEY_REGEX.test(existingWallet))
      setMnemonic("")
      setSecret("")
    }
  }, [open, existingWallet])

  const validateAddress = (address: string) => STELLAR_PUBKEY_REGEX.test(address)

  const handleAddressChange = (value: string) => {
    setWalletAddress(value)
    if (value.length > 0) {
      setIsValidating(true)
      setTimeout(() => {
        setIsValid(validateAddress(value))
        setIsValidating(false)
      }, 300)
    } else {
      setIsValid(false)
      setIsValidating(false)
    }
  }

  const handleLinkPublicKey = async (publicKey: string) => {
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Connect with Pi first, then link your wallet.",
        variant: "destructive",
      })
      return
    }
    setLinking(true)
    try {
      await linkWallet(publicKey)
      await refreshUser()
      onWalletCollected?.(publicKey)
      onOpenChange(false)
      toast({
        title: existingWallet ? "Wallet updated" : "Wallet linked",
        description: "Your wallet is now linked to your account.",
      })
      setWalletAddress("")
      setIsValid(false)
    } catch (err) {
      const apiError = toApiError(err)
      toast({
        title: "Could not link wallet",
        description: apiError.message,
        variant: "destructive",
      })
    } finally {
      setLinking(false)
    }
  }

  const handleImportAndLink = async () => {
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Connect with Pi first, then import your wallet.",
        variant: "destructive",
      })
      return
    }
    const hasMnemonic = mnemonic.trim().length > 0
    const hasSecret = secret.trim().length > 0
    if (!hasMnemonic && !hasSecret) {
      toast({
        title: "Enter mnemonic or secret",
        description: "Provide either a 12/24-word mnemonic or your Stellar secret key.",
        variant: "destructive",
      })
      return
    }
    if (hasMnemonic && hasSecret) {
      toast({
        title: "Use one method",
        description: "Enter either mnemonic or secret key, not both.",
        variant: "destructive",
      })
      return
    }
    setLinking(true)
    try {
      const payload = hasMnemonic ? { mnemonic: mnemonic.trim() } : { secret: secret.trim() }
      const { publicKey } = await importAccount(payload)
      await linkWallet(publicKey)
      await refreshUser()
      onWalletCollected?.(publicKey)
      onOpenChange(false)
      toast({
        title: "Wallet imported and linked",
        description: "Your wallet is now linked. Never share your secret key.",
      })
      setMnemonic("")
      setSecret("")
    } catch (err) {
      const apiError = toApiError(err)
      toast({
        title: "Import failed",
        description: apiError.message,
        variant: "destructive",
      })
    } finally {
      setLinking(false)
    }
  }

  const handleSubmitPaste = () => {
    if (!isValid || !walletAddress) return
    if (existingWallet && walletAddress !== existingWallet) {
      setPendingWalletAddress(walletAddress)
      setShowConfirmDialog(true)
    } else {
      handleLinkPublicKey(walletAddress)
    }
  }

  const handleConfirmUpdate = () => {
    handleLinkPublicKey(pendingWalletAddress)
    setShowConfirmDialog(false)
    setPendingWalletAddress("")
  }

  const handleClose = () => {
    onOpenChange(false)
    setWalletAddress("")
    setMnemonic("")
    setSecret("")
    setIsValid(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {existingWallet ? "Update wallet" : "Connect / Import wallet"}
          </DialogTitle>
          <DialogDescription>
            Link a Stellar (Pi) wallet by pasting your public key or importing with mnemonic/secret.
          </DialogDescription>
        </DialogHeader>

        {!token && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect with Pi in the navbar first, then return here to link a wallet.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`flex-1 py-1.5 rounded text-sm font-medium ${mode === "paste" ? "bg-background shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Paste address
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`flex-1 py-1.5 rounded text-sm font-medium ${mode === "import" ? "bg-background shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Import wallet
          </button>
        </div>

        {mode === "paste" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter your Stellar public key (starts with G, 56 characters). Never paste your secret key here.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="wallet-address">Public key</Label>
              <div className="relative">
                <Input
                  id="wallet-address"
                  placeholder="G..."
                  value={walletAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className={`pr-10 ${walletAddress.length > 0 ? (isValid ? "border-green-500" : "border-red-500") : ""}`}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isValidating && walletAddress.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid ? <Check className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                )}
              </div>
              {walletAddress.length > 0 && !isValid && !isValidating && (
                <p className="text-sm text-red-500">Enter a valid Stellar public key (G + 55 characters)</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1" disabled={linking}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPaste} disabled={!isValid || isValidating || linking || !token} className="flex-1">
                {linking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {existingWallet ? "Update" : "Link wallet"}
              </Button>
            </div>
          </div>
        )}

        {mode === "import" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your secret key and mnemonic stay on your device and are never sent after import. We only link the public key to your account.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="mnemonic">Mnemonic (12 or 24 words)</Label>
              <Input
                id="mnemonic"
                placeholder="word1 word2 ..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                className="font-mono text-sm"
                type="password"
                autoComplete="off"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-background px-2 text-xs text-muted-foreground">or</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Secret key</Label>
              <Input
                id="secret"
                placeholder="S..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="font-mono text-sm"
                type="password"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1" disabled={linking}>
                Cancel
              </Button>
              <Button
                onClick={handleImportAndLink}
                disabled={linking || (!mnemonic.trim() && !secret.trim()) || !token}
                className="flex-1"
              >
                {linking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Import and link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Replace wallet?
            </DialogTitle>
            <DialogDescription>
              This will replace your current linked wallet address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <Label className="text-sm text-muted-foreground">New address</Label>
              <code className="text-xs break-all block mt-1">{pendingWalletAddress}</code>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowConfirmDialog(false); setPendingWalletAddress("") }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConfirmUpdate} disabled={linking} className="flex-1">
                {linking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
