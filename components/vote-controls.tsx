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
    const optimistic: ProjectWithUserVote = {
      ...data,
      votes: {
        up:
          dir === "up"
            ? data.votes.up + (data.userVote === "up" ? -1 : 1)
            : data.votes.up - (data.userVote === "up" ? 1 : 0),
        down:
          dir === "down"
            ? data.votes.down + (data.userVote === "down" ? -1 : 1)
            : data.votes.down - (data.userVote === "down" ? 1 : 0),
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
      const fresh = (await res.json()) as ProjectWithUserVote
      await mutate(fresh, false)
      await globalMutate("/api/projects")
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
        className="inline-flex items-center rounded-full border bg-muted px-3 h-10 shadow-inner select-none"
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

        <span aria-live="polite" className="mx-4 text-base font-medium tabular-nums tracking-[-0.01em]">
          {data.votes.up}
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
