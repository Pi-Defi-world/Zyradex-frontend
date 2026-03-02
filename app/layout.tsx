import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Suspense } from "react"
import { PiProvider } from "@/components/providers/pi-provider"
import { BalanceRefreshProvider } from "@/components/providers/balance-refresh-provider"
import { DisclaimerProvider } from "@/components/disclaimer-provider"
import Script from 'next/script'
import "./globals.css"

export const metadata: Metadata = {
  title: "ZYRADEX CAPITAL - Financial platform on Pi Network",
  description: "Savings, investments, and borrowing on Pi Network. Mint tokens, trade, and manage assets.",
  generator: "Solie, Junman",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} pb-20 lg:pb-0`}>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <Script id="pi-init" strategy="afterInteractive">
          {`
            console.log('Pi initialization script running...');
            console.log('Pi SDK available:', !!window.Pi);
            
            if (window.Pi) {
              console.log('Pi SDK loaded, initializing...');
              window.Pi.init({ version: "2.0", sandbox: true });
              console.log('Pi SDK initialized successfully');
            } else {
              console.warn('Pi SDK not available - this app requires Pi Browser');
            }
          `}
        </Script>
        <PiProvider>
          <BalanceRefreshProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Suspense fallback={null}>
              <Navbar />
              {children}
              <Toaster />
              <DisclaimerProvider />
            </Suspense>
          </ThemeProvider>
          </BalanceRefreshProvider>
        </PiProvider>
      </body>
    </html>
  )
}
