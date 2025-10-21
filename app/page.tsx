"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, TrendingUp, Droplets, Loader2, Coins } from "lucide-react"
import { TokenCard } from "@/components/token-card"
import { LiquidityPoolCard } from "@/components/liquidity-pool-card"
import { DisclaimerPopup } from "@/components/disclaimer-popup"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchTokens, fetchTrendingTokens, setSearchQuery as setTokenSearchQuery } from "@/lib/store/slices/tokensSlice"
import { fetchPools, setSearchQuery as setPoolSearchQuery } from "@/lib/store/slices/liquidityPoolsSlice"
import { usePi } from "@/components/providers/pi-provider"

type SearchType = "tokens" | "pools"

export default function LandingPage() {
  const [searchInput, setSearchInput] = useState("")
  const [searchType, setSearchType] = useState<SearchType>("tokens")
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, authenticate, createPayment } = usePi()

  const {
    tokens,
    trendingTokens,
    loading: tokensLoading,
    hasMore,
    searchQuery: tokenSearchQuery,
  } = useAppSelector((state) => state.tokens)
  const {
    pools,
    loading: poolsLoading,
    hasMore: poolsHasMore,
    searchQuery: poolSearchQuery,
  } = useAppSelector((state) => state.liquidityPools)

  useEffect(() => {
    dispatch(fetchTokens({ limit: 12 }))
    dispatch(fetchPools({ limit: 12 }))
    dispatch(fetchTrendingTokens({ limit: 12 }))

    // Check if disclaimer has been accepted before
    const disclaimerAccepted = localStorage.getItem('bingepi-disclaimer-accepted')
    if (!disclaimerAccepted) {
      setDisclaimerOpen(true)
    }
  }, [dispatch])


  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchType === "tokens" && searchInput !== tokenSearchQuery) {
        dispatch(setTokenSearchQuery(searchInput))
      } else if (searchType === "pools" && searchInput !== poolSearchQuery) {
        dispatch(setPoolSearchQuery(searchInput))
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchInput, searchType, dispatch, tokenSearchQuery, poolSearchQuery])

  const handleMintClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Pi wallet using the navbar to mint tokens.",
        variant: "destructive",
      })
    } else {
      router.push("/mint")
    }
  }

  const handleDisclaimerClose = () => {
    localStorage.setItem('bingepi-disclaimer-accepted', 'true')
    setDisclaimerOpen(false)
  }


  const handleLoadMoreTokens = () => {
    if (!tokensLoading && hasMore) {
      dispatch(fetchTokens({ limit: 12, search: tokenSearchQuery }))
    }
  }

  const handleLoadMorePools = () => {
    if (!poolsLoading && poolsHasMore) {
      dispatch(fetchPools({ limit: 12, search: poolSearchQuery }))
    }
  }

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type)
    setSearchInput("")
    dispatch(setTokenSearchQuery(""))
    dispatch(setPoolSearchQuery(""))
  }

  return (
    <div className="min-h-screen premium-gradient">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-3">
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
                placeholder={`Search ${searchType === "tokens" ? "tokens by code or issuer" : "pools by asset pair"}...`}
                className="pl-10 bg-card border-border"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="  bg-primary text-primary-foreground hover:bg-primary/90 font-semibold self-end"
            onClick={handleMintClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Mint Token
          </Button>
        </div>

        {/* Trending Section */}
        {!searchInput && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingTokens.map((token, index) => (
                <TokenCard key={token.paging_token} token={token} index={index} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {(searchType === "tokens" || !searchInput) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              {searchInput ? `Token Results for "${searchInput}"` : "Recent Tokens"}
            </h2>

            {tokensLoading && tokens.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!tokensLoading && tokens.length === 0 && searchInput && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tokens found matching "{searchInput}"</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map((token, index) => (
                <TokenCard key={token.paging_token} token={token} index={index} />
              ))}
            </div>

            {hasMore && tokens.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleLoadMoreTokens}
                  disabled={tokensLoading}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px] bg-transparent"
                >
                  {tokensLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Tokens"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {(searchType === "pools" || !searchInput) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                {searchInput ? `Pool Results for "${searchInput}"` : "Liquidity Pools"}
              </h2>
            </div>

            {poolsLoading && pools.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!poolsLoading && pools.length === 0 && searchInput && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No liquidity pools found matching "{searchInput}"</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pools.map((pool, index) => (
                <LiquidityPoolCard key={pool.id} pool={pool} index={index} />
              ))}
            </div>

            {poolsHasMore && pools.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleLoadMorePools}
                  disabled={poolsLoading}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px] bg-transparent"
                >
                  {poolsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Pools"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <DisclaimerPopup open={disclaimerOpen} onOpenChange={handleDisclaimerClose} />
    </div>
  )
}
