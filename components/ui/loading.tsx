"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border shadow-sm p-5 animate-pulse", 
      className
    )}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-full"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
        <div className="h-8 w-8 bg-muted rounded-full"></div>
      </div>
      
      {/* Title skeleton */}
      <div className="h-7 w-3/4 bg-muted rounded mb-3"></div>
      
      {/* Media skeleton */}
      <div className="h-48 w-full bg-muted rounded-xl mb-4"></div>
      
      {/* Actions skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-16 bg-muted rounded-full"></div>
          <div className="h-9 w-14 bg-muted rounded-full"></div>
          <div className="h-9 w-12 bg-muted rounded-full"></div>
        </div>
        <div className="h-4 w-16 bg-muted rounded"></div>
      </div>
    </div>
  )
}

interface LoadingPageProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingPage({ title = "Loading...", description, className }: LoadingPageProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] text-center",
      className
    )}>
      <LoadingSpinner size="lg" className="text-orange-600 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-sm max-w-md">{description}</p>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}
