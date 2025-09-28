'use client'

import { getBaseUrl, getAuthCallbackUrl } from '@/lib/url-utils'
import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugUrlsPage() {
  const { user, loading } = useAuth()
  const [urls, setUrls] = useState({
    baseUrl: '',
    callbackUrl: '',
    windowOrigin: '',
    envSiteUrl: '',
    envVercelUrl: ''
  })
  const [voteTest, setVoteTest] = useState({
    testing: false,
    result: '',
    error: ''
  })
  const [envTest, setEnvTest] = useState({
    testing: false,
    result: '',
    error: ''
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

  const testVoteAPI = async () => {
    if (!user) {
      setVoteTest({ testing: false, result: '', error: 'Please sign in to test voting API' })
      return
    }

    setVoteTest({ testing: true, result: '', error: '' })
    
    try {
      // Test with a fake project ID to see what error we get
      const response = await fetch('/api/projects/test-project-id/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: 'up' })
      })

      const data = await response.json()
      
      setVoteTest({
        testing: false,
        result: `Status: ${response.status}, Response: ${JSON.stringify(data, null, 2)}`,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : ''
      })
    } catch (error: any) {
      setVoteTest({
        testing: false,
        result: '',
        error: `Network Error: ${error.message}`
      })
    }
  }

  const testEnvironmentVariables = async () => {
    setEnvTest({ testing: true, result: '', error: '' })
    
    try {
      const response = await fetch('/api/debug/environment')
      const data = await response.json()
      
      setEnvTest({
        testing: false,
        result: JSON.stringify(data, null, 2),
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : ''
      })
    } catch (error: any) {
      setEnvTest({
        testing: false,
        result: '',
        error: `Network Error: ${error.message}`
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 Production Debug Dashboard</h1>
      
      <div className="space-y-6">
        {/* URL Resolution */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">🌐 URL Resolution:</h3>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Base URL:</strong> {urls.baseUrl}</div>
            <div><strong>Auth Callback URL:</strong> {urls.callbackUrl}</div>
            <div><strong>Window Origin:</strong> {urls.windowOrigin}</div>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">🔐 Authentication Status:</h3>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
            {user && (
              <>
                <div><strong>User ID:</strong> {user.id}</div>
                <div><strong>Username:</strong> {user.username}</div>
                <div><strong>Email:</strong> {user.email}</div>
              </>
            )}
          </div>
        </div>

        {/* Vote API Test */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">🗳️ Vote API Test:</h3>
          <div className="space-y-3">
            <Button 
              onClick={testVoteAPI} 
              disabled={voteTest.testing || loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {voteTest.testing ? 'Testing...' : 'Test Vote API'}
            </Button>
            
            {voteTest.error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                <div className="text-red-700 dark:text-red-400 font-semibold">❌ Error:</div>
                <div className="text-sm font-mono mt-1">{voteTest.error}</div>
              </div>
            )}
            
            {voteTest.result && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                <div className="text-green-700 dark:text-green-400 font-semibold">📊 Result:</div>
                <pre className="text-xs mt-1 overflow-auto">{voteTest.result}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Environment Variables Test */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">🔧 Environment Variables Test:</h3>
          <div className="space-y-3">
            <Button 
              onClick={testEnvironmentVariables} 
              disabled={envTest.testing || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {envTest.testing ? 'Testing...' : 'Test Server Environment'}
            </Button>
            
            {envTest.error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                <div className="text-red-700 dark:text-red-400 font-semibold">❌ Error:</div>
                <div className="text-sm font-mono mt-1">{envTest.error}</div>
              </div>
            )}
            
            {envTest.result && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-blue-700 dark:text-blue-400 font-semibold">🔧 Environment Info:</div>
                <pre className="text-xs mt-1 overflow-auto max-h-40">{envTest.result}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">🔧 Environment Variables:</h3>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>NEXT_PUBLIC_SITE_URL:</strong> {urls.envSiteUrl}</div>
            <div><strong>NEXT_PUBLIC_VERCEL_URL:</strong> {urls.envVercelUrl}</div>
          </div>
        </div>

        {/* Expected Values */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold mb-2">✅ Expected in Production:</h3>
          <div className="space-y-1 text-sm">
            <div>• <strong>Base URL:</strong> https://hatchr.techsagelabs.in</div>
            <div>• <strong>Callback URL:</strong> https://hatchr.techsagelabs.in/auth/callback?next=%2F</div>
            <div>• <strong>Window Origin:</strong> https://hatchr.techsagelabs.in</div>
            <div>• <strong>Authentication:</strong> User should be authenticated</div>
            <div>• <strong>Vote API Test:</strong> Should return 404 (project not found) or 401 (auth required)</div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="font-semibold mb-2">🚨 Troubleshooting Guide:</h3>
          <div className="space-y-2 text-sm">
            <div><strong>If you see localhost URLs:</strong> Environment variables not set in Vercel</div>
            <div><strong>If authentication fails:</strong> Check Supabase Site URL in dashboard</div>
            <div><strong>If vote API returns 500:</strong> RLS policies need updating in production database</div>
            <div><strong>If vote API returns 401:</strong> Authentication not working properly</div>
            <div><strong>If vote API returns 404:</strong> Good! This means auth is working, just no project with that ID</div>
          </div>
        </div>
      </div>
    </div>
  )
}
