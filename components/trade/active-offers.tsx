"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, X, Lock, User } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useUserOffers, useCancelOffer } from "@/hooks/useTrade"
import { useTransactionAuth } from "@/hooks/useTransactionAuth"
import { PasswordPromptDialog } from "@/components/password-prompt-dialog"
import { useAccountBalances } from "@/hooks/useAccountData"

interface ActiveOffersProps {
  account: string
}

export function ActiveOffers({ account }: ActiveOffersProps) {
  const { toast } = useToast()
  const { offers, isLoading, error } = useUserOffers(account)
  const { cancelOffer, isLoading: cancelling } = useCancelOffer()
  const { refresh: refreshBalances } = useAccountBalances(account)

  // Authentication
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordResolve, setPasswordResolve] = useState<((password: string) => void) | null>(null)
  const [passwordReject, setPasswordReject] = useState<((error: Error) => void) | null>(null)
  const [cancellingOfferId, setCancellingOfferId] = useState<string | null>(null)

  const handlePasswordPrompt = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPasswordResolve(() => (password: string) => resolve(password))
      setPasswordReject(() => (error: Error) => reject(error))
      setShowPasswordDialog(true)
    })
  }

  const { getSecret: getSecretFromAuth, hasStoredSecret } = useTransactionAuth(
    account || undefined,
    handlePasswordPrompt
  )

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
      setCancellingOfferId(null)
    }
  }

  const handleCancel = async (offer: any) => {
    if (!hasStoredSecret) {
      toast({ 
        title: "Account required", 
        description: "Please import your account in your profile to set up authentication. This allows you to use PIN/password for transactions.", 
        variant: "destructive" 
      })
      return
    }

    setCancellingOfferId(offer.id)

    try {
      const secret = await getSecretFromAuth(account)
      
      await cancelOffer({
        userSecret: secret,
        selling: offer.selling,
        buying: offer.buying,
        offerId: offer.id,
      })

      toast({ title: "Offer cancelled", description: "Your offer has been cancelled successfully." })
      
 
      setTimeout(() => {
        refreshBalances()
      }, 2000) // Wait 2 seconds for transaction to be processed
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to cancel offer"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setCancellingOfferId(null)
    }
  }

  // Parse asset string for display
  const formatAsset = (asset: string) => {
    if (asset === "native") return "Test Pi"
    if (asset.includes(":")) {
      const [code] = asset.split(":")
      return code
    }
    return asset
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Offers</CardTitle>
          <CardDescription>Your open trade offers on the order book</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading offers...
            </div>
          ) : error ? (
            <div className="text-sm text-destructive py-8 text-center">
              {error.message || "Failed to load offers"}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No active offers
            </div>
          ) : (
            <>
              {!hasStoredSecret && (
                <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                        Account Required
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">
                        You need to import your account and set up authentication to cancel offers. This allows you to use PIN/password instead of entering your secret key manually.
                      </p>
                    </div>
                  </div>
                  <Link href="/profile" className="block">
                    <Button type="button" variant="outline" className="w-full" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      Go to Profile to Import Account
                    </Button>
                  </Link>
                </div>
              )}
              <div className="space-y-3">
                {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Selling:</span>
                      <span>{formatAsset(offer.selling)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Buying:</span>
                      <span>{formatAsset(offer.buying)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Amount: {Number(offer.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                      <span>Price: {offer.price}</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(offer)}
                    disabled={cancelling || cancellingOfferId === offer.id}
                  >
                    {cancellingOfferId === offer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="ml-2">Cancel</span>
                  </Button>
                </div>
              ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {account && (
        <PasswordPromptDialog
          open={showPasswordDialog}
          onOpenChange={handlePasswordDialogClose}
          publicKey={account}
          onPasswordSubmit={handlePasswordSubmit}
          error={null}
        />
      )}
    </>
  )
}

