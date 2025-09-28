"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, Image as ImageIcon, Link } from "lucide-react"
import { createClient } from '@/utils/supabase/client'
import { useAuth } from "@/lib/auth-context"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  label?: string
  required?: boolean
}

export function ImageUpload({ value, onChange, disabled, label = "Image", required }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useUrlInput, setUseUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Ensure authenticated
      if (!user) throw new Error('Authentication required')

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
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('project-assets')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      console.log('Image uploaded successfully:', urlData.publicUrl)
      onChange(urlData.publicUrl)

    } catch (error: any) {
      console.error('Error uploading image:', error)
      setError(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    uploadImage(file)
  }

  const removeImage = () => {
    onChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
            <Image
              src={value}
              alt="Uploaded preview"
              width={400}
              height={160}
              className="h-40 w-full rounded-lg object-cover"
              loading="lazy"
              onError={() => setError('Failed to load image preview')}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute right-2 top-2"
              onClick={removeImage}
              disabled={disabled || uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Image uploaded successfully
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled || uploading}
              className="sr-only"
            />
            
            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Uploading image...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Choose Image'}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Alternative URL input */}
      <div className="pt-2 border-t">
        {useUrlInput ? (
          <div className="space-y-2">
            <Label className="text-sm">Or enter image URL:</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (urlValue.trim()) {
                    onChange(urlValue.trim())
                    setUrlValue("")
                  }
                  setUseUrlInput(false)
                }}
                disabled={!urlValue.trim() || disabled}
              >
                Use URL
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseUrlInput(false)
                  setUrlValue("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUseUrlInput(true)}
            disabled={disabled || uploading}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Link className="h-3 w-3 mr-1" />
            Use image URL instead
          </Button>
        )}
      </div>
    </div>
  )
}
