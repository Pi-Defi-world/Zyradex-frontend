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
import { Loader2, PiggyBank } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import { usePi } from "@/components/providers/pi-provider"
import { useBalanceRefresh } from "@/components/providers/balance-refresh-provider"
import {
  useSavingsProducts,
  useSavingsPositions,
  useSavingsDeposit,
  useSavingsWithdraw,
} from "@/hooks/useSavingsData"
import { getTermOptions } from "@/lib/api/savings"
import type { SavingsProduct, SavingsPosition, SavingsTermOption } from "@/lib/api/savings"

function formatTermLabel(days: number): string {
  if (days >= 365) {
    const years = days / 365
    return years === 1 ? "1 year" : `${years} years`
  }
  return `${days} days`
}

function TermOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: SavingsTermOption
  selected: boolean
  onSelect: () => void
}) {
  const unlockDate = new Date(option.unlockDate).toLocaleDateString(undefined, {
    dateStyle: "medium",
  })
  return (
    <Card
      className={`cursor-pointer border-border bg-card/80 transition-colors hover:bg-muted/50 ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="pt-4">
        <p className="font-medium">{formatTermLabel(option.days)}</p>
        <p className="text-sm text-muted-foreground">APY: {option.apy}%</p>
        <p className="text-sm text-muted-foreground">Unlocks: {unlockDate}</p>
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

  const depositedAt = position.depositedAt ? new Date(position.depositedAt).toLocaleString() : null
  const accrued = position.accruedInterestSoFar ?? "0"
  const projected = position.projectedInterestAtUnlock ?? "0"
  const showInterest = position.status === "locked"

  return (
    <Card className="border-border bg-card/80">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{assetLabel}</p>
            <p className="text-sm text-muted-foreground">
              Amount: {position.amount} · Unlocks: {new Date(position.unlockedAt).toLocaleString()}
            </p>
            {depositedAt && (
              <p className="text-xs text-muted-foreground">Deposited: {depositedAt}</p>
            )}
            {showInterest && (
              <p className="text-xs text-muted-foreground mt-1">
                {unlocked ? `Accrued interest: ${accrued}` : `Projected interest at unlock: ${projected}`}
              </p>
            )}
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
  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useUserProfile()
  const { isAuthenticated } = usePi()
  const { refreshBalances: refreshBalancesGlobal } = useBalanceRefresh() ?? {}
  // Support backend returning id, _id (Mongo), or uid
  const userId = profile?.id ?? (profile as { _id?: string })?._id ?? profile?.uid ?? ""

  const { products, error: productsError, isLoading: productsLoading } = useSavingsProducts()
  const { positions, error: positionsError, isLoading: positionsLoading, refetch: refetchPositions } = useSavingsPositions(
    userId || undefined
  )
  const { deposit: depositMutation } = useSavingsDeposit()
  const { withdraw: withdrawMutation } = useSavingsWithdraw()

  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [depositProductId, setDepositProductId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [depositTermOption, setDepositTermOption] = useState<SavingsTermOption | null>(null)
  const [depositSecret, setDepositSecret] = useState("")
  const [depositLoading, setDepositLoading] = useState(false)
  const [termOptions, setTermOptions] = useState<SavingsTermOption[]>([])
  const [termOptionsLoading, setTermOptionsLoading] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<SavingsTermOption | null>(null)

  // When Pi is connected but profile not loaded yet, trigger sign-in so profile gets set
  useEffect(() => {
    if (!isAuthenticated || profile || profileLoading) return
    refreshProfile().catch(() => undefined)
  }, [isAuthenticated, profile, profileLoading, refreshProfile])

  useEffect(() => {
    let cancelled = false
    setTermOptionsLoading(true)
    getTermOptions()
      .then((opts) => {
        if (!cancelled) setTermOptions(opts)
      })
      .catch(() => {
        if (!cancelled) setTermOptions([])
      })
      .finally(() => {
        if (!cancelled) setTermOptionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const openDepositDialog = (productId: string, amount: string, termOption: SavingsTermOption) => {
    setDepositProductId(productId)
    setDepositAmount(amount)
    setDepositTermOption(termOption)
    setDepositSecret("")
    setDepositDialogOpen(true)
  }

  const handleDepositSubmit = async () => {
    if (!userId || !depositProductId || !depositAmount.trim() || !depositSecret.trim()) {
      toast({ title: "Missing fields", description: "Enter amount and your secret seed to sign the transaction.", variant: "destructive" })
      return
    }
    setDepositLoading(true)
    try {
      await depositMutation({
        productId: depositProductId,
        amount: depositAmount.trim(),
        userId,
        userSecret: depositSecret.trim(),
        termDays: depositTermOption?.days,
      })
      toast({ title: "Deposit successful", description: "Your savings position has been created." })
      setDepositDialogOpen(false)
      setDepositProductId(null)
      setDepositAmount("")
      setDepositTermOption(null)
      setDepositSecret("")
      refetchPositions()
      refreshBalancesGlobal?.()
    } catch (e) {
      toast({
        title: "Deposit failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDepositLoading(false)
    }
  }

  const handleDepositClick = (productId: string, amount: string) => {
    if (!selectedTerm) {
      toast({ title: "Select a term", description: "Choose a term option above before depositing.", variant: "destructive" })
      return
    }
    openDepositDialog(productId, amount, selectedTerm)
  }

  const handleWithdraw = async (positionId: string) => {
    try {
      const result = await withdrawMutation(positionId)
      const txMsg = result?.transactionHash ? ` Tx: ${result.transactionHash.slice(0, 8)}...` : ""
      toast({ title: "Withdrawal successful", description: `Principal + interest sent to your wallet.${txMsg}` })
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
            {profileLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!profileLoading && !userId && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Connect your wallet to deposit into savings.
                </CardContent>
              </Card>
            )}
            {productsError && !profileLoading && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{productsError.message}</p>
                </CardContent>
              </Card>
            )}
            {!profileLoading && userId && productsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!profileLoading && userId && !productsLoading && !productsError && (
              <>
                {products.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No savings products available yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Choose term (time and unlock date)</h3>
                      {termOptionsLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                          {termOptions.map((opt) => (
                            <TermOptionCard
                              key={opt.days}
                              option={opt}
                              selected={selectedTerm?.days === opt.days}
                              onSelect={() => setSelectedTerm(opt)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <Card className="border-border bg-card/80">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <PiggyBank className="h-5 w-5" />
                          Deposit amount
                        </CardTitle>
                        <CardDescription>
                          {products[0]?.asset ? `${products[0].asset.code}` : "—"} · Min: {products[0]?.minAmount ?? "0"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="savings-amount">Amount</Label>
                          <Input
                            id="savings-amount"
                            type="text"
                            placeholder="0"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (products[0]) handleDepositClick(products[0]._id, depositAmount.trim())
                          }}
                          disabled={!depositAmount.trim() || !selectedTerm}
                          className="w-full"
                        >
                          Deposit
                        </Button>
                      </CardContent>
                    </Card>
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
                  Connect your wallet to see your positions.
                </CardContent>
              </Card>
            )}
            {!profileLoading && userId && positionsError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{positionsError.message}</p>
                </CardContent>
              </Card>
            )}
            {!profileLoading && userId && positionsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!profileLoading && userId && !positionsLoading && !positionsError && (
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

        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm savings deposit</DialogTitle>
              <DialogDescription>
                Enter your secret seed to sign the transaction. Your funds will be sent to the savings custody address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {depositAmount && (
                <p className="text-sm text-muted-foreground">
                  Amount: <span className="font-medium text-foreground">{depositAmount}</span>
                </p>
              )}
              {depositTermOption && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Term: <span className="font-medium text-foreground">{formatTermLabel(depositTermOption.days)}</span>
                    {" · "}APY: <span className="font-medium text-foreground">{depositTermOption.apy}%</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unlocks: <span className="font-medium text-foreground">
                      {new Date(depositTermOption.unlockDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </p>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="deposit-secret">Secret seed (required)</Label>
                <Input
                  id="deposit-secret"
                  type="password"
                  placeholder="S..."
                  value={depositSecret}
                  onChange={(e) => setDepositSecret(e.target.value)}
                  disabled={depositLoading}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleDepositSubmit}
                disabled={depositLoading || !depositSecret.trim()}
              >
                {depositLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deposit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
