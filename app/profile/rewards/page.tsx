"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { getRewards, addReferrer, getReferralPayouts, type RewardsSummary, type ReferralPayoutRecord } from "@/lib/api/rewards"
import { Copy, ExternalLink, Loader2, Users } from "lucide-react"

const parsePi = (v: string | undefined | null) => {
  const n = v ? Number(v) : 0
  return Number.isFinite(n) ? n : 0
}

export default function RewardsPage() {
  const { isAuthenticated } = usePi()
  const { profile } = useUserProfile()
  const { toast } = useToast()
  const [rewards, setRewards] = useState<RewardsSummary | null>(null)
  const [payouts, setPayouts] = useState<ReferralPayoutRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addReferralCode, setAddReferralCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRewards = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    setError(null)
    try {
      const [rewardsData, payoutsData] = await Promise.all([
        getRewards(),
        getReferralPayouts({ limit: 20, offset: 0 }),
      ])
      setRewards(rewardsData)
      setPayouts(payoutsData.payouts || [])
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Failed to load rewards"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  const handleCopyLink = () => {
    if (rewards?.referralLink) {
      navigator.clipboard.writeText(rewards.referralLink)
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      })
    }
  }

  const handleAddReferrer = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = addReferralCode.trim()
    if (!code) {
      toast({ title: "Referral code required", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      await addReferrer(code)
      toast({ title: "Referrer added", description: "100 points have been awarded to your referrer." })
      setAddReferralCode("")
      fetchRewards()
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Failed to add referrer"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Rewards & Referral</CardTitle>
              <CardDescription>Sign in to view your rewards and referral link</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/profile">Go to Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <span className="text-base">←</span>
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Rewards & Referral</h1>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : rewards ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Your Referral Link
                </CardTitle>
                <CardDescription>
                  Your referral link uses your username. Share it so new users can sign up with it; they can also enter your username when signing up or in Add referrer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={rewards.referralLink}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {profile?.username && (
                  <p className="text-sm text-muted-foreground">
                    Link uses <span className="font-medium text-foreground">@{profile.username}</span>. Others can enter this username when signing up or in Add referrer.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    My Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{rewards.points}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{rewards.successfulReferralsCount}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Referral Earnings (Pi)</CardTitle>
                <CardDescription>
                  You earn 20% of the platform fee from swaps and mints by users you referred. Earnings are automatically sent to your wallet and appear in your transaction history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Earned</p>
                    <p className="text-base font-semibold">{rewards.referralFeePiEarned} Pi</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-base font-semibold">{rewards.referralFeePiPaid} Pi</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Owed</p>
                    <p className="text-base font-semibold">{rewards.referralFeePiOwed} Pi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral earnings history</CardTitle>
                <CardDescription>Paid amounts sent to your wallet (also visible in transaction history)</CardDescription>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payouts yet. Earned amounts are sent automatically when your referrals swap or mint.</p>
                ) : (
                  <div className="space-y-2">
                    {payouts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-sm">{p.amountPi} Pi</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.paidAt).toLocaleDateString()}
                            {p.operation ? ` �- ${p.operation}` : ""}
                          </p>
                        </div>
                        {p.txHash && (
                          <a
                            href={`https://minepi.com/explorer/tx/${p.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                            title="View on explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {!rewards.referredByUserId && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Who Referred You</CardTitle>
                  <CardDescription>
                    If someone referred you, enter their username (e.g. @username) to credit them with 100 points.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddReferrer} className="space-y-3">
                    <div>
                      <Label htmlFor="referralCode">Referrer username</Label>
                      <Input
                        id="referralCode"
                        value={addReferralCode}
                        onChange={(e) => setAddReferralCode(e.target.value)}
                        placeholder="e.g. @username or username"
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Referrer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>Users who signed up using your link</CardDescription>
              </CardHeader>
              <CardContent>
                {rewards.referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No referrals yet. Share your link to earn points!</p>
                ) : (
                  <div className="space-y-2">
                    {rewards.referrals.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-sm">@{r.referredUserName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()} �- {r.status}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary">+{r.awardedPoints} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
