"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

// ✅ OPTIMIZED: Client-side dynamic imports (works in client components)
const OnboardingTrigger = dynamic(() => import("@/components/onboarding-trigger").then(mod => ({ default: mod.OnboardingTrigger })), {
  ssr: false, // Client-side only
  loading: () => null, // No loading spinner needed
})

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      {children}
      <OnboardingTrigger />
    </>
  )
}
