"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, Settings, Loader2 } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useToast } from "@/hooks/use-toast"
import { usePoolsForPair, useSwapQuote, useExecuteSwap } from "@/hooks/useSwapData"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("bingepi-wallet-address")
}

interface AssetOption {
  code: string
  issuer?: string
  label: string
}

const formatAssetLabel = (code: string, issuer?: string | null) =>
  issuer ? `${code} (${issuer.slice(0, 6)}...)` : code === "native" ? "PI (native)" : code

export function SwapCard() {
  const { user } = usePi()
  const { toast } = useToast()
  const [localWallet, setLocalWallet] = useState<string | null>(null)

  useEffect(() => {
    setLocalWallet(getStoredWallet())
  }, [])

  const publicKey = user?.wallet_address || localWallet || undefined
  const { balances } = useAccountBalances(publicKey)

  const assetOptions = useMemo<AssetOption[]>(() => {
    const assets: AssetOption[] = [{ code: "native", label: "PI (native)" }]
    balances.forEach((balance) => {
      if (balance.assetType === "native") return
      assets.push({
        code: balance.assetCode,
        issuer: balance.assetIssuer ?? undefined,
        label: formatAssetLabel(balance.assetCode, balance.assetIssuer),
      })
    })
    return assets
  }, [balances])

  const firstOption = assetOptions[0]
  const secondOption = assetOptions[1] ?? assetOptions[0]

  const [fromAssetCode, setFromAssetCode] = useState(firstOption?.code ?? "native")
  const [fromAssetIssuer, setFromAssetIssuer] = useState<string>(firstOption?.issuer ?? "")
  const [toAssetCode, setToAssetCode] = useState(secondOption?.code ?? "native")
  const [toAssetIssuer, setToAssetIssuer] = useState<string>(secondOption?.issuer ?? "")
  const [fromAmount, setFromAmount] = useState("")
  const [userSecret, setUserSecret] = useState("")

  useEffect(() => {
    if (!firstOption) return
    setFromAssetCode(firstOption.code)
    setFromAssetIssuer(firstOption.issuer ?? "")
    if (secondOption) {
      setToAssetCode(secondOption.code)
      setToAssetIssuer(secondOption.issuer ?? "")
    }
  }, [firstOption?.code, firstOption?.issuer, secondOption?.code, secondOption?.issuer])

  const fromDescriptor = fromAssetCode === "native" ? "native" : `${fromAssetCode}:${fromAssetIssuer}`
  const toDescriptor = toAssetCode === "native" ? "native" : `${toAssetCode}:${toAssetIssuer}`

  const poolsEnabled = Boolean(fromAssetCode && toAssetCode && fromAssetCode !== toAssetCode)
  const { pools } = usePoolsForPair(
    poolsEnabled
      ? {
          tokenA: fromAssetCode,
          tokenB: toAssetCode,
        }
      : undefined
  )

  const selectedPoolId = pools?.[0]?.id
  const quoteEnabled = Boolean(selectedPoolId && fromAmount && Number(fromAmount) > 0)

  const { quote, isLoading: quoting } = useSwapQuote(
    quoteEnabled
      ? {
          poolId: selectedPoolId,
          from: fromDescriptor,
          to: toDescriptor,
          amount: fromAmount,
        }
      : undefined
  )

  const { executeSwap, isLoading: executing } = useExecuteSwap()

  const handleSwapTokens = () => {
    setFromAssetCode(toAssetCode)
    setFromAssetIssuer(toAssetIssuer)
    setToAssetCode(fromAssetCode)
    setToAssetIssuer(fromAssetIssuer)
  }

  const applySuggestedAsset = (setter: (code: string, issuer?: string) => void, asset: AssetOption) => {
    setter(asset.code, asset.issuer)
  }

  const handleSubmit = async () => {
    if (!selectedPoolId) {
      toast({ title: "No pool available", description: "Select a valid asset pair with available liquidity.", variant: "destructive" })
      return
    }
    if (!userSecret) {
      toast({ title: "Secret required", description: "Enter the secret key to sign the swap transaction.", variant: "destructive" })
      return
    }
    try {
      await executeSwap({
        userSecret,
        poolId: selectedPoolId,
        from: fromDescriptor,
        to: toDescriptor,
        sendAmount: fromAmount,
      })
      toast({ title: "Swap executed", description: "The transaction was submitted to the network." })
      setFromAmount("")
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Swap failed"
      toast({ title: "Swap failed", description: message, variant: "destructive" })
    }
  }

  const poolSummary = () => {
    if (!poolsEnabled) return "Select two distinct assets to view pools."
    if (!pools?.length) return "No pools found for this pair."
    return `${pools.length} pool${pools.length > 1 ? "s" : ""} available`
  }

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-lg p-px">
        <div className="h-full w-full rounded-lg bg-background/95 backdrop-blur-sm" />
      </div>
      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Swap
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50" disabled>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{poolSummary()}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">From Asset</Label>
            <div className="grid gap-2">
              <div className="grid md:grid-cols-2 gap-2">
                <Input
                  placeholder="Asset code"
                  value={fromAssetCode}
                  onChange={(event) => setFromAssetCode(event.target.value.toUpperCase())}
                />
                <Input
                  placeholder="Issuer (optional)"
                  value={fromAssetIssuer}
                  onChange={(event) => setFromAssetIssuer(event.target.value)}
                  disabled={fromAssetCode === "native"}
                />
              </div>
              {assetOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assetOptions.map((asset) => (
                    <Button
                      key={`from-${asset.code}-${asset.issuer ?? "native"}`}
                      type="button"
                      size="sm"
                      variant={fromAssetCode === asset.code && (asset.issuer ?? "") === fromAssetIssuer ? "default" : "outline"}
                      onClick={() => applySuggestedAsset((code, issuer) => {
                        setFromAssetCode(code)
                        setFromAssetIssuer(issuer ?? "")
                      }, asset)}
                    >
                      {asset.label}
                    </Button>
                  ))}
                </div>
              )}
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(event) => setFromAmount(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 border-0 hover:scale-105 transition-transform shadow-lg hover:shadow-green-500/25"
              onClick={handleSwapTokens}
            >
              <ArrowDown className="h-4 w-4 text-white" />
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">To Asset</Label>
            <div className="grid gap-2">
              <div className="grid md:grid-cols-2 gap-2">
                <Input
                  placeholder="Asset code"
                  value={toAssetCode}
                  onChange={(event) => setToAssetCode(event.target.value.toUpperCase())}
                />
                <Input
                  placeholder="Issuer (optional)"
                  value={toAssetIssuer}
                  onChange={(event) => setToAssetIssuer(event.target.value)}
                  disabled={toAssetCode === "native"}
                />
              </div>
              {assetOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assetOptions.map((asset) => (
                    <Button
                      key={`to-${asset.code}-${asset.issuer ?? "native"}`}
                      type="button"
                      size="sm"
                      variant={toAssetCode === asset.code && (asset.issuer ?? "") === toAssetIssuer ? "default" : "outline"}
                      onClick={() => applySuggestedAsset((code, issuer) => {
                        setToAssetCode(code)
                        setToAssetIssuer(issuer ?? "")
                      }, asset)}
                    >
                      {asset.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Output</span>
                <span className="font-medium">{quote?.expectedOutput ?? "0.00"} {toAssetCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Received</span>
                <span className="font-medium text-green-500">{quote?.minOut ?? "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool Fee</span>
                <span className="font-medium">{quote?.fee ?? 0}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="swap-secret" className="text-sm font-medium text-muted-foreground">
              User Secret
            </Label>
            <Input
              id="swap-secret"
              placeholder="SXXXXXXXXXXXXXXXX"
              value={userSecret}
              onChange={(event) => setUserSecret(event.target.value)}
            />
          </div>

          <Button
            className="w-full h-12 btn-gradient-primary font-semibold shadow-lg"
            onClick={handleSubmit}
            disabled={executing || quoting || !quoteEnabled}
          >
            {executing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : quoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching quote...
              </>
            ) : (
              "Swap"
            )}
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}
