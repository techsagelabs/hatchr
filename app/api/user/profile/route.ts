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
    
    // If no profile exists, create one with basic info from Clerk
    if (!profile) {
      const newProfile = await createOrUpdateUserProfile(
        user.id, 
        user.name, 
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
    const updates: UserProfileUpdate = {
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
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
