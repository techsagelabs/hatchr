import { NextResponse } from "next/server"
import { getProject } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProject(id)
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(p)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // First, check if the project exists and if the user owns it
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own projects" }, { status: 403 })
    }

    // Delete the project (comments and votes will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, shortDescription, fullDescription, thumbnailUrl, mediaUrl, codeEmbedUrl } = body

    if (!title || !shortDescription || !fullDescription || !thumbnailUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Update the project
    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update({
        title,
        short_description: shortDescription,
        full_description: fullDescription,
        thumbnail_url: thumbnailUrl,
        media_url: mediaUrl || null,
        code_embed_url: codeEmbedUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id) // Ensure user can only update their own projects
      .select()
      .single()

    if (updateError || !project) {
      console.error('Error updating project:', updateError)
      if (updateError?.code === 'PGRST116') {
        return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
    }

    // Convert to our app's format
    const updatedProject = {
      id: project.id,
      title: project.title,
      shortDescription: project.short_description,
      fullDescription: project.full_description,
      thumbnailUrl: project.thumbnail_url,
      mediaUrl: project.media_url || undefined,
      codeEmbedUrl: project.code_embed_url || undefined,
      author: {
        id: project.author_id,
        name: project.author_name,
        avatarUrl: project.author_avatar_url || undefined,
      },
      votes: { up: project.upvotes, down: project.downvotes },
      createdAt: project.created_at,
      commentsCount: project.comments_count,
      userVote: null, // We'll let the client handle this
    }

    return NextResponse.json(updatedProject)
    
  } catch (error) {
    console.error('Error in PUT /api/projects/[id]:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}