import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (basic, no auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with Clerk native integration
export async function createServerSupabaseClient() {
  const { getToken, userId } = await auth()
  
  console.log('🔍 Creating Supabase client for user:', userId || 'anonymous')
  
  // ✅ NATIVE INTEGRATION: Use custom fetch to inject Clerk token
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        if (!userId) {
          console.log('👤 Anonymous request to Supabase')
          return fetch(url, options)
        }
        
        try {
          console.log('🔍 Getting Clerk token for Supabase request')
          
          // Native integration: getToken() without template parameter
          const clerkToken = await getToken()
          
          if (clerkToken) {
            console.log('🔑 Injecting Clerk token into Supabase request')
            console.log('🔍 Token details:', { 
              length: clerkToken.length,
              prefix: clerkToken.substring(0, 20) + '...'
            })
            
            // Inject the Clerk token into the Authorization header
            const headers = new Headers(options?.headers)
            headers.set('Authorization', `Bearer ${clerkToken}`)
            
            return fetch(url, { ...options, headers })
          } else {
            console.log('⚠️ No Clerk token available, making unauthenticated request')
            return fetch(url, options)
          }
        } catch (error) {
          console.log('❌ Error getting Clerk token:', error)
          // Fallback to unauthenticated request
          return fetch(url, options)
        }
      }
    }
  })
}

// Client-side helper for React components (using useSession hook)
export function createClientSupabaseClient(session: any) {
  console.log('🔍 Creating client-side Supabase client with session:', !!session)
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        if (!session) {
          console.log('👤 No session - making anonymous request')
          return fetch(url, options)
        }
        
        try {
          // Native integration: getToken() without template parameter
          const clerkToken = await session.getToken()
          
          if (clerkToken) {
            console.log('🔑 Using session token for client request')
            
            // Inject the Clerk token into the Authorization header
            const headers = new Headers(options?.headers)
            headers.set('Authorization', `Bearer ${clerkToken}`)
            
            return fetch(url, { ...options, headers })
          } else {
            console.log('⚠️ No token from session, making unauthenticated request')
            return fetch(url, options)
          }
        } catch (error) {
          console.log('❌ Error getting session token:', error)
          // Fallback to unauthenticated request
          return fetch(url, options)
        }
      }
    }
  })
}

// Database type definitions for better TypeScript support
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          short_description: string
          full_description: string
          thumbnail_url: string
          media_url: string | null
          code_embed_url: string | null
          author_id: string
          author_name: string
          author_avatar_url: string | null
          upvotes: number
          downvotes: number
          net_votes: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          short_description: string
          full_description: string
          thumbnail_url: string
          media_url?: string | null
          code_embed_url?: string | null
          author_id: string
          author_name: string
          author_avatar_url?: string | null
          upvotes?: number
          downvotes?: number
          net_votes?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          short_description?: string
          full_description?: string
          thumbnail_url?: string
          media_url?: string | null
          code_embed_url?: string | null
          author_id?: string
          author_name?: string
          author_avatar_url?: string | null
          upvotes?: number
          downvotes?: number
          net_votes?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          author_id: string
          author_name: string
          author_avatar_url: string | null
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          author_id: string
          author_name: string
          author_avatar_url?: string | null
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          author_id?: string
          author_name?: string
          author_avatar_url?: string | null
          content?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          vote_type: 'up' | 'down'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          vote_type: 'up' | 'down'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          vote_type?: 'up' | 'down'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}