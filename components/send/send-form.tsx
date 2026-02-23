"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useCheckTrustline } from "@/hooks/useCheckTrustline"
import { sendPayment } from "@/lib/api/account"
import Link from "next/link"

interface SendFormProps {
  publicKey?: string
}

export function SendForm({ publicKey }: SendFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { balances, refresh: refreshBalances } = useAccountBalances(publicKey)

  const [selectedToken, setSelectedToken] = useState<string>("")
  const [destination, setDestination] = useState("")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [userSecret, setUserSecret] = useState("")
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [isCheckingTrustline, setIsCheckingTrustline] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [receiverNeedsTrustline, setReceiverNeedsTrustline] = useState(false)

  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken) return null
    if (selectedToken === "native") {
      return balances.find((b) => b.assetType === "native")
    }
    const [code, issuer] = selectedToken.split(":")
    return balances.find(
      (b) => b.assetCode === code && (issuer ? b.assetIssuer === issuer : !b.assetIssuer)
    )
  }, [selectedToken, balances])

  const { hasTrustline: receiverHasTrustline, isLoading: checkingTrustline } = useCheckTrustline(
    destination.trim() && selectedTokenBalance && selectedTokenBalance.assetType !== "native"
      ? destination.trim()
      : undefined,
    selectedTokenBalance?.assetCode || "",
    selectedTokenBalance?.assetIssuer || undefined,
    false // Don't auto-check, we'll check manually
  )

  const handleCheckAndSend = async () => {
    if (!selectedToken || !destination.trim() || !amount.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (!selectedTokenBalance || amountNum > selectedTokenBalance.amount) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${selectedTokenBalance?.assetCode || "tokens"}.`,
        variant: "destructive",
      })
      return
    }

    // Check receiver trustline for non-native tokens
    if (selectedTokenBalance.assetType !== "native" && selectedTokenBalance.assetIssuer) {
      setIsCheckingTrustline(true)
      setReceiverNeedsTrustline(false)

      try {
        // Use the hook's check by enabling it temporarily
        // For now, we'll check via API call
        const { getAccountBalances } = await import("@/lib/api/account")
        const receiverBalances = await getAccountBalances(destination.trim(), true)

        const hasTrustline = receiverBalances.balances.some(
          (b) =>
            b.assetCode === selectedTokenBalance.assetCode &&
            b.assetIssuer === selectedTokenBalance.assetIssuer
        )

        setIsCheckingTrustline(false)

        if (!hasTrustline) {
          setReceiverNeedsTrustline(true)
          toast({
            title: "Receiver needs trustline",
            description: "The receiver must establish a trustline for this token first.",
            variant: "destructive",
          })
          return
        }
      } catch (err: any) {
        setIsCheckingTrustline(false)
        // If we can't check, proceed anyway (Stellar will handle the error)
        console.warn("Could not check receiver trustline:", err)
      }
    }

    // All checks passed, show secret dialog
    setShowSecretDialog(true)
  }

  const handleSend = async () => {
    if (!userSecret.trim()) {
      toast({
        title: "Secret seed required",
        description: "Please enter your secret seed to sign the transaction.",
        variant: "destructive",
      })
      return
    }

    if (!selectedTokenBalance) return

    setIsSending(true)
    try {
      const assetCode = selectedTokenBalance.assetType === "native" ? "native" : selectedTokenBalance.assetCode
      const assetIssuer = selectedTokenBalance.assetType === "native" ? undefined : selectedTokenBalance.assetIssuer || undefined

      const result = await sendPayment({
        userSecret: userSecret.trim(),
        destination: destination.trim(),
        asset: {
          code: assetCode,
          issuer: assetIssuer,
        },
        amount: amount,
        memo: memo.trim() || undefined,
      })

      if (result.success && result.transactionHash) {
        toast({
          title: "Payment sent successfully",
          description: `Transaction hash: ${result.transactionHash.slice(0, 8)}...`,
        })
        setSelectedToken("")
        setDestination("")
        setAmount("")
        setMemo("")
        setUserSecret("")
        setShowSecretDialog(false)
        refreshBalances()
      } else if (result.receiverNeedsTrustline) {
        setReceiverNeedsTrustline(true)
        setShowSecretDialog(false)
        toast({
          title: "Receiver needs trustline",
          description: "The receiver must establish a trustline for this token first.",
          variant: "destructive",
        })
      } else {
        throw new Error(result.message || "Failed to send payment")
      }
    } catch (err: any) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as any).message
          : "Failed to send payment"
      toast({
        title: "Send failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden border border-border/50 bg-card shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Send Tokens</CardTitle>
          <CardDescription>Send tokens to another wallet address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Token</label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select token to send" />
              </SelectTrigger>
              <SelectContent>
                {balances
                  .filter((balance) => {
                    // Filter out balances that would result in empty value
                    if (balance.assetType === "native") return true
                    return balance.assetCode && balance.assetCode.trim() !== ""
                  })
                  .map((balance) => {
                    const isNative = balance.assetType === "native"
                    const displayName = isNative ? "Test Pi" : balance.assetCode
                    const value = isNative
                      ? "native"
                      : balance.assetIssuer
                      ? `${balance.assetCode}:${balance.assetIssuer}`
                      : balance.assetCode || "unknown"
                    const amount = Number(balance.amount).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{displayName}</span>
                          <span className="text-xs text-muted-foreground ml-2">{amount}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Address</label>
            <Input
              placeholder="G..."
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setReceiverNeedsTrustline(false)
              }}
              className="rounded-xl font-mono"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl pr-20"
              />
              {selectedTokenBalance && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Max: {selectedTokenBalance.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </div>
              )}
            </div>
          </div>

          {/* Memo (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Memo (Optional)</label>
            <Input
              placeholder="Add a memo..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl"
              maxLength={28}
            />
          </div>

          {/* Receiver Needs Trustline Alert */}
          {receiverNeedsTrustline && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The receiver does not have a trustline for this token. Please ask them to{" "}
                <Link href="/trustlines" className="underline font-medium">
                  establish a trustline
                </Link>{" "}
                before sending.
              </AlertDescription>
            </Alert>
          )}

          {/* Send Button */}
          <Button
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg rounded-xl"
            onClick={handleCheckAndSend}
            disabled={isCheckingTrustline || !selectedToken || !destination.trim() || !amount.trim()}
          >
            {isCheckingTrustline ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Checking...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Secret Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              Enter your secret seed to sign and execute the payment transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Seed</label>
              <Input
                type="password"
                placeholder="Enter your secret seed (starts with S...)"
                value={userSecret}
                onChange={(e) => setUserSecret(e.target.value)}
                className="font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSending && userSecret.trim()) {
                    handleSend()
                  }
                }}
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
                  setUserSecret("")
                }}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                onClick={handleSend}
                disabled={isSending || !userSecret.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Confirm Send"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

