'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

// Load debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/auth-debug')
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Auth Check:', { 
            user: user ? { id: user.id, email: user.email } : null, 
            error: error?.message 
          })
        }
        
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auth State Change:', { 
            event, 
            user: session?.user ? { id: session.user.id, email: session.user.email } : null 
          })
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string) => {
    // Validate username format
    if (!username || username.length < 3 || username.length > 30) {
      return { error: { message: 'Username must be 3-30 characters long' } }
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { error: { message: 'Username can only contain letters, numbers, and underscores' } }
    }

    // Clean username (lowercase, remove invalid chars)
    const cleanUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '')

    try {
      // Check username uniqueness by calling our API
      const checkResponse = await fetch('/api/user/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername }),
      })

      if (!checkResponse.ok) {
        const checkData = await checkResponse.json()
        return { error: { message: checkData.message || 'Failed to validate username' } }
      }

      const { available } = await checkResponse.json()
      if (!available) {
        return { error: { message: 'Username is already taken' } }
      }

      // Proceed with Supabase signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanUsername, // For backward compatibility
          },
        },
      })

      return { error }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { error: { message: error.message || 'An unexpected error occurred during signup' } }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase (clears localStorage and cookies)
      await supabase.auth.signOut()
      
      // Force clear any remaining auth state
      setUser(null)
      setLoading(false)
      
      // Clear localStorage manually as a fallback
      if (typeof window !== 'undefined') {
        // Clear any Supabase auth keys from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      console.log('✅ Successfully signed out and cleared auth state')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Even if sign out fails, clear local state
      setUser(null)
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
