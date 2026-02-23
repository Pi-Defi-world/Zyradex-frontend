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
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import {
  useLendingPools,
  useLendingPositions,
  useCreditScore,
  useFeeDestination,
  useLendingSupply,
  useLendingWithdraw,
  useLendingBorrow,
  useLendingRepay,
  useSetCreditScore,
} from "@/hooks/useLendingData"
import type { LendingPool, SupplyPosition, BorrowPosition } from "@/lib/api/lending"

function PoolCard({
  pool,
  userId,
  onSupply,
  onWithdraw,
  onBorrow,
}: {
  pool: LendingPool
  userId: string
  onSupply: (poolId: string, amount: string) => Promise<void>
  onWithdraw: (poolId: string, amount: string) => Promise<void>
  onBorrow: (poolId: string, body: { collateralAsset: { code: string; issuer: string }; collateralAmount: string; borrowAmount: string }) => Promise<void>
}) {
  const [supplyAmount, setSupplyAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [collateralAmount, setCollateralAmount] = useState("")
  const [activeTab, setActiveTab] = useState<"supply" | "withdraw" | "borrow">("supply")
  const { supply, isLoading: supplyLoading } = useLendingSupply(pool._id)
  const { withdraw, isLoading: withdrawLoading } = useLendingWithdraw(pool._id)
  const { borrow, isLoading: borrowLoading } = useLendingBorrow(pool._id)

  const assetLabel = pool.asset ? `${pool.asset.code}` : "—"

  const handleSupply = async () => {
    if (!supplyAmount.trim()) return
    await supply({ amount: supplyAmount.trim(), userId })
    onSupply(pool._id, supplyAmount.trim())
    setSupplyAmount("")
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount.trim()) return
    await withdraw({ amount: withdrawAmount.trim(), userId })
    onWithdraw(pool._id, withdrawAmount.trim())
    setWithdrawAmount("")
  }

  const handleBorrow = async () => {
    if (!borrowAmount.trim() || !collateralAmount.trim()) return
    await borrow({
      collateralAsset: pool.collateralAssets?.[0]?.asset ?? pool.asset,
      collateralAmount: collateralAmount.trim(),
      borrowAmount: borrowAmount.trim(),
      userId,
    })
    onBorrow(pool._id, {
      collateralAsset: pool.collateralAssets?.[0]?.asset ?? pool.asset,
      collateralAmount: collateralAmount.trim(),
      borrowAmount: borrowAmount.trim(),
    })
    setBorrowAmount("")
    setCollateralAmount("")
  }

  return (
    <Card className="border-border bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {assetLabel}
        </CardTitle>
        <CardDescription>
          Supply APY: {pool.supplyRate}% · Borrow: {pool.borrowRate}% · Collateral factor: {pool.collateralFactor}
        </CardDescription>
        <p className="text-xs text-muted-foreground mt-1">
          Total supply: {pool.totalSupply} · Total borrow: {pool.totalBorrow}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "supply" | "withdraw" | "borrow")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="supply">Supply</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
          </TabsList>
          <TabsContent value="supply" className="space-y-2 mt-2">
            <Label>Amount (0.6% fee)</Label>
            <Input
              type="text"
              placeholder="0"
              value={supplyAmount}
              onChange={(e) => setSupplyAmount(e.target.value)}
            />
            <Button onClick={handleSupply} disabled={!supplyAmount.trim() || supplyLoading} className="w-full">
              {supplyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supply"}
            </Button>
          </TabsContent>
          <TabsContent value="withdraw" className="space-y-2 mt-2">
            <Label>Amount (0.6% fee)</Label>
            <Input
              type="text"
              placeholder="0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <Button onClick={handleWithdraw} disabled={!withdrawAmount.trim() || withdrawLoading} className="w-full">
              {withdrawLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
            </Button>
          </TabsContent>
          <TabsContent value="borrow" className="space-y-2 mt-2">
            <Label>Collateral amount</Label>
            <Input
              type="text"
              placeholder="0"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
            />
            <Label>Borrow amount</Label>
            <Input
              type="text"
              placeholder="0"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
            />
            <Button
              onClick={handleBorrow}
              disabled={!borrowAmount.trim() || !collateralAmount.trim() || borrowLoading}
              className="w-full"
            >
              {borrowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Borrow"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SupplyPositionRow({ position }: { position: SupplyPosition }) {
  const pool = typeof position.poolId === "object" ? position.poolId : null
  const assetLabel = pool?.asset ? `${pool.asset.code}` : "—"
  return (
    <Card className="border-border bg-card/80">
      <CardContent className="pt-4 flex justify-between items-center">
        <div>
          <p className="font-medium flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Supply · {assetLabel}
          </p>
          <p className="text-sm text-muted-foreground">Amount: {position.amount}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function BorrowPositionRow({
  position,
  onRepay,
}: {
  position: BorrowPosition
  onRepay: (id: string, amount: string) => Promise<void>
}) {
  const [repayAmount, setRepayAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const pool = typeof position.poolId === "object" ? position.poolId : null
  const assetLabel = position.borrowedAsset ? `${position.borrowedAsset.code}` : "—"
  const totalDebt = position.totalDebt ?? position.borrowedAmount
  const healthOk = position.healthFactor && parseFloat(position.healthFactor) >= 1

  const handleRepay = async () => {
    if (!repayAmount.trim()) return
    setLoading(true)
    try {
      await onRepay(position._id, repayAmount.trim())
      setRepayAmount("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`border-border bg-card/80 ${!healthOk ? "border-amber-500/50" : ""}`}>
      <CardContent className="pt-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              Borrow · {assetLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              Principal: {position.borrowedAmount} · Accrued: {position.accruedInterest ?? "0"} · Total debt: {totalDebt}
            </p>
            {position.healthFactor != null && (
              <p className={`text-xs mt-1 ${healthOk ? "text-muted-foreground" : "text-amber-600"}`}>
                Health: {position.healthFactor} {!healthOk && <AlertTriangle className="inline h-3 w-3" />}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Repay amount</Label>
            <Input
              type="text"
              placeholder={totalDebt}
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleRepay} disabled={!repayAmount.trim() || loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Repay"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LendingPage() {
  const { toast } = useToast()
  const { adminUser } = useAdminAuth()
  const userId = adminUser?.id ?? ""

  const { pools, error: poolsError, isLoading: poolsLoading } = useLendingPools()
  const { supplyPositions, borrowPositions, error: positionsError, isLoading: positionsLoading } =
    useLendingPositions(userId || undefined, { refreshKey })
  const { score, canBorrow, error: creditError } = useCreditScore(userId || undefined)
  const { platformFeePublicKey } = useFeeDestination()
  const [creditScoreInput, setCreditScoreInput] = useState("")
  const { setCreditScore, isLoading: setScoreLoading } = useSetCreditScore()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSupply = async () => {
    toast({ title: "Supply recorded" })
    setRefreshKey((k) => k + 1)
  }
  const handleWithdraw = async () => {
    toast({ title: "Withdraw recorded" })
    setRefreshKey((k) => k + 1)
  }
  const handleBorrow = async () => {
    toast({ title: "Borrow recorded" })
    setRefreshKey((k) => k + 1)
  }

  const handleRepay = async (borrowPositionId: string, amount: string) => {
    const { repay } = await import("@/lib/api/lending")
    try {
      await repay(borrowPositionId, { amount })
      toast({ title: "Repayment recorded" })
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast({
        title: "Repay failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
      throw e
    }
  }

  const handleSetCreditScore = async () => {
    const num = parseInt(creditScoreInput, 10)
    if (!userId || isNaN(num) || num < 0 || num > 100) {
      toast({ title: "Enter score 0–100", variant: "destructive" })
      return
    }
    try {
      await setCreditScore({ userId, score: num })
      toast({ title: "Credit score updated" })
      setCreditScoreInput("")
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7" />
            Borrow & Lend
          </h1>
          <p className="text-muted-foreground mt-1">
            Supply assets to earn interest; borrow against collateral. Rates depend on amount and credit score.
          </p>
        </div>

        <Tabs defaultValue="pools" className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="pools">Pools</TabsTrigger>
            <TabsTrigger value="positions">My positions</TabsTrigger>
            <TabsTrigger value="credit">Credit & fees</TabsTrigger>
          </TabsList>

          <TabsContent value="pools" className="space-y-4">
            {poolsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{poolsError.message}</p>
                </CardContent>
              </Card>
            )}
            {poolsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!poolsLoading && !poolsError && (
              <>
                {pools.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No lending pools yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pools
                      .filter((p) => p.active)
                      .map((pool) => (
                        <PoolCard
                          key={pool._id}
                          pool={pool}
                          userId={userId}
                          onSupply={handleSupply}
                          onWithdraw={handleWithdraw}
                          onBorrow={handleBorrow}
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
                  Connect your wallet to see positions.
                </CardContent>
              </Card>
            )}
            {userId && positionsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {userId && positionsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{positionsError.message}</p>
                </CardContent>
              </Card>
            )}
            {userId && !positionsLoading && !positionsError && (
              <div className="space-y-3">
                {supplyPositions.length === 0 && borrowPositions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No supply or borrow positions yet.
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {supplyPositions.map((pos) => (
                      <SupplyPositionRow key={pos._id} position={pos} />
                    ))}
                    {borrowPositions.map((pos) => (
                      <BorrowPositionRow
                        key={pos._id}
                        position={pos}
                        onRepay={handleRepay}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="credit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Credit score
                </CardTitle>
                <CardDescription>
                  Score 0–100. Borrow allowed above 30. Higher score can reduce borrow rate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!userId && (
                  <p className="text-sm text-muted-foreground">Connect wallet to see your score.</p>
                )}
                {userId && (
                  <>
                    {creditError && (
                      <p className="text-sm text-destructive">{creditError.message}</p>
                    )}
                    <div className="flex flex-wrap items-end gap-2">
                      <p className="text-sm">
                        Your score: <strong>{score ?? "—"}</strong>
                        {canBorrow !== undefined && (
                          <Badge className="ml-2" variant={canBorrow ? "default" : "destructive"}>
                            {canBorrow ? "Can borrow" : "Cannot borrow"}
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="space-y-1">
                        <Label>Set score (testing)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0–100"
                          value={creditScoreInput}
                          onChange={(e) => setCreditScoreInput(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleSetCreditScore}
                        disabled={!creditScoreInput.trim() || setScoreLoading}
                      >
                        {setScoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set score"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Where fees go</CardTitle>
                <CardDescription>
                  All 0.6% platform fees (supply, borrow, liquidation) are sent to this address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformFeePublicKey ? (
                  <p className="text-sm font-mono break-all">{platformFeePublicKey}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not configured.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
