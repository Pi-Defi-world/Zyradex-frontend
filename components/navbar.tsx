"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun, Wallet } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePi } from "@/components/providers/pi-provider"
import { useState, useEffect } from "react"

interface NavbarProps {
  isConnected?: boolean
  onConnect?: () => void
}

export function Navbar({ isConnected = false, onConnect }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, authenticate, signOut } = usePi()
  const [mounted, setMounted] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const handlePiAuth = async () => {
    if (typeof window === 'undefined') {
      alert('Window not available. Please refresh the page.')
      return
    }

    if (!window.Pi) {
      alert('Pi SDK not available. Please open this app in Pi Browser.')
      return
    }

    setAuthLoading(true)
    try {
      await authenticate()
    } catch (error) {
      console.error('Pi authentication failed:', error)
      alert(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
        
          <span className="font-bold text-xl">Pi DeFi</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {!mounted ? (
            <Button variant="outline" className="gap-2 bg-transparent">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Loading...</span>
            </Button>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username || 'Connected'}</span>
              </Button>
              <Button 
                onClick={signOut}
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handlePiAuth} 
              disabled={authLoading}
              size="sm" 
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">
                {authLoading ? 'Connecting...' : 'Connect Pi Wallet'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
