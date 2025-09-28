import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser()
    
    // Test Supabase connection with detailed debugging
    let supabaseTest = { 
      connected: false, 
      error: null, 
      details: {},
      rawError: null,
      clientType: 'unknown'
    }
    
    try {
      const supabase = await createServerSupabaseClient()
      supabaseTest.clientType = 'server_client'
      
      console.log('🧪 Debug: Testing basic supabase connection')
      
      // Test 1: Simple count query
      const { data, error, count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        
      console.log('🧪 Debug: Votes count result:', { data, error, count })
      
      if (error) {
        supabaseTest = { 
          connected: false, 
          error: error.message,
          details: {
            code: error.code,
            details: error.details,
            hint: error.hint,
            message: error.message
          },
          rawError: error,
          clientType: 'server_client'
        }
      } else {
        // Test 2: Try a simple select with auth context
        const { data: authData, error: authError } = await supabase
          .from('votes')
          .select('id')
          .limit(1)
          
        console.log('🧪 Debug: Auth context test:', { authData, authError })
        
        if (authError) {
          supabaseTest = {
            connected: false,
            error: `Auth context failed: ${authError.message}`,
            details: {
              step: 'auth_context_test',
              code: authError.code,
              details: authError.details,
              hint: authError.hint
            },
            rawError: authError,
            clientType: 'server_client'
          }
        } else {
          supabaseTest = { 
            connected: true, 
            error: null,
            details: {
              count_result: count,
              auth_test_result: authData
            },
            rawError: null,
            clientType: 'server_client'
          }
        }
      }
    } catch (err: any) {
      console.error('🧪 Debug: Supabase connection threw exception:', err)
      supabaseTest = { 
        connected: false, 
        error: err.message,
        details: {
          name: err.name,
          stack: err.stack,
          cause: err.cause
        },
        rawError: err,
        clientType: 'server_client'
      }
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
