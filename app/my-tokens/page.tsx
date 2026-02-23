"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { usePi } from "@/components/providers/pi-provider"

const formatSupply = (value?: number) =>
  (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })

export default function MyTokensPage() {
  const { tokens, isLoading, error } = useTokenRegistry()
  const { isAuthenticated } = usePi()
  const router = useRouter()

  // Check if error is auth-related
  const isAuthError = error?.status === 401 || error?.status === 403

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Minted Tokens</CardTitle>
              <CardDescription>Tokens created through the platform registry</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                  <p className="text-sm font-medium text-destructive mb-2">{error.message}</p>
                  {error.suggestion && (
                    <p className="text-xs text-muted-foreground mb-3">{error.suggestion}</p>
                  )}
                  {isAuthError && !isAuthenticated && (
                    <Button 
                      onClick={() => router.push("/profile")}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Sign In to Continue
                    </Button>
                  )}
                </div>
              )}
              {isLoading && !tokens.length && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tokens...
          </div>
        )}
              {!isLoading && !tokens.length && !error && (
                <div className="text-sm text-muted-foreground">You haven't minted any tokens yet.</div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tokens.map((token) => {
                  const totalSupply = token.totalSupply ?? 0
                  const minted = token.totalSupply ?? 0

            return (
                    <Card key={token.assetCode} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                            <CardTitle className="text-xl">{token.assetCode}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                              Issuer: {token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}
                      </CardDescription>
                    </div>
                          <Badge variant="secondary">{token.name || "Custom Token"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Supply</span>
                            <span className="font-semibold">{formatSupply(totalSupply)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Minted</span>
                            <span className="font-semibold">{formatSupply(minted)}</span>
                    </div>
                          <p className="text-xs text-muted-foreground">
                            {formatSupply(minted)} of {formatSupply(totalSupply)} issued
                          </p>
                      </div>
                        {token.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {token.description}
                          </p>
                        )}
                    <Button className="w-full btn-gradient-primary" size="sm">
                          View Details
                    </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
