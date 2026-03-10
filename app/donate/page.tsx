"use client"

import { useState } from "react"
import { PageBackHeader } from "@/components/ui/page-back-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DonationModal } from "@/components/donation-modal"
import { usePi } from "@/components/providers/pi-provider"
import { Heart, CheckCircle2, Loader2 } from "lucide-react"

export default function DonatePage() {
  const { user, isAuthenticated, authenticate, isLoading } = usePi()
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [recentDonations, setRecentDonations] = useState<{ amount: number }[]>([])

  const handleDonationSuccess = (data: { amount: number }) => {
    setRecentDonations((prev) => [data, ...prev.slice(0, 4)])
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageBackHeader title="Donate" />
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Support ZYRADEX</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Help us build the future of decentralized finance on Pi Network. Your Pi donations help us
            maintain and improve the platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Make a Donation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Donate Pi to support development and keep the platform free for everyone.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Support platform development and maintenance",
                  "Help us add new features and improvements",
                  "Keep the platform free for all users",
                  "Support the Pi Network ecosystem",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {!isAuthenticated ? (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Please sign in with your Pi wallet to make a donation.
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={authenticate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Sign in with Pi"
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowDonationModal(true)}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Donate with Pi
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onSuccess={handleDonationSuccess}
      />
    </div>
  )
}
