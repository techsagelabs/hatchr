"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
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
import { Edit, Trash2, MoreVertical } from "lucide-react"
import type { ProjectWithUserVote } from "@/lib/types"

interface ProjectActionsProps {
  project: ProjectWithUserVote
  currentUserId?: string
  className?: string
}

export function ProjectActions({ project, currentUserId, className }: ProjectActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  // Only show actions if user owns the project
  const isOwner = currentUserId && currentUserId === project.author.id

  if (!isOwner) return null

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
      router.refresh() // Ensure the page refreshes to show updated data
      
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleEdit = () => {
    router.push(`/projects/${project.id}/edit`)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground ${className}`}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Project actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
