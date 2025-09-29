import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Utility function for validated operations using service role
 * Ensures user is authenticated before performing admin operations
 */
export async function performAuthenticatedOperation<T>(
  userSupabase: any,
  operation: (adminClient: any, userId: string) => Promise<T>
): Promise<T> {
  // First verify user authentication
  const { data: { user }, error: userError } = await userSupabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  console.log(`🔒 Performing admin operation for user: ${user.id}`)

  // Use admin client for the actual operation
  const adminClient = createAdminClient()
  return await operation(adminClient, user.id)
}
