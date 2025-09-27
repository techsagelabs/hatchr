import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export async function createClient() {
  const cookieStore = await cookies()
  const { getToken, userId } = await auth()
  
  console.log('🔍 Creating SSR Supabase client for user:', userId || 'anonymous')
  
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
      global: {
        headers: async () => {
          if (!userId) {
            console.log('👤 No user - using anonymous access')
            return {}
          }

          try {
            console.log('🔍 Getting Clerk token for SSR request')
            // ✅ NATIVE INTEGRATION: Use getToken() without template parameter
            const token = await getToken()
            
            if (token) {
              console.log('🔑 Successfully got Clerk token for Supabase SSR')
              return { Authorization: `Bearer ${token}` }
            } else {
              console.log('⚠️ No token received from Clerk in SSR')
              return {}
            }
          } catch (error) {
            console.log('❌ Error getting Clerk token in SSR:', error)
            return {}
          }
        }
      }
    }
  )
}