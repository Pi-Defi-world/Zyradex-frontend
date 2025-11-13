"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Copy, LogOut, Wallet, Bell, Shield, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { usePi } from "@/components/providers/pi-provider"
import { useAccountBalances } from "@/hooks/useAccountData"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { Badge } from "@/components/ui/badge"

const getStoredWallet = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("zyradex-wallet-address")
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, signOut } = usePi()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [notifications, setNotifications] = useState(true)
  const [username, setUsername] = useState("")
  const {
    isAdmin,
    adminUser,
    isLoading: adminLoading,
    error: adminError,
    signIn: signInAdmin,
    signOut: signOutAdmin,
  } = useAdminAuth()

  useEffect(() => {
    setWalletAddress(getStoredWallet() || user?.wallet_address || null)
    setUsername(user?.username ?? "")
  }, [user])

  const { balances, totalBalance, isLoading } = useAccountBalances(walletAddress || undefined)

  const summary = useMemo(
    () => ({
      assets: balances.length,
      total: totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    }),
    [balances.length, totalBalance]
  )

  const copyPublicKey = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    toast({ title: "Copied!", description: "Wallet address copied to clipboard" })
  }

  const handleDisconnect = () => {
    signOut()
    toast({ title: "Wallet Disconnected", description: "You have been signed out." })
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {(user?.username || "Guest").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user?.username ? `@${user.username}` : "Guest"}</h3>
                <p className="text-sm text-muted-foreground">
                  Tracking {isLoading ? "..." : summary.assets} assets · Total {isLoading ? "..." : summary.total}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <Button className="btn-gradient-primary">Save Changes</Button>
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
            {walletAddress ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">{walletAddress}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyPublicKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No wallet connected. Add one from your profile page to enable full functionality.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access
            </CardTitle>
            <CardDescription>Authenticate to perform administrative actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminError && <p className="text-sm text-destructive">{adminError.message}</p>}
            {isAdmin && adminUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">Signed in as</p>
                    <p className="text-sm text-muted-foreground">{adminUser.username}</p>
                  </div>
                  <Badge variant="secondary">{adminUser.role}</Badge>
                </div>
                <Button variant="outline" onClick={signOutAdmin} disabled={adminLoading}>
                  {adminLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign out of admin
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Admin privileges are required to mint tokens, manage fees, and moderate liquidity pools.
                </p>
                <Button className="btn-gradient-primary" onClick={signInAdmin} disabled={adminLoading}>
                  {adminLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in as admin
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for transactions</p>
              </div>
              <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Get updates via email</p>
              </div>
              <Switch id="email-notifications" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
