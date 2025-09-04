"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/ui/image-upload"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ProjectWithUserVote } from "@/lib/types"

interface EditProjectFormProps {
  project: ProjectWithUserVote
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const [title, setTitle] = useState(project.title)
  const [shortDescription, setShortDescription] = useState(project.shortDescription)
  const [fullDescription, setFullDescription] = useState(project.fullDescription)
  const [thumbnailUrl, setThumbnailUrl] = useState(project.thumbnailUrl)
  const [mediaUrl, setMediaUrl] = useState(project.mediaUrl || "")
  const [codeEmbedUrl, setCodeEmbedUrl] = useState(project.codeEmbedUrl || "")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !shortDescription || !fullDescription || !thumbnailUrl) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          shortDescription,
          fullDescription,
          thumbnailUrl,
          mediaUrl: mediaUrl || undefined,
          codeEmbedUrl: codeEmbedUrl || undefined,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        console.error("Failed to update project:", error)
        alert(`Failed to update project: ${error.error || 'Unknown error'}`)
        return
      }
      
      // Redirect back to project page
      router.push(`/projects/${project.id}`)
      router.refresh()
      
    } catch (error) {
      console.error("Error updating project:", error)
      alert("Failed to update project. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link 
          href={`/projects/${project.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to project
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                disabled={saving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="short">Short description</Label>
              <Input 
                id="short" 
                value={shortDescription} 
                onChange={(e) => setShortDescription(e.target.value)} 
                required 
                disabled={saving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full">Full description</Label>
              <Textarea
                id="full"
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                required
                disabled={saving}
                className="min-h-[120px]"
              />
            </div>
            
            <ImageUpload
              label="Project thumbnail image"
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              disabled={saving}
              required
            />
            
            <div className="space-y-2">
              <Label htmlFor="media">Media embed URL (optional)</Label>
              <Input
                id="media"
                placeholder="YouTube embed URL"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                disabled={saving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code embed URL (optional)</Label>
              <Input
                id="code"
                placeholder="CodePen pen URL"
                value={codeEmbedUrl}
                onChange={(e) => setCodeEmbedUrl(e.target.value)}
                disabled={saving}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={saving || !title || !shortDescription || !fullDescription || !thumbnailUrl}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
              
              <Link href={`/projects/${project.id}`}>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
