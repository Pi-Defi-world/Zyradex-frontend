"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { establishTrustline } from "@/lib/api/tokens"

interface TrustlineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: {
    assetCode: string
    issuer: string
    name?: string
  }
  onSuccess?: () => void
}

export function TrustlineDialog({
  open,
  onOpenChange,
  token,
  onSuccess,
}: TrustlineDialogProps) {
  const { toast } = useToast()
  const [userSecret, setUserSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!userSecret.trim()) {
      toast({
        title: "Secret seed required",
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await establishTrustline({
        userSecret: userSecret.trim(),
        assetCode: token.assetCode,
        issuer: token.issuer,
        limit: "10000000000",
      })

      toast({
        title: "Trustline established",
        description: `${token.assetCode} is now trusted.`,
      })

      setUserSecret("")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as any).message
          : "Failed to establish trustline"
      toast({
        title: "Trustline failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Establish Trustline</DialogTitle>
          <DialogDescription>
            Add {token.name || token.assetCode} to your wallet by establishing a trustline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-1">Token</p>
            <p className="text-lg font-bold">{token.name || token.assetCode}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {token.assetCode}:{token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Seed</label>
            <Input
              type="password"
              placeholder="Enter your secret seed (starts with S...)"
              value={userSecret}
              onChange={(e) => setUserSecret(e.target.value)}
              className="font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading && userSecret.trim()) {
                  handleSubmit()
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              We don't store your secret seed. It's only used to sign this transaction.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false)
                setUserSecret("")
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              onClick={handleSubmit}
              disabled={isLoading || !userSecret.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Establishing...
                </>
              ) : (
                "Establish Trustline"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

