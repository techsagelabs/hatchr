import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"

// PUT /api/connections/:id  body: { status: 'accepted' | 'declined' }
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { status } = await req.json()
    if (!['accepted','declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    // RLS ensures only recipient can update status
    const { data, error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    // If request was accepted, notify the original requester
    if (status === 'accepted' && data) {
      const { error: notificationError } = await supabase.rpc('create_notification', {
        target_user_id: data.requester_id,
        notification_type: 'connection_accepted',
        notification_data: {
          connectionId: data.id,
          recipientName: user.username
        }
      })
      if (notificationError) {
        console.error('Failed to create notification for connection acceptance:', notificationError)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT /api/connections/:id error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/connections/:id  requester can cancel pending
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/connections/:id error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


