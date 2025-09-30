"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectImage } from "@/lib/types"

interface ImageCarouselProps {
  images: ProjectImage[]
  className?: string
  showThumbnails?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function ImageCarousel({ 
  images, 
  className,
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sort images by display order, with thumbnail first
  const sortedImages = [...images].sort((a, b) => {
    if (a.isThumbnail) return -1
    if (b.isThumbnail) return 1
    return a.displayOrder - b.displayOrder
  })

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length)
  }, [sortedImages.length])

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }, [sortedImages.length])

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || sortedImages.length <= 1) return

    const interval = setInterval(nextImage, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, nextImage, sortedImages.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextImage()
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault()
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeydown)
      return () => document.removeEventListener('keydown', handleKeydown)
    }
  }, [isFullscreen, nextImage, prevImage])

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isFullscreen])

  if (!sortedImages.length) {
    return (
      <div className={cn("aspect-video bg-muted rounded-md flex items-center justify-center", className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  if (sortedImages.length === 1) {
    // Single media display
    return (
      <div className={cn("relative", className)}>
        <div className="aspect-video relative rounded-md overflow-hidden group">
          {sortedImages[0].mediaType === 'video' ? (
            <video
              src={sortedImages[0].imageUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          ) : sortedImages[0].imageUrl.includes('supabase.co') ? (
            <img
              src={sortedImages[0].imageUrl}
              alt={sortedImages[0].altText || 'Project image'}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <Image
              src={sortedImages[0].imageUrl}
              alt={sortedImages[0].altText || 'Project image'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={sortedImages[0].isThumbnail}
            />
          )}
          
          {/* Fullscreen Button - hide for videos since they have their own controls */}
          {sortedImages[0].mediaType !== 'video' && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const currentImage = sortedImages[currentIndex]

  return (
    <>
      {/* Main Carousel */}
      <div className={cn("relative", className)}>
        {/* Main Media Display */}
        <div className="aspect-video relative rounded-md overflow-hidden group bg-muted">
          {currentImage.mediaType === 'video' ? (
            <video
              src={currentImage.imageUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          ) : currentImage.imageUrl.includes('supabase.co') ? (
            <img
              src={currentImage.imageUrl}
              alt={currentImage.altText || `Project image ${currentIndex + 1}`}
              className="w-full h-full object-contain transition-opacity duration-300"
              loading="lazy"
            />
          ) : (
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.altText || `Project image ${currentIndex + 1}`}
              fill
              className="object-contain transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={currentIndex === 0}
            />
          )}

          {/* Navigation Arrows */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Fullscreen Button - hide for videos since they have their own controls */}
          {currentImage.mediaType !== 'video' && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {sortedImages.length}
          </div>

          {/* Thumbnail Badge */}
          {currentImage.isThumbnail && (
            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Main Image
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {showThumbnails && sortedImages.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                  index === currentIndex 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => goToImage(index)}
              >
                {image.mediaType === 'video' ? (
                  <video
                    src={image.imageUrl}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                ) : image.imageUrl.includes('supabase.co') ? (
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={image.imageUrl}
                    alt={image.altText || `Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
                
                {image.isThumbnail && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Dots Navigation (alternative to thumbnails for mobile) */}
        {!showThumbnails && sortedImages.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {sortedImages.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"
                )}
                onClick={() => goToImage(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <Button
              variant="secondary"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsFullscreen(false)}
            >
              ✕
            </Button>

            {/* Fullscreen Image */}
            <div className="relative max-w-full max-h-full">
              {currentImage.imageUrl.includes('supabase.co') ? (
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.altText || `Project image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Image
                  src={currentImage.imageUrl}
                  alt={currentImage.altText || `Project image ${currentIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Fullscreen Navigation */}
            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Fullscreen Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded">
                  {currentIndex + 1} / {sortedImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
