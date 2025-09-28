import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()
  
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component limitation - can be ignored with middleware
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for API routes with explicit JWT token
 * This ensures proper authentication context for table operations
 */
export function createClientForApiRoute(request: Request) {
  // Extract JWT token from Authorization header
  const authHeader = request.headers.get('Authorization')
  const accessToken = authHeader?.replace('Bearer ', '')
  
  console.log('🔑 Creating API route client with token:', { 
    hasAuthHeader: !!authHeader,
    hasAccessToken: !!accessToken,
    tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none'
  })
  
  // Create client with explicit JWT token for authenticated operations
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {}
      }
    }
  )
}