import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SWRConfigProvider } from "@/components/swr-config-provider"
import { ClientProviders } from "@/components/client-providers"

export const metadata: Metadata = {
  title: "TechsageLabs",
  description: "TechsageLabs community app",
  generator: "v0.app",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${inter.variable} ${GeistMono.variable} antialiased`}>
        <body className="min-h-screen bg-background font-sans tracking-[-0.01em] text-foreground" suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SWRConfigProvider>
              <ClientProviders>
                <Suspense fallback={null}>{children}</Suspense>
                <Analytics />
              </ClientProviders>
            </SWRConfigProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
