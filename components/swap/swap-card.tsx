"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, Settings, Wallet, Loader2 } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"

interface Token {
  symbol: string
  name: string
  balance: string
  logo?: string
}

const tokens: Token[] = [
  { symbol: "PI", name: "Pi Network", balance: "1,234.56" },
  { symbol: "PIUSD", name: "Pi USD", balance: "5,000.00" },
  { symbol: "PEPE", name: "Pepe Coin", balance: "10,000" },
  { symbol: "DOGE", name: "Doge Token", balance: "2,500" },
]

export function SwapCard() {
  const { isAuthenticated, authenticate, user } = usePi()
  const [fromToken, setFromToken] = useState("PI")
  const [toToken, setToToken] = useState("PIUSD")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleConnectWallet = async () => {
    if (typeof window === 'undefined') {
      alert('Window not available. Please refresh the page.')
      return
    }

    if (!window.Pi) {
      alert('Pi SDK not available. Please open this app in Pi Browser.')
      return
    }

    setIsLoading(true)
    try {
      await authenticate()
    } catch (error) {
      console.error('Pi authentication failed:', error)
      alert(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwap = () => {
    // TODO: Implement swap logic
    console.log('Executing swap...')
  }

  const fromTokenData = tokens.find(t => t.symbol === fromToken)
  const toTokenData = tokens.find(t => t.symbol === toToken)

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm shadow-2xl">
      {/* Premium gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-lg p-px">
        <div className="h-full w-full rounded-lg bg-background/95 backdrop-blur-sm" />
      </div>
      
      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Swap
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Slippage: 0.5%</span>
            <span>•</span>
            <span>Fee: 0.3%</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">From</Label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="w-[140px] h-12 bg-muted/30 border-border/50 hover:border-border transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                            {token.symbol.charAt(0)}
                          </div>
                          {token.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="h-12 bg-muted/30 border-border/50 hover:border-border transition-colors text-right pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-muted/50">
                      Max
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-muted/50">
                      50%
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  Balance: {fromTokenData?.balance || "0"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${fromAmount ? (parseFloat(fromAmount) * 0.5).toFixed(2) : "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
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

          {/* To Token */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">To</Label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-[140px] h-12 bg-muted/30 border-border/50 hover:border-border transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {token.symbol.charAt(0)}
                          </div>
                          {token.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="h-12 bg-muted/30 border-border/50 hover:border-border transition-colors text-right pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-muted/50">
                      Max
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-muted/50">
                      50%
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  Balance: {toTokenData?.balance || "0"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${toAmount ? (parseFloat(toAmount) * 0.5).toFixed(2) : "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          {fromAmount && toAmount && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">
                  1 {fromToken} = 1.05 {toToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span className="font-medium text-green-500">0.12%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Liquidity Provider Fee</span>
                <span className="font-medium">0.3%</span>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Button
            className="w-full h-12 btn-gradient-primary font-semibold shadow-lg"
            onClick={isAuthenticated ? handleSwap : handleConnectWallet}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : isAuthenticated ? (
              "Swap"
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}
