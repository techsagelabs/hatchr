import { auth, clerkClient } from "@clerk/nextjs/server"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  const { userId, sessionClaims } = await auth()

  if (!userId) return null

  // Prefer claims (no extra network), then fall back to Clerk API, but never throw
  let username: string | undefined = (sessionClaims?.username as string) || undefined
  let avatarUrl: string | undefined

  try {
    const user = await clerkClient.users.getUser(userId)
    username = username || user.username || user.firstName || "user"
    avatarUrl = user.imageUrl || undefined
  } catch {
    // If Clerk API call fails, still return minimal identity so server routes don't crash
    username = username || "user"
  }

  const result: User = {
    id: userId,
    username,
    avatarUrl,
  }

  return result
}

export async function requireAuth() {
  const { userId } = await auth()
  return userId || null
}
