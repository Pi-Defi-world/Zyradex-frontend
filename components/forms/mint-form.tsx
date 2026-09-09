"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { Loader2 } from "lucide-react"
import { useMintToken } from "@/hooks/useTokenRegistry"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useBalanceRefresh } from "@/components/providers/balance-refresh-provider"
import { getMintFee } from "@/lib/api/tokens"

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
  const { refreshBalances: refreshBalancesGlobal } = useBalanceRefresh() ?? {}

  useEffect(() => {
    const stored = getStoredWallet()
    const address = profile?.public_key || stored || user?.wallet_address || null
    setWalletAddress(address)
  }, [profile?.public_key, user?.wallet_address])

  // Fetch mint fee on component mount
  useEffect(() => {
    const fetchMintFee = async () => {
      setLoadingFee(true)
      try {
        const feeData = await getMintFee()
        if (feeData.success && feeData.fee) {
          setMintFee({
            platformFee: feeData.fee.platformFee,
            baseFee: feeData.fee.baseFee,
            totalFee: feeData.fee.totalFee,
          })
        }
      } catch (err) {
        console.error("Failed to fetch mint fee:", err)
      } finally {
        setLoadingFee(false)
      }
    }
    fetchMintFee()
  }, [])

  const [formData, setFormData] = useState({
    distributorSecret: "",
    assetCode: "",
    totalSupply: "",
    tokenName: "",
    description: "",
    homeDomain: "",
  })
  const [assetCodeError, setAssetCodeError] = useState("")
  const [mintFee, setMintFee] = useState<{ platformFee: string; baseFee: string; totalFee: string } | null>(null)
  const [loadingFee, setLoadingFee] = useState(false)
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [distributorSecret, setDistributorSecret] = useState("")


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

  const handleMintClick = (event: React.FormEvent) => {
    event.preventDefault()

    const assetCodeValidationError = validateAssetCode(formData.assetCode)
    if (assetCodeValidationError) {
      setAssetCodeError(assetCodeValidationError)
      toast({ title: "Validation Error", description: assetCodeValidationError, variant: "destructive" })
      return
    }

    if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
      toast({ title: "Invalid total supply", description: "Total supply must be a positive number.", variant: "destructive" })
      return
    }

    setShowSecretDialog(true)
  }

  const handleSubmit = async () => {
    if (!distributorSecret.trim()) {
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
        distributorSecret: distributorSecret.trim(),
        assetCode: formData.assetCode,
        totalSupply: totalSupplyNum,
        name: formData.tokenName || formData.assetCode,
        description: formData.description || `${formData.assetCode} token`,
        homeDomain: formData.homeDomain || undefined,
      })

      addLog("success", "Token minted successfully")
      toast({ title: "Token minted", description: `${formData.totalSupply} ${formData.assetCode} issued.` })
      setFormData({ distributorSecret: "", assetCode: "", totalSupply: "", tokenName: "", description: "", homeDomain: "" })
      setDistributorSecret("")
      setShowSecretDialog(false)
      setAssetCodeError("")
      
      // Refresh balances after successful minting to show new token
      if (publicKey) {
        setTimeout(() => {
          refreshBalances()
          refreshBalancesGlobal?.()
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
    <form onSubmit={handleMintClick} className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Token Code</div>
          <Input
            id="assetCode"
            placeholder="MYTOKEN"
            value={formData.assetCode}
            onChange={handleAssetCodeChange}
            required
            maxLength={12}
            className={`rounded-2xl p-4 pt-8 border border-border/50 ${assetCodeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
        </div>
        {assetCodeError && <p className="text-sm text-destructive font-medium -mt-2">{assetCodeError}</p>}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Token Name </div>
          <Input
            id="tokenName"
            placeholder="Token display name"
            value={formData.tokenName}
            onChange={(event) => setFormData((prev) => ({ ...prev, tokenName: event.target.value }))}
            className="rounded-2xl p-4 pt-8 border border-border/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Total Supply</div>
          <Input
            id="totalSupply"
            type="number"
            min="0"
            step="any"
            placeholder="1000"
            value={formData.totalSupply}
            onChange={(event) => setFormData((prev) => ({ ...prev, totalSupply: event.target.value }))}
            required
            className="rounded-2xl p-4 pt-8 border border-border/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute top-3 left-4 text-xs text-muted-foreground font-medium z-10">Domain (Optional)</div>
          <Input
            id="homeDomain"
            type="text"
            placeholder="https://example.com"
            value={formData.homeDomain}
            onChange={(event) => setFormData((prev) => ({ ...prev, homeDomain: event.target.value }))}
            className="rounded-2xl p-4 pt-8 border border-border/50"
          />
        </div>
      </div>

      {mintFee && (
        <div className="rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Fee</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
              ~{parseFloat(mintFee.totalFee).toFixed(7)} Test Pi
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <Button 
        type="submit" 
        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50" 
        disabled={isLoading || !formData.assetCode || !formData.totalSupply}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Minting...
          </>
        ) : (
          "Mint Token"
        )}
      </Button>
    </form>

    <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Mint</DialogTitle>
          <DialogDescription>
            Enter your secret seed to sign and execute the mint transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Seed</label>
            <Input
              type="password"
              placeholder="Enter your secret seed (starts with S...)"
              value={distributorSecret}
              onChange={(event) => setDistributorSecret(event.target.value)}
              className="font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              We don't store your secret seed. It's only used to sign this transaction.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSecretDialog(false)
                setDistributorSecret("")
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              onClick={handleSubmit}
              disabled={isLoading || !distributorSecret.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                "Confirm Mint"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
