"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Loader2, CheckCircle2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useAvailableTokens } from "@/hooks/useAvailableTokens"
import { useCheckTrustline } from "@/hooks/useCheckTrustline"
import { TrustlineDialog } from "@/components/trustlines/trustline-dialog"
import { AuthErrorDisplay } from "@/components/auth-error-display"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function TrustlinesPage() {
  const { user, isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedToken, setSelectedToken] = useState<{
    assetCode: string
    issuer: string
    name?: string
  } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const publicKey = isAuthenticated
    ? (profile?.public_key || user?.wallet_address || getStoredWallet() || undefined)
    : undefined

  const { balances, refresh: refreshBalances } = useAccountBalances(publicKey)
  const { tokens, isLoading: tokensLoading, error: tokensError } = useAvailableTokens({
    searchQuery,
    limit: 50,
    enabled: true,
  })

  // Check which tokens user already has trustlines for
  const userTrustedTokens = useMemo(() => {
    const trusted = new Set<string>()
    balances.forEach((balance) => {
      if (balance.assetType === "native") return
      const key = `${balance.assetCode}:${balance.assetIssuer || ""}`
      trusted.add(key)
    })
    return trusted
  }, [balances])

  const handleToggleToken = (token: typeof tokens[0]) => {
    const tokenKey = `${token.assetCode}:${token.issuer}`
    const hasTrustline = userTrustedTokens.has(tokenKey)

    if (hasTrustline) {
      toast({
        title: "Already trusted",
        description: `You already have a trustline for ${token.assetCode}.`,
      })
      return
    }

    setSelectedToken({
      assetCode: token.assetCode,
      issuer: token.issuer,
      name: token.name,
    })
    setDialogOpen(true)
  }

  const handleTrustlineSuccess = () => {
    refreshBalances()
  }

  // Filter tokens based on search (if search is active, show network tokens; otherwise show all)
  const displayedTokens = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show platform tokens when no search
      return tokens.filter((t) => t.isPlatformToken)
    }
    // Show all matching tokens when searching
    return tokens
  }, [tokens, searchQuery])

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <AuthErrorDisplay error={tokensError} />

        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Manage Token List</CardTitle>
            <CardDescription>
              Browse and establish trustlines for tokens. Platform tokens appear first, followed by
              popular network tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens by asset code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Token List */}
            <div className="space-y-2">
              {tokensLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading tokens...
                </div>
              ) : displayedTokens.length === 0 ? (
                <div className="text-sm text-muted-foreground py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                  {searchQuery.trim()
                    ? "No tokens found matching your search"
                    : "No tokens available"}
                </div>
              ) : (
                displayedTokens.map((token) => {
                  const tokenKey = `${token.assetCode}:${token.issuer}`
                  const hasTrustline = userTrustedTokens.has(tokenKey)

                  return (
                    <div
                      key={tokenKey}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-foreground">
                            {token.name || token.assetCode}
                          </p>
                          {token.isPlatformToken && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              Platform
                            </span>
                          )}
                          {hasTrustline && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {token.assetCode}:{token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}
                        </p>
                        {token.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {token.description}
                          </p>
                        )}
                        {token.numAccounts !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {token.numAccounts.toLocaleString()} accounts
                          </p>
                        )}
                      </div>
                      <div className="ml-4 shrink-0">
                        {hasTrustline ? (
                          <Button variant="outline" disabled className="rounded-xl">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Trusted
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => handleToggleToken(token)}
                            className="rounded-xl"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {searchQuery.trim() && displayedTokens.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Showing {displayedTokens.length} result{displayedTokens.length !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedToken && (
        <TrustlineDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          token={selectedToken}
          onSuccess={handleTrustlineSuccess}
        />
      )}
    </div>
  )
}

