export type User = {
  id: string
  username: string
  avatarUrl?: string
  bio?: string | null
  location?: string | null
  websiteUrl?: string | null
  twitterUrl?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
}

export type VoteDirection = "up" | "down" | null

export type Project = {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  thumbnailUrl: string
  mediaUrl?: string
  codeEmbedUrl?: string
  author: User
  votes: { up: number; down: number; net: number }
  createdAt: string
  commentsCount: number
}

export type ProjectWithUserVote = Project & {
  userVote: VoteDirection
}

export type Comment = {
  id: string
  projectId: string
  author: User
  content: string
  parentId?: string | null
  createdAt: string
}
