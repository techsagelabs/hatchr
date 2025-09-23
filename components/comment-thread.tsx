"use client"

import { useState } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { Comment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function buildTree(flat: Comment[]) {
  const byId: Record<string, Comment & { children: Comment[] }> = {}
  flat.forEach((c) => (byId[c.id] = { ...c, children: [] }))
  const roots: (Comment & { children: Comment[] })[] = []
  flat.forEach((c) => {
    if (c.parentId) {
      byId[c.parentId]?.children.push(byId[c.id])
    } else {
      roots.push(byId[c.id])
    }
  })
  return roots
}

function CommentItem({
  node,
  projectId,
  onReplied,
}: {
  node: Comment & { children?: Comment[] }
  projectId: string
  onReplied: () => void
}) {
  const [showReply, setShowReply] = useState(false)
  const [content, setContent] = useState("")

  async function submitReply() {
    if (!content.trim()) return
    const res = await fetch(`/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId: node.id }),
    })
    if (res.ok) {
      setContent("")
      setShowReply(false)
      onReplied()
    }
  }

  return (
    <li className="mt-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={node.author.avatarUrl || "/placeholder.svg?height=32&width=32&query=avatar"}
            alt={`${node.author.name} avatar`}
          />
          <AvatarFallback>{node.author.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm">
            <span className="font-medium">{node.author.name}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed">{node.content}</p>
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReply((s) => !s)}>
              {showReply ? "Cancel" : "Reply"}
            </Button>
          </div>
          {showReply && (
            <div className="mt-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply..."
                aria-label="Reply"
              />
              <div className="mt-2">
                <Button onClick={submitReply} className="bg-orange-600 hover:bg-orange-700">
                  Post reply
                </Button>
              </div>
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <ul className="ml-6 border-l pl-4">
              {node.children.map((c) => (
                <CommentItem key={c.id} node={c} projectId={projectId} onReplied={onReplied} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}

export function CommentThread({ projectId }: { projectId: string }) {
  const { data, mutate } = useSWR<Comment[]>(`/api/projects/${projectId}/comments`, fetcher)
  const [content, setContent] = useState("")

  async function submitComment() {
    if (!content.trim()) return
    const res = await fetch(`/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      setContent("")
      // Real-time subscriptions will update comments automatically
      // mutate() call removed to prevent double updates
    }
  }

  const tree = data ? buildTree(data) : []

  return (
    <section id="comments" aria-label="Comments" className="mt-8">
      <h3 className="text-lg font-semibold">Comments</h3>
      <div className="mt-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          aria-label="New comment"
        />
        <div className="mt-2">
          <Button onClick={submitComment} className="bg-orange-600 hover:bg-orange-700">
            Post comment
          </Button>
        </div>
      </div>
      <ul className="mt-6">
        {tree.map((c) => (
          <CommentItem key={c.id} node={c} projectId={projectId} onReplied={() => {
            // Real-time subscriptions will handle comment updates automatically
          }} />
        ))}
      </ul>
    </section>
  )
}
