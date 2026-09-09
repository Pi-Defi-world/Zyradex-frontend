"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun, Wallet, Home, ArrowRightLeft, Compass, User } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePi } from "@/components/providers/pi-provider"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

// Mobile Bottom Navigation (4 items)
function MobileBottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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
    { href: "/swap", icon: ArrowRightLeft, label: "Swap" },
    { href: "/earn", icon: Compass, label: "Earn" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0rem), 1rem)',
        paddingLeft: 'env(safe-area-inset-left, 1rem)',
        paddingRight: 'env(safe-area-inset-right, 1rem)'
      }}
    >
      <div className="relative max-w-sm mx-auto mb-2">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl px-2 py-3">
          <div className="flex justify-around items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center transition-all p-2 rounded-xl ${
                    isActive
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40'
                      : 'text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Navbar() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, authenticate, signOut, isLoading: authLoading } = usePi()
  const { profile, isLoading: profileLoading } = useUserProfile()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePiAuth = async () => {
    if (typeof window === "undefined") return
    if (!window.Pi) {
      router.push("/profile")
      return
    }
    try {
      await authenticate()
    } catch (error) {
      console.error("Pi authentication failed:", error)
      router.push("/profile")
    }
  }

  const hasWallet = Boolean(profile?.public_key && profile.public_key.trim() !== "")
  const displayName = profile?.username ?? user?.username ?? "Connected"

  const desktopLinks = [
    { href: "/", label: "Home" },
    { href: "/swap", label: "Swap" },
    { href: "/earn", label: "Earn" },
    { href: "/explore", label: "Explore" },
    { href: "/profile", label: "Profile" },
  ]

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.jpg"
              alt="ZyraDex"
              className="w-9 h-9 rounded-lg object-cover shadow group-hover:shadow-md transition-shadow"
            />
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              ZyraDex
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {desktopLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {!mounted ? (
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Loading...</span>
              </Button>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="hidden sm:inline text-xs max-w-[120px] truncate font-mono">
                    {hasWallet && profile?.public_key
                      ? `${profile.public_key.slice(0, 6)}...${profile.public_key.slice(-4)}`
                      : displayName}
                  </span>
                </Button>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-xs hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handlePiAuth}
                disabled={profileLoading || authLoading}
                size="sm"
                className="gap-2 bg-gradient-to-r from-green-600 to-mint-500 text-white hover:shadow-lg hover:shadow-green-500/25"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </nav>
      <MobileBottomNav />
    </>
  )
}
