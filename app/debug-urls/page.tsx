'use client'

import { getBaseUrl, getAuthCallbackUrl } from '@/lib/url-utils'
import { useEffect, useState } from 'react'

export default function DebugUrlsPage() {
  const [urls, setUrls] = useState({
    baseUrl: '',
    callbackUrl: '',
    windowOrigin: '',
    envSiteUrl: '',
    envVercelUrl: ''
  })

  useEffect(() => {
    setUrls({
      baseUrl: getBaseUrl(),
      callbackUrl: getAuthCallbackUrl('/'),
      windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A (server)',
      envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
      envVercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL || 'Not set'
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 URL Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Current URL Resolution:</h3>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Base URL:</strong> {urls.baseUrl}</div>
            <div><strong>Auth Callback URL:</strong> {urls.callbackUrl}</div>
            <div><strong>Window Origin:</strong> {urls.windowOrigin}</div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Environment Variables:</h3>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>NEXT_PUBLIC_SITE_URL:</strong> {urls.envSiteUrl}</div>
            <div><strong>NEXT_PUBLIC_VERCEL_URL:</strong> {urls.envVercelUrl}</div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold mb-2">✅ Expected in Production:</h3>
          <div className="space-y-1 text-sm">
            <div>• <strong>Base URL:</strong> https://hatchr.techsagelabs.in</div>
            <div>• <strong>Callback URL:</strong> https://hatchr.techsagelabs.in/auth/callback?next=%2F</div>
            <div>• <strong>Window Origin:</strong> https://hatchr.techsagelabs.in</div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="font-semibold mb-2">❌ Problem Indicators:</h3>
          <div className="space-y-1 text-sm">
            <div>• If you see <code>localhost:3000</code> in production → Environment variable issue</div>
            <div>• If Supabase still redirects to localhost → Dashboard Site URL not updated</div>
          </div>
        </div>
      </div>
    </div>
  )
}
