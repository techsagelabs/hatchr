import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with Clerk integration
export async function createServerSupabaseClient() {
  const { getToken, userId } = await auth()
  
  console.log('🔍 createServerSupabaseClient called:', { 
    hasUserId: !!userId, 
    userId: userId ? `${userId.substring(0, 8)}...` : null 
  })
  
  // Only try to get token if user is authenticated
  let token = null
  if (userId) {
    try {
      token = await getToken({ template: 'supabase' })
      console.log('✅ JWT token obtained:', { 
        hasToken: !!token, 
        tokenStart: token ? `${token.substring(0, 20)}...` : null 
      })
    } catch (error) {
      console.error('❌ Could not get JWT token:', {
        error: error instanceof Error ? error.message : error,
        userId: userId.substring(0, 8) + '...'
      })
      // FALLBACK: Use anonymous access if JWT fails
      console.log('🔄 Falling back to anonymous access due to JWT error')
    }
  }

  // Debug: Log token info
  if (token) {
    console.log('🔑 Using Clerk JWT token for Supabase')
  } else if (userId) {
    console.log('⚠️ User authenticated but using anonymous access (JWT failed)')
  } else {
    // This is normal for unauthenticated users browsing publicly
    console.log('👤 Unauthenticated user accessing public data')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
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
