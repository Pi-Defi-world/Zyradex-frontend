"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Plug,
  Settings,
  FileText,
  BookOpen,
  ChevronRight,
  Copy,
  MessageCircle,
  LogOut,
  Loader2,
  Users,
  Star,
  Rocket,
  LayoutDashboard,
  Coins,
  Droplets,
  User,
  Shield,
  History,
  Heart,
  Github,
  Send,
  Share2,
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

  useEffect(() => {
    // Only set wallet address if user is authenticated
    if (!isAuthenticated) {
      setStoredWalletAddress(null)
      if (typeof window !== "undefined") {
        // Clear localStorage when not authenticated
        localStorage.removeItem("zyradex-wallet-address")
      }
      return
    }

    // Priority 1: Use wallet from user profile (database) - this is the source of truth
    if (profile?.public_key && profile.public_key.trim() !== '') {
      setStoredWalletAddress(profile.public_key)
      if (typeof window !== "undefined") {
        // Only store in localStorage if it matches the database
        localStorage.setItem("zyradex-wallet-address", profile.public_key)
      }
      return
    }

    // Priority 2: Check localStorage, but only if it matches what's in the database
    // If user has no wallet in database, clear localStorage to avoid using stale data
    const storedWallet = getStoredWallet()
    if (storedWallet && profile?.public_key && storedWallet === profile.public_key) {
      // Only use localStorage if it matches the database
      setStoredWalletAddress(storedWallet)
    } else {
      // Clear localStorage if it doesn't match or user has no wallet
      setStoredWalletAddress(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("zyradex-wallet-address")
      }
    }

    // Priority 3: Fallback to user.wallet_address (from Pi SDK) if no database wallet
    if (!storedWalletAddress && !profile?.public_key && user?.wallet_address) {
      setStoredWalletAddress(user.wallet_address)
    }
  }, [profile?.public_key, user?.wallet_address, isAuthenticated, profile])

  const { balances, totalBalance, isLoading: balancesLoading, refresh: refreshBalances } = useAccountBalances(storedWalletAddress ?? user?.wallet_address ?? undefined)
  const { refreshBalances: refreshBalancesGlobal } = useBalanceRefresh() ?? {}

  const stats = useMemo(
    () => [
      { label: "Assets", value: balances.length, icon: Users },
      { label: "Total Balance", value: totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }), icon: Coins },
      { label: "Liquidity Pools", value: "–", icon: Droplets },
    ],
    [balances.length, totalBalance]
  )

  const handleCopyWalletAddress = () => {
    const address = storedWalletAddress || user?.wallet_address
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
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
      toast({
        title: "Authentication Failed",
        description: "Please try again or enter your wallet address manually",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWallet = async () => {
    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please authenticate first to create a wallet.", 
        variant: "destructive" 
      })
      return
    }

    try {
      const response = await createWallet()
      
      // Store the secret seed to show to user
      setNewWalletSecret(response.secret)
      setSuccessReplaceWarning(response.replacedPreviousWallet ? (response.warning ?? null) : null)
      handleWalletPersist(response.publicKey)
      refreshProfile().catch(() => undefined)
      
      // Show dialog with wallet details
      setShowSecretDialog(true)
      
      toast({
        title: "Wallet Created!",
        description: "Your new wallet has been created and seeded with test Pi. Please save your secret seed securely.",
      })
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
      toast({
        title: response.replacedPreviousWallet ? "Wallet replaced" : "Wallet created",
        description: "Save your new secret seed securely.",
      })
    } catch (err: unknown) {
      const apiError = err && typeof err === "object" && "code" in err ? (err as { code?: string; message?: string }) : null
      const code = apiError?.code
      if (code === "NO_WALLET_TO_REPLACE") {
        setShowChangeWalletWarning(false)
        setChangeWalletConfirm(false)
        refreshProfile().catch(() => undefined)
        toast({
          title: "No wallet to replace",
          description: "Use Create wallet below to set up your first wallet.",
          variant: "destructive",
        })
      } else if (code === "CONFIRM_REQUIRED") {
        toast({
          title: "Confirmation required",
          description: "Please confirm that you understand the warning before replacing your wallet.",
          variant: "destructive",
        })
      } else {
        const message = apiError && "message" in apiError ? (apiError as { message: string }).message : "Failed to replace wallet"
        toast({ title: "Change wallet failed", description: message, variant: "destructive" })
      }
    }
  }

  const handleCopySecret = () => {
    if (newWalletSecret) {
      navigator.clipboard.writeText(newWalletSecret)
      toast({
        title: "Copied!",
        description: "Secret seed copied to clipboard. Keep it safe!",
      })
    }
  }

  const mainNavItems = [
    {
      title: "My Assets",
      description: "Manage your assets",
      icon: Coins,
      href: "/my-tokens",
      showChevron: true,
    },
    ...(profile?.role === "admin"
      ? [
          {
            title: "Launchpad (Mint)",
            description: "Create new tokens (admin)",
            icon: Rocket,
            href: "/mint",
            showChevron: true,
          },
        ]
      : []),
    {
      title: "Liquidity Pools",
      description: "Manage LP Holdings",
      icon: Droplets,
      href: "/liquidity",
      showChevron: true,
    },
    {
      title: "Swap Assets",
      description: "Exchange assets",
      icon: Users,
      href: "/swap",
      showChevron: true,
    },
    {
      title: "Transaction History",
      description: "View your transaction history",
      icon: History,
      href: "/history",
      showChevron: true,
    },
    {
      title: "Donate",
      description: "Support ZYRADEX with Pi donations",
      icon: Heart,
      href: "/donate",
      showChevron: true,
    },
  ]

  // const additionalMenuItems = [
  //   {
  //     title: "Terms of Service",
  //     description: "Read our terms and conditions",
  //     icon: FileText,
  //     href: "/terms",
  //     showChevron: true,
  //   },
  //   {
  //     title: "Privacy Policy",
  //     description: "Learn about our privacy practices",
  //     icon: FileText,
  //     href: "/privacy",
  //     showChevron: true,
  //   },
  //   // {
  //   //   title: "API Documentation",
  //   //   description: "Pi Network Oracle API docs",
  //   //   icon: BookOpen,
  //   //   href: "/api-docs",
  //   //   showChevron: true,
  //   // },
  //   {
  //     title: "Contact Us",
  //     description: "Get help and support",
  //     icon: MessageCircle,
  //     href: "/contact",
  //     showChevron: true,
  //   },
  // ]

  const walletDisplay = storedWalletAddress || user?.wallet_address
  const truncatedWallet = walletDisplay ? `${walletDisplay.slice(0, 6)}...${walletDisplay.slice(-6)}` : null

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-md mx-auto space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Wallet
            </CardTitle>
            <CardDescription> Your ZyraDex Profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile?.avatarUrl && !profileLoading && (
                  <AvatarImage src={profile.avatarUrl} alt={profile?.username || "Profile avatar"} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {(user?.username || "Guest").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg text-foreground truncate">
                  {isLoading ? "Authenticating..." : user?.username ? `@${user.username}` : "Unauthenticated"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Wallets tracked: {balancesLoading ? "..." : stats[0].value}
                </div>
                {walletDisplay && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="truncate max-w-[160px]" title={walletDisplay}>
                      {truncatedWallet}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyWalletAddress()}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3 text-center">
              {stats.map((stat) => (
                <div key={stat.label} className="p-2 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold">{balancesLoading ? "..." : stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {!storedWalletAddress && isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create New Wallet
              </CardTitle>
              <CardDescription>Generate a new wallet and receive test Pi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createWalletError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm break-words">
                    {createWalletError.message}
                  </AlertDescription>
                </Alert>
              )}
              <Alert>
                <AlertDescription className="text-sm break-words">
                  A new wallet will be created and seeded with test Pi. You will receive your secret seed - 
                  save it securely as you'll need it for all transactions. We don't store your secret seed.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleCreateWallet} 
                className="btn-gradient-primary w-full" 
                disabled={creatingWallet}
              >
                {creatingWallet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create New Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Holdings
            </CardTitle>
            <CardDescription>Your holdings on the ZyraDex</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="font-medium text-foreground">Assets Tracked</p>
              <p>{balancesLoading ? "Loading..." : balances.length ? `${balances.length} assets` : "None yet"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="font-medium text-foreground">Total Value</p>
              <p>{balancesLoading ? "Loading..." : totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
          {mainNavItems.map((item) => (
            <Link key={item.title} href={item.href} className="block w-full">
              <div className="bg-card rounded-xl p-4 hover:bg-muted/50 transition-colors border border-border/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  {item.showChevron && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />}
                </div>
              </div>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleChangeWalletClick}
            disabled={changingWallet || !isAuthenticated}
            className="block w-full text-left"
          >
            <div className="bg-card rounded-xl p-4 hover:bg-muted/50 transition-colors border border-border/30 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground truncate">Change wallet</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Replace your wallet or set up a new one</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </div>
            </div>
          </button>
        </div>

        <div className="space-y-3 pt-4">
          <h2 className="text-lg font-semibold text-foreground">Connect with us</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/Pi-Defi-world/demo-app-fronted"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
            <a
              href="https://t.me/zyrachains"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              <Send className="h-5 w-5" />
              Telegram
            </a>
            <a
              href="https://x.com/zyradex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              <Share2 className="h-5 w-5" />
              X
            </a>
          </div>
        </div>

      </div>

      <Dialog open={showSecretDialog} onOpenChange={(open) => {
        setShowSecretDialog(open)
        if (!open) {
          setNewWalletSecret(null)
          setSuccessReplaceWarning(null)
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Save Your Secret Seed</DialogTitle>
            <DialogDescription>
              Your wallet has been created! Please save your secret seed securely. You'll need it for all transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {successReplaceWarning && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm break-words">
                  {successReplaceWarning}
                </AlertDescription>
              </Alert>
            )}
            <Alert variant="destructive">
              <AlertDescription className="text-sm break-words">
                <strong>IMPORTANT:</strong> Save this secret seed in a secure location. We don't store it, 
                and you cannot recover it if lost. You'll need to provide it for every transaction.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Wallet Address (Public Key)</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md border border-border">
                <span className="flex-1 break-all font-mono text-xs sm:text-sm min-w-0">{storedWalletAddress}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyWalletAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Seed (Private Key)</Label>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-md border border-border min-h-[60px]">
                <span className="flex-1 break-all font-mono text-xs sm:text-sm min-w-0 leading-relaxed">{newWalletSecret}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5" onClick={handleCopySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowSecretDialog(false)
                setNewWalletSecret(null)
                setSuccessReplaceWarning(null)
              }}
              className="w-full"
            >
              I've Saved My Secret Seed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangeWalletWarning} onOpenChange={(open) => {
        setShowChangeWalletWarning(open)
        if (!open) setChangeWalletConfirm(false)
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Changing your wallet</DialogTitle>
            <DialogDescription>
              Your current wallet will be replaced. The old wallet address will no longer be linked to this account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert variant="destructive">
              <AlertDescription className="text-sm break-words space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Any funds in the old wallet are <strong>not</strong> automatically moved to the new one.</li>
                  <li>You will need to save the <strong>new</strong> secret key securely; the old one will no longer be used for this account.</li>
                </ul>
                <p className="mt-2">Are you sure you want to replace your wallet?</p>
              </AlertDescription>
            </Alert>
            {changeWalletError && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm break-words">{changeWalletError.message}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-replace"
                checked={changeWalletConfirm}
                onCheckedChange={(checked) => setChangeWalletConfirm(checked === true)}
              />
              <label
                htmlFor="confirm-replace"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand, replace my wallet
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowChangeWalletWarning(false); setChangeWalletConfirm(false) }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!changeWalletConfirm || changingWallet}
                onClick={handleChangeWalletConfirm}
              >
                {changingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Replace my wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
