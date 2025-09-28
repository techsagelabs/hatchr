import { getCurrentUser } from "./auth"
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server'
import { type Database } from "./supabase"
import type { Comment, Project, ProjectWithUserVote, User, VoteDirection } from "./types"

type ProjectRow = Database['public']['Tables']['projects']['Row']
type CommentRow = Database['public']['Tables']['comments']['Row']
type VoteRow = Database['public']['Tables']['votes']['Row']

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

// Helper function to get user's preferred avatar (custom first, Clerk fallback)
async function getUserPreferredAvatar(supabase: any, userId: string, fallbackAvatarUrl?: string): Promise<string | undefined> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single()
    
    // If user has uploaded a custom avatar, use that
    if (!error && profile && profile.avatar_url) {
      return profile.avatar_url
    }
    
    // Log RLS or permission errors for debugging
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (normal)
      console.warn(`Avatar lookup failed for user ${userId}:`, error.code, error.message)
    }
  } catch (error) {
    // Profile doesn't exist or error occurred, use fallback silently
    console.warn(`Avatar lookup exception for user ${userId}:`, error.message)
  }
  
  // Fall back to Clerk avatar or provided fallback
  return fallbackAvatarUrl || undefined
}

// Convert database row to Project type (with avatar preference handling)
async function dbProjectToProject(row: ProjectRow, supabase?: any): Promise<Project> {
  let authorAvatarUrl = row.author_avatar_url || undefined
  
  // If supabase client is provided, check for custom avatar
  if (supabase) {
    authorAvatarUrl = await getUserPreferredAvatar(supabase, row.author_id, row.author_avatar_url)
  }
  
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    thumbnailUrl: row.thumbnail_url,
    mediaUrl: row.media_url || undefined,
    codeEmbedUrl: row.code_embed_url || undefined,
    author: {
      id: row.author_id,
      username: row.author_name,
      avatarUrl: authorAvatarUrl,
    },
    votes: { up: row.upvotes, down: row.downvotes, net: row.net_votes },
    createdAt: row.created_at,
    commentsCount: row.comments_count,
  }
}

// Convert database row to Comment type (with avatar preference handling)
async function dbCommentToComment(row: CommentRow, supabase?: any): Promise<Comment> {
  let authorAvatarUrl = row.author_avatar_url || undefined
  
  // If supabase client is provided, check for custom avatar
  if (supabase) {
    authorAvatarUrl = await getUserPreferredAvatar(supabase, row.author_id, row.author_avatar_url)
  }
  
  return {
    id: row.id,
    projectId: row.project_id,
    author: {
      id: row.author_id,
      username: row.author_name,
      avatarUrl: authorAvatarUrl,
    },
    content: row.content,
    parentId: row.parent_id,
    createdAt: row.created_at,
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get distinct users from projects and find the one whose name matches the username slug
    const { data: projects, error } = await supabase
      .from('projects')
      .select('author_id, author_name, author_avatar_url')
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent projects for performance

    if (error) {
      console.error('Error finding user by username:', error)
      return null
    }

    if (!projects || projects.length === 0) {
      return null
    }

    // Find user whose name slug matches the requested username
    const matchingProject = projects.find(project => {
      const nameSlug = slugifyName(project.author_name)
      return nameSlug === username
    })

    if (!matchingProject) {
      return null
    }
    
    // Get user's preferred avatar (custom first, Clerk fallback)
    const avatarUrl = await getUserPreferredAvatar(supabase, matchingProject.author_id, matchingProject.author_avatar_url)
    
    // Get user profile data (bio, socials, etc.)
    let profileData = null
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('bio, location, website_url, twitter_url, github_url, linkedin_url')
        .eq('user_id', matchingProject.author_id)
        .single()
      
      if (!profileError && profile) {
        profileData = profile
      }
    } catch (error) {
      // Profile doesn't exist, that's fine
    }
    
    return {
      id: matchingProject.author_id,
      name: matchingProject.author_name,
      avatarUrl: avatarUrl,
      bio: profileData?.bio || null,
      location: profileData?.location || null,
      websiteUrl: profileData?.website_url || null,
      twitterUrl: profileData?.twitter_url || null,
      githubUrl: profileData?.github_url || null,
      linkedinUrl: profileData?.linkedin_url || null,
    }
  } catch (error) {
    console.error('Error in getUserByUsername:', error)
    return null
  }
}

export async function getUserStats(userId: string): Promise<{
  totalProjects: number
  totalVotesReceived: number
  totalCommentsReceived: number
  totalConnections: number
  joinedDate?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // ✅ OPTIMIZED: Single query with CTEs to get all stats at once
    const { data, error } = await supabase.rpc('get_user_stats_optimized', {
      target_user_id: userId
    })

    if (error) {
      console.error('Error calling get_user_stats_optimized:', error)
      // Fallback to original queries if RPC fails
      return await getUserStatsLegacy(userId)
    }

    const stats = data?.[0]
    if (!stats) {
      return {
        totalProjects: 0,
        totalVotesReceived: 0,
        totalCommentsReceived: 0,
        totalConnections: 0
      }
    }

    return {
      totalProjects: parseInt(stats.total_projects) || 0,
      totalVotesReceived: parseInt(stats.total_votes_received) || 0,
      totalCommentsReceived: parseInt(stats.total_comments_received) || 0,
      totalConnections: parseInt(stats.total_connections) || 0,
      joinedDate: stats.joined_date || undefined
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    // Fallback to legacy implementation
    return await getUserStatsLegacy(userId)
  }
}

// ✅ OPTIMIZED: Legacy fallback function (same as original)
async function getUserStatsLegacy(userId: string): Promise<{
  totalProjects: number
  totalVotesReceived: number
  totalCommentsReceived: number
  totalConnections: number
  joinedDate?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Execute queries in parallel instead of sequentially  
    const [
      { count: projectCount },
      { data: projects },
      { count: connectionsCount },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact' }).eq('author_id', userId),
      supabase.from('projects').select('id, upvotes, downvotes, created_at').eq('author_id', userId),
      supabase.from('connections').select('*', { count: 'exact' }).eq('status', 'accepted').or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
    ])
    
    // Calculate votes from projects data
    const totalVotesReceived = projects?.reduce((sum, project) => 
      sum + (project.upvotes || 0) + (project.downvotes || 0), 0) || 0
    
    // Get comments count for user's projects (if user has projects)
    let commentCount = 0
    if (projects && projects.length > 0) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .in('project_id', projects.map(p => p.id))
      commentCount = count || 0
    }
    
    // Get oldest project date
    const oldestProject = projects?.length > 0 
      ? projects.reduce((oldest, project) => 
          !oldest || project.created_at < oldest.created_at ? project : oldest
        )
      : null
    
    return {
      totalProjects: projectCount || 0,
      totalVotesReceived,
      totalCommentsReceived: commentCount,
      totalConnections: connectionsCount || 0,
      joinedDate: oldestProject?.created_at || undefined
    }
  } catch (error) {
    console.error('Error in getUserStatsLegacy:', error)
    return {
      totalProjects: 0,
      totalVotesReceived: 0,
      totalCommentsReceived: 0,
      totalConnections: 0
    }
  }
}

export async function listProjects(): Promise<ProjectWithUserVote[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getCurrentUser()
    const userId = user?.id || "anonymous"

    // Get projects with vote information
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        votes!left (
          user_id,
          vote_type
        )
      `)
      .order('net_votes', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return []
    }

    if (!projects) return []

    // Transform the data to include user votes
    const result = await Promise.all(projects.map(async (project): Promise<ProjectWithUserVote> => {
      const userVote = project.votes?.find(v => v.user_id === userId)
      const userVoteDirection: VoteDirection = userVote?.vote_type === 'up' ? 'up' : userVote?.vote_type === 'down' ? 'down' : null

      return {
        ...(await dbProjectToProject(project, supabase)),
        userVote: userVoteDirection,
      }
    }))
    
    return result
  } catch (error) {
    console.error('Error in listProjects:', error)
    // Return empty array if Supabase is not configured or connection fails
    return []
  }
}

export async function getProject(id: string): Promise<ProjectWithUserVote | null> {
  try {
    if (!id || id === 'undefined') {
      console.error('Invalid project ID:', id)
      return null
    }

    const supabase = await createServerSupabaseClient()
    const user = await getCurrentUser()
    const userId = user?.id || "anonymous"

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        votes!left (
          user_id,
          vote_type
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching project:', { id, error: error.message, code: error.code })
      return null
    }

    if (!project) {
      console.error('Project not found:', id)
      return null
    }

    const userVote = project.votes?.find(v => v.user_id === userId)
    const userVoteDirection: VoteDirection = userVote?.vote_type === 'up' ? 'up' : userVote?.vote_type === 'down' ? 'down' : null

    return {
      ...(await dbProjectToProject(project, supabase)),
      userVote: userVoteDirection,
    }
  } catch (error) {
    console.error('Error in getProject:', { id, error })
    return null
  }
}

export async function createProject(input: {
  title: string
  shortDescription: string
  fullDescription: string
  thumbnailUrl: string
  mediaUrl?: string
  codeEmbedUrl?: string
}): Promise<ProjectWithUserVote | null> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error('User not authenticated for project creation')
      return null
    }

    console.log('Creating project for user:', { userId: user.id, userName: user.username })

    const supabase = await createServerSupabaseClient()

    const projectData = {
      title: input.title,
      short_description: input.shortDescription,
      full_description: input.fullDescription,
      thumbnail_url: input.thumbnailUrl,
      media_url: input.mediaUrl || null,
      code_embed_url: input.codeEmbedUrl || null,
      author_id: user.id,
      author_name: user.username,
      author_avatar_url: user.avatarUrl || null,
    }

    console.log('Inserting project data:', projectData)

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        projectData
      })
      return null
    }

    if (!project) {
      console.error('No project returned after creation')
      return null
    }

    console.log('Project created successfully:', project.id)

    return {
      ...(await dbProjectToProject(project, supabase)),
      userVote: null,
    }
  } catch (error) {
    console.error('Error in createProject:', error)
    return null
  }
}

export async function voteProject(id: string, dir: Exclude<VoteDirection, null>): Promise<ProjectWithUserVote | null> {
  const user = await getCurrentUser()
  if (!user) {
    console.log('❌ voteProject - No user authenticated')
    return null
  }

  console.log('🗳️ voteProject - Starting vote operation:', { 
    projectId: id, 
    direction: dir, 
    userId: user.id,
    userName: user.username 
  })

  const supabase = await createServerSupabaseClient()

  // Check for existing vote
  console.log('🔍 voteProject - Checking for existing vote')
  const { data: existingVote, error: selectError } = await supabase
    .from('votes')
    .select('*')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('❌ voteProject - Error checking existing vote:', {
      error: selectError.message,
      code: selectError.code,
      details: selectError.details,
      hint: selectError.hint
    })
  }
  
  console.log('📊 voteProject - Existing vote check result:', { 
    hasExistingVote: !!existingVote,
    existingVoteType: existingVote?.vote_type 
  })

  if (existingVote) {
    if (existingVote.vote_type === dir) {
      // Remove vote if clicking the same direction
      console.log('🗑️ voteProject - Removing existing vote (same direction)')
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)

      if (error) {
        console.error('❌ voteProject - Error removing vote:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          voteId: existingVote.id
        })
        return null
      }
      console.log('✅ voteProject - Vote removed successfully')
    } else {
      // Update vote if clicking different direction
      console.log('🔄 voteProject - Updating vote direction:', { 
        from: existingVote.vote_type, 
        to: dir 
      })
      const { error } = await supabase
        .from('votes')
        .update({ vote_type: dir })
        .eq('id', existingVote.id)

      if (error) {
        console.error('❌ voteProject - Error updating vote:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          voteId: existingVote.id
        })
        return null
      }
      console.log('✅ voteProject - Vote updated successfully')
    }
  } else {
    // Create new vote
    console.log('➕ voteProject - Creating new vote')
    const { error } = await supabase
      .from('votes')
      .insert({
        project_id: id,
        user_id: user.id,
        vote_type: dir,
      })

    if (error) {
      console.error('❌ voteProject - Error creating vote:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertData: { project_id: id, user_id: user.id, vote_type: dir }
      })
      return null
    }
    console.log('✅ voteProject - New vote created successfully')
  }

  // Return updated project
  return await getProject(id)
}

export async function listComments(projectId: string): Promise<Comment[]> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    if (!comments) return []
    
    const result = await Promise.all(comments.map(comment => dbCommentToComment(comment, supabase)))
    return result
  } catch (error) {
    console.error('Error in listComments:', error)
    // Return empty array if Supabase is not configured or connection fails
    return []
  }
}

export async function addComment(projectId: string, content: string, parentId?: string | null): Promise<Comment | null> {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const supabase = await createServerSupabaseClient()

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      project_id: projectId,
      author_id: user.id,
      author_name: user.username,
      author_avatar_url: user.avatarUrl || null,
      content,
      parent_id: parentId || null,
    })
    .select()
    .single()

  if (error || !comment) {
    console.error('Error creating comment:', error)
    return null
  }

  return await dbCommentToComment(comment, supabase)
}

export async function listProjectsByUser(userId: string): Promise<ProjectWithUserVote[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || "anonymous"

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        votes!left (
          user_id,
          vote_type
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user projects:', error)
      return []
    }

    if (!projects) return []

    const result = await Promise.all(projects.map(async (project): Promise<ProjectWithUserVote> => {
      const userVote = project.votes?.find(v => v.user_id === currentUserId)
      const userVoteDirection: VoteDirection = userVote?.vote_type === 'up' ? 'up' : userVote?.vote_type === 'down' ? 'down' : null

      return {
        ...(await dbProjectToProject(project, supabase)),
        userVote: userVoteDirection,
      }
    }))
    
    return result
  } catch (error) {
    console.error('Error in listProjectsByUser:', error)
    // Return empty array if Supabase is not configured or connection fails
    return []
  }
}
