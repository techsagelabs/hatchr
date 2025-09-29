import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { 
  getCurrentUserProfile, 
  updateUserProfile, 
  createOrUpdateUserProfile,
  type UserProfileUpdate 
} from "@/lib/user-profiles"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getCurrentUserProfile()
    
    // If no profile exists, create one with basic info from Supabase Auth
    if (!profile) {
      const newProfile = await createOrUpdateUserProfile(
        user.id, 
        user.username, 
        user.avatarUrl
      )
      return NextResponse.json(newProfile)
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error in GET /api/user/profile:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    
    // Username validation
    if (body.username !== undefined) {
      if (typeof body.username !== 'string') {
        return NextResponse.json({ error: "username must be a string" }, { status: 400 })
      }
      if (body.username.length < 3 || body.username.length > 30) {
        return NextResponse.json({ error: "username must be 3-30 characters long" }, { status: 400 })
      }
      if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
        return NextResponse.json({ error: "username can only contain letters, numbers, and underscores" }, { status: 400 })
      }
    }
    
    if (body.displayName !== undefined && typeof body.displayName !== 'string') {
      return NextResponse.json({ error: "displayName must be a string" }, { status: 400 })
    }
    if (body.bio !== undefined && typeof body.bio !== 'string') {
      return NextResponse.json({ error: "bio must be a string" }, { status: 400 })
    }
    if (body.website !== undefined && typeof body.website !== 'string') {
      return NextResponse.json({ error: "website must be a string" }, { status: 400 })
    }
    if (body.twitter !== undefined && typeof body.twitter !== 'string') {
      return NextResponse.json({ error: "twitter must be a string" }, { status: 400 })
    }
    if (body.github !== undefined && typeof body.github !== 'string') {
      return NextResponse.json({ error: "github must be a string" }, { status: 400 })
    }
    if (body.linkedin !== undefined && typeof body.linkedin !== 'string') {
      return NextResponse.json({ error: "linkedin must be a string" }, { status: 400 })
    }
    if (body.avatarUrl !== undefined && typeof body.avatarUrl !== 'string') {
      return NextResponse.json({ error: "avatarUrl must be a string" }, { status: 400 })
    }
    if (body.location !== undefined && typeof body.location !== 'string') {
      return NextResponse.json({ error: "location must be a string" }, { status: 400 })
    }
    const updates: UserProfileUpdate = {
      username: body.username,
      displayName: body.displayName,
      bio: body.bio,
      website: body.website,
      twitter: body.twitter,
      github: body.github,
      linkedin: body.linkedin,
      avatarUrl: body.avatarUrl,
      location: body.location,
    }

    // Ensure user profile exists first
    let profile = await getCurrentUserProfile()
    if (!profile) {
      profile = await createOrUpdateUserProfile(user.id, user.name, user.avatarUrl)
    }

    // Update the profile
    const updatedProfile = await updateUserProfile(updates)
    
    if (!updatedProfile) {
      return NextResponse.json({ error: "Failed to update profile. Check Supabase RLS/JWT configuration." }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error: any) {
    console.error('Error in PUT /api/user/profile:', error)
    
    // Handle specific database constraint errors
    if (error.message?.includes('Username is already taken')) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
    }
    
    if (error.message?.includes('Failed to validate username')) {
      return NextResponse.json({ error: "Failed to validate username availability" }, { status: 500 })
    }
    
    // Handle database column errors (if username column doesn't exist yet)
    if (error.message?.includes('column "username" does not exist')) {
      return NextResponse.json({ 
        error: "Database migration required. Please run the username migration script.",
        details: "The username field has not been added to the database yet."
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: error.details || undefined
    }, { status: 500 })
  }
}
