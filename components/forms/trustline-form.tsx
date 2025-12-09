"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { Loader2 } from "lucide-react"
import { useTrustline } from "@/hooks/useTokenRegistry"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export function TrustlineForm() {
  const { toast } = useToast()
  const { addLog } = useLogger()
  const { user } = usePi()
  const { profile } = useUserProfile()
  const { establishTrustline, isLoading, error } = useTrustline()

  const [formData, setFormData] = useState({
    userSecret: "",
    assetCode: "",
    issuer: "",
    limit: "100000000",
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.userSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive" 
      })
      return
    }

    try {
      addLog("info", `Establishing trustline for ${formData.assetCode}`)
      await establishTrustline({
        userSecret: formData.userSecret.trim(),
        assetCode: formData.assetCode,
        issuer: formData.issuer,
        limit: formData.limit,
      })
      addLog("success", "Trustline established successfully")
      toast({ title: "Trustline established", description: `${formData.assetCode} is now trusted.` })
      setFormData({ userSecret: "", assetCode: "", issuer: "", limit: "100000000" })
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to establish trustline"
      addLog("error", message)
      toast({ title: "Trustline failed", description: message, variant: "destructive" })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userSecret">Secret Seed (Required)</Label>
          <Input
            id="userSecret"
            type="password"
            placeholder="Enter your secret seed (starts with S...)"
            value={formData.userSecret}
            onChange={(event) => setFormData({ ...formData, userSecret: event.target.value })}
            required
          />
          <p className="text-sm text-muted-foreground">Enter your secret seed to sign this transaction. We don't store your secret seed.</p>
        </div>

      <div className="space-y-2">
        <Label htmlFor="trustAssetCode">Asset Code</Label>
        <Input
          id="trustAssetCode"
          placeholder="e.g., PIUSD"
          value={formData.assetCode}
          onChange={(event) => setFormData({ ...formData, assetCode: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuer">Issuer Public Key</Label>
        <Input
          id="issuer"
          placeholder="G..."
          value={formData.issuer}
          onChange={(event) => setFormData({ ...formData, issuer: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Trust Limit</Label>
        <Input
          id="limit"
          type="number"
          placeholder="100000000"
          value={formData.limit}
          onChange={(event) => setFormData({ ...formData, limit: event.target.value })}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Establishing..." : "Establish Trustline"}
        </Button>
      </form>

    </>
  )
}
