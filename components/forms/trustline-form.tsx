"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { Loader2 } from "lucide-react"

export function TrustlineForm() {
  const { toast } = useToast()
  const { addLog } = useLogger()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userSecret: "",
    assetCode: "",
    issuer: "",
    limit: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    addLog("info", "Establishing trustline...")
    addLog("info", `Asset: ${formData.assetCode}`)
    addLog("info", `Limit: ${formData.limit}`)

    // Simulate API call
    setTimeout(() => {
      addLog("success", "Trustline established successfully!")
      toast({
        title: "Success!",
        description: `Trustline for ${formData.assetCode} established`,
      })
      setLoading(false)
      setFormData({ userSecret: "", assetCode: "", issuer: "", limit: "" })
    }, 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userSecret">User Secret</Label>
        <Input
          id="userSecret"
          type="password"
          placeholder="S..."
          value={formData.userSecret}
          onChange={(e) => setFormData({ ...formData, userSecret: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trustAssetCode">Asset Code</Label>
        <Input
          id="trustAssetCode"
          placeholder="e.g., PIUSD"
          value={formData.assetCode}
          onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuer">Issuer Public Key</Label>
        <Input
          id="issuer"
          placeholder="G..."
          value={formData.issuer}
          onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Trust Limit</Label>
        <Input
          id="limit"
          type="number"
          placeholder="10000"
          value={formData.limit}
          onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Establishing..." : "Establish Trustline"}
      </Button>
    </form>
  )
}
