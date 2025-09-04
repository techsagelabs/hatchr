import { NextResponse } from "next/server"
import { voteProject } from "@/lib/data"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const dir = body.direction as "up" | "down"
  if (!dir || !["up", "down"].includes(dir)) {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 })
  }
  
  const p = await voteProject(id, dir)
  if (p === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!p) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  
  return NextResponse.json(p)
}
