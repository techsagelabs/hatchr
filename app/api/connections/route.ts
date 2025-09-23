import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"

// GET /api/connections?with=<userId>&status=pending|accepted|declined
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const otherId = searchParams.get('with')
    const status = searchParams.get('status')

    const supabase = await createServerSupabaseClient()
    let query = supabase.from('connections').select('*')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

    if (otherId) {
      query = query.or(`and(requester_id.eq.${user.id},recipient_id.eq.${otherId}),and(requester_id.eq.${otherId},recipient_id.eq.${user.id})`)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/connections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/connections  body: { recipientId: string }
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { recipientId } = await req.json()
    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json({ error: 'recipientId is required' }, { status: 400 })
    }
    if (recipientId === user.id) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('connections')
      .upsert({ requester_id: user.id, recipient_id: recipientId, status: 'pending' }, { onConflict: 'requester_id,recipient_id' })
      .select()
      .single()
    if (error) throw error

    // Create a notification for the recipient
    if (data) {
      const { error: notificationError } = await supabase.rpc('create_notification', {
        target_user_id: recipientId,
        notification_type: 'connection_request',
        notification_data: { 
          connectionId: data.id,
          requesterName: user.username 
        }
      })
      if (notificationError) {
        console.error('Failed to create notification for connection request:', notificationError)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('POST /api/connections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


