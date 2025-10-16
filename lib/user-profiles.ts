import { getCurrentUser } from "./auth"
import { createServerSupabaseClient } from "./supabase"

export type UserProfile = {
  id: string
  userId: string
  username: string // Unique username for the user
  displayName?: string | null // Full name or display name
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
  username?: string // Allow username updates with uniqueness validation
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
      // Treat "no rows" as a non-error (profile not yet created)
      const err: any = error
      const isNoRows = err?.code === 'PGRST116' || (err?.details && String(err.details).toLowerCase().includes('results contain 0'))
      if (isNoRows) {
        return null
      }
      console.error('Error fetching user profile:', err?.message || err)
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

    const existing = await getUserProfile(user.id)
    if (existing) return existing

    // Attempt to create a minimal profile on first access (best-effort)
    const created = await createOrUpdateUserProfile(user.id, user.name, user.avatarUrl)
    return created
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
      }, { onConflict: 'user_id' })
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
    if (!user) {
      console.error('❌ updateUserProfile: No user found')
      return null
    }

    console.log('🔄 Updating profile for user:', user.id)
    console.log('📝 Update data:', JSON.stringify(updates, null, 2))

    const supabase = await createServerSupabaseClient()
    
    // Check if username column exists in the database
    let hasUsernameColumn = true
    try {
      console.log('🔍 Checking if username column exists...')
      // Try to check if username column exists by querying table info
      const { error: columnError } = await supabase
        .from('user_profiles')
        .select('username')
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to avoid "multiple rows" error
        
      if (columnError && (
        columnError.message?.includes('column "username" does not exist') ||
        columnError.code === '42703'
      )) {
        hasUsernameColumn = false
        console.warn('⚠️ Username column does not exist yet, skipping username update')
      } else if (columnError) {
        console.log('ℹ️ Column check error (non-critical):', columnError)
      } else {
        console.log('✅ Username column exists')
      }
    } catch (e) {
      console.warn('⚠️ Could not check username column existence, assuming it exists:', e)
    }
    
    // If username is being updated and column exists, check for uniqueness first
    if (updates.username !== undefined && hasUsernameColumn) {
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('user_id', user.id) // Exclude current user
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking username uniqueness:', checkError)
        throw new Error('Failed to validate username')
      }

      if (existingUser) {
        throw new Error('Username is already taken')
      }
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Map the updates to database column names
    if (updates.username !== undefined && hasUsernameColumn) {
      updateData.username = updates.username
    }
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.website !== undefined) updateData.website = updates.website
    if (updates.twitter !== undefined) updateData.twitter = updates.twitter
    if (updates.github !== undefined) updateData.github = updates.github
    if (updates.linkedin !== undefined) updateData.linkedin = updates.linkedin
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl
    if (updates.location !== undefined) updateData.location = updates.location

    console.log('💾 Attempting to update database with:', updateData)

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating user profile:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // If it's a column error, provide a helpful message
      if (error.message?.includes('column "username" does not exist') || error.code === '42703') {
        console.error('⚠️ Username column does not exist - migration required')
        throw new Error('Database migration required. Please run the username migration script.')
      }
      
      // Throw the error with full details for better debugging
      throw new Error(`Database update failed: ${error.message} (code: ${error.code})`)
    }

    if (!profile) {
      console.error('❌ No profile returned after update')
      return null
    }

    console.log('✅ Profile updated successfully:', profile.id)
    return formatProfile(profile)
  } catch (error) {
    console.error('❌ Error in updateUserProfile:', error)
    throw error // Re-throw to be caught by API route
  }
}

export async function markUserOnboarded(userId?: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) return false

    const supabase = await createServerSupabaseClient()
    
    // Idempotent upsert keyed by user_id
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: targetUserId,
        display_name: user?.name || null,
        avatar_url: user?.avatarUrl || null,
        is_onboarded: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error upserting onboarding status:', error)
      return false
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
    username: dbRow.username || dbRow.display_name || 'user', // Fallback to display_name for existing users
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
