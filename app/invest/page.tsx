"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, ChevronRight } from "lucide-react"
import { useLaunches } from "@/hooks/useLaunchpadData"
import type { Launch } from "@/lib/api/launchpad"

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  participation_open: "Participation open",
  participation_closed: "Participation closed",
  allocation_running: "Allocation",
  tge_open: "TGE open",
}

function LaunchCard({ launch }: { launch: Launch }) {
  const statusLabel = STATUS_LABELS[launch.status] ?? launch.status
  const tokenLabel = launch.tokenAsset ? `${launch.tokenAsset.code}` : "—"
  const windowStart = launch.participationWindowStart
    ? new Date(launch.participationWindowStart).toLocaleDateString()
    : "—"
  const windowEnd = launch.participationWindowEnd
    ? new Date(launch.participationWindowEnd).toLocaleDateString()
    : "—"

  return (
    <Card className="border-border bg-card/80 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{launch.projectId || "Launch"}</CardTitle>
            <CardDescription className="mt-1">
              Token: {tokenLabel}
              {launch.isEquityStyle && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Equity
                </Badge>
              )}
            </CardDescription>
          </div>
          <Badge variant={launch.status === "tge_open" ? "default" : "outline"}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Window: {windowStart} → {windowEnd}
        </p>
        {launch.listingPrice && (
          <p className="text-sm text-muted-foreground">Listing price: {launch.listingPrice}</p>
        )}
        <Button asChild variant="default" size="sm" className="w-full sm:w-auto mt-2">
          <Link href={`/invest/${launch._id}`} className="inline-flex items-center gap-1">
            View
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function InvestPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const { launches, error, isLoading } = useLaunches({ limit: 50, status: statusFilter })

  const statusOptions = useMemo(
    () => [
      { value: undefined, label: "All" },
      ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    ],
    []
  )

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7" />
              Invest
            </h1>
            <p className="text-muted-foreground mt-1">
              Launchpad launches and equity-style investments. Participate and earn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value ?? "all"}
                variant={statusFilter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <Button asChild variant="secondary" size="sm">
              <Link href="/invest/create">Create launch</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/invest/projects">My projects</Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !error && (
          <>
            {launches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No launches found. Check back later.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {launches.map((launch) => (
                  <LaunchCard key={launch._id} launch={launch} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
