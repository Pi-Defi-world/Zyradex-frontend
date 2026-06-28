"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Settings,
  Copy,
  LogOut,
  Loader2,
  User,
  Shield,
  History,
  Droplets,
  ArrowRightLeft,
  Gift,
  Github,
  Send,
  Share2,
  ChevronRight,
  Wallet,
} from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useBalanceRefresh } from "@/components/providers/balance-refresh-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateWallet, useChangeWallet } from "@/hooks/useAccountData"
import { useUserProfile } from "@/hooks/useUserProfile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { usePiPrice } from "@/hooks/usePiPrice"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, authenticate, signOut } = usePi()
  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useUserProfile()
  const { toast } = useToast()
  const [storedWalletAddress, setStoredWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { createWallet, isLoading: creatingWallet, error: createWalletError } = useCreateWallet()
  const { changeWallet, isLoading: changingWallet, error: changeWalletError } = useChangeWallet()
  const [newWalletSecret, setNewWalletSecret] = useState<string | null>(null)
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [successReplaceWarning, setSuccessReplaceWarning] = useState<string | null>(null)
  const [showChangeWalletWarning, setShowChangeWalletWarning] = useState(false)
  const [changeWalletConfirm, setChangeWalletConfirm] = useState(false)
  const { price: piPrice } = usePiPrice()

  useEffect(() => {
    if (!isAuthenticated) {
      setStoredWalletAddress(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("zyradex-wallet-address")
      }
      return
    }
    if (profile?.public_key && profile.public_key.trim() !== '') {
      setStoredWalletAddress(profile.public_key)
      if (typeof window !== "undefined") {
        localStorage.setItem("zyradex-wallet-address", profile.public_key)
      }
      return
    }
    const storedWallet = getStoredWallet()
    if (storedWallet && profile?.public_key && storedWallet === profile.public_key) {
      setStoredWalletAddress(storedWallet)
    } else {
      setStoredWalletAddress(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("zyradex-wallet-address")
      }
    }
    if (!storedWalletAddress && !profile?.public_key && user?.wallet_address) {
      setStoredWalletAddress(user.wallet_address)
    }
  }, [profile?.public_key, user?.wallet_address, isAuthenticated, profile])

  const { balances, totalBalance, isLoading: balancesLoading, refresh: refreshBalances } = useAccountBalances(storedWalletAddress ?? user?.wallet_address ?? undefined)
  const { refreshBalances: refreshBalancesGlobal } = useBalanceRefresh() ?? {}

  const usdBalance = useMemo(() => {
    if (!piPrice || !totalBalance) return null
    return totalBalance * piPrice
  }, [piPrice, totalBalance])

  const handleCopyWalletAddress = () => {
    const address = storedWalletAddress || user?.wallet_address
    if (address) {
      navigator.clipboard.writeText(address)
      toast({ title: "Copied", description: "Wallet address copied to clipboard" })
    }
  }

  const handleWalletPersist = (walletAddress: string) => {
    setStoredWalletAddress(walletAddress)
    if (typeof window !== "undefined") {
      localStorage.setItem("zyradex-wallet-address", walletAddress)
    }
  }

  const handlePiConnect = async () => {
    setIsLoading(true)
    try {
      await authenticate()
    } catch (error) {
      console.error("Pi authentication failed:", error)
      toast({ title: "Authentication Failed", description: "Please try again.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWallet = async () => {
    if (!isAuthenticated) {
      toast({ title: "Connect wallet first", description: "Please authenticate with Pi to create a wallet.", variant: "destructive" })
      return
    }
    try {
      const response = await createWallet()
      setNewWalletSecret(response.secret)
      setSuccessReplaceWarning(response.replacedPreviousWallet ? (response.warning ?? null) : null)
      handleWalletPersist(response.publicKey)
      refreshProfile().catch(() => undefined)
      setShowSecretDialog(true)
      toast({ title: "Wallet Created", description: "Save your secret seed securely." })
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Wallet creation failed"
      toast({ title: "Creation failed", description: message, variant: "destructive" })
    }
  }

  const handleChangeWalletClick = () => {
    setChangeWalletConfirm(false)
    setShowChangeWalletWarning(true)
  }

  const handleChangeWalletConfirm = async () => {
    if (!changeWalletConfirm || !isAuthenticated) return
    try {
      const response = await changeWallet()
      setShowChangeWalletWarning(false)
      setChangeWalletConfirm(false)
      setNewWalletSecret(response.secret)
      setSuccessReplaceWarning(response.replacedPreviousWallet ? (response.warning ?? null) : null)
      handleWalletPersist(response.publicKey)
      refreshProfile().catch(() => undefined)
      refreshBalances()
      refreshBalancesGlobal?.()
      setShowSecretDialog(true)
      toast({ title: "Wallet replaced", description: "Save your new secret seed securely." })
    } catch (err: unknown) {
      const apiError = err && typeof err === "object" && "code" in err ? (err as { code?: string; message?: string }) : null
      if (apiError?.code === "NO_WALLET_TO_REPLACE") {
        setShowChangeWalletWarning(false)
        setChangeWalletConfirm(false)
        refreshProfile().catch(() => undefined)
        toast({ title: "No wallet to replace", description: "Use Create wallet to set up your first wallet.", variant: "destructive" })
      } else {
        const message = apiError && "message" in apiError ? (apiError as { message: string }).message : "Failed to replace wallet"
        toast({ title: "Change wallet failed", description: message, variant: "destructive" })
      }
    }
  }

  const handleCopySecret = () => {
    if (newWalletSecret) {
      navigator.clipboard.writeText(newWalletSecret)
      toast({ title: "Copied", description: "Secret seed copied. Keep it safe!" })
    }
  }

  const navItems = [
    { title: "Swap Assets", description: "Exchange tokens", icon: ArrowRightLeft, href: "/swap" },
    { title: "Transaction History", description: "View past transactions", icon: History, href: "/history" },
    { title: "Liquidity Pools", description: "Manage LP positions", icon: Droplets, href: "/liquidity" },
    { title: "Rewards & Referral", description: "Earn and refer friends", icon: Gift, href: "/profile/rewards" },
    ...(profile?.role === "admin" ? [{ title: "Launchpad (Admin)", description: "Create new tokens", icon: Shield, href: "/mint" }] : []),
  ]

  const walletDisplay = storedWalletAddress || user?.wallet_address
  const truncatedWallet = walletDisplay ? `${walletDisplay.slice(0, 6)}...${walletDisplay.slice(-6)}` : null

  // UNAUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
        <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Connect your wallet to view your profile</p>
          </div>

          <Card className="border border-slate-200 dark:border-slate-700">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                <Wallet className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Not connected</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Connect your Pi wallet to view holdings, track assets, and manage your profile.
                </p>
              </div>
              <Button
                onClick={handlePiConnect}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-mint-500 text-white hover:shadow-lg hover:shadow-green-500/25 rounded-xl"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Settings (available even without auth) */}
          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>Theme: Use the toggle in the top navigation bar</p>
              <p>Network: Pi Network (Testnet)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // AUTHENTICATED
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6">
      <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        </div>

        {/* Wallet Identity Card */}
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {profile?.avatarUrl && !profileLoading && (
                  <AvatarImage src={profile.avatarUrl} alt={profile?.username || "Avatar"} className="object-cover" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-green-600 to-mint-500 text-white text-xl font-bold">
                  {(user?.username || "Z").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate">
                  {user?.username ? `@${user.username}` : "Connected"}
                </div>
                {walletDisplay && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[160px]" title={walletDisplay}>
                      {truncatedWallet}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyWalletAddress}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Assets</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{balances.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Balance</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {usdBalance !== null && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
                ≈ ${usdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Actions</h2>
          {navItems.map((item) => (
            <Link key={item.title} href={item.href} className="block w-full">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <item.icon className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                </div>
              </div>
            </Link>
          ))}

          {/* Change wallet */}
          <button type="button" onClick={handleChangeWalletClick} disabled={changingWallet || !isAuthenticated} className="block w-full text-left">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Shield className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Change wallet</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Replace or set up a new wallet</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
              </div>
            </div>
          </button>
        </div>

        {/* Create Wallet (if no wallet yet) */}
        {!storedWalletAddress && (
          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Create Wallet
              </CardTitle>
              <CardDescription>Generate a new wallet and receive test Pi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createWalletError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{createWalletError.message}</AlertDescription>
                </Alert>
              )}
              <Alert>
                <AlertDescription className="text-sm">
                  A new wallet will be created and seeded with test Pi. Save your secret seed securely — we don't store it.
                </AlertDescription>
              </Alert>
              <Button onClick={handleCreateWallet} className="w-full bg-gradient-to-r from-green-600 to-mint-500 text-white" disabled={creatingWallet}>
                {creatingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create New Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button onClick={signOut} variant="ghost" className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect Wallet
        </Button>

        {/* Social Links */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Connect</h2>
          <div className="flex flex-wrap gap-3">
            <a href="https://github.com/Pi-Defi-world/Zyradex-frontend" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a href="https://t.me/zyrachains" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium">
              <Send className="h-4 w-4" /> Telegram
            </a>
            <a href="https://x.com/intent/follow?screen_name=zyradex" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium">
              <Share2 className="h-4 w-4" /> X
            </a>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 pt-2">ZyraDex v1.0.0</p>
      </div>

      {/* Secret Seed Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={(open) => { setShowSecretDialog(open); if (!open) { setNewWalletSecret(null); setSuccessReplaceWarning(null) } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Save Your Secret Seed</DialogTitle>
            <DialogDescription>Your wallet has been created. Save your secret seed securely — you'll need it for all transactions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {successReplaceWarning && <Alert variant="destructive"><AlertDescription className="text-sm">{successReplaceWarning}</AlertDescription></Alert>}
            <Alert variant="destructive"><AlertDescription className="text-sm"><strong>IMPORTANT:</strong> We don't store your secret seed. Save it in a secure location.</AlertDescription></Alert>
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
                <span className="flex-1 break-all font-mono text-xs min-w-0">{storedWalletAddress}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyWalletAddress}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Seed</Label>
              <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border min-h-[60px]">
                <span className="flex-1 break-all font-mono text-xs leading-relaxed">{newWalletSecret}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5" onClick={handleCopySecret}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <Button onClick={() => { setShowSecretDialog(false); setNewWalletSecret(null); setSuccessReplaceWarning(null) }} className="w-full">I've Saved My Secret Seed</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Wallet Warning */}
      <Dialog open={showChangeWalletWarning} onOpenChange={(open) => { setShowChangeWalletWarning(open); if (!open) setChangeWalletConfirm(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changing your wallet</DialogTitle>
            <DialogDescription>Your current wallet will be replaced. Funds in the old wallet are not automatically moved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert variant="destructive"><AlertDescription className="text-sm">Funds in the old wallet are not automatically moved. Save the new secret key securely.</AlertDescription></Alert>
            {changeWalletError && <Alert variant="destructive"><AlertDescription className="text-sm">{changeWalletError.message}</AlertDescription></Alert>}
            <div className="flex items-center gap-2">
              <Checkbox id="confirm-replace" checked={changeWalletConfirm} onCheckedChange={(c) => setChangeWalletConfirm(c === true)} />
              <label htmlFor="confirm-replace" className="text-sm cursor-pointer">I understand, replace my wallet</label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowChangeWalletWarning(false); setChangeWalletConfirm(false) }}>Cancel</Button>
              <Button className="flex-1" disabled={!changeWalletConfirm || changingWallet} onClick={handleChangeWalletConfirm}>
                {changingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Replace wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
