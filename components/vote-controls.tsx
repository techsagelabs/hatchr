"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { fetcher } from "@/lib/fetcher"
import type { ProjectWithUserVote, VoteDirection } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Triangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { SignUpPromptModal } from "@/components/sign-up-prompt-modal"
import { createClient } from "@/utils/supabase/client"

export function VoteControls({
  projectId,
  initial,
}: {
  projectId: string
  initial: ProjectWithUserVote
}) {
  const { user, loading } = useAuth()
  const { data, mutate } = useSWR<ProjectWithUserVote>(`/api/projects/${projectId}`, fetcher, {
    fallbackData: initial,
  })
  const [busy, setBusy] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  function handleVoteClick(dir: Exclude<VoteDirection, null>) {
    // Wait for auth to load before checking authentication
    if (loading) {
      console.log('Auth not loaded yet, please wait...')
      return
    }
    
    // Check if user is authenticated
    if (!user) {
      setShowSignUpModal(true)
      return
    }
    
    // User is authenticated, proceed with voting
    vote(dir)
  }

  async function vote(dir: Exclude<VoteDirection, null>) {
    if (!data) return
    setBusy(true)
    const newUpvotes = dir === "up"
      ? data.votes.up + (data.userVote === "up" ? -1 : 1)
      : data.votes.up - (data.userVote === "up" ? 1 : 0)
    
    const newDownvotes = dir === "down"
      ? data.votes.down + (data.userVote === "down" ? -1 : 1)
      : data.votes.down - (data.userVote === "down" ? 1 : 0)

    const optimistic: ProjectWithUserVote = {
      ...data,
      votes: {
        up: newUpvotes,
        down: newDownvotes,
        net: newUpvotes - newDownvotes,
      },
      userVote: data.userVote === dir ? null : dir,
    }
    await mutate(optimistic, false)
    try {
      // 🚀 PRODUCTION FIX: Enhanced JWT token handling with fallbacks
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        console.error('🔑 No valid session for voting:', sessionError?.message)
        throw new Error('No active authentication session')
      }
      
      console.log('🔑 Vote request - Auth info:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenPreview: session.access_token ? `${session.access_token.substring(0, 20)}...` : 'none',
        userId: session.user?.id
      })
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        // Include cookies for dual auth approach
        "Cookie": document.cookie
      }
      
      console.log('✅ Enhanced auth headers prepared for vote request')
      
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: "POST",
        headers,
        body: JSON.stringify({ direction: dir }),
        credentials: 'include' // Important for cookie-based auth fallback
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('🚨 VOTE FAILED - Full error details:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          projectId,
          direction: dir,
          timestamp: new Date().toISOString()
        })
        
        if (res.status === 401) {
          console.log('🔐 Vote failed with 401 - showing sign up modal')
          setShowSignUpModal(true)
          return
        }
        
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const responseData = await res.json()
      console.log('✅ Vote response received:', responseData)
      
      // Validate the response structure
      if (!responseData || typeof responseData !== 'object') {
        console.error('❌ Invalid response format:', responseData)
        throw new Error('Invalid response format from server')
      }
      
      // Handle the new API response format
      let fresh: ProjectWithUserVote
      if (responseData.success && responseData.data) {
        // Handle the old format or error responses
        fresh = data // Keep current data since we can't process the response
        console.warn('⚠️ Received old API format, keeping current data')
      } else if (responseData.votes && responseData.id) {
        // Handle the new project format
        fresh = responseData as ProjectWithUserVote
        console.log('✅ Using new project response format')
      } else {
        console.error('❌ Unrecognized response format:', responseData)
        throw new Error('Unrecognized response format')
      }
      
      await mutate(fresh, false)
      console.log('✅ Vote UI updated successfully')
      // Real-time subscriptions will handle global updates automatically
    } catch (error) {
      console.error('Error voting:', error)
      // Revert optimistic update
      await mutate(data, false)
    } finally {
      setBusy(false)
    }
  }

  if (!data) return null

  // Only show user's vote state if they are authenticated and auth is loaded
  const upActive = (!loading && user) ? data.userVote === "up" : false
  const downActive = (!loading && user) ? data.userVote === "down" : false

  return (
    <>
      <div
        className="inline-flex items-center rounded-full border bg-muted px-4 h-10 shadow-inner select-none"
        aria-label="Vote controls"
        role="group"
      >
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={upActive}
          disabled={busy}
          onClick={() => handleVoteClick("up")}
          className={cn(
            "rounded-full p-2 transition-colors",
            "hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20",
          )}
        >
          <Triangle className={cn("h-5 w-5", "stroke-[2.5] text-black", upActive && "opacity-100")} aria-hidden />
        </button>

        <span aria-live="polite" className="mx-3 text-sm font-medium tabular-nums tracking-[-0.01em]">
          {data.votes.net}
        </span>

        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={downActive}
          disabled={busy}
          onClick={() => handleVoteClick("down")}
          className={cn(
            "rounded-full p-2 transition-colors",
            "hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20",
          )}
        >
          <Triangle
            className={cn("h-5 w-5 rotate-180", "stroke-[2.5] text-black", downActive && "opacity-100")}
            aria-hidden
          />
        </button>
      </div>

      {/* Sign up prompt modal */}
      <SignUpPromptModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        action="vote"
      />
    </>
  )
}
