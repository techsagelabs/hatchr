import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { markUserOnboarded } from "@/lib/user-profiles"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await markUserOnboarded(user.id)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to complete onboarding. Check Supabase RLS/JWT configuration." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/user/onboard:', error)
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
