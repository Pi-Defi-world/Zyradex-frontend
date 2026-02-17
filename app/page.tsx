"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, TrendingUp, Droplets, Loader2, Coins } from "lucide-react"
import { TokenCard, type TokenSummary } from "@/components/token-card"
import { LiquidityPoolCard } from "@/components/liquidity-pool-card"
import { DisclaimerPopup } from "@/components/disclaimer-popup"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { useLiquidityPools } from "@/hooks/useLiquidityData"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { useAccountBalances } from "@/hooks/useAccountData"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const buildTokenSummary = (token: ReturnType<typeof useTokenRegistry>["tokens"][number]): TokenSummary => ({
  code: token.assetCode,
  issuer: token.issuer,
  name: token.name,
  totalSupply: token.totalSupply,
  description: token.description,
})

export default function LandingPage() {
  const [searchInput, setSearchInput] = useState("")
  const [searchType, setSearchType] = useState<"tokens" | "pools">("tokens")
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { adminUser } = useAdminAuth()
  const publicKey = adminUser?.public_key?.trim() ?? undefined

  const { tokens, isLoading: tokensLoading } = useTokenRegistry()
  const { pools, isLoading: poolsLoading } = useLiquidityPools({ limit: 20 })
  const { balances } = useAccountBalances(publicKey)

  const tokenSummaries = useMemo(() => tokens.map(buildTokenSummary), [tokens])
  const trendingTokens = tokenSummaries.slice(0, 6)

  const filteredTokens = useMemo(() => {
    if (!searchInput.trim()) return tokenSummaries
    const query = searchInput.trim().toUpperCase()
    return tokenSummaries.filter((token) => token.code.toUpperCase().includes(query))
  }, [tokenSummaries, searchInput])

  const filteredPools = useMemo(() => {
    if (!searchInput.trim()) return pools.map((pool) => pool)
    const query = searchInput.trim().toUpperCase()
    return pools.filter((pool) =>
      pool.reserves.some((reserve) => reserve.asset.toUpperCase().includes(query))
    )
  }, [pools, searchInput])

  useEffect(() => {
    const disclaimerAccepted = localStorage.getItem("bingepi-disclaimer-accepted")
    if (!disclaimerAccepted) {
      setDisclaimerOpen(true)
    }
  }, [])

  const handleMintClick = () => {
    if (!adminUser) {
      toast({
        title: "Authentication Required",
        description: "Please connect with Pi using the navbar to mint tokens.",
        variant: "destructive",
      })
    } else {
      router.push("/mint")
    }
  }

  const handleDisclaimerClose = () => {
    localStorage.setItem("bingepi-disclaimer-accepted", "true")
    setDisclaimerOpen(false)
  }

  const handleSearchTypeChange = (type: "tokens" | "pools") => {
    setSearchType(type)
    setSearchInput("")
  }

  return (
    <div className="min-h-screen premium-gradient">
      <div className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => handleSearchTypeChange("tokens")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  searchType === "tokens"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Coins className="h-4 w-4" />
                Tokens
              </button>
              <button
                onClick={() => handleSearchTypeChange("pools")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  searchType === "pools"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Droplets className="h-4 w-4" />
                Pools
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${searchType === "tokens" ? "tokens by code" : "pools by asset pair"}...`}
                className="pl-10 bg-card border-border"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
          </div>
          <Button size="sm" className="btn-gradient-primary self-end" onClick={handleMintClick}>
            <Plus className="mr-2 h-4 w-4" />
            Mint Token
          </Button>
        </div>

        {!searchInput && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingTokens.map((token, index) => (
                <TokenCard key={`${token.code}-${index}`} token={token} index={index} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {(searchType === "tokens" || !searchInput) && (
          <Card>
            <CardHeader>
              <CardTitle>{searchInput ? `Token Results for "${searchInput}"` : "Recent Tokens"}</CardTitle>
              <CardDescription>Registry of tokens available for trustlines and swaps</CardDescription>
            </CardHeader>
            <CardContent>
              {tokensLoading && !filteredTokens.length ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tokens...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTokens.map((token, index) => (
                    <TokenCard key={`${token.code}-${index}`} token={token} index={index} />
                  ))}
                </div>
              )}
              {!tokensLoading && !filteredTokens.length && (
                <div className="text-sm text-muted-foreground py-6 text-center">No tokens found matching "{searchInput}"</div>
              )}
            </CardContent>
          </Card>
        )}

        {(searchType === "pools" || !searchInput) && (
          <Card>
            <CardHeader>
              <CardTitle>{searchInput ? `Pool Results for "${searchInput}"` : "Liquidity Pools"}</CardTitle>
              <CardDescription>Explore Pi liquidity pools sourced from Horizon</CardDescription>
            </CardHeader>
            <CardContent>
              {poolsLoading && !filteredPools.length ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading pools...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPools.map((pool, index) => (
                    <LiquidityPoolCard key={pool.id} pool={pool} index={index} />
                  ))}
                </div>
              )}
              {!poolsLoading && !filteredPools.length && (
                <div className="text-sm text-muted-foreground py-6 text-center">No liquidity pools found matching "{searchInput}"</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <DisclaimerPopup open={disclaimerOpen} onOpenChange={handleDisclaimerClose} />
    </div>
  )
}
