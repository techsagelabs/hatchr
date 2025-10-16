import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from "./types"

// Create Supabase client for server-side operations
export async function createServerSupabaseClient() {
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
            // Server Component limitation - can be ignored
          }
        },
      },
    }
  )
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('❌ [AUTH] No authenticated user')
      return null
    }

    console.log('🔍 [AUTH] Authenticated user:', user.id)

    // Get user profile from our custom user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle to avoid error if profile doesn't exist

    if (profileError) {
      console.error('⚠️ [AUTH] Error fetching profile:', profileError)
    }

    console.log('🔍 [AUTH] Profile found:', profile ? 'Yes' : 'No')

    return {
      id: user.id,
      email: user.email!,
      name: profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      username: profile?.username || profile?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
      bio: profile?.bio,
      location: profile?.location,
      websiteUrl: profile?.website,
      twitterUrl: profile?.twitter,
      githubUrl: profile?.github,
      linkedinUrl: profile?.linkedin,
    }
  } catch (error) {
    console.error('❌ [AUTH] Error getting current user:', error)
    return null
  }
}

export async function requireAuth(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user.id
  } catch (error) {
    console.error('Error requiring auth:', error)
    return null
  }
}