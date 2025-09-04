import { NextResponse } from "next/server"
import { createProject, listProjects } from "@/lib/data"

export async function GET() {
  return NextResponse.json(await listProjects())
}

export async function POST(req: Request) {
  const body = await req.json()
  const p = await createProject({
    title: body.title,
    shortDescription: body.shortDescription,
    fullDescription: body.fullDescription,
    thumbnailUrl: body.thumbnailUrl,
    mediaUrl: body.mediaUrl,
    codeEmbedUrl: body.codeEmbedUrl,
  })
  
  if (!p) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return NextResponse.json(p)
}
