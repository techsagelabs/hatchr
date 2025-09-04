import { NextResponse } from "next/server"
import { addComment, listComments } from "@/lib/data"

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
  
  return NextResponse.json(c)
}
