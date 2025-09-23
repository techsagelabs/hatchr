"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { fetcher } from "@/lib/fetcher"
import type { ProjectWithUserVote, VoteDirection } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Triangle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { SignUpPromptModal } from "@/components/sign-up-prompt-modal"

export function VoteControls({
  projectId,
  initial,
}: {
  projectId: string
  initial: ProjectWithUserVote
}) {
  const { user } = useUser()
  const { data, mutate } = useSWR<ProjectWithUserVote>(`/api/projects/${projectId}`, fetcher, {
    fallbackData: initial,
  })
  const [busy, setBusy] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  function handleVoteClick(dir: Exclude<VoteDirection, null>) {
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
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: dir }),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Vote failed:', errorData)
        
        if (res.status === 401) {
          setShowSignUpModal(true)
          return
        }
        
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const fresh = (await res.json()) as ProjectWithUserVote
      await mutate(fresh, false)
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

  // Only show user's vote state if they are authenticated
  const upActive = user ? data.userVote === "up" : false
  const downActive = user ? data.userVote === "down" : false

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
