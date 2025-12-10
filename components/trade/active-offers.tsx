"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserOffers, useCancelOffer } from "@/hooks/useTrade"
import { useAccountBalances } from "@/hooks/useAccountData"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthErrorDisplay } from "@/components/auth-error-display"

interface ActiveOffersProps {
  account: string
}

export function ActiveOffers({ account }: ActiveOffersProps) {
  const { toast } = useToast()
  const { offers, isLoading, error } = useUserOffers(account)
  const { cancelOffer, isLoading: cancelling } = useCancelOffer()
  const { refresh: refreshBalances } = useAccountBalances(account)
  const [userSecret, setUserSecret] = useState<string>("")
  const [cancellingOfferId, setCancellingOfferId] = useState<string | null>(null)

  const handleCancel = async (offer: any) => {
    if (!userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to cancel the offer.", 
        variant: "destructive" 
      })
      return
    }

    setCancellingOfferId(offer.id)

    try {
      await cancelOffer({
        userSecret: userSecret.trim(),
        selling: offer.selling,
        buying: offer.buying,
        offerId: offer.id,
      })

      toast({ title: "Offer cancelled", description: "Your offer has been cancelled successfully." })
      setUserSecret("") // Clear secret after successful transaction
      
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
          <AuthErrorDisplay error={error} />
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading offers...
            </div>
          ) : error && error.status !== 401 && error.status !== 403 ? (
            <div className="text-sm text-destructive py-8 text-center">
              {error.message || "Failed to load offers"}
            </div>
          ) : offers.length === 0 && !error ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No active offers
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-2">
                <Label>Secret Seed (Required to Cancel Offers)</Label>
                <Input
                  type="password"
                  placeholder="Enter your secret seed (starts with S...)"
                  value={userSecret}
                  onChange={(event) => setUserSecret(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your secret seed to cancel offers. We don't store your secret seed.
                </p>
              </div>
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
                    disabled={cancelling || cancellingOfferId === offer.id || !userSecret.trim()}
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
    </>
  )
}

