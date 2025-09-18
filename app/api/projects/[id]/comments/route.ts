import { NextResponse } from "next/server"
import { addComment, listComments, getProject } from "@/lib/data"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"


export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json(await listComments(id))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json()
  const content = (body.content as string)?.trim()
  const parentId = (body.parentId as string | undefined) || null
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 })
  
  const { id } = await params
  const c = await addComment(id, content, parentId)
  if (!c) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Create notification for project author
  if (c) {
    try {
      const user = await getCurrentUser()
      const project = await getProject(id)
      if (user && project && project.author) {
        const supabase = await createServerSupabaseClient()
        const { error: notificationError } = await supabase.rpc('create_notification', {
          target_user_id: project.author.id,
          notification_type: 'new_comment',
          notification_data: {
            projectId: project.id,
            projectName: project.title,
            commenterName: user.name,
            commentId: c.id
          }
        })
        if (notificationError) {
          console.error('Failed to create notification for new comment:', notificationError)
        }
      }
    } catch (e) {
      console.error('Error creating comment notification:', e)
    }
  }

  return NextResponse.json(c)
}
