import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getUserByUsername, listProjectsByUser, getUserStats } from "@/lib/data"
import { ProjectCard } from "@/components/project-card"
import { getCurrentUser } from "@/lib/auth" // use current user for fallback
import { Navbar } from "@/components/navbar"
import { PageTransition, CardTransition } from "@/components/page-transitions"
import { MapPin, Calendar, ExternalLink, Github, Twitter, Linkedin, BarChart3, MessageSquare, ThumbsUp, Users } from "lucide-react"
import { ConnectButton } from "@/components/connect-button"

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const raw = decodeURIComponent(username)

  if (raw === "username") {
    const me = await getCurrentUser()
    if (me) {
      const meSlug = slugifyName(me.name || "user")
      return redirect(`/u/${meSlug}`)
    } else {
      return redirect("/")
    }
  }

  const user = await getUserByUsername(raw)
  
  if (!user) {
    return notFound()
  }

  const projects = await listProjectsByUser(user.id)
  const stats = await getUserStats(user.id)

  const joinedDate = stats.joinedDate ? new Date(stats.joinedDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  }) : null

  return (
    <main>
      <Navbar />
      <PageTransition>
        <section className="mx-auto max-w-4xl px-6 py-6">
          {/* User Info Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Image
                src={user.avatarUrl || "/placeholder.svg?height=96&width=96&query=avatar"}
                alt={`${user.name} avatar`}
                width={96}
                height={96}
                className="rounded-full ring-4 ring-orange-100 dark:ring-orange-900 object-cover"
                priority={true}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{user.name}</h1>
                <div className="mt-2" id="connect-button">
                  {/* Connect button */}
                  <ConnectButton otherUserId={user.id} />
                </div>
                
                {/* Bio */}
                {user.bio && (
                  <p className="text-lg text-muted-foreground mb-3">{user.bio}</p>
                )}
                
                {/* Location and Join Date */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {joinedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {joinedDate}</span>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="flex flex-wrap items-center gap-3">
                  {user.websiteUrl && (
                    <a
                      href={user.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {user.twitterUrl && (
                    <a
                      href={user.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      <span>Twitter</span>
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-4 bg-muted/30 rounded-xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  {stats.totalProjects}
                </div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  {stats.totalVotesReceived}
                </div>
                <div className="text-sm text-muted-foreground">Votes Received</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  {stats.totalCommentsReceived}
                </div>
                <div className="text-sm text-muted-foreground">Comments Received</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
                  <Users className="h-5 w-5 text-purple-600" />
                  {stats.totalConnections}
                </div>
                <div className="text-sm text-muted-foreground">Connections</div>
                <a 
                  href="#connect-button"
                  className="text-xs text-muted-foreground mt-1 hover:text-orange-600 transition-colors cursor-pointer block"
                >
                  → Connect to view details
                </a>
              </div>
            </div>
          </div>

          <section className="mt-6 space-y-6">
            {projects.map((p, index) => (
              <CardTransition key={p.id} index={index}>
                <ProjectCard project={p} />
              </CardTransition>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No projects yet.{" "}
                <Link href="/submit" className="underline">
                  Submit one
                </Link>
                .
              </p>
            )}
          </section>
        </section>
      </PageTransition>
    </main>
  )
}
