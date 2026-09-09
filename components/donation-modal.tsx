"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2 } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"

const PREDEFINED_AMOUNTS = [5, 10, 25, 50, 100]
const APP_NAME = "ZYRADEX"

interface DonationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: { paymentId: string; amount: number }) => void
}

export function DonationModal({ isOpen, onClose, onSuccess }: DonationModalProps) {
  const { user, createPayment } = usePi()
  const [amount, setAmount] = useState(10)
  const [memo, setMemo] = useState("")
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setAmount(10)
    setMemo("")
    setStatus("idle")
    setError(null)
  }

  const handleDonation = async () => {
    if (!amount || amount <= 0) {
      setError("Please enter a valid donation amount")
      return
    }
    if (!user) {
      setError("Please login with Pi first")
      return
    }

    setStatus("processing")
    setError(null)

    try {
      const donationData = {
        userId: user.uid,
        amount,
        memo: memo || `Donation to ${APP_NAME} - ${amount} π`,
        metadata: {
          type: "donation",
          timestamp: new Date().toISOString(),
        },
      }
      const result = await createPayment(
        amount,
        memo || `Donation to ${APP_NAME} - ${amount} π`,
        donationData.metadata,
        donationData
      )

      if (result?.success) {
        setStatus("success")
        setTimeout(() => {
          onSuccess?.({ paymentId: result.paymentId, amount })
          onClose()
          resetForm()
        }, 2000)
      } else {
        setError(result?.error || "Donation failed")
        setStatus("error")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Donation failed"
      setError(message)
      setStatus("error")
    }
  }

  const handleClose = () => {
    if (status !== "processing") {
      resetForm()
      onClose()
    }
  }

  const displayName = user?.username || user?.uid || "—"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={status !== "processing"}>
        <DialogHeader>
          <DialogTitle>Support {APP_NAME}</DialogTitle>
          <DialogDescription>Your Pi donation helps us maintain and improve the platform.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Donating as:</strong> {displayName}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Donation Amount (π)</label>
            <div className="grid grid-cols-3 gap-2">
              {PREDEFINED_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  type="button"
                  variant={amount === a ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(a)}
                  disabled={status === "processing"}
                >
                  {a} π
                </Button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              disabled={status === "processing"}
              min={0.1}
              step={0.1}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Custom amount"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={status === "processing"}
              placeholder="Thank you for supporting ZYRADEX!"
              rows={3}
              className="resize-none"
            />
          </div>

          {status === "processing" && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing donation...</p>
              <p className="text-xs text-muted-foreground">Approve the transaction in your Pi wallet</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Donation successful!</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={status === "processing"}>
            Cancel
          </Button>
          <Button
            onClick={handleDonation}
            disabled={status === "processing" || amount <= 0}
          >
            {status === "processing" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Donate ${amount} π`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
