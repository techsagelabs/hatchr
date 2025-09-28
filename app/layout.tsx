import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SWRConfigProvider } from "@/components/swr-config-provider"
import { ClientProviders } from "@/components/client-providers"
import { RealtimeProvider } from "@/lib/realtime-provider"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "Hatchr",
  description: "Hatchr community app",
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans tracking-[-0.01em] text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SWRConfigProvider>
              <RealtimeProvider>
                <ClientProviders>
                  <Suspense fallback={null}>{children}</Suspense>
                  <Analytics />
                  <SpeedInsights />
                </ClientProviders>
              </RealtimeProvider>
            </SWRConfigProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
