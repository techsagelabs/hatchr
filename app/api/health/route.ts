import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: false,
    auth: false,
    voting_system: false,
    environment: false
  }
  
  try {
    // Test database connection
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('projects').select('id').limit(1)
    checks.database = !error && data !== null
    
    // Test auth system (check if we can call auth functions)
    try {
      const { data: authTest } = await adminClient.rpc('auth_uid_test')
      checks.auth = authTest !== null
    } catch (authError) {
      console.log('[Health] Auth test function not available:', authError)
      checks.auth = false
    }
    
    // Test voting system (check if votes table is accessible)
    const { data: voteTest } = await adminClient.from('votes').select('id').limit(1)
    checks.voting_system = voteTest !== null
    
    // Test environment variables
    checks.environment = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
  } catch (error) {
    console.error('[Health Check] Error:', error)
  }
  
  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : true
  )
  
  return NextResponse.json(
    { 
      status: allHealthy ? 'healthy' : 'degraded',
      checks 
    },
    { status: allHealthy ? 200 : 503 }
  )
}
