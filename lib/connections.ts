import { getCurrentUser } from "./auth"
import { createServerSupabaseClient } from "./supabase"

export async function getUserConnections(userId: string, viewerUserId?: string): Promise<any[]> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // If no viewer specified, only return count
    if (!viewerUserId) {
      return []
    }

    // If viewer is the user themselves, return all connections
    if (viewerUserId === userId) {
      const { data: connections, error } = await supabase
        .from('connections')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return connections || []
    }

    // Check if viewer is connected to the user
    const { data: connection, error } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${viewerUserId},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${viewerUserId})`)
      .single()

    if (error || !connection) {
      // Not connected, return empty array
      return []
    }

    // Connected, return the user's connections
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (connectionsError) throw connectionsError
    return connections || []
  } catch (error) {
    console.error('Error getting user connections:', error)
    return []
  }
}

export async function areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('connections')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId1},recipient_id.eq.${userId2})`)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}
