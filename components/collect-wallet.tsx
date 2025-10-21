"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, Copy, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CollectWalletProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWalletCollected?: (walletAddress: string) => void
}

export function CollectWallet({ open, onOpenChange, onWalletCollected }: CollectWalletProps) {
  const [walletAddress, setWalletAddress] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [copied, setCopied] = useState(false)
  const [existingWallet, setExistingWallet] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingWalletAddress, setPendingWalletAddress] = useState("")
  const { toast } = useToast()

  // Sample Pi wallet address for demonstration
  const sampleWalletAddress = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

  // Check for existing wallet on component mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('bingepi-wallet-address')
    if (storedWallet) {
      setExistingWallet(storedWallet)
      setWalletAddress(storedWallet)
      setIsValid(true) // Assume existing wallet is valid
    }
  }, [])

  // Check for existing wallet when dialog opens
  useEffect(() => {
    if (open) {
      const storedWallet = localStorage.getItem('bingepi-wallet-address')
      if (storedWallet) {
        setExistingWallet(storedWallet)
        setWalletAddress(storedWallet)
        setIsValid(true)
      } else {
        setExistingWallet(null)
        setWalletAddress("")
        setIsValid(false)
      }
    }
  }, [open])

  const validateWalletAddress = (address: string) => {
    // Basic validation for Pi wallet address format
    // Pi addresses typically start with 'G' and are 56 characters long
    const piAddressRegex = /^G[A-Z0-9]{55}$/
    return piAddressRegex.test(address)
  }

  const handleAddressChange = (value: string) => {
    setWalletAddress(value)
    if (value.length > 0) {
      setIsValidating(true)
      // Simulate validation delay
      setTimeout(() => {
        const valid = validateWalletAddress(value)
        setIsValid(valid)
        setIsValidating(false)
      }, 500)
    } else {
      setIsValid(false)
      setIsValidating(false)
    }
  }

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleWalletAddress)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Sample wallet address copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = () => {
    if (isValid && walletAddress) {
      // If there's an existing wallet and the new address is different, show confirmation
      if (existingWallet && walletAddress !== existingWallet) {
        setPendingWalletAddress(walletAddress)
        setShowConfirmDialog(true)
      } else {
        // Direct submit for new wallet or same wallet
        submitWallet(walletAddress)
      }
    }
  }

  const submitWallet = (address: string) => {
    // Store wallet address in localStorage
    localStorage.setItem('bingepi-wallet-address', address)
    
    const isUpdate = existingWallet !== null
    toast({
      title: isUpdate ? "Wallet Updated!" : "Wallet Connected!",
      description: isUpdate 
        ? "Your Pi wallet address has been updated successfully" 
        : "Your Pi wallet address has been saved successfully",
    })
    
    onWalletCollected?.(address)
    onOpenChange(false)
    
    // Reset form
    setWalletAddress("")
    setIsValid(false)
    setExistingWallet(address)
  }

  const handleConfirmUpdate = () => {
    submitWallet(pendingWalletAddress)
    setShowConfirmDialog(false)
    setPendingWalletAddress("")
  }

  const handleCancelUpdate = () => {
    setShowConfirmDialog(false)
    setPendingWalletAddress("")
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form when closing
    setWalletAddress("")
    setIsValid(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {existingWallet ? "Update Pi Wallet" : "Connect Pi Wallet"}
          </DialogTitle>
          <DialogDescription>
            {existingWallet 
              ? "Update your Pi Network wallet address"
              : "Enter your Pi Network wallet address to connect and access all features"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure you're entering your correct Pi wallet address. This will be used for all transactions.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="wallet-address">Pi Wallet Address</Label>
            <div className="relative">
              <Input
                id="wallet-address"
                placeholder="Enter your Pi wallet address..."
                value={walletAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={`pr-10 ${
                  walletAddress.length > 0 
                    ? isValid 
                      ? 'border-green-500 focus:border-green-500' 
                      : 'border-red-500 focus:border-red-500'
                    : ''
                }`}
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                </div>
              )}
              {!isValidating && walletAddress.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValid ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {walletAddress.length > 0 && !isValid && !isValidating && (
              <p className="text-sm text-red-500">
                Please enter a valid Pi wallet address (starts with 'G' and is 56 characters long)
              </p>
            )}
            {isValid && (
              <p className="text-sm text-green-500">
                ✓ Valid Pi wallet address
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Sample Format</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySample}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <code className="text-xs text-muted-foreground break-all">
              {sampleWalletAddress}
            </code>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isValidating}
              className="flex-1"
            >
              {isValidating ? "Validating..." : existingWallet ? "Update Wallet" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Are you sure?
            </DialogTitle>
            <DialogDescription>
              You're about to update your wallet address. This will replace your current wallet address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <Label className="text-sm font-medium text-muted-foreground">Current Address</Label>
              <code className="text-xs text-foreground break-all block mt-1">
                {existingWallet}
              </code>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <Label className="text-sm font-medium text-muted-foreground">New Address</Label>
              <code className="text-xs text-foreground break-all block mt-1">
                {pendingWalletAddress}
              </code>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure this is the correct wallet address. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCancelUpdate}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                className="flex-1"
              >
                Update Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
