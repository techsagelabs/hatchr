"use client"

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

// ✅ OPTIMIZED: Global fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url)
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object.
    ;(error as any).info = await res.json()
    ;(error as any).status = res.status
    throw error
  }

  return res.json()
}

// ✅ OPTIMIZED: Performance-focused SWR configuration with instant vote updates
const swrConfig = {
  fetcher,
  // Cache settings optimized for realtime updates
  revalidateOnFocus: false, // Don't refetch when window gets focus (realtime handles this)
  revalidateOnReconnect: true, // Refetch when reconnecting to internet
  revalidateIfStale: true, // Revalidate stale data immediately
  shouldRetryOnError: (error: any) => {
    // Don't retry on 4xx errors
    if (error.status >= 400 && error.status < 500) return false
    return true
  },
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
  loadingTimeout: 10000, // 10 second timeout
  // ⚡ CRITICAL FIX: Reduced deduping interval for instant vote updates
  dedupingInterval: 200, // Only 200ms (was 2000ms) - allow rapid updates
  // Background revalidation settings
  refreshInterval: 0, // Disable automatic refresh (realtime handles updates)
  // Focus revalidation only for critical data
  focusThrottleInterval: 5000,
  // Cache settings - use Map for better performance
  provider: () => new Map(),
  // REMOVED: compare function was causing infinite loops
}

interface SWRConfigProviderProps {
  children: ReactNode
}

export function SWRConfigProvider({ children }: SWRConfigProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}

