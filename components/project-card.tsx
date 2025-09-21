"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, MoreHorizontal, Share2 } from "lucide-react"
import type { ProjectWithUserVote } from "@/lib/types"
import { VoteControls } from "./vote-controls"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useUser } from "@clerk/nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Edit, Flag } from "lucide-react"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { ReportDialog } from "@/components/report-dialog"
import { SignUpPromptModal } from "@/components/sign-up-prompt-modal"

function toUsernameSlug(name?: string) {
  if (!name) return "user"
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function ProjectCard({ project }: { project: ProjectWithUserVote }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showCommentSignUpModal, setShowCommentSignUpModal] = useState(false)
  
  const createdAt = project.createdAt ? new Date(project.createdAt) : null
  const timeAgo = createdAt ? timeSince(createdAt) : ""

  const anyProject = project as unknown as { videoUrl?: string; mediaUrl?: string }
  const videoUrl = anyProject?.videoUrl
  const mediaSrc = anyProject?.mediaUrl || project.thumbnailUrl

  const authorName = project.author?.name || "username"
  const profileHref = `/u/${toUsernameSlug(authorName)}`
  
  // Avatar is now handled at the data level (custom avatar prioritized over Clerk)
  const isCurrentUser = isLoaded && user?.id === project.author.id
  const avatarUrl = project.author?.avatarUrl

  const handleDelete = async () => {
    if (deleting) return
    
    try {
      setDeleting(true)
      
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete project')
      }

      // Redirect to home page after successful deletion
      router.push('/')
      router.refresh()
      
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleCommentClick = () => {
    if (!isLoaded || !user) {
      setShowCommentSignUpModal(true)
      return
    }
    // User is authenticated, navigate to comments
    router.push(`/projects/${project.id}#comments`)
  }

  return (
    <Card className="group rounded-2xl border shadow-sm transition-shadow hover:shadow-md py-0">
      <CardContent className="p-5">
        {/* Header: avatar + username, menu */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={avatarUrl || "/placeholder.svg?height=36&width=36&query=user avatar"}
                alt=""
              />
              <AvatarFallback>{(authorName || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link href={profileHref} className="text-sm text-muted-foreground leading-5 hover:underline">
                {authorName}
              </Link>
            </div>
          </div>
          {/* Single unified menu */}
          <UnifiedProjectMenu 
            project={project} 
            user={isLoaded ? user : null}
            onDelete={() => setDeleteDialogOpen(true)}
            onReport={() => setReportDialogOpen(true)}
          />
        </div>

        {/* Title */}
        <Link href={`/projects/${project.id}`} className="block">
          <h3 className="text-balance text-2xl font-bold leading-tight tracking-[-0.01em]">{project.title}</h3>
        </Link>

        {/* Media */}
        <Link href={`/projects/${project.id}`} aria-label={`Open ${project.title}`}>
          <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
            {videoUrl ? (
              <video src={videoUrl} controls preload="metadata" className="block h-auto w-full" />
            ) : (
              <Image
                src={
                  mediaSrc || "/placeholder.svg?height=360&width=640&query=image%20%2F%20video" || "/placeholder.svg"
                }
                alt={`${project.title} preview`}
                width={640}
                height={360}
                className="block h-auto w-full object-cover"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                onError={(e) => {
                  console.log('🖼️ Image load error for project:', project.title, {
                    originalSrc: mediaSrc,
                    projectThumbnailUrl: project.thumbnailUrl,
                    fallbackSrc: e.currentTarget.src
                  })
                  e.currentTarget.onerror = null
                  e.currentTarget.src = "/image---video.png"
                }}
              />
            )}
          </div>
        </Link>

        {/* Actions row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Vote controls rendered as rounded pills */}
            <VoteControls projectId={project.id} initial={project} />
            
            {/* Comments button */}
            <Button 
              variant="secondary" 
              className="h-10 rounded-full px-4 gap-2 bg-muted hover:bg-muted/80 border shadow-inner"
              onClick={handleCommentClick}
            >
              <MessageSquare className="h-4 w-4" aria-hidden />
              <span className="tabular-nums text-sm font-medium">{project.commentsCount}</span>
              <span className="sr-only">Comments</span>
            </Button>
            
            {/* Share button */}
            <Button 
              variant="secondary" 
              className="h-10 rounded-full px-4 gap-2 bg-muted hover:bg-muted/80 border shadow-inner"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: project.title,
                    text: project.shortDescription,
                    url: `${window.location.origin}/projects/${project.id}`,
                  }).catch(console.error)
                } else {
                  navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`)
                    .then(() => {
                      // You could add a toast here
                      console.log('Link copied to clipboard!')
                    })
                    .catch(console.error)
                }
              }}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium">Share</span>
              <span className="sr-only">Share project</span>
            </Button>
          </div>
        {timeAgo && <time className="text-sm text-muted-foreground">{timeAgo}</time>}
      </div>
    </CardContent>

    {/* Delete Confirmation Dialog */}
    <DeleteConfirmationDialog 
      isOpen={deleteDialogOpen}
      onClose={() => setDeleteDialogOpen(false)}
      project={project}
      deleting={deleting}
      onDelete={handleDelete}
    />

    {/* Report Dialog */}
    <ReportDialog
      isOpen={reportDialogOpen}
      onClose={() => setReportDialogOpen(false)}
      projectTitle={project.title}
      projectId={project.id}
    />

    {/* Comment Sign Up Modal */}
    <SignUpPromptModal
      isOpen={showCommentSignUpModal}
      onClose={() => setShowCommentSignUpModal(false)}
      action="comment"
    />
  </Card>
)
}

function timeSince(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const intervals: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ]
  let duration = seconds
  let unit: Intl.RelativeTimeFormatUnit = "second"
  for (const [div, nextUnit] of intervals) {
    if (Math.abs(duration) < div) break
    duration /= div
    unit = nextUnit
  }
  return rtf.format(-Math.floor(duration), unit)
}

function UnifiedProjectMenu({ project, user, onDelete, onReport }: {
  project: ProjectWithUserVote
  user: any
  onDelete: () => void
  onReport: () => void
}) {
  const router = useRouter()
  const isOwner = user?.id === project.author.id
  const [showShareSignUpModal, setShowShareSignUpModal] = useState(false)

  const handleEdit = () => {
    if (!user) {
      setShowShareSignUpModal(true)
      return
    }
    router.push(`/projects/${project.id}/edit`)
  }

  const handleShare = async () => {
    // Sharing is allowed for everyone (authenticated or not)
    const url = `${window.location.origin}/projects/${project.id}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          url: url
        })
      } else {
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      // Fallback to clipboard if sharing fails
      try {
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      } catch {
        console.error('Failed to copy link')
      }
    }
  }

  const handleReport = () => {
    if (!user) {
      setShowShareSignUpModal(true)
      return
    }
    onReport()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More options"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share project
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleReport}>
            <Flag className="h-4 w-4 mr-2" />
            Report project
          </DropdownMenuItem>
          
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Sign up prompt modal for menu actions */}
      <SignUpPromptModal
        isOpen={showShareSignUpModal}
        onClose={() => setShowShareSignUpModal(false)}
        action="perform this action"
      />
    </>
  )
}

function DeleteConfirmationDialog({ isOpen, onClose, project, deleting, onDelete }: {
  isOpen: boolean
  onClose: () => void
  project: ProjectWithUserVote
  deleting: boolean
  onDelete: () => void
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{project.title}"? This action cannot be undone and will permanently remove the project and all its comments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={deleting}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {deleting ? 'Deleting...' : 'Delete project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ShareButton({ projectId, title }: { projectId: string; title: string }) {
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/projects/${projectId}`
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-9 rounded-full px-3 gap-2"
      onClick={async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title, url })
          } else {
            await navigator.clipboard.writeText(url)
          }
        } catch {
          /* noop */
        }
      }}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      <span>Share</span>
    </Button>
  )
}
