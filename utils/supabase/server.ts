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
        // Switch to custom fetch so Authorization is guaranteed to be attached
        fetch: async (url: RequestInfo, options: RequestInit = {}) => {
          if (!userId) {
            return fetch(url, options)
          }

          try {
            console.log('🔍 Getting Clerk token for SSR request')
            const preferTemplate = (process.env.NEXT_PUBLIC_CLERK_SUPABASE_USE_TEMPLATE_FIRST || '').toLowerCase() === 'true'
            const templateName = process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE || 'supabase'

            let token: string | null = null
            if (preferTemplate) {
              try {
                console.log(`🔐 Preferring Clerk JWT template first: ${templateName}`)
                token = await getToken({ template: templateName })
              } catch (e) {
                console.log('⚠️ Template token retrieval failed, will try native token next:', e)
              }
            }

            // ✅ Try native token (RS256) if no template token or not preferring template
            if (!token) {
              token = await getToken()
            }
            // 🔁 Fallback to legacy JWT template (HS256) if native token is unavailable or Supabase not configured
            // 🔁 Final fallback to template if native returned null
            if (!token) {
              console.log(`🔁 Final fallback to Clerk JWT template: ${templateName}`)
              try {
                token = await getToken({ template: templateName })
              } catch (e) {
                console.log('⚠️ Final fallback template token retrieval failed:', e)
              }
            }

            if (token) {
              const headers = new Headers(options.headers as HeadersInit | undefined)
              headers.set('Authorization', `Bearer ${token}`)
              return fetch(url, { ...options, headers })
            }
            return fetch(url, options)
          } catch (error) {
            return fetch(url, options)
          }
        }
      }
    }
  )
}