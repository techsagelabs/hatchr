/**
 * URL utilities for handling production and development environments
 */

export function getBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side: check for production environment variables
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Vercel automatically provides VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback to localhost for development
  return 'http://localhost:3000'
}

export function getAuthCallbackUrl(next: string = '/'): string {
  return `${getBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`
}
