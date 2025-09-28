import { NextResponse } from "next/server"
import { getProject, voteProject } from "@/lib/data"
import { createClient as createServerSupabaseClient, createClientForApiRoute } from "@/utils/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const dir = body.direction as "up" | "down"
    if (!dir || !["up", "down"].includes(dir)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 })
    }

    // Check authentication first
    const user = await getCurrentUser()
    console.log('🔍 Vote API - User check:', { 
      hasUser: !!user, 
      userId: user?.id,
      userName: user?.username 
    })
    
    if (!user) {
      console.log('❌ Vote API - No user found, returning 401')
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.log('🗳️ Vote API - Attempting vote:', { projectId: id, direction: dir, userId: user.id })
    
    // 🚀 PRODUCTION FIX: Create authenticated Supabase client with JWT token
    const authenticatedSupabase = createClientForApiRoute(req)
    
    let p;
    try {
      p = await voteProject(id, dir, authenticatedSupabase)
    } catch (voteError: any) {
      console.error('❌ Vote API - voteProject threw an error:', {
        error: voteError.message,
        code: voteError.code,
        details: voteError.details,
        hint: voteError.hint,
        stack: voteError.stack
      })
      return NextResponse.json({ 
        error: "Vote operation failed with exception",
        details: voteError.message || "Unknown error in voteProject function",
        code: voteError.code,
        production_debug: {
          user_id: user.id,
          project_id: id,
          direction: dir,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }
    
    if (p === null) {
      console.log('❌ Vote API - voteProject returned null (RLS or database error)')
      return NextResponse.json({ 
        error: "Vote failed - voteProject returned null",
        details: "This is usually caused by Row Level Security policies blocking the vote operation",
        production_debug: {
          user_id: user.id,
          project_id: id,
          direction: dir,
          timestamp: new Date().toISOString(),
          auth_check: {
            has_user: !!user,
            user_id: user?.id,
            user_email: user?.email
          }
        }
      }, { status: 500 })
    }
    if (!p) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // If vote was successful and was an upvote, create notification
    if (p && dir === 'up') {
      try {
        const project = await getProject(id) // Re-fetch project to get author
        if (user && project && project.author && user.id !== project.author.id) {
          const supabase = await createServerSupabaseClient()
          const { error: notificationError } = await supabase.rpc('create_notification', {
            target_user_id: project.author.id,
            notification_type: 'new_vote',
            notification_data: {
              projectId: p.id,
              projectName: p.title,
              voterName: user.username
            }
          })
          if (notificationError) {
            console.error('Failed to create notification for new vote:', notificationError)
          }
        }
      } catch (e) {
        console.error('Error creating vote notification:', e)
      }
    }
    
    return NextResponse.json(p)
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
