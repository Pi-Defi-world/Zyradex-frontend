"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchMyTokens } from "@/lib/store/slices/myTokensSlice"
import { Progress } from "@/components/ui/progress"

export default function MyTokensPage() {
  const dispatch = useAppDispatch()
  const { tokens, loading, error } = useAppSelector((state) => state.myTokens)

  useEffect(() => {
    dispatch(fetchMyTokens())
  }, [dispatch])

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && tokens.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You haven't minted any tokens yet.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => {
            const totalSupply = Number.parseFloat(token.balances.authorized)
            const minted = Number.parseFloat(token.balances.authorized)
            const remaining = totalSupply - minted
            const progress = (minted / totalSupply) * 100

            return (
              <Card key={token.asset_code} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{token.asset_code}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Issuer: {token.asset_issuer.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    {remaining > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Mintable
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Supply:</span>
                      <span className="font-semibold">{totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minted:</span>
                      <span className="font-semibold">{minted.toLocaleString()}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-semibold text-primary">{remaining.toLocaleString()}</span>
                      </div>
                    )}
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Authorized Accounts:</span>
                      <span>{token.accounts.authorized}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidity Pools:</span>
                      <span>{token.num_liquidity_pools}</span>
                    </div>
                  </div>

                  {remaining > 0 && (
                    <Button className="w-full" size="sm">
                      Mint Remaining
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
