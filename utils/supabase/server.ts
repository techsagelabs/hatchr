import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function createClient() {
  const cookieStore = await cookies() // Next.js 15 requires await
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component
            // This is expected and can be safely ignored in Next.js 15
            // Middleware handles session refresh
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for API routes with enhanced cookie handling
 * This ensures proper authentication context for table operations
 */
export function createApiRouteClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return []
          
          return cookieHeader
            .split(';')
            .map(cookie => {
              const [name, ...rest] = cookie.trim().split('=')
              return { 
                name: name.trim(), 
                value: decodeURIComponent(rest.join('=') || '') 
              }
            })
            .filter(cookie => cookie.name && cookie.value)
        },
        setAll(cookiesToSet) {
          // In API routes, we can't set cookies directly
          // This will be handled by the response
        },
      },
    }
  )
}

/**
 * Alternative: Direct JWT extraction from Authorization header
 */
export function createJWTClient(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  
  console.log('🔑 Creating JWT client with token:', { 
    tokenPreview: `${token.substring(0, 20)}...`
  })
  
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  
  return client
}