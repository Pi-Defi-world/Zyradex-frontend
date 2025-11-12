"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { useAdminAuth } from "@/hooks/useAdminAuth"

const formatSupply = (value?: number) =>
  (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })

export default function MyTokensPage() {
  const { isAdmin, signIn: signInAdmin, isLoading: adminLoading, error: adminError } = useAdminAuth()
  const { tokens, isLoading, error } = useTokenRegistry()
  const registry = useMemo(() => (isAdmin ? tokens : []), [tokens, isAdmin])

  if (!isAdmin) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
              <CardDescription>Authenticate to view and manage minted tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {adminError && <p className="text-sm text-destructive">{adminError.message}</p>}
              <Button className="btn-gradient-primary" onClick={signInAdmin} disabled={adminLoading}>
                {adminLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in as admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
              {error && <p className="text-sm text-destructive">{error.message}</p>}
              {isLoading && !registry.length && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tokens...
          </div>
        )}
              {!isLoading && !registry.length && !error && (
                <div className="text-sm text-muted-foreground">You haven't minted any tokens yet.</div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {registry.map((token) => {
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
