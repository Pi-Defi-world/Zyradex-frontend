"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePi } from '@/components/providers/pi-provider'
import { CollectWallet } from '@/components/collect-wallet'
import { 
  Plug,
  Settings,
  FileText,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  MessageCircle,
  LogOut,
  Loader2,
  Users,
  Star,
  Calendar,
  Trophy,
  Rocket,
  List,
  LayoutDashboard,
  Coins,
  Droplets,
  User,
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, authenticate, signOut } = usePi()
  const { toast } = useToast()
  const [showCollectWallet, setShowCollectWallet] = useState(false)
  const [showListingsDropdown, setShowListingsDropdown] = useState(false)
  const [storedWalletAddress, setStoredWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load stored wallet address from localStorage
    const stored = localStorage.getItem('bingepi-wallet-address')
    setStoredWalletAddress(stored)
  }, [])

  const handleCopyWalletAddress = () => {
    if (storedWalletAddress) {
      navigator.clipboard.writeText(storedWalletAddress)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const handleWalletCollected = (walletAddress: string) => {
    setStoredWalletAddress(walletAddress)
  }

  const handlePiConnect = async () => {
    setIsLoading(true)
    try {
      await authenticate()
    } catch (error) {
      console.error('Pi authentication failed:', error)
      toast({
        title: "Authentication Failed",
        description: "Please try again or enter your wallet address manually",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Main navigation items
  const mainNavItems = [
    {
      title: 'Dashboard',
      description: 'View your portfolio and stats',
      icon: LayoutDashboard,
      href: '/dashboard',
      showChevron: true
    },
    {
      title: 'My Tokens',
      description: 'Manage your minted tokens',
      icon: Coins,
      href: '/my-tokens',
      showChevron: true
    },
    {
      title: 'Mint Token',
      description: 'Create new tokens',
      icon: Rocket,
      href: '/mint',
      showChevron: true
    },
    {
      title: 'Liquidity Pools',
      description: 'Manage liquidity pools',
      icon: Droplets,
      href: '/liquidity',
      showChevron: true
    },
    {
      title: 'Swap Tokens',
      description: 'Exchange tokens',
      icon: Users,
      href: '/swap',
      showChevron: true
    },
    {
      title: 'Settings',
      description: 'Account and app settings',
      icon: Settings,
      href: '/settings',
      showChevron: true
    }
  ]

  // Additional menu items
  const additionalMenuItems = [
    {
      title: 'Terms of Service',
      description: 'Read our terms and conditions',
      icon: FileText,
      href: '/terms',
      showChevron: true
    },
    {
      title: 'Privacy Policy',
      description: 'Learn about our privacy practices',
      icon: FileText,
      href: '/privacy',
      showChevron: true
    },
    {
      title: 'API Documentation',
      description: 'Pi Network Oracle API docs',
      icon: BookOpen,
      href: '/api-docs',
      showChevron: true
    },
    {
      title: 'Contact Us',
      description: 'Get help and support',
      icon: MessageCircle,
      href: '/contact',
      showChevron: true
    }
  ]

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-border/50">
          <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Avatar */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                ) : (
                  <span className="text-white text-lg sm:text-xl font-bold">
                    {isAuthenticated && user?.username ? user.username.slice(0, 2).toUpperCase() : '👤'}
                  </span>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="text-base sm:text-lg font-semibold text-foreground mb-1 truncate">
                  {isLoading 
                    ? 'Authenticating...'
                    : isAuthenticated && user?.username 
                      ? `@${user.username}` 
                      : 'Connect Pi Wallet'
                  }
                </div>
                {storedWalletAddress && !isLoading ? (
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="truncate">Wallet: {storedWalletAddress.slice(0, 8)}...{storedWalletAddress.slice(-6)}</span>
                    <button 
                      onClick={handleCopyWalletAddress}
                      className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                      aria-label="Copy wallet address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
              </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-border/50">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-foreground">Wallet Connection</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Connect your Pi wallet to access all features</p>
            {!isAuthenticated && !storedWalletAddress ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Pi wallet to access all features and manage your tokens.
                </AlertDescription>
              </Alert>
            ) : null}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCollectWallet(true)}
                className="w-full btn-gradient-primary"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Enter Wallet Address
              </Button>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
          {mainNavItems.map((item, index) => (
            <Link key={index} href={item.href || '#'} className="block w-full">
              <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-muted/50 transition-colors border border-border/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-sm sm:text-base text-foreground truncate">{item.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{item.description}</div>
                    </div>
                  </div>
                  {item.showChevron && (
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Menu Items */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-lg font-semibold text-foreground">More</h2>
          {additionalMenuItems.map((item, index) => (
            <Link key={index} href={item.href || '#'} className="block w-full">
              <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-muted/50 transition-colors border border-border/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-sm sm:text-base text-foreground truncate">{item.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{item.description}</div>
                    </div>
                  </div>
                  {item.showChevron && (
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Disconnect Wallet Button - Last Item */}
        {isAuthenticated && (
          <div className="mt-6">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-between p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm text-destructive hover:text-destructive"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-destructive truncate">Disconnect Pi Account</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Logout from your Pi account</div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Collect Wallet Modal */}
      <CollectWallet 
        open={showCollectWallet} 
        onOpenChange={setShowCollectWallet}
        onWalletCollected={handleWalletCollected}
      />
    </div>
  )
}

export default ProfilePage
