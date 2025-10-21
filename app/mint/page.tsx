"use client"

import { MintForm } from "@/components/forms/mint-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MintPage() {
  
  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 max-w-2xl mx-auto">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Minting creates new tokens and adds them to the total supply. Make sure you have the necessary permissions
              and understand the tokenomics before minting.
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
