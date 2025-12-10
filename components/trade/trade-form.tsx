"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useCreateSellOffer, useCreateBuyOffer, useSearchAssets } from "@/hooks/useTrade"
import { AuthErrorDisplay } from "@/components/auth-error-display"

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

  const handleSubmit = async () => {
    if (!publicKey) {
      toast({ title: "Wallet required", description: "Please connect your wallet first.", variant: "destructive" })
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

    if (!userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to sign the transaction.",
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
      
      // Refresh balances after successful offer creation
      // Backend already clears cache, but we refresh to get the latest data
      setTimeout(() => {
        refreshBalances()
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
      <AuthErrorDisplay error={sellError || buyError || balancesError} />
      <Card>
        <CardHeader>
          <CardTitle>Create Trade Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as "sell" | "buy")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sell">Sell</TabsTrigger>
              <TabsTrigger value="buy">Buy</TabsTrigger>
            </TabsList>

            <TabsContent value="sell" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Selling Token (You Own)</Label>
                <Select value={sellingToken} onValueChange={setSellingToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token to sell" />
                  </SelectTrigger>
                  <SelectContent>
                    {balances.map((balance) => {
                      const isNative = balance.assetType === "native"
                      const displayName = isNative ? "Test Pi" : balance.assetCode
                      const value = isNative ? "native" : (balance.assetIssuer ? `${balance.assetCode}:${balance.assetIssuer}` : balance.assetCode)
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

              <div className="space-y-2">
                <Label>Buying Token</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for token (e.g., WPI, ZYRA)"
                    value={buyingTokenSearch}
                    onChange={(e) => setBuyingTokenSearch(e.target.value)}
                    className="pl-9"
                  />
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

              <div className="space-y-2">
                <Label>Amount to Sell</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Price (per unit)</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="buy" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Selling Token (You'll Pay With)</Label>
                <Select value={sellingToken} onValueChange={setSellingToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token to pay with" />
                  </SelectTrigger>
                  <SelectContent>
                    {balances.map((balance) => {
                      const isNative = balance.assetType === "native"
                      const displayName = isNative ? "Test Pi" : balance.assetCode
                      const value = isNative ? "native" : (balance.assetIssuer ? `${balance.assetCode}:${balance.assetIssuer}` : balance.assetCode)
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

              <div className="space-y-2">
                <Label>Buying Token</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for token (e.g., WPI, ZYRA)"
                    value={buyingTokenSearch}
                    onChange={(e) => setBuyingTokenSearch(e.target.value)}
                    className="pl-9"
                  />
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

              <div className="space-y-2">
                <Label>Amount to Buy</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Price (per unit)</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 space-y-2">
            <Label>Secret Seed (Required for Transaction)</Label>
            <Input
              type="password"
              placeholder="Enter your secret seed (starts with S...)"
              value={userSecret}
              onChange={(event) => setUserSecret(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter your secret seed to sign this transaction. We don't store your secret seed.
            </p>
          </div>

          {/* Only show non-auth errors here */}
          {(sellError || buyError) && sellError?.status !== 401 && sellError?.status !== 403 && buyError?.status !== 401 && buyError?.status !== 403 && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
              {(sellError || buyError)?.message || "An error occurred"}
            </div>
          )}

          <Button
            className="w-full mt-4 btn-gradient-primary"
            onClick={handleSubmit}
            disabled={creatingSell || creatingBuy || !userSecret.trim()}
          >
            {(creatingSell || creatingBuy) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {creatingSell || creatingBuy ? "Creating..." : tradeType === "sell" ? "Create Sell Offer" : "Create Buy Offer"}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

