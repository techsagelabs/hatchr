import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server"
import { getUserProfile } from "@/lib/user-profiles"

// GET /api/connections/my-connections - Get user's accepted connections
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createServerSupabaseClient()
    const { data: connections, error } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Enhance connections with user profile data
    const enhancedConnections = await Promise.all(
      connections.map(async (connection) => {
        // Determine who the "other" user is
        const otherUserId = connection.requester_id === user.id 
          ? connection.recipient_id 
          : connection.requester_id
        
        const otherUserProfile = await getUserProfile(otherUserId)
        
        return {
          ...connection,
          otherUser: otherUserProfile ? {
            id: otherUserId,
            name: otherUserProfile.displayName,
            avatarUrl: otherUserProfile.avatarUrl
          } : {
            id: otherUserId,
            name: "Unknown User",
            avatarUrl: null
          }
        }
      })
    )

    return NextResponse.json(enhancedConnections)
  } catch (error) {
    console.error('GET /api/connections/my-connections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
