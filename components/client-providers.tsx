"use client"

import { ReactNode } from "react"

// Onboarding popup removed as requested
// const OnboardingTrigger = dynamic(() => import("@/components/onboarding-trigger").then(mod => ({ default: mod.OnboardingTrigger })), {
//   ssr: false, // Client-side only
//   loading: () => null, // No loading spinner needed
// })

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      {children}
      {/* <OnboardingTrigger /> */}
    </>
  )
}
