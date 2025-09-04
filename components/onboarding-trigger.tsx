"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { OnboardingModal } from "@/components/onboarding-modal"

export function OnboardingTrigger() {
  const { user, isLoaded } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user || hasChecked) return

    // Check if user needs onboarding
    const checkOnboardingStatus = async () => {
      try {
        // Check if user is truly new (created within last 2 minutes)
        const userCreatedAt = new Date(user.createdAt)
        const now = new Date()
        const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
        const isNewUser = userCreatedAt > twoMinutesAgo

        // Only proceed with onboarding check if user is truly new
        if (!isNewUser) {
          setHasChecked(true)
          return
        }

        const response = await fetch('/api/user/profile')
        
        if (response.ok) {
          const profile = await response.json()
          // Show onboarding if user doesn't have a profile or isn't onboarded
          if (!profile || !profile.isOnboarded) {
            setShowOnboarding(true)
          }
        } else if (response.status === 401) {
          // User not authenticated, don't show onboarding
        } else {
          // Profile doesn't exist for new user, show onboarding
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setHasChecked(true)
      }
    }

    // Small delay to ensure user data is fully loaded
    const timer = setTimeout(checkOnboardingStatus, 1000)
    return () => clearTimeout(timer)
  }, [isLoaded, user, hasChecked])

  if (!user || !showOnboarding) return null

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setHasChecked(true)
  }

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      userName={user.fullName || user.firstName || 'User'}
      userAvatar={user.imageUrl}
      onComplete={handleOnboardingComplete}
    />
  )
}
