import { NextResponse } from "next/server"
import { createProject, listProjects } from "@/lib/data"

export async function GET() {
  return NextResponse.json(await listProjects())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.shortDescription || !body.fullDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Validate images if provided (or fallback to thumbnailUrl)
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      if (!body.thumbnailUrl) {
        return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
      }
    }
    
    const p = await createProject({
      title: body.title,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription,
      thumbnailUrl: body.thumbnailUrl,
      images: body.images, // New multi-image support
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
