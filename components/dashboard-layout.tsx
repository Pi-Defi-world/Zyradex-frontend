"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { LayoutDashboard, Droplets, Settings, Menu, Moon, Sun, Wallet, X, Coins, ArrowLeftRight } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LoggerConsole } from "@/components/logger-console"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mint", href: "/mint", icon: Coins },
  { name: "Swap", href: "/swap", icon: ArrowLeftRight },
  { name: "Liquidity", href: "/liquidity", icon: Droplets },
  { name: "My Tokens", href: "/my-tokens", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
]

const userTokens = [
  { symbol: "PEPE", name: "Pepe Coin", totalSupply: 1000000, minted: 750000, remaining: 250000 },
  { symbol: "DOGE", name: "Doge Token", totalSupply: 500000, minted: 500000, remaining: 0 },
  { symbol: "SHIB", name: "Shiba Token", totalSupply: 2000000, minted: 1200000, remaining: 800000 },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [showLogger, setShowLogger] = useState(false)

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-lg">π</span>
          </div>
          <span className="font-bold text-xl">BINGEPi</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-primary/10 text-primary hover:bg-primary/20")}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute ml-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="ml-6">Toggle theme</span>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar mobile />
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">π</span>
            </div>
            <span className="font-bold text-xl">BINGEPi</span>
          </Link>

          <Button variant="ghost" size="icon" onClick={() => setShowLogger(!showLogger)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-4">{children}</div>
      </main>

      {/* Logger Console */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 border-l border-border bg-background transition-transform duration-300 z-40",
          showLogger ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Console Logs</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowLogger(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <LoggerConsole />
      </div>
    </div>
  )
}
