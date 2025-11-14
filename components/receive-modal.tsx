"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"

interface ReceiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const { user } = usePi()
  const { toast } = useToast()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const stored = getStoredWallet()
    const address = stored || user?.wallet_address || null
    setWalletAddress(address)
  }, [user?.wallet_address])

  const handleCopy = async () => {
    if (!walletAddress) return

    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  if (!walletAddress) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive / Deposit</DialogTitle>
            <DialogDescription>No wallet address found. Please connect a wallet first.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive / Deposit</DialogTitle>
          <DialogDescription>Share this address to receive tokens</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground mb-2">Your Wallet Address</p>
            <p className="font-mono text-sm break-all">{walletAddress}</p>
          </div>
          <Button onClick={handleCopy} className="w-full" variant="outline">
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

