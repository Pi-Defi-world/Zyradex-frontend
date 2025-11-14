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
} from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalances } from "@/hooks/useAccountData"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useImportAccount } from "@/hooks/useAccountData"
import { useUserProfile } from "@/hooks/useUserProfile"
import { usePasskeyRegistration } from "@/hooks/usePasskey"
import { storeEncryptedSecret } from "@/lib/passkey/storage"
import { encryptSecret, generateKey } from "@/lib/passkey/encryption"
import { setEncryptionKey } from "@/lib/passkey/transaction"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

const normalizeMnemonic = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, authenticate, signOut } = usePi()
  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useUserProfile()
  const { toast } = useToast()
  const [storedWalletAddress, setStoredWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [secretInput, setSecretInput] = useState("")
  const [mnemonicInput, setMnemonicInput] = useState("")
  const { importAccount, isLoading: importingAccount, error: importError } = useImportAccount()
  const { register: registerPasskey, isLoading: registeringPasskey } = usePasskeyRegistration()
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false)
  const [pendingPublicKey, setPendingPublicKey] = useState<string | null>(null)
  const [pendingSecret, setPendingSecret] = useState<string | null>(null)

  useEffect(() => {
    setStoredWalletAddress(getStoredWallet())
  }, [])

  useEffect(() => {
    if (profile?.public_key) {
      setStoredWalletAddress(profile.public_key)
      if (typeof window !== "undefined") {
        localStorage.setItem("zyradex-wallet-address", profile.public_key)
      }
      return
    }

    if (!storedWalletAddress && user?.wallet_address) {
      setStoredWalletAddress(user.wallet_address)
    }
  }, [profile?.public_key, user?.wallet_address, storedWalletAddress])

  const { balances, totalBalance, isLoading: balancesLoading } = useAccountBalances(storedWalletAddress ?? user?.wallet_address ?? undefined)

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

  const handleAccountImport = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!secretInput.trim() && !mnemonicInput.trim()) {
      toast({ title: "Missing credentials", description: "Provide either a secret key or mnemonic.", variant: "destructive" })
      return
    }
    try {
      const response = await importAccount({
        secret: secretInput.trim() || undefined,
        mnemonic: mnemonicInput.trim() || undefined,
      })
      
      // Store public key and secret for passkey registration
      setPendingPublicKey(response.publicKey)
      setPendingSecret(response.secret)
      
      // Encrypt and store secret in IndexedDB
      try {
        const key = await generateKey()
        const { encrypted, iv } = await encryptSecret(response.secret, key)
        await storeEncryptedSecret(response.publicKey, encrypted, iv)
        // Store encryption key in memory for later decryption
        setEncryptionKey(response.publicKey, key)
      } catch (encryptError) {
        console.error("Failed to encrypt secret:", encryptError)
        toast({
          title: "Warning",
          description: "Account imported but secret encryption failed. Please set up passkey.",
          variant: "destructive",
        })
      }
      
      handleWalletPersist(response.publicKey)
      refreshProfile().catch(() => undefined)
      
      // Show passkey registration dialog
      setShowPasskeyDialog(true)
      
      setSecretInput("")
      setMnemonicInput("")
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Import failed"
      toast({ title: "Import failed", description: message, variant: "destructive" })
    }
  }

  const handlePasskeyRegistration = async () => {
    try {
      await registerPasskey()
      setShowPasskeyDialog(false)
      setPendingPublicKey(null)
      setPendingSecret(null)
      toast({
        title: "Success",
        description: "Passkey registered successfully. You can now use it for transactions.",
      })
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Passkey registration failed"
      toast({ title: "Registration failed", description: message, variant: "destructive" })
    }
  }

  const mainNavItems = [
    // {
    //   title: "Dashboard",
    //   description: "View your portfolio and stats",
    //   icon: LayoutDashboard,
    //   href: "/dashboard",
    //   showChevron: true,
    // },
    {
      title: "My Assets",
      description: "Manage your assets",
      icon: Coins,
      href: "/my-tokens",
      showChevron: true,
    },
    {
      title: "Create Asset",
      description: "Create new assets",
      icon: Rocket,
      href: "/mint",
      showChevron: true,
    },
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
      title: "Settings",
      description: "Wallet settings",
      icon: Settings,
      href: "/settings",
      showChevron: true,
    },
  ]

  const additionalMenuItems = [
    {
      title: "Terms of Service",
      description: "Read our terms and conditions",
      icon: FileText,
      href: "/terms",
      showChevron: true,
    },
    {
      title: "Privacy Policy",
      description: "Learn about our privacy practices",
      icon: FileText,
      href: "/privacy",
      showChevron: true,
    },
    // {
    //   title: "API Documentation",
    //   description: "Pi Network Oracle API docs",
    //   icon: BookOpen,
    //   href: "/api-docs",
    //   showChevron: true,
    // },
    {
      title: "Contact Us",
      description: "Get help and support",
      icon: MessageCircle,
      href: "/contact",
      showChevron: true,
    },
  ]

  const walletDisplay = storedWalletAddress || user?.wallet_address
  const truncatedWallet = walletDisplay ? `${walletDisplay.slice(0, 6)}...${walletDisplay.slice(-6)}` : null

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile</h1>
          {!isAuthenticated && (
            <Button size="sm" onClick={handlePiConnect} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
              Connect Pi
            </Button>
          )}
        </div> */}

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Import
            </CardTitle>
            <CardDescription>Import your account using a secret key or mnemonic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importError && <p className="text-sm text-destructive">{importError.message}</p>}
            <form className="space-y-3" onSubmit={handleAccountImport}>
            <div className="space-y-2">
                <Label htmlFor="mnemonic">Mnemonic</Label>
                <Input
                  id="mnemonic"
                  placeholder="word1 word2 word3 ..."
                  value={mnemonicInput}
                  onChange={(event) => setMnemonicInput(normalizeMnemonic(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key (optional)</Label>
                <Input
                  id="secret-key"
                  type="password"
                  placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={secretInput}
                  onChange={(event) => setSecretInput(event.target.value)}
                />
              </div>
              <Button type="submit" className="btn-gradient-primary w-full" disabled={importingAccount}>
                {importingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Account
              </Button>
            </form>
          </CardContent>
        </Card>

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
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">More</h2>
          {additionalMenuItems.map((item) => (
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
        </div>

        {isAuthenticated && (
          <div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm text-destructive"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <LogOut className="h-5 w-5 text-destructive shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-destructive truncate">Disconnect Wallet</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Logout from your ZyraDex wallet</div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <Dialog open={showPasskeyDialog} onOpenChange={setShowPasskeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Passkey</DialogTitle>
            <DialogDescription>
              To secure your account and enable passwordless transactions, please register a passkey.
              This will allow you to sign transactions without entering your secret key each time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to create a passkey using your device's biometric authentication
              (fingerprint, face recognition, or PIN).
            </p>
            <Button
              onClick={handlePasskeyRegistration}
              disabled={registeringPasskey}
              className="w-full"
            >
              {registeringPasskey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Passkey
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasskeyDialog(false)
                setPendingPublicKey(null)
                setPendingSecret(null)
              }}
              className="w-full"
            >
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
