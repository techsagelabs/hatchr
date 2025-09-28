import { NextResponse } from "next/server"
import { createProject, listProjects } from "@/lib/data"

export async function GET() {
  return NextResponse.json(await listProjects())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.shortDescription || !body.fullDescription || !body.thumbnailUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const p = await createProject({
      title: body.title,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription,
      thumbnailUrl: body.thumbnailUrl,
      mediaUrl: body.mediaUrl,
      codeEmbedUrl: body.codeEmbedUrl,
    })
    
    if (!p) {
      return NextResponse.json({ error: "Failed to create project. Please ensure you are authenticated." }, { status: 401 })
    }
    
    return NextResponse.json(p)
  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
