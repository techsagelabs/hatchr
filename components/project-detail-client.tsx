"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import type { ProjectWithUserVote } from "@/lib/types"

interface ProjectDetailClientProps {
  projectId: string
  children: React.ReactNode
}

export function ProjectDetailClient({ projectId, children }: ProjectDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to vote changes for this specific project
    const channel = supabase
      .channel(`project-${projectId}-votes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('🗳️ Vote changed on project page:', payload)
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    console.log(`✅ Subscribed to votes for project ${projectId}`)

    return () => {
      console.log(`🧹 Unsubscribing from project ${projectId} votes`)
      supabase.removeChannel(channel)
    }
  }, [projectId, router, supabase])

  // Also handle visibility change for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Project page became visible - refreshing')
        router.refresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router])

  return <>{children}</>
}

