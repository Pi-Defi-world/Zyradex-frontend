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
  Calendar,
  Trophy,
  Rocket,
  LayoutDashboard,
  Coins,
  Droplets,
  User,
  Wallet,
} from "lucide-react"
import { usePi } from "@/components/providers/pi-provider"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { CollectWallet } from "@/components/collect-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useTokenRegistry } from "@/hooks/useTokenRegistry"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const formatDate = (value?: Date | string) => {
  if (!value) return "Unknown"
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const ProfilePage: React.FC = () => {
  const { user: piUser, authenticate, signOut: piSignOut } = usePi()
  const { adminUser, token, signIn: backendSignIn, signOut: backendSignOut, isLoading: backendLoading } = useAdminAuth()
  const { toast } = useToast()
  const [showCollectWallet, setShowCollectWallet] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const walletForData = adminUser?.public_key?.trim() || undefined
  const { balances, totalBalance, isLoading: balancesLoading } = useAccountBalances(walletForData)
  const isLoggedIn = Boolean(token && adminUser)
  const { tokens } = useTokenRegistry()

  const stats = useMemo(
    () => [
      { label: "Assets", value: balances.length, icon: Users },
      { label: "Total Balance", value: totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }), icon: Coins },
      { label: "Minted Tokens", value: tokens.length, icon: Trophy },
    ],
    [balances.length, totalBalance, tokens.length]
  )

  const handleCopyWalletAddress = () => {
    if (walletForData) {
      navigator.clipboard.writeText(walletForData)
      toast({ title: "Copied!", description: "Wallet address copied to clipboard" })
    }
  }

  const handlePiConnect = async () => {
    setIsLoading(true)
    try {
      await authenticate()
      await backendSignIn()
    } catch (error) {
      console.error("Auth failed:", error)
      toast({
        title: "Authentication Failed",
        description: "Please try again or link a wallet from this page",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    backendSignOut()
    piSignOut()
  }

  const mainNavItems = [
    { title: "Dashboard", description: "View your portfolio and stats", icon: LayoutDashboard, href: "/dashboard", showChevron: true },
    { title: "My Tokens", description: "Manage your minted tokens", icon: Coins, href: "/my-tokens", showChevron: true },
    { title: "Mint Token", description: "Create new tokens", icon: Rocket, href: "/mint", showChevron: true },
    { title: "Liquidity Pools", description: "Manage liquidity pools", icon: Droplets, href: "/liquidity", showChevron: true },
    { title: "Swap Tokens", description: "Exchange tokens", icon: Users, href: "/swap", showChevron: true },
    { title: "Settings", description: "Account and app settings", icon: Settings, href: "/settings", showChevron: true },
  ]

  const additionalMenuItems = [
    { title: "Terms of Service", description: "Read our terms and conditions", icon: FileText, href: "/terms", showChevron: true },
    { title: "Privacy Policy", description: "Learn about our privacy practices", icon: FileText, href: "/privacy", showChevron: true },
    { title: "API Documentation", description: "Pi Network Oracle API docs", icon: BookOpen, href: "/api-docs", showChevron: true },
    { title: "Contact Us", description: "Get help and support", icon: MessageCircle, href: "/contact", showChevron: true },
  ]

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile</h1>
          {!isLoggedIn && (
            <Button size="sm" onClick={handlePiConnect} disabled={isLoading || backendLoading}>
              {isLoading || backendLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
              Connect Pi
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Overview
            </CardTitle>
            <CardDescription>Summary of your Pi profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {(adminUser?.username ?? piUser?.username ?? "Guest").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg text-foreground truncate">
                  {isLoading || backendLoading ? "Authenticating…" : adminUser?.username ? `@${adminUser.username}` : "Unauthenticated"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {adminUser?.username ? "Backend account linked" : "Connect Pi to link your account"}
                </div>
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
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>Manage your connected wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {walletForData
                ? "This address is used to load balances and swap history."
                : "Connect or import a wallet to unlock portfolio insights."}
            </p>
            {walletForData ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {walletForData}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyWalletAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Link a wallet by importing with mnemonic/secret or by pasting your Stellar public key.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCollectWallet(true)}
                className="w-full btn-gradient-primary"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect / Import Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Highlights
            </CardTitle>
            <CardDescription>Your recent account activity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="font-medium text-foreground">Balances Tracked</p>
              <p>{balancesLoading ? "Loading..." : balances.length ? `${balances.length} assets` : "None yet"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="font-medium text-foreground">Total Supply</p>
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
                    <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  {item.showChevron && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />}
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
                    <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  {item.showChevron && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {isLoggedIn && (
          <div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm text-destructive"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <LogOut className="h-5 w-5 text-destructive flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-destructive truncate">Disconnect Pi Account</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Logout from your Pi account</div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <CollectWallet open={showCollectWallet} onOpenChange={setShowCollectWallet} />
    </div>
  )
}

export default ProfilePage
