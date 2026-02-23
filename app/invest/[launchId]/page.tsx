"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  Coins,
  Calendar,
  DollarSign,
  Share2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useLaunch,
  useMyPiPower,
  useLaunchCommit,
  useLaunchCloseWindow,
  useLaunchRunAllocation,
  useLaunchCreateEscrow,
  useLaunchExecuteTge,
  useLaunchTransitionStatus,
} from "@/hooks/useLaunchpadData"
import {
  useCreateDividendRound,
  useDividendRound,
  useRunDividendSnapshot,
  useDividendHolders,
  useRecordDividendClaim,
} from "@/hooks/useDividendData"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  participation_open: "Participation open",
  participation_closed: "Participation closed",
  allocation_running: "Allocation",
  tge_open: "TGE open",
}

export default function InvestLaunchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const launchId = typeof params.launchId === "string" ? params.launchId : undefined
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const userId = user?.id ?? undefined

  const { launch, error: launchError, isLoading: launchLoading } = useLaunch(launchId)
  const { piPower, isLoading: piPowerLoading } = useMyPiPower(launchId, userId)
  const { commitPi, isLoading: commitLoading } = useLaunchCommit(launchId ?? "")
  const { closeWindow, isLoading: closeLoading } = useLaunchCloseWindow(launchId ?? "")
  const { runAllocation, isLoading: allocLoading } = useLaunchRunAllocation(launchId ?? "")
  const { createEscrow, isLoading: escrowLoading } = useLaunchCreateEscrow(launchId ?? "")
  const { executeTge, isLoading: tgeLoading } = useLaunchExecuteTge(launchId ?? "")
  const { transitionStatus, isLoading: transitionLoading } = useLaunchTransitionStatus(launchId ?? "")

  const [commitAmount, setCommitAmount] = useState("")
  const [dividendRoundAmount, setDividendRoundAmount] = useState("")
  const [escrowSecret, setEscrowSecret] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)

  const { createRound, data: newRound, isLoading: createRoundLoading } = useCreateDividendRound(launchId ?? "")
  const { runSnapshot, isLoading: snapshotLoading } = useRunDividendSnapshot(selectedRoundId ?? "")
  const { round: selectedRound } = useDividendRound(selectedRoundId)
  const { holders } = useDividendHolders(selectedRoundId)
  const { recordClaim, isLoading: claimLoading } = useRecordDividendClaim(selectedRoundId ?? "")

  const handleCommit = async () => {
    if (!launchId || !commitAmount.trim()) {
      toast({ title: "Enter amount", variant: "destructive" })
      return
    }
    try {
      await commitPi({ committedPi: commitAmount.trim(), userId })
      toast({ title: "Commit recorded" })
      setCommitAmount("")
    } catch (e) {
      toast({
        title: "Commit failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleCreateDividendRound = async () => {
    if (!launchId || !dividendRoundAmount.trim()) {
      toast({ title: "Enter total payout amount", variant: "destructive" })
      return
    }
    try {
      await createRound({ totalPayoutAmount: dividendRoundAmount.trim() })
      toast({ title: "Dividend round created" })
      setDividendRoundAmount("")
    } catch (e) {
      toast({
        title: "Create round failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleRunSnapshot = async () => {
    if (!selectedRoundId) return
    try {
      await runSnapshot()
      toast({ title: "Snapshot completed" })
    } catch (e) {
      toast({
        title: "Snapshot failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleExecuteTge = async () => {
    if (!launchId || !escrowSecret.trim()) {
      toast({ title: "Enter escrow secret", variant: "destructive" })
      return
    }
    try {
      await executeTge({ escrowSecret: escrowSecret.trim() })
      toast({ title: "TGE executed" })
      setEscrowSecret("")
    } catch (e) {
      toast({
        title: "TGE failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (!launchId) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Invalid launch</p>
      </div>
    )
  }

  if (launchLoading || !launch) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20 flex items-center justify-center">
        {launchError ? (
          <Card className="max-w-md">
            <CardContent className="pt-4">
              <p className="text-destructive">{launchError.message}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/invest">Back to Invest</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        )}
      </div>
    )
  }

  const statusLabel = STATUS_LABELS[launch.status] ?? launch.status
  const canCommit =
    launch.status === "participation_open" && userId && parseFloat(commitAmount) > 0
  const isProjectFlow =
    launch.status === "participation_open" ||
    launch.status === "participation_closed" ||
    launch.status === "allocation_running"

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invest">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7" />
              {launch.projectId}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Badge>{statusLabel}</Badge>
              {launch.tokenAsset && (
                <span>
                  Token: {launch.tokenAsset.code}
                  {launch.isEquityStyle && (
                    <Badge variant="secondary" className="ml-2">
                      Equity
                    </Badge>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Your PiPower
              </CardTitle>
              <CardDescription>Staked Pi and commitment cap for this launch</CardDescription>
            </CardHeader>
            <CardContent>
              {piPowerLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="space-y-1 text-sm">
                  {piPower?.piPower != null && <p>PiPower: {piPower.piPower}</p>}
                  {piPower?.canCommit != null && <p>Can commit (max): {piPower.canCommit}</p>}
                  {piPower?.committedPi != null && <p>Committed: {piPower.committedPi}</p>}
                  {!piPower?.piPower && !piPower?.canCommit && (
                    <p className="text-muted-foreground">Connect and stake to see PiPower.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Participation window
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {launch.participationWindowStart && launch.participationWindowEnd ? (
                <p>
                  {new Date(launch.participationWindowStart).toLocaleString()} →{" "}
                  {new Date(launch.participationWindowEnd).toLocaleString()}
                </p>
              ) : (
                <p>Not set</p>
              )}
              {launch.listingPrice && (
                <p className="mt-2 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Listing price: {launch.listingPrice}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {launch.status === "participation_open" && userId && (
          <Card>
            <CardHeader>
              <CardTitle>Commit Pi</CardTitle>
              <CardDescription>Commit Pi to this launch (within your PiPower cap)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="commit-amount">Amount (Pi)</Label>
                <Input
                  id="commit-amount"
                  type="text"
                  placeholder="0"
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleCommit} disabled={!canCommit || commitLoading}>
                {commitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isProjectFlow && (
          <Card>
            <CardHeader>
              <CardTitle>Launch flow (project)</CardTitle>
              <CardDescription>
                Close window → Run allocation → Create escrow → Execute TGE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {launch.status === "participation_open" && (
                <Button
                  variant="outline"
                  onClick={() => closeWindow()}
                  disabled={closeLoading}
                >
                  {closeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Close participation window"}
                </Button>
              )}
              {launch.status === "participation_closed" && (
                <Button
                  variant="outline"
                  onClick={() => runAllocation()}
                  disabled={allocLoading}
                >
                  {allocLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run allocation"}
                </Button>
              )}
              {launch.status === "allocation_running" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => createEscrow()}
                    disabled={escrowLoading}
                  >
                    {escrowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create escrow"}
                  </Button>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-2">
                      <Label>Escrow secret (for TGE)</Label>
                      <Input
                        type="password"
                        placeholder="Secret key"
                        value={escrowSecret}
                        onChange={(e) => setEscrowSecret(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleExecuteTge} disabled={!escrowSecret.trim() || tgeLoading}>
                      {tgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute TGE"}
                    </Button>
                  </div>
                </>
              )}
              <div className="flex flex-wrap items-end gap-2 pt-2">
                <Input
                  placeholder="New status (e.g. participation_open)"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="secondary"
                  onClick={() => newStatus && transitionStatus({ status: newStatus })}
                  disabled={!newStatus.trim() || transitionLoading}
                >
                  {transitionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transition"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {launch.isEquityStyle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Dividend rounds
              </CardTitle>
              <CardDescription>
                Create rounds, run snapshot, view holders. Payouts in company token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Total payout amount (company token)</Label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={dividendRoundAmount}
                    onChange={(e) => setDividendRoundAmount(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateDividendRound}
                  disabled={!dividendRoundAmount.trim() || createRoundLoading}
                >
                  {createRoundLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create round"}
                </Button>
              </div>
              {newRound && (
                <p className="text-sm text-muted-foreground">
                  Created round: {newRound._id}. Use Run snapshot below after selecting it.
                </p>
              )}
              <div className="space-y-2">
                <Label>Select round (enter round ID to load)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Round ID"
                    value={selectedRoundId ?? ""}
                    onChange={(e) => setSelectedRoundId(e.target.value.trim() || null)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleRunSnapshot}
                    disabled={!selectedRoundId || snapshotLoading}
                  >
                    {snapshotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run snapshot"}
                  </Button>
                </div>
              </div>
              {selectedRound && (
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium">Round: {selectedRound.status}</p>
                  <p className="text-sm text-muted-foreground">
                    Eligible: {selectedRound.eligibleHoldersCount ?? "—"} · Supply:{" "}
                    {selectedRound.totalEligibleSupply ?? "—"}
                  </p>
                  {holders.length > 0 && (
                    <ul className="text-sm max-h-40 overflow-y-auto">
                      {holders.slice(0, 20).map((h) => (
                        <li key={h._id}>
                          {h.publicKey.slice(0, 8)}… → {h.payoutAmount}
                        </li>
                      ))}
                      {holders.length > 20 && <li className="text-muted-foreground">… and more</li>}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
