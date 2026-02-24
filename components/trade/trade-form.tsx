"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useBalanceRefresh } from "@/components/providers/balance-refresh-provider"
import { useCreateSellOffer, useCreateBuyOffer, useSearchAssets } from "@/hooks/useTrade"

interface TradeFormProps {
  publicKey?: string
}

// Parse token string (e.g., "native" or "CODE:ISSUER") into { code, issuer }
const parseToken = (token: string): { code: string; issuer?: string } => {
  if (!token || token.trim() === "") return { code: "" }
  const trimmed = token.trim()
  if (trimmed === "native") {
    return { code: "native" }
  }
  const parts = trimmed.split(":")
  if (parts.length === 2) {
    return { code: parts[0].trim(), issuer: parts[1].trim() }
  }
  return { code: trimmed }
}

// Convert token to descriptor string for API
const tokenToDescriptor = (token: { code: string; issuer?: string }): string => {
  if (token.code === "native") return "native"
  if (token.issuer) return `${token.code}:${token.issuer}`
  return token.code
}

export function TradeForm({ publicKey }: TradeFormProps) {
  const { toast } = useToast()
  const { balances, refresh: refreshBalances } = useAccountBalances(publicKey)
  const { refreshBalances: refreshBalancesGlobal } = useBalanceRefresh() ?? {}
  const [tradeType, setTradeType] = useState<"sell" | "buy">("sell")
  
  // Token selection
  const [sellingToken, setSellingToken] = useState<string>("")
  const [buyingToken, setBuyingToken] = useState<string>("")
  const [buyingTokenSearch, setBuyingTokenSearch] = useState<string>("")
  
  // Form inputs
  const [amount, setAmount] = useState("")
  const [price, setPrice] = useState("")
  const [buyAmount, setBuyAmount] = useState("") // For buy offers
  const [userSecret, setUserSecret] = useState<string>("")
  const [showSecretDialog, setShowSecretDialog] = useState(false)

  // Search assets for buying token
  const { assets: searchResults, isLoading: searchingAssets } = useSearchAssets(
    buyingTokenSearch && buyingTokenSearch.length >= 2 ? buyingTokenSearch : undefined,
    10
  )

  // Parse tokens
  const sellingTokenParsed = useMemo(() => parseToken(sellingToken), [sellingToken])
  const buyingTokenParsed = useMemo(() => parseToken(buyingToken), [buyingToken])

  const { createSellOffer, isLoading: creatingSell, error: sellError } = useCreateSellOffer()
  const { createBuyOffer, isLoading: creatingBuy, error: buyError } = useCreateBuyOffer()

  const handleCreateOffer = () => {
    if (!publicKey) {
      toast({ title: "Wallet required", description: "Wallet required", variant: "destructive" })
      return
    }

    if (!sellingToken || !buyingToken) {
      toast({ title: "Tokens required", description: "Please select both selling and buying tokens.", variant: "destructive" })
      return
    }

    if (tradeType === "sell") {
      if (!amount || !price) {
        toast({ title: "Amount and price required", description: "Please enter amount and price for the sell offer.", variant: "destructive" })
        return
      }
    } else {
      if (!buyAmount || !price) {
        toast({ title: "Amount and price required", description: "Please enter buy amount and price for the buy offer.", variant: "destructive" })
        return
      }
    }

    setShowSecretDialog(true)
  }

  const handleSubmit = async () => {
    if (!userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Your secret seed is required to sign the transaction.",
        variant: "destructive" 
      })
      return
    }

    try {
      const sellingDescriptor = tokenToDescriptor(sellingTokenParsed)
      const buyingDescriptor = tokenToDescriptor(buyingTokenParsed)

      if (tradeType === "sell") {
        await createSellOffer({
          userSecret: userSecret.trim(),
          selling: sellingDescriptor,
          buying: buyingDescriptor,
          amount: amount,
          price: price,
        })
        toast({ title: "Sell offer created", description: `Selling ${amount} ${sellingTokenParsed.code} at ${price} per unit.` })
      } else {
        await createBuyOffer({
          userSecret: userSecret.trim(),
          selling: sellingDescriptor,
          buying: buyingDescriptor,
          buyAmount: buyAmount,
          price: price,
        })
        toast({ title: "Buy offer created", description: `Buying ${buyAmount} ${buyingTokenParsed.code} at ${price} per unit.` })
      }

      // Reset form
      setAmount("")
      setBuyAmount("")
      setPrice("")
      setUserSecret("") // Clear secret after successful transaction
      setShowSecretDialog(false) // Close dialog
      
      // Refresh balances after successful offer creation
      setTimeout(() => {
        refreshBalances()
        refreshBalancesGlobal?.()
      }, 2000) // Wait 2 seconds for transaction to be processed
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to create offer"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleBuyingTokenSelect = (value: string) => {
    setBuyingToken(value)
    setBuyingTokenSearch("")
  }

  const { error: balancesError } = useAccountBalances(publicKey)

  return (
    <>
      <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Create Trade Offer</h2>
          </div>

          <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as "sell" | "buy")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sell">Sell</TabsTrigger>
              <TabsTrigger value="buy">Buy</TabsTrigger>
            </TabsList>

            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Selling Token</div>
                  <Select value={sellingToken} onValueChange={setSellingToken}>
                    <SelectTrigger className="rounded-2xl p-4 pt-8 border border-border/50 h-auto">
                      <SelectValue placeholder="Select token to sell" />
                    </SelectTrigger>
                  <SelectContent>
                    {balances
                      .filter((balance) => {
                        // Filter out balances that would result in empty value
                        if (balance.assetType === "native") return true
                        return balance.assetCode && balance.assetCode.trim() !== ""
                      })
                      .map((balance) => {
                        const isNative = balance.assetType === "native"
                        const displayName = isNative ? "Test Pi" : balance.assetCode
                        const value = isNative ? "native" : (balance.assetIssuer ? `${balance.assetCode}:${balance.assetIssuer}` : balance.assetCode || "unknown")
                        const amount = Number(balance.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })
                        return (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{displayName}</span>
                              <span className="text-xs text-muted-foreground ml-2">{amount}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Buying Token</div>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Search for token (e.g., WPI, ZYRA)"
                      value={buyingTokenSearch}
                      onChange={(e) => setBuyingTokenSearch(e.target.value)}
                      className="rounded-2xl p-4 pt-8 pl-10 border border-border/50"
                    />
                  </div>
                </div>
                {buyingTokenSearch.length >= 2 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {searchingAssets ? (
                      <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y">
                        {searchResults.map((asset) => {
                          const value = asset.asset_type === "native" ? "native" : `${asset.asset_code}:${asset.asset_issuer}`
                          const displayName = asset.asset_type === "native" ? "Test Pi" : asset.asset_code
                          return (
                            <button
                              key={value}
                              onClick={() => handleBuyingTokenSelect(value)}
                              className="w-full p-3 text-left hover:bg-muted transition-colors"
                            >
                              <div className="font-medium">{displayName}</div>
                              {asset.asset_issuer && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {asset.asset_issuer.slice(0, 8)}...{asset.asset_issuer.slice(-6)}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground">No tokens found</div>
                    )}
                  </div>
                )}
                {buyingToken && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                    Selected: {buyingTokenParsed.code === "native" ? "Test Pi" : buyingTokenParsed.code}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Amount to Sell</div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-2xl p-4 pt-8 border border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Price (per unit)</div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded-2xl p-4 pt-8 border border-border/50"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10"> You'll Pay </div>
                  <Select value={sellingToken} onValueChange={setSellingToken}>
                    <SelectTrigger className="rounded-2xl p-4 pt-8 border border-border/50 h-auto">
                      <SelectValue placeholder="Select token to pay with" />
                    </SelectTrigger>
                  <SelectContent>
                    {balances
                      .filter((balance) => {
                        // Filter out balances that would result in empty value
                        if (balance.assetType === "native") return true
                        return balance.assetCode && balance.assetCode.trim() !== ""
                      })
                      .map((balance) => {
                        const isNative = balance.assetType === "native"
                        const displayName = isNative ? "Test Pi" : balance.assetCode
                        const value = isNative ? "native" : (balance.assetIssuer ? `${balance.assetCode}:${balance.assetIssuer}` : balance.assetCode || "unknown")
                        const amount = Number(balance.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })
                        return (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{displayName}</span>
                              <span className="text-xs text-muted-foreground ml-2">{amount}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Buying Token</div>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Search for token (e.g., WPI, ZYRA)"
                      value={buyingTokenSearch}
                      onChange={(e) => setBuyingTokenSearch(e.target.value)}
                      className="rounded-2xl p-4 pt-8 pl-10 border border-border/50"
                    />
                  </div>
                </div>
                {buyingTokenSearch.length >= 2 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {searchingAssets ? (
                      <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y">
                        {searchResults.map((asset) => {
                          const value = asset.asset_type === "native" ? "native" : `${asset.asset_code}:${asset.asset_issuer}`
                          const displayName = asset.asset_type === "native" ? "Test Pi" : asset.asset_code
                          return (
                            <button
                              key={value}
                              onClick={() => handleBuyingTokenSelect(value)}
                              className="w-full p-3 text-left hover:bg-muted transition-colors"
                            >
                              <div className="font-medium">{displayName}</div>
                              {asset.asset_issuer && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {asset.asset_issuer.slice(0, 8)}...{asset.asset_issuer.slice(-6)}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground">No tokens found</div>
                    )}
                  </div>
                )}
                {buyingToken && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                    Selected: {buyingTokenParsed.code === "native" ? "Test Pi" : buyingTokenParsed.code}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Amount to Buy</div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="rounded-2xl p-4 pt-8 border border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Price (per unit)</div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded-2xl p-4 pt-8 border border-border/50"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Only show non-auth errors here */}
          {(sellError || buyError) && sellError?.status !== 401 && sellError?.status !== 403 && buyError?.status !== 401 && buyError?.status !== 403 && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
              {(sellError || buyError)?.message || "An error occurred"}
            </div>
          )}

          <Button
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 mt-6"
            onClick={handleCreateOffer}
            disabled={creatingSell || creatingBuy}
          >
            {(creatingSell || creatingBuy) ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              tradeType === "sell" ? "Create Sell Offer" : "Create Buy Offer"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Secret Seed Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm {tradeType === "sell" ? "Sell" : "Buy"} Offer</DialogTitle>
            <DialogDescription>
              Enter your secret seed to sign and execute the transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Seed</label>
              <Input
                type="password"
                placeholder="Enter your secret seed (starts with S...)"
                value={userSecret}
                onChange={(event) => setUserSecret(event.target.value)}
                className="font-mono"
                autoFocus
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
                  setShowSecretDialog(false)
                  setUserSecret("")
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                onClick={handleSubmit}
                disabled={creatingSell || creatingBuy || !userSecret.trim()}
              >
                {(creatingSell || creatingBuy) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

