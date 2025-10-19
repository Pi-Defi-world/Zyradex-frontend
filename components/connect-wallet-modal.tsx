"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

interface ConnectWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect?: () => void
}

export function ConnectWalletModal({ open, onOpenChange, onConnect }: ConnectWalletModalProps) {
  const handleConnect = () => {
    onConnect?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authenticate with Pi to get started</DialogTitle>
          <DialogDescription>
            Log in with your Pi account to access Pi DeFi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4 hover:bg-primary/10 hover:border-primary bg-transparent"
            onClick={handleConnect}
          >
            <div className="flex items-center gap-3">
              <img
                src="/pi.png"
                alt="Pi Network"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="text-left">
                {/* <p className="font-semibold">Pi Authentication</p> */}
                <p className="text-sm font-semibold text-muted-foreground">Pi Authentication</p>
                <p className="text-sm text-muted-foreground">Authenticate with Pi Browser</p>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
