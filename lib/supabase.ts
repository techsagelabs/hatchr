import { createClient } from '@supabase/supabase-js'
// Deprecated: this file has been superseded by utils/supabase/* for SSR/CSR

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (basic, no auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (deprecated - use utils/supabase/server.ts)
export async function createServerSupabaseClient() {
  // Use utils/supabase/server.ts instead for SSR
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Client-side helper for React components (using useSession hook)
export function createClientSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
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