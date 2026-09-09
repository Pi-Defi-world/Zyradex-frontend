"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageBackHeader } from "@/components/ui/page-back-header"
import { Loader2, Gem, TrendingUp, Timer, Coins } from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useBalanceRefresh } from "@/components/providers/balance-refresh-provider"
import { useTransactionPopup } from "@/components/providers/transaction-popup-provider"

interface StakingPoolUI {
  poolId: number
  name: string
  apy: string
  totalStaked: string
  minStake: string
  lockDays: number
  rewardToken: string
  active: boolean
}

export default function StakingPage() {
  const { toast } = useToast()
  const { isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const { refreshAll } = useBalanceRefresh() ?? {}
  const { showPopup, updatePopup } = useTransactionPopup()

  const [pools, setPools] = useState<StakingPoolUI[]>([])
  const [loading, setLoading] = useState(true)
  const [stakeAmount, setStakeAmount] = useState("")
  const [selectedPool, setSelectedPool] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rewards/staking-pools`)
      .then((r) => r.json())
      .then((d) => {
        setPools(
          (d.pools || d.data || []).map((p: any) => ({
            poolId: p.poolId ?? p._id ?? 0,
            name: p.name || `Pool #${p.poolId ?? p._id}`,
            apy: `${p.rewardRate || p.apy || 10}%`,
            totalStaked: p.totalStaked || "0",
            minStake: p.minStake || "100",
            lockDays: p.lockDays || p.lockLedgers ? Math.round((p.lockLedgers || 0) / 17280) : 0,
            rewardToken: p.rewardToken || "PI",
            active: p.active !== false,
          }))
        )
      })
      .catch(() => setPools([]))
      .finally(() => setLoading(false))
  }, [])

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount.trim() || !profile?.public_key) return
    setSubmitting(true)
    const popupId = showPopup({
      type: "stake",
      title: "Staking...",
      description: `Staking ${stakeAmount} PI in pool #${selectedPool}`,
      status: "pending",
    })

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rewards/stake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: profile.public_key,
          poolId: selectedPool,
          amount: stakeAmount,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Stake failed")

      updatePopup(popupId, {
        status: "success",
        title: "Staked!",
        description: `Successfully staked ${stakeAmount} PI.`,
        txHash: data.txHash,
      })
      setStakeAmount("")
      refreshAll?.()
    } catch (e: any) {
      updatePopup(popupId, {
        status: "error",
        title: "Stake failed",
        description: e.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <PageBackHeader title="Staking" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gem className="h-7 w-7 text-amber-500" />
            Staking Rewards
          </h1>
          <p className="text-muted-foreground">Stake your tokens and earn rewards over time.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pools.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No staking pools available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pools.filter(p => p.active).map((pool) => (
              <Card
                key={pool.poolId}
                className={`border-border bg-card/80 cursor-pointer transition-all hover:border-primary/50 ${
                  selectedPool === pool.poolId ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedPool(pool.poolId)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-500" />
                    {pool.name}
                  </CardTitle>
                  <CardDescription>Reward: {pool.rewardToken}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">APY</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{pool.apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Staked</span>
                    <span>{pool.totalStaked} PI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Stake</span>
                    <span>{pool.minStake} PI</span>
                  </div>
                  {pool.lockDays > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lock Period</span>
                      <span>{pool.lockDays} days</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedPool && (
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Stake Tokens
              </CardTitle>
              <CardDescription>Enter an amount to stake in pool #{selectedPool}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount (PI)</Label>
                <Input
                  id="stake-amount"
                  type="text"
                  placeholder="100"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>
              <Button
                onClick={handleStake}
                disabled={submitting || !stakeAmount.trim() || !isAuthenticated}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Staking...
                  </>
                ) : !isAuthenticated ? (
                  "Connect Wallet to Stake"
                ) : (
                  `Stake ${stakeAmount || "0"} PI`
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
