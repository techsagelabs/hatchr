import { NextResponse } from "next/server"
import { getProject, voteProject } from "@/lib/data"
import { createServerSupabaseClient } from "@/lib/supabase"
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
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    const p = await voteProject(id, dir)
    if (p === null) {
      return NextResponse.json({ error: "Unauthorized or invalid vote" }, { status: 401 })
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
              voterName: user.name
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
