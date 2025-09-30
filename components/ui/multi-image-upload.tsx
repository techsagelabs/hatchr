"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/utils/supabase/client"
import { Upload, X, Image as ImageIcon, MoveUp, MoveDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ImageItem {
  id: string
  url: string
  altText?: string
  isThumbnail: boolean
  mediaType?: 'image' | 'video' // Type of media
}

interface MultiImageUploadProps {
  value: ImageItem[]
  onChange: (images: ImageItem[]) => void
  disabled?: boolean
  label?: string
  maxImages?: number
  required?: boolean
}

export function MultiImageUpload({ 
  value, 
  onChange, 
  disabled, 
  label = "Project Images & Videos", 
  maxImages = 5,
  required 
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Authentication required')

    // Log upload attempt
    console.log('📤 Starting upload:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      bucket: 'project-assets'
    })

    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `project-images/${fileName}`

    // Create client-side Supabase client with auth token
    const supabaseClient = createClient()

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('project-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload failed:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        filePath,
        fileType: file.type
      })
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log('✅ Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('project-assets')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    console.log('✅ Got public URL:', urlData.publicUrl)

    return urlData.publicUrl
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (value.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const newImages: ImageItem[] = []

      for (const file of files) {
        // Validate file type (accept image or video)
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        
        if (!isImage && !isVideo) {
          throw new Error(`${file.name} is not an image or video file`)
        }

        // Validate file size (max 50MB for videos, 5MB for images)
        const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
        const maxSizeLabel = isVideo ? '50MB' : '5MB'
        
        if (file.size > maxSize) {
          throw new Error(`${file.name} is too large (max ${maxSizeLabel})`)
        }

        const url = await uploadImage(file)
        newImages.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          url,
          altText: file.name.split('.')[0],
          isThumbnail: value.length === 0 && newImages.length === 0, // First media is thumbnail
          mediaType: isVideo ? 'video' : 'image'
        })
      }

      onChange([...value, ...newImages])
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error: any) {
      console.error('Error uploading images:', error)
      setError(error.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (id: string) => {
    const updatedImages = value.filter(img => img.id !== id)
    
    // If we removed the thumbnail, make the first remaining image the thumbnail
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isThumbnail)) {
      updatedImages[0].isThumbnail = true
    }
    
    onChange(updatedImages)
    setError(null)
  }

  const setAsThumbnail = (id: string) => {
    const updatedImages = value.map(img => ({
      ...img,
      isThumbnail: img.id === id
    }))
    onChange(updatedImages)
  }

  const moveImage = (id: string, direction: 'up' | 'down') => {
    const currentIndex = value.findIndex(img => img.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= value.length) return

    const updatedImages = [...value]
    const temp = updatedImages[currentIndex]
    updatedImages[currentIndex] = updatedImages[newIndex]
    updatedImages[newIndex] = temp

    onChange(updatedImages)
  }

  const updateAltText = (id: string, altText: string) => {
    const updatedImages = value.map(img => 
      img.id === id ? { ...img, altText } : img
    )
    onChange(updatedImages)
  }

  return (
    <div className="space-y-4">
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      
      {/* Upload Area */}
      <div className="space-y-4">
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            disabled ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300 hover:border-gray-400",
            value.length >= maxImages && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && value.length < maxImages && fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                disabled={disabled || uploading || value.length >= maxImages}
                className="hidden"
              />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">Uploading media...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {value.length >= maxImages 
                  ? `Maximum ${maxImages} media files reached`
                  : "Click to upload images or videos"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Images: PNG, JPG, GIF (max 5MB) • Videos: MP4, MOV, WebM (max 50MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((image, index) => (
            <div 
              key={image.id} 
              className={cn(
                "relative group rounded-lg border-2 overflow-hidden",
                image.isThumbnail ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
              )}
            >
              <div className="aspect-video relative">
                {image.mediaType === 'video' ? (
                  <video
                    src={image.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={image.url}
                    alt={image.altText || `Project image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                )}
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.isThumbnail && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setAsThumbnail(image.id)}
                      className="text-xs"
                    >
                      Set as Main
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(image.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Thumbnail Badge */}
                {image.isThumbnail && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Main {image.mediaType === 'video' ? 'Video' : 'Image'}
                  </div>
                )}

                {/* Move Controls */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(image.id, 'up')}
                      className="p-1 h-auto opacity-0 group-hover:opacity-100"
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                  )}
                  {index < value.length - 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(image.id, 'down')}
                      className="p-1 h-auto opacity-0 group-hover:opacity-100"
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Alt Text Input */}
              <div className="p-2 bg-white">
                <input
                  type="text"
                  placeholder="Image description..."
                  value={image.altText || ''}
                  onChange={(e) => updateAltText(image.id, e.target.value)}
                  disabled={disabled}
                  className="w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

          {/* Instructions */}
          {value.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• The first media file will be used as the project thumbnail</p>
              <p>• Click "Set as Main" on any file to make it the thumbnail</p>
              <p>• Use arrow buttons to reorder media files</p>
              <p>• Add descriptions for better accessibility</p>
              <p>• Videos will play in the carousel on project pages</p>
            </div>
          )}
    </div>
  )
}
