import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { message: 'Username must be 3-30 characters long' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { message: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if username exists (case-insensitive)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means "no rows found" which is good (username available)
      console.error('Error checking username:', error)
      return NextResponse.json(
        { message: 'Failed to check username availability' },
        { status: 500 }
      )
    }

    // If data exists, username is taken
    const available = !data

    return NextResponse.json({ available })

  } catch (error) {
    console.error('Error in check-username API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
