"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import dynamic from "next/dynamic"

// ✅ OPTIMIZED: Lazy load heavy profile modal (forms, validation, image upload)
const ProfileEditModal = dynamic(() => import("@/components/profile-edit-modal").then(mod => ({ default: mod.ProfileEditModal })), {
  ssr: false,
  loading: () => null,
})
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/lib/user-profiles"

interface ProfileEditButtonProps {
  profile: UserProfile | null
  className?: string
}

export function ProfileEditButton({ profile, className }: ProfileEditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(profile)

  // Sync profile state when prop changes
  useEffect(() => {
    setCurrentProfile(profile)
  }, [profile])

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setCurrentProfile(updatedProfile)
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "h-8 w-8 p-0 rounded-full shadow-md border-2 border-background",
          className
        )}
        title="Edit profile"
      >
        <Edit className="h-4 w-4" />
      </Button>

      <ProfileEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={currentProfile}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  )
}
