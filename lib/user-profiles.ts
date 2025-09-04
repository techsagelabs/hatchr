import { getCurrentUser } from "./auth"
import { createServerSupabaseClient } from "./supabase"

export type UserProfile = {
  id: string
  userId: string
  displayName?: string | null
  bio?: string | null
  website?: string | null
  twitter?: string | null
  github?: string | null
  linkedin?: string | null
  avatarUrl?: string | null
  location?: string | null
  isOnboarded: boolean
  createdAt: string
  updatedAt: string
}

export type UserProfileUpdate = {
  displayName?: string
  bio?: string
  website?: string
  twitter?: string
  github?: string
  linkedin?: string
  avatarUrl?: string
  location?: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profile ? formatProfile(profile) : null
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    return await getUserProfile(user.id)
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error)
    return null
  }
}

export async function createOrUpdateUserProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating user profile:', error)
      return null
    }

    return profile ? formatProfile(profile) : null
  } catch (error) {
    console.error('Error in createOrUpdateUserProfile:', error)
    return null
  }
}

export async function updateUserProfile(updates: UserProfileUpdate): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createServerSupabaseClient()
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Map the updates to database column names
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.website !== undefined) updateData.website = updates.website
    if (updates.twitter !== undefined) updateData.twitter = updates.twitter
    if (updates.github !== undefined) updateData.github = updates.github
    if (updates.linkedin !== undefined) updateData.linkedin = updates.linkedin
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl
    if (updates.location !== undefined) updateData.location = updates.location

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return profile ? formatProfile(profile) : null
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return null
  }
}

export async function markUserOnboarded(userId?: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) return false

    const supabase = await createServerSupabaseClient()
    
    // First, try to update existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .single()

    if (existingProfile) {
      // Profile exists, just update it
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_onboarded: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId)

      if (error) {
        console.error('Error updating onboarding status:', error)
        return false
      }
    } else {
      // Profile doesn't exist, create it with minimal data
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: targetUserId,
          display_name: user?.name || null,
          avatar_url: user?.avatarUrl || null,
          is_onboarded: true,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating profile during onboarding:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in markUserOnboarded:', error)
    return false
  }
}

export async function checkIfUserNeedsOnboarding(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const profile = await getUserProfile(user.id)
    
    // User needs onboarding if:
    // 1. No profile exists, or
    // 2. Profile exists but is_onboarded is false
    return !profile || !profile.isOnboarded
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}

// Helper function to format database row to our UserProfile type
function formatProfile(dbRow: any): UserProfile {
  return {
    id: dbRow.id,
    userId: dbRow.user_id,
    displayName: dbRow.display_name,
    bio: dbRow.bio,
    website: dbRow.website,
    twitter: dbRow.twitter,
    github: dbRow.github,
    linkedin: dbRow.linkedin,
    avatarUrl: dbRow.avatar_url,
    location: dbRow.location,
    isOnboarded: dbRow.is_onboarded,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  }
}
