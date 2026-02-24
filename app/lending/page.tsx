"use client"

import { useState, useEffect } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useUserProfile } from "@/hooks/useUserProfile"
import { usePi } from "@/components/providers/pi-provider"
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
import { useBalanceRefresh } from "@/components/providers/balance-refresh-provider"
import { supply as supplyApi, borrow as borrowApi, repay as repayApi } from "@/lib/api/lending"
import type { LendingPool, SupplyPosition, BorrowPosition } from "@/lib/api/lending"

function PoolCard({
  pool,
  userId,
  onSupplyClick,
  onWithdraw,
  onBorrowClick,
}: {
  pool: LendingPool
  userId: string
  onSupplyClick: (poolId: string, amount: string) => void
  onWithdraw: (poolId: string, amount: string) => Promise<void>
  onBorrowClick: (poolId: string, body: { collateralAsset: { code: string; issuer: string }; collateralAmount: string; borrowAmount: string }) => void
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

  const handleSupplyClick = () => {
    if (!supplyAmount.trim()) return
    onSupplyClick(pool._id, supplyAmount.trim())
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount.trim()) return
    await withdraw({ amount: withdrawAmount.trim(), userId })
    onWithdraw(pool._id, withdrawAmount.trim())
    setWithdrawAmount("")
  }

  const handleBorrowClick = () => {
    if (!borrowAmount.trim() || !collateralAmount.trim()) return
    onBorrowClick(pool._id, {
      collateralAsset: pool.collateralAssets?.[0]?.asset ?? pool.asset,
      collateralAmount: collateralAmount.trim(),
      borrowAmount: borrowAmount.trim(),
    })
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
            <Button onClick={handleSupplyClick} disabled={!supplyAmount.trim() || supplyLoading} className="w-full">
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
              onClick={handleBorrowClick}
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
  onRepayClick,
}: {
  position: BorrowPosition
  onRepayClick: (positionId: string, amount: string) => void
}) {
  const [repayAmount, setRepayAmount] = useState("")
  const pool = typeof position.poolId === "object" ? position.poolId : null
  const assetLabel = position.borrowedAsset ? `${position.borrowedAsset.code}` : "—"
  const totalDebt = position.totalDebt ?? position.borrowedAmount
  const healthOk = position.healthFactor && parseFloat(position.healthFactor) >= 1

  const handleRepayClick = () => {
    if (!repayAmount.trim()) return
    onRepayClick(position._id, repayAmount.trim())
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
          <Button onClick={handleRepayClick} disabled={!repayAmount.trim()} size="sm">
            Repay
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LendingPage() {
  const { toast } = useToast()
  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useUserProfile()
  const { isAuthenticated } = usePi()
  const { refreshBalances: refreshBalancesGlobal } = useBalanceRefresh() ?? {}
  const userId = profile?.id ?? (profile as { _id?: string })?._id ?? profile?.uid ?? ""
  const [refreshKey, setRefreshKey] = useState(0)

  const [secretDialogOpen, setSecretDialogOpen] = useState(false)
  const [secretValue, setSecretValue] = useState("")
  const [dialogLoading, setDialogLoading] = useState(false)
  const [pendingSupply, setPendingSupply] = useState<{ poolId: string; amount: string } | null>(null)
  const [pendingBorrow, setPendingBorrow] = useState<{
    poolId: string
    body: { collateralAsset: { code: string; issuer: string }; collateralAmount: string; borrowAmount: string }
  } | null>(null)
  const [pendingRepay, setPendingRepay] = useState<{ positionId: string; amount: string } | null>(null)

  useEffect(() => {
    if (!isAuthenticated || profile || profileLoading) return
    refreshProfile().catch(() => undefined)
  }, [isAuthenticated, profile, profileLoading, refreshProfile])

  const { pools, error: poolsError, isLoading: poolsLoading } = useLendingPools()
  const { supplyPositions, borrowPositions, error: positionsError, isLoading: positionsLoading } =
    useLendingPositions(userId || undefined, { refreshKey })
  const { score, canBorrow, maxBorrowTermDays, hasHistory, reason: creditReason, error: creditError } = useCreditScore(userId || undefined)
  const { platformFeePublicKey } = useFeeDestination()
  const [creditScoreInput, setCreditScoreInput] = useState("")
  const { setCreditScore, isLoading: setScoreLoading } = useSetCreditScore()

  const handleSupplyClick = (poolId: string, amount: string) => {
    setPendingSupply({ poolId, amount })
    setPendingBorrow(null)
    setPendingRepay(null)
    setSecretValue("")
    setSecretDialogOpen(true)
  }

  const handleBorrowClick = (poolId: string, body: { collateralAsset: { code: string; issuer: string }; collateralAmount: string; borrowAmount: string }) => {
    setPendingSupply(null)
    setPendingBorrow({ poolId, body })
    setPendingRepay(null)
    setSecretValue("")
    setSecretDialogOpen(true)
  }

  const handleRepayClick = (positionId: string, amount: string) => {
    setPendingSupply(null)
    setPendingBorrow(null)
    setPendingRepay({ positionId, amount })
    setSecretValue("")
    setSecretDialogOpen(true)
  }

  const handleSecretSubmit = async () => {
    if (!secretValue.trim()) {
      toast({ title: "Enter your secret seed", variant: "destructive" })
      return
    }
    setDialogLoading(true)
    try {
      if (pendingSupply) {
        await supplyApi(pendingSupply.poolId, { amount: pendingSupply.amount, userId, userSecret: secretValue.trim() })
        toast({ title: "Supply successful" })
        setPendingSupply(null)
        setSecretDialogOpen(false)
        setRefreshKey((k) => k + 1)
        refreshBalancesGlobal?.()
      } else if (pendingBorrow) {
        await borrowApi(pendingBorrow.poolId, {
          ...pendingBorrow.body,
          userId,
          userSecret: secretValue.trim(),
        })
        toast({ title: "Borrow successful" })
        setPendingBorrow(null)
        setSecretDialogOpen(false)
        setRefreshKey((k) => k + 1)
        refreshBalancesGlobal?.()
      } else if (pendingRepay) {
        await repayApi(pendingRepay.positionId, { amount: pendingRepay.amount, userSecret: secretValue.trim() })
        toast({ title: "Repayment successful" })
        setPendingRepay(null)
        setSecretDialogOpen(false)
        setRefreshKey((k) => k + 1)
        refreshBalancesGlobal?.()
      }
    } catch (e) {
      toast({
        title: "Transaction failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDialogLoading(false)
    }
  }

  const handleSupply = async () => {
    setRefreshKey((k) => k + 1)
  }
  const handleWithdraw = async () => {
    setRefreshKey((k) => k + 1)
    refreshBalancesGlobal?.()
  }
  const handleBorrow = async () => {
    setRefreshKey((k) => k + 1)
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
            {userId && score != null && (
              <Card className="border-border bg-card/80">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">Your borrowing eligibility</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Credit score: <span className="font-medium text-foreground">{score}%</span>
                    {maxBorrowTermDays != null && (
                      <> · Max borrow term: <span className="font-medium text-foreground">{maxBorrowTermDays} days</span></>
                    )}
                    {score >= 98 && !hasHistory && (
                      <span className="block mt-1 text-xs text-muted-foreground">Build history (repay a loan or supply) to unlock max term (5 years).</span>
                    )}
                    {score >= 98 && hasHistory && (
                      <span className="block mt-1 text-xs text-muted-foreground">You have access to max borrow term.</span>
                    )}
                    {!canBorrow && creditReason && (
                      <span className="block mt-1 text-destructive text-sm">{creditReason}</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
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
                          onSupplyClick={handleSupplyClick}
                          onWithdraw={handleWithdraw}
                          onBorrowClick={handleBorrowClick}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            {profileLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!profileLoading && !userId && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Connect your wallet to see positions.
                </CardContent>
              </Card>
            )}
            {!profileLoading && userId && positionsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!profileLoading && userId && positionsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{positionsError.message}</p>
                </CardContent>
              </Card>
            )}
            {!profileLoading && userId && !positionsLoading && !positionsError && (
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
                        onRepayClick={handleRepayClick}
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
                  Score 0–100. Everyone starts at 50%. Repay loans to gain; default (liquidation) loses 25%. Borrow allowed at 19% and above; below 19% cannot borrow. Score 98+ with history (repaid or supplied) unlocks max borrow term.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!profileLoading && !userId && (
                  <p className="text-sm text-muted-foreground">Connect wallet to see your score.</p>
                )}
                {!profileLoading && userId && (
                  <>
                    {creditError && (
                      <p className="text-sm text-destructive">{creditError.message}</p>
                    )}
                    <div className="space-y-2">
                      <p className="text-sm">
                        Your score: <strong>{score ?? "—"}%</strong>
                        {canBorrow !== undefined && (
                          <Badge className="ml-2" variant={canBorrow ? "default" : "destructive"}>
                            {canBorrow ? "Can borrow" : "Cannot borrow"}
                          </Badge>
                        )}
                      </p>
                      {maxBorrowTermDays != null && (
                        <p className="text-sm text-muted-foreground">
                          Max borrow term: <strong>{maxBorrowTermDays} days</strong>
                          {hasHistory ? " (history built)" : " — build history to unlock max term at 98%+"}
                        </p>
                      )}
                      {creditReason && !canBorrow && (
                        <p className="text-sm text-destructive">{creditReason}</p>
                      )}
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

        <Dialog open={secretDialogOpen} onOpenChange={(open) => { if (!open) { setPendingSupply(null); setPendingBorrow(null); setPendingRepay(null); setSecretDialogOpen(false); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm transaction</DialogTitle>
              <DialogDescription>
                Enter your secret seed to sign this transaction. We don&apos;t store your secret.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {(pendingSupply || pendingBorrow || pendingRepay) && (
                <p className="text-sm text-muted-foreground">
                  {pendingSupply && `Supply ${pendingSupply.amount}`}
                  {pendingBorrow && `Borrow ${pendingBorrow.body.borrowAmount} (collateral: ${pendingBorrow.body.collateralAmount})`}
                  {pendingRepay && `Repay ${pendingRepay.amount}`}
                </p>
              )}
              <div className="space-y-2">
                <Label>Secret seed (required)</Label>
                <Input
                  type="password"
                  placeholder="S..."
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  disabled={dialogLoading}
                />
              </div>
              <Button className="w-full" onClick={handleSecretSubmit} disabled={dialogLoading || !secretValue.trim()}>
                {dialogLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
