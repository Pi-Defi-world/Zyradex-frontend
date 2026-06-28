"use client"

import { useState } from "react"
import { PageBackHeader } from "@/components/ui/page-back-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DonationModal } from "@/components/donation-modal"
import { usePi } from "@/components/providers/pi-provider"
import { Heart, CheckCircle2, Loader2 } from "lucide-react"

const steps = [
  { num: 1, title: "Connect Pi Wallet", desc: "Sign in with your Pi Network wallet" },
  { num: 2, title: "Choose Amount", desc: "Select a donation amount in Pi - from 0.1 to any amount" },
  { num: 3, title: "Confirm Payment", desc: "Approve the transaction in your Pi wallet" },
  { num: 4, title: "Thank You!", desc: "Your donation helps support ZYRADEX development" },
]

const faqs = [
  { q: "Is my donation secure?", a: "Yes, all donations are processed through the secure Pi Network blockchain." },
  { q: "Can I donate any amount?", a: "Yes, you can donate any amount starting from 0.1 Pi." },
  { q: "How is my donation used?", a: "Donations fund platform development, server costs, and new features." },
]

export default function DonatePage() {
  const { user, isAuthenticated, authenticate, isLoading } = usePi()
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [recentDonations, setRecentDonations] = useState<{ amount: number }[]>([])

  const handleDonationSuccess = (data: { amount: number }) => {
    setRecentDonations((prev) => [data, ...prev.slice(0, 4)])
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <PageBackHeader title="Donate" />

        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Support ZYRADEX</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Help us build the future of decentralized finance on Pi Network. Your Pi donations help us
            maintain and improve the platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donation Card */}
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

              {recentDonations.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-medium">Recent Donations</h4>
                  {recentDonations.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{d.amount} Pi</span>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Column */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>How Donations Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="font-medium text-sm text-foreground">{faq.q}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{faq.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
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
