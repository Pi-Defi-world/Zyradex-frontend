"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, Settings, Loader2 } from "lucide-react"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePoolsForPair, useSwapQuote, useExecuteSwap } from "@/hooks/useSwapData"
import { useToast } from "@/hooks/use-toast"

interface AssetOption {
  code: string
  issuer?: string
  label: string
}

const buildOptions = (tokens: ReturnType<typeof useTokenRegistry>["tokens"]): AssetOption[] => {
  const defaults: AssetOption[] = [{ code: "native", label: "PI (native)" }]
  const registry = tokens.map((token) => ({
    code: token.assetCode,
    issuer: token.issuer,
    label: `${token.assetCode} (${token.issuer.slice(0, 6)}...)`,
  }))
  return [...defaults, ...registry]
}

const stringifyAsset = (asset: AssetOption) =>
  asset.code === "native" ? "native" : `${asset.code}:${asset.issuer ?? ""}`

export function SwapCard() {
  const { toast } = useToast()
  const { tokens, isLoading: tokensLoading } = useTokenRegistry()
  const assetOptions = useMemo(() => buildOptions(tokens), [tokens])

  const [fromAsset, setFromAsset] = useState<AssetOption>(assetOptions[0] ?? { code: "native", label: "PI (native)" })
  const [toAsset, setToAsset] = useState<AssetOption>(assetOptions[1] ?? assetOptions[0] ?? { code: "native", label: "PI (native)" })
  const [fromAmount, setFromAmount] = useState("")
  const [userSecret, setUserSecret] = useState("")

  useEffect(() => {
    if (assetOptions.length && !assetOptions.find((option) => option.code === fromAsset.code && option.issuer === fromAsset.issuer)) {
      setFromAsset(assetOptions[0])
    }
    if (assetOptions.length && !assetOptions.find((option) => option.code === toAsset.code && option.issuer === toAsset.issuer)) {
      setToAsset(assetOptions[1] ?? assetOptions[0])
    }
  }, [assetOptions])

  const poolsQueryEnabled = fromAsset.code !== toAsset.code
  const { pools } = usePoolsForPair(
    poolsQueryEnabled
      ? {
          tokenA: fromAsset.code,
          tokenB: toAsset.code,
        }
      : undefined
  )

  const selectedPoolId = pools?.[0]?.id
  const quoteEnabled = Boolean(selectedPoolId && fromAmount)

  const { quote, isLoading: quoting } = useSwapQuote(
    quoteEnabled
      ? {
          poolId: selectedPoolId,
          from: stringifyAsset(fromAsset),
          to: stringifyAsset(toAsset),
          amount: fromAmount,
        }
      : undefined
  )

  const { executeSwap, isLoading: executing } = useExecuteSwap()

  const handleSwapTokens = () => {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
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
        from: stringifyAsset(fromAsset),
        to: stringifyAsset(toAsset),
        sendAmount: fromAmount,
      })
      toast({ title: "Swap executed", description: "The transaction was submitted to the network." })
      setFromAmount("")
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Swap failed"
      toast({ title: "Swap failed", description: message, variant: "destructive" })
    }
  }

  const secondaryText = () => {
    if (!poolsQueryEnabled) return "Select two distinct assets to view pools."
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
            <span>{secondaryText()}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">From</Label>
            <div className="flex items-center gap-2">
              <Select
                value={JSON.stringify(fromAsset)}
                onValueChange={(value) => setFromAsset(JSON.parse(value))}
                disabled={tokensLoading}
              >
                <SelectTrigger className="w-[160px] h-12 bg-muted/30 border-border/50 hover:border-border transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetOptions.map((option) => (
                    <SelectItem key={`${option.code}-${option.issuer}`} value={JSON.stringify(option)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={fromAmount}
                onChange={(event) => setFromAmount(event.target.value)}
                className="h-12 bg-muted/30 border-border/50 hover:border-border transition-colors text-right"
              />
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">To</Label>
            <div className="flex items-center gap-2">
              <Select
                value={JSON.stringify(toAsset)}
                onValueChange={(value) => setToAsset(JSON.parse(value))}
                disabled={tokensLoading}
              >
                <SelectTrigger className="w-[160px] h-12 bg-muted/30 border-border/50 hover:border-border transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetOptions.map((option) => (
                    <SelectItem key={`${option.code}-${option.issuer}`} value={JSON.stringify(option)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                readOnly
                value={quote?.expectedOutput ?? "0.00"}
                className="h-12 bg-muted/30 border-border/50 text-right"
              />
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

          {quote && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">
                  1 {fromAsset.code} ≈ {Number(quote.expectedOutput) / Number(fromAmount || 1) || 0}
                  {" "}
                  {toAsset.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Received</span>
                <span className="font-medium text-green-500">{quote.minOut} {toAsset.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool Fee</span>
                <span className="font-medium">{quote.fee}%</span>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 btn-gradient-primary font-semibold shadow-lg"
            onClick={handleSubmit}
            disabled={executing || tokensLoading || !fromAmount || !quoteEnabled}
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
