"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun, Wallet } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

interface NavbarProps {
  isConnected?: boolean
  onConnect?: () => void
}

export function Navbar({ isConnected = false, onConnect }: NavbarProps) {
  const { theme, setTheme } = useTheme()

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
          {isConnected ? (
            <Button variant="outline" className="gap-2 bg-transparent">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">0x1234...5678</span>
            </Button>
          ) : (
            <Button onClick={onConnect} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
