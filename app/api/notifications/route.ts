import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getUserProfile } from "@/lib/user-profiles"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Enhance notifications with actor details
    const enhancedNotifications = await Promise.all(
      notifications.map(async (n) => {
        if (!n.actor_id) return n
        const actorProfile = await getUserProfile(n.actor_id)
        return {
          ...n,
          actor: actorProfile ? {
            name: actorProfile.displayName,
            avatarUrl: actorProfile.avatarUrl
          } : {
            name: "Someone",
            avatarUrl: null
          }
        }
      })
    )

    return NextResponse.json(enhancedNotifications)
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: "Notification IDs array is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids)
    
    if (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notifications error (mark read):', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
