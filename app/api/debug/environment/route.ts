import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser()
    
    // Test Supabase connection
    let supabaseTest = { connected: false, error: null }
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.from('votes').select('COUNT(*)', { count: 'exact', head: true })
      if (error) {
        supabaseTest = { connected: false, error: error.message }
      } else {
        supabaseTest = { connected: true, error: null }
      }
    } catch (err: any) {
      supabaseTest = { connected: false, error: err.message }
    }

    // Test auth.uid() function
    let authTest = { working: false, uid: null, error: null }
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.rpc('auth_uid_test')
      if (error) {
        authTest = { working: false, uid: null, error: error.message }
      } else {
        authTest = { working: true, uid: data, error: null }
      }
    } catch (err: any) {
      authTest = { working: false, uid: null, error: err.message }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      
      // Environment Variables
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      
      // Authentication Status  
      authentication: {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.username,
      },
      
      // Supabase Connection
      supabase: supabaseTest,
      
      // Auth Function Test
      authFunction: authTest,
      
      // Runtime Info
      runtime: {
        platform: process.platform,
        nodeVersion: process.version,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    }

    return NextResponse.json(debugInfo)
    
  } catch (error: any) {
    console.error('Debug environment API error:', error)
    return NextResponse.json({ 
      error: "Debug environment check failed",
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
