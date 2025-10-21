"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { Loader2, Wallet } from "lucide-react"
import { useAppDispatch } from "@/lib/store/hooks"
import { mintToken } from "@/lib/store/slices/tokensSlice"
import { usePi } from "@/components/providers/pi-provider"

export function MintForm() {
  const { toast } = useToast()
  const { addLog } = useLogger()
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [formData, setFormData] = useState({
    issuerSecret: "",
    distributorPub: "",
    assetCode: "",
    amount: "",
    homeDomain: "",
  })
  const [assetCodeError, setAssetCodeError] = useState("")

  const dispatch = useAppDispatch()
  const { user, isAuthenticated, authenticate, createPayment } = usePi()

  const validateAssetCode = (value: string): string => {
    if (!value) {
      return ""
    }
    if (value.length > 12) {
      return "Token name must be 12 characters or less"
    }
    if (value.length < 1) {
      return "Token name must be at least 1 character"
    }
    if (/\s/.test(value)) {
      return "Token name cannot contain spaces"
    }
    if (!/^[a-zA-Z0-9]*$/.test(value)) {
      return "Token name can only contain letters and numbers"
    }
    return ""
  }

  // Enforce max 12 chars and only allow alphanumeric at input level, auto-remove any invalid chars
  const handleAssetCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Remove all non-alphanumeric characters and spaces
    value = value.replace(/[^a-zA-Z0-9]/g, "")

    // Enforce max 12 chars
    if (value.length > 12) {
      value = value.slice(0, 12)
    }

    setFormData({ ...formData, assetCode: value })
    const error = validateAssetCode(value)
    setAssetCodeError(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const assetCodeValidationError = validateAssetCode(formData.assetCode)
    if (assetCodeValidationError) {
      setAssetCodeError(assetCodeValidationError)
      toast({
        title: "Validation Error",
        description: assetCodeValidationError,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    addLog("info", "Initiating token mint...")
    addLog("info", `Asset Code: ${formData.assetCode}`)
    addLog("info", `Amount: ${formData.amount}`)

    try {
      // The backend expects distributorSecret, not distributorPub
      // We'll assume the user enters the secret here (update label accordingly)
      const payload = {
        issuerSecret: formData.issuerSecret,
        distributorSecret: formData.distributorPub,
        assetCode: formData.assetCode,
        amount: formData.amount,
        homeDomain: formData.homeDomain,
      }

      addLog("info", "Dispatching mintToken action...")
      const resultAction = await dispatch(mintToken(payload as any))

      if (mintToken.fulfilled.match(resultAction)) {
        addLog("success", "Token minted successfully!")
        toast({
          title: "Success!",
          description: `Minted ${formData.amount} ${formData.assetCode} tokens`,
        })
        setFormData({
          issuerSecret: "",
          distributorPub: "",
          assetCode: "",
          amount: "",
          homeDomain: "",
        })
      } else {
        const errorMsg = (resultAction.payload as string) || (resultAction.error?.message ?? "Minting failed")
        addLog("error", errorMsg)
        toast({
          title: "Minting Failed",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      addLog("error", "Minting failed")
      toast({
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="issuerSecret" className="text-base font-medium">
          Issuer Secret
        </Label>
        <Input
          id="issuerSecret"
          type="password"
          placeholder="S..."
          value={formData.issuerSecret}
          onChange={(e) => setFormData({ ...formData, issuerSecret: e.target.value })}
          required
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="distributorPub" className="text-base font-medium">
          Distributor Secret
        </Label>
        <Input
          id="distributorPub"
          type="password"
          placeholder="S..."
          value={formData.distributorPub}
          onChange={(e) => setFormData({ ...formData, distributorPub: e.target.value })}
          required
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assetCode" className="text-base font-medium">
          Token Name
        </Label>
        <Input
          id="assetCode"
          placeholder="e.g., MYTOKEN"
          value={formData.assetCode}
          onChange={handleAssetCodeChange}
          required
          maxLength={12}
          className={`border-border ${
            assetCodeError ? "border-destructive focus-visible:ring-destructive" : ""
          }`}
        />
        {assetCodeError && <p className="text-sm text-destructive font-medium">{assetCodeError}</p>}
        <p className="text-sm text-muted-foreground">
          Must be 1–12 alphanumeric characters, no spaces, no special characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base font-medium">
          Total Supply
        </Label>
        <Input
          id="amount"
          type="number"
          placeholder="1000"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="homeDomain" className="text-base font-medium">
          Home Domain (optional)
        </Label>
        <Input
          id="homeDomain"
          placeholder="e.g., mytoken.com"
          value={formData.homeDomain}
          onChange={(e) => setFormData({ ...formData, homeDomain: e.target.value })}
          className="border-border"
        />
      </div>

      <Button type="submit" className="w-full btn-gradient-primary" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Minting..." : "Mint Token"}
      </Button>
    </form>
  )
}
