"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { Loader2 } from "lucide-react"
import { useMintToken } from "@/hooks/useTokenRegistry"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAccountBalances } from "@/hooks/useAccountData"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export function MintForm() {
  const { toast } = useToast()
  const { addLog } = useLogger()
  const { user } = usePi()
  const { profile } = useUserProfile()
  const { mintToken, isLoading, error } = useMintToken()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  
  // Get public key for balance refresh
  const publicKey = profile?.public_key || walletAddress || user?.wallet_address || undefined
  const { refresh: refreshBalances } = useAccountBalances(publicKey)

  useEffect(() => {
    const stored = getStoredWallet()
    const address = profile?.public_key || stored || user?.wallet_address || null
    setWalletAddress(address)
  }, [profile?.public_key, user?.wallet_address])

  const [formData, setFormData] = useState({
    distributorSecret: "",
    assetCode: "",
    totalSupply: "",
    tokenName: "",
    description: "",
    homeDomain: "",
  })
  const [assetCodeError, setAssetCodeError] = useState("")


  const validateAssetCode = (value: string): string => {
    if (!value) return "Token code is required"
    if (value.length > 12) return "Token code must be 12 characters or less"
    if (!/^[a-zA-Z0-9]+$/.test(value)) return "Token code can only contain letters and numbers"
    return ""
  }

  const handleAssetCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/[^a-zA-Z0-9]/g, "")
    if (value.length > 12) {
      value = value.slice(0, 12)
    }
    setFormData((prev) => ({ ...prev, assetCode: value }))
    setAssetCodeError(validateAssetCode(value))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const assetCodeValidationError = validateAssetCode(formData.assetCode)
    if (assetCodeValidationError) {
      setAssetCodeError(assetCodeValidationError)
      toast({ title: "Validation Error", description: assetCodeValidationError, variant: "destructive" })
      return
    }

    if (!formData.distributorSecret.trim()) {
      toast({ 
        title: "Secret seed required", 
        description: "Please enter your secret key to sign the transaction.",
        variant: "destructive" 
      })
      return
    }

    try {

      // Convert totalSupply to number
      const totalSupplyNum = parseFloat(formData.totalSupply)
      if (isNaN(totalSupplyNum) || totalSupplyNum <= 0) {
        toast({ title: "Invalid total supply", description: "Total supply must be a positive number.", variant: "destructive" })
        return
      }

      addLog("info", `Minting ${formData.totalSupply} ${formData.assetCode}`)
      await mintToken({
        distributorSecret: formData.distributorSecret.trim(),
        assetCode: formData.assetCode,
        totalSupply: totalSupplyNum,
        name: formData.tokenName || formData.assetCode,
        description: formData.description || `${formData.assetCode} token`,
        homeDomain: formData.homeDomain || undefined,
      })

      addLog("success", "Token minted successfully")
      toast({ title: "Token minted", description: `${formData.totalSupply} ${formData.assetCode} issued.` })
      setFormData({ distributorSecret: "", assetCode: "", totalSupply: "", tokenName: "", description: "", homeDomain: "" })
      setAssetCodeError("")
      
      // Refresh balances after successful minting to show new token
      // Backend already clears cache, but we refresh to get the latest data
      if (publicKey) {
        setTimeout(() => {
          refreshBalances()
        }, 2000) // Wait 2 seconds for transaction to be processed
      }
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Minting failed"
      addLog("error", message)
      toast({ title: "Minting failed", description: message, variant: "destructive" })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="distributorSecret" className="text-base font-medium">
          Wallet Secret Key (Required)
        </Label>
        <Input
          id="distributorSecret"
          type="password"
          placeholder="Enter your wallet secret key (starts with W...)"
          value={formData.distributorSecret}
          onChange={(event) => setFormData((prev) => ({ ...prev, distributorSecret: event.target.value }))}
          required
        />
        <p className="text-sm text-muted-foreground">Enter your wallet secret key to sign the mint transaction. We don't store your secret key.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assetCode" className="text-base font-medium">
          Token Code
        </Label>
        <Input
          id="assetCode"
          placeholder="e.g., MYTOKEN"
          value={formData.assetCode}
          onChange={handleAssetCodeChange}
          required
          maxLength={12}
          className={`border-border ${assetCodeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {assetCodeError && <p className="text-sm text-destructive font-medium">{assetCodeError}</p>}
        <p className="text-sm text-muted-foreground">1–12 alphanumeric characters, no spaces or symbols</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tokenName" className="text-base font-medium">
          Token Name
        </Label>
        <Input
          id="tokenName"
          placeholder="Token display name"
          value={formData.tokenName}
          onChange={(event) => setFormData((prev) => ({ ...prev, tokenName: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Description
        </Label>
        <Input
          id="description"
          placeholder="Short description"
          value={formData.description}
          onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalSupply" className="text-base font-medium">
          Total Supply
        </Label>
        <Input
          id="totalSupply"
          type="number"
          min="0"
          step="any"
          placeholder="1000"
          value={formData.totalSupply}
          onChange={(event) => setFormData((prev) => ({ ...prev, totalSupply: event.target.value }))}
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
          placeholder="e.g., dex.example.com"
          value={formData.homeDomain}
          onChange={(event) => setFormData((prev) => ({ ...prev, homeDomain: event.target.value }))}
          className="border-border"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <Button type="submit" className="w-full btn-gradient-primary" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Minting..." : "Mint Token"}
      </Button>
    </form>

    </>
  )
}
