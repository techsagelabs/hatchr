import { NextRequest, NextResponse } from 'next/server'
import { createApiRouteClient, createJWTClient } from '@/utils/supabase/server'
import { createAdminClient, performAuthenticatedOperation } from '@/utils/supabase/admin'

interface VoteRequest {
  direction: 'up' | 'down'
}

interface VoteContext {
  projectId: string
  userId: string
  direction: 'up' | 'down'
  userEmail?: string
}

async function voteWithRegularClient(context: VoteContext, supabase: any) {
  console.log(`[Vote] Attempting regular client vote for user ${context.userId}`)
  
  // First, try to upsert the vote
  const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .upsert(
      {
        project_id: context.projectId,
        user_id: context.userId,
        vote_type: context.direction
      },
      {
        onConflict: 'project_id,user_id'
      }
    )
    .select()

  if (voteError) {
    console.error('[Vote] Regular client vote failed:', voteError)
    throw voteError
  }

  return voteData
}

async function voteWithServiceRole(context: VoteContext, userSupabase: any) {
  console.log(`[Vote] Attempting service role vote for user ${context.userId}`)
  
  return await performAuthenticatedOperation(
    userSupabase,
    async (adminClient, validatedUserId) => {
      // Double-check user ID matches
      if (validatedUserId !== context.userId) {
        throw new Error('User ID mismatch in service role operation')
      }

      const { data, error } = await adminClient
        .from('votes')
        .upsert(
          {
            project_id: context.projectId,
            user_id: context.userId,
            vote_type: context.direction
          },
          {
            onConflict: 'project_id,user_id'
          }
        )
        .select()

      if (error) throw error
      return data
    }
  )
}

async function updateProjectVoteCounts(context: VoteContext, adminClient: any) {
  // Recalculate vote counts for the project
  const { data: voteCounts, error: countError } = await adminClient
    .from('votes')
    .select('vote_type')
    .eq('project_id', context.projectId)

  if (countError) {
    console.error('[Vote] Failed to fetch vote counts:', countError)
    return
  }

  const upvotes = voteCounts.filter(v => v.vote_type === 'up').length
  const downvotes = voteCounts.filter(v => v.vote_type === 'down').length
  const netVotes = upvotes - downvotes

  // Update project vote counts
  const { error: updateError } = await adminClient
    .from('projects')
    .update({
      upvotes,
      downvotes,
      net_votes: netVotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', context.projectId)

  if (updateError) {
    console.error('[Vote] Failed to update project counts:', updateError)
  } else {
    console.log(`[Vote] Updated project ${context.projectId} counts: ${upvotes} up, ${downvotes} down`)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  
  try {
    // Parse request
    const { direction }: VoteRequest = await request.json()
    const { id: projectId } = await params

    if (!direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid vote direction' },
        { status: 400 }
      )
    }

    console.log(`[Vote] Starting vote process: ${projectId} ${direction}`)

    // Method 1: Try with cookie-based client
    let supabase
    let user
    
    try {
      supabase = createApiRouteClient(request)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (!userError && userData.user) {
        user = userData.user
        console.log(`[Vote] Cookie auth successful for user: ${user.id}`)
      }
    } catch (cookieError) {
      console.log('[Vote] Cookie authentication failed:', cookieError.message)
    }

    // Method 2: Try with JWT header if cookie method failed
    if (!user) {
      try {
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          supabase = createJWTClient(authHeader)
          const { data: userData, error: userError } = await supabase.auth.getUser()
          
          if (!userError && userData.user) {
            user = userData.user
            console.log(`[Vote] JWT auth successful for user: ${user.id}`)
          }
        }
      } catch (jwtError) {
        console.log('[Vote] JWT authentication failed:', jwtError.message)
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const context: VoteContext = {
      projectId,
      userId: user.id,
      direction,
      userEmail: user.email
    }

    let voteData
    let method = 'unknown'

    // Try regular client first
    try {
      voteData = await voteWithRegularClient(context, supabase)
      method = 'regular_client'
      console.log(`[Vote] Success with regular client`)
    } catch (regularError) {
      console.log('[Vote] Regular client failed, trying service role:', regularError.message)
      
      // Fallback to service role
      try {
        voteData = await voteWithServiceRole(context, supabase)
        method = 'service_role'
        console.log(`[Vote] Success with service role`)
      } catch (serviceError) {
        console.error('[Vote] Both methods failed:', {
          regular: regularError.message,
          service: serviceError.message
        })
        
        return NextResponse.json(
          {
            error: 'Vote operation failed',
            details: {
              regular_client: regularError.message,
              service_role: serviceError.message,
              user_id: context.userId,
              project_id: projectId
            }
          },
          { status: 500 }
        )
      }
    }

    // Update project vote counts using admin client
    const adminClient = createAdminClient()
    await updateProjectVoteCounts(context, adminClient)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: voteData,
      meta: {
        method,
        duration_ms: duration,
        user_id: context.userId,
        project_id: projectId,
        vote_type: direction
      }
    })

  } catch (error: any) {
    const duration = Date.now() - startTime
    
    console.error('[Vote] Unexpected error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        duration_ms: duration
      },
      { status: 500 }
    )
  }
}
