import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { PiProvider } from "@/components/providers/pi-provider"
import { Providers } from "@/lib/providers"
import Script from 'next/script'
import "./globals.css"

export const metadata: Metadata = {
  title: "Bingepi - Build DeFi on Pi Network",
  description: "Mint tokens, create liquidity pools, and manage assets on Pi Network",
  generator: "Solie, Junman, RichAdams, ",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <Script id="pi-init" strategy="afterInteractive">
          {`
            console.log('🔍 Pi initialization script running...');
            console.log('Pi SDK available:', !!window.Pi);
            
            if (window.Pi) {
              console.log('✅ Pi SDK loaded, initializing...');
              window.Pi.init({ version: "2.0", sandbox: true });
              console.log('✅ Pi SDK initialized successfully');
            } else {
              console.warn('⚠️ Pi SDK not available - this app requires Pi Browser');
            }
          `}
        </Script>
        <Providers>
          <PiProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <Suspense fallback={null}>
                {children}
                <Toaster />
              </Suspense>
            </ThemeProvider>
          </PiProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
