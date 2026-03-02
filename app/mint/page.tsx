"use client"

import Link from "next/link"
import { MintForm } from "@/components/forms/mint-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Lock, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUserProfile } from "@/hooks/useUserProfile"

export default function MintPage() {
  const { profile, isLoading } = useUserProfile()
  const isAdmin = profile?.role === "admin"

  if (isLoading) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Token creation is restricted to approved projects (PiRC). Only project owners can create tokens when creating a launch (IPO). Use the Invest page to participate in launches or create a launch from your approved project.
            </AlertDescription>
          </Alert>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How to create a token</CardTitle>
              <CardDescription>Tokens are created as part of an IPO launch by approved projects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you represent an approved project, create a launch with token details from the API or project dashboard. If you want to participate in token launches, browse open IPOs on the Invest page.
              </p>
              <Button asChild>
                <Link href="/invest" className="inline-flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Go to Invest (IPO)
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 max-w-2xl mx-auto">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Admin: Minting creates new tokens. For PiRC-aligned flows, projects should create launches with token params instead. This form is for admin or legacy use.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Token Details</CardTitle>
              <CardDescription>Enter the details for your new token</CardDescription>
            </CardHeader>
            <CardContent>
              <MintForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Minting Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-1">1. Token Creation</h4>
                <p>Define your token's name, symbol, and total supply.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">2. Initial Distribution</h4>
                <p>Specify the initial amount to mint and the recipient address.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">3. Supply Management</h4>
                <p>Track remaining supply and mint additional tokens as needed.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
