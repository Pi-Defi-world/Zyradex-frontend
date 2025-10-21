"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun, Wallet, Home, Coins, Droplets, User, LayoutDashboard } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePi } from "@/components/providers/pi-provider"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface NavbarProps {
  isConnected?: boolean
  onConnect?: () => void
}

// Mobile Bottom Navigation Component
function MobileBottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Scroll-based show/hide behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < lastScrollY || currentScrollY < 100 || currentScrollY > document.body.scrollHeight - window.innerHeight - 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/mint", icon: Coins, label: "Mint" },
    { href: "/liquidity", icon: Droplets, label: "Liquidity" },
    { href: "/my-tokens", icon: User, label: "My Tokens" },
  ]

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 1rem)',
        paddingLeft: 'env(safe-area-inset-left, 1rem)',
        paddingRight: 'env(safe-area-inset-right, 1rem)'
      }}
    >
      <div className="relative max-w-sm mx-auto">
        <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-lg px-3 py-1.5">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex flex-col items-center justify-center transition-colors p-1.5 ${
                    isActive ? 'text-primary' : 'text-neutral-400 hover:text-primary'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
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
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">BINGEPi</span>
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
                <span className="text-xs sm:text-sm">Loading...</span>
              </Button>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs sm:text-sm max-w-[120px] truncate">
                    {user?.username || 'Connected'}
                  </span>
                </Button>
                <Button 
                  onClick={signOut}
                  variant="ghost" 
                  size="sm"
                  className="text-xs px-2"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">×</span>
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
                <span className="text-xs sm:text-sm">
                  {authLoading ? 'Connecting...' : 'Connect Pi'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  )
}
