"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, PiggyBank } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import {
  useSavingsProducts,
  useSavingsPositions,
  useSavingsDeposit,
  useSavingsWithdraw,
} from "@/hooks/useSavingsData"
import type { SavingsProduct, SavingsPosition } from "@/lib/api/savings"

function ProductCard({
  product,
  onDeposit,
  userId,
}: {
  product: SavingsProduct
  onDeposit: (productId: string, amount: string) => Promise<void>
  userId: string
}) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const assetLabel = product.asset ? `${product.asset.code}` : "—"

  const handleDeposit = async () => {
    if (!amount.trim()) return
    setLoading(true)
    try {
      await onDeposit(product._id, amount.trim())
      setAmount("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          {assetLabel} · {product.termDays} days
        </CardTitle>
        <CardDescription>
          APY: {product.apy}% · Min: {product.minAmount}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`amount-${product._id}`}>Amount</Label>
          <Input
            id={`amount-${product._id}`}
            type="text"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button
          onClick={handleDeposit}
          disabled={!amount.trim() || loading}
          className="w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deposit"}
        </Button>
      </CardContent>
    </Card>
  )
}

function PositionRow({
  position,
  onWithdraw,
}: {
  position: SavingsPosition
  onWithdraw: (positionId: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const product = typeof position.productId === "object" ? position.productId : null
  const assetLabel = product?.asset ? `${product.asset.code}` : "—"
  const unlocked = new Date(position.unlockedAt) <= new Date()
  const status = position.status === "withdrawn" ? "Withdrawn" : unlocked ? "Unlocked" : "Locked"

  const handleWithdraw = async () => {
    setLoading(true)
    try {
      await onWithdraw(position._id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card/80">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{assetLabel}</p>
            <p className="text-sm text-muted-foreground">
              Amount: {position.amount} · Unlocks: {new Date(position.unlockedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Status: {status}</p>
          </div>
          {position.status === "locked" && unlocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SavingsPage() {
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const userId = user?.id ?? ""

  const { products, error: productsError, isLoading: productsLoading } = useSavingsProducts()
  const { positions, error: positionsError, isLoading: positionsLoading } = useSavingsPositions(
    userId || undefined
  )
  const { deposit: depositMutation } = useSavingsDeposit()
  const { withdraw: withdrawMutation } = useSavingsWithdraw()

  const handleDeposit = async (productId: string, amount: string) => {
    if (!userId) {
      toast({ title: "Connect wallet to deposit", variant: "destructive" })
      return
    }
    try {
      await depositMutation({ productId, amount, userId })
      toast({ title: "Deposit instructions received" })
    } catch (e) {
      toast({
        title: "Deposit failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
      throw e
    }
  }

  const handleWithdraw = async (positionId: string) => {
    try {
      await withdrawMutation(positionId)
      toast({ title: "Withdrawal processed" })
    } catch (e) {
      toast({
        title: "Withdraw failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
      throw e
    }
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="h-7 w-7" />
            Savings
          </h1>
          <p className="text-muted-foreground mt-1">
            Time-lock products with APY. Deposit and earn interest.
          </p>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="positions">My positions</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {productsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{productsError.message}</p>
                </CardContent>
              </Card>
            )}
            {productsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!productsLoading && !productsError && (
              <>
                {products.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No savings products available yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products
                      .filter((p) => p.active)
                      .map((product) => (
                        <ProductCard
                          key={product._id}
                          product={product}
                          onDeposit={handleDeposit}
                          userId={userId}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            {!userId && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Connect your wallet to see your positions.
                </CardContent>
              </Card>
            )}
            {userId && positionsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{positionsError.message}</p>
                </CardContent>
              </Card>
            )}
            {userId && positionsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {userId && !positionsLoading && !positionsError && (
              <>
                {positions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No positions yet. Deposit from the Products tab.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos) => (
                      <PositionRow
                        key={pos._id}
                        position={pos}
                        onWithdraw={handleWithdraw}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
