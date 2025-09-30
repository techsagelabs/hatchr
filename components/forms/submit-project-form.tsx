"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MultiImageUpload, type ImageItem } from "@/components/ui/multi-image-upload"

export function SubmitProjectForm() {
  const [title, setTitle] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [fullDescription, setFullDescription] = useState("")
  const [images, setImages] = useState<ImageItem[]>([])
  const [mediaUrl, setMediaUrl] = useState("")
  const [codeEmbedUrl, setCodeEmbedUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate required fields
    if (!title || !shortDescription || !fullDescription) {
      alert("Please fill in all required fields")
      return
    }
    
    if (images.length === 0) {
      alert("Please upload at least one project image")
      return
    }
    
    setBusy(true)
    try {
      // Find the thumbnail image (first image marked as thumbnail, or first image if none marked)
      const thumbnailImage = images.find(img => img.isThumbnail) || images[0]
      
      // Prepare images data for API
      const imagesData = images.map((img, index) => ({
        url: img.url,
        altText: img.altText || `${title} - Image ${index + 1}`,
        displayOrder: index,
        isThumbnail: img.id === thumbnailImage.id
      }))
      
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          shortDescription,
          fullDescription,
          thumbnailUrl: thumbnailImage.url, // Backward compatibility
          images: imagesData, // New multi-image support
          mediaUrl: mediaUrl || undefined,
          codeEmbedUrl: codeEmbedUrl || undefined,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        console.error("Failed to submit project:", error)
        alert(`Failed to submit project: ${error.error || `HTTP ${res.status}: ${res.statusText}`}`)
        return
      }
      
      const p = await res.json()
      console.log('API Response:', p) // Debug logging
      
      if (!p || !p.id) {
        console.error("Invalid response:", p)
        alert(`Failed to submit project: ${p?.error || 'Invalid response from server'}`)
        return
      }
      
      router.push(`/projects/${p.id}`)
    } catch (error) {
      console.error("Error submitting project:", error)
      alert("Failed to submit project. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="short">Short description</Label>
        <Input id="short" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="full">Full description</Label>
        <Textarea
          id="full"
          value={fullDescription}
          onChange={(e) => setFullDescription(e.target.value)}
          required
          className="min-h-[120px]"
        />
      </div>
      <MultiImageUpload
        label="Project Images (up to 5)"
        value={images}
        onChange={setImages}
        disabled={busy}
        maxImages={5}
        required
      />
      <div className="space-y-2">
        <Label htmlFor="media">Media embed URL (optional)</Label>
        <Input
          id="media"
          placeholder="YouTube embed URL"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Code embed URL (optional)</Label>
        <Input
          id="code"
          placeholder="CodePen pen URL"
          value={codeEmbedUrl}
          onChange={(e) => setCodeEmbedUrl(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="bg-orange-600 hover:bg-orange-700">
        {busy ? "Submitting..." : "Submit Project"}
      </Button>
    </form>
  )
}
