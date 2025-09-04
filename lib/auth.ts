import { auth, currentUser } from "@clerk/nextjs/server"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }
  
  const user = await currentUser()
  
  if (!user) {
    return null
  }
  
  return {
    id: user.id,
    name: user.fullName || user.firstName || "User",
    avatarUrl: user.imageUrl || undefined,
  }
}

export async function requireAuth() {
  const { userId } = await auth()
  return userId || null
}
