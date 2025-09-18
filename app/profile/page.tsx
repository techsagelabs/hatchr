import { Navbar } from "@/components/navbar"
import Image from "next/image"
import { getCurrentUser } from "@/lib/auth"
import { getCurrentUserProfile } from "@/lib/user-profiles"
import { listProjectsByUser, getUserStats } from "@/lib/data"
import { ProjectCard } from "@/components/project-card"
import { SignInButton, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Plus, Edit, Globe, Github, Twitter, Linkedin, MapPin, BarChart3, ThumbsUp, MessageSquare, Users } from "lucide-react"
import { ManageAccountButton } from "@/components/manage-account-button"
import { ProfileEditButton } from "@/components/profile-edit-button"
import { PageTransition, CardTransition } from "@/components/page-transitions"
import Link from "next/link"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  const profile = await getCurrentUserProfile()
  
  if (!user) {
    return (
      <main>
        <Navbar />
        <section className="mx-auto max-w-5xl px-4 py-6">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold mb-4">Sign in required</h1>
            <p className="text-muted-foreground mb-6">
              You need to sign in to view your profile and projects.
            </p>
            <SignInButton mode="modal">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Sign in to continue
              </Button>
            </SignInButton>
          </div>
        </section>
      </main>
    )
  }

  const projects = await listProjectsByUser(user.id)
  const stats = await getUserStats(user.id)

  return (
    <main>
      <Navbar />
      <PageTransition>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <Image
                        src={(profile?.avatarUrl || user.avatarUrl) || "/placeholder.svg?height=120&width=120&query=avatar"}
                        alt={`${profile?.displayName || user.name} avatar`}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-full object-cover"
                        priority={true}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      />
                      <ProfileEditButton profile={profile} className="absolute -bottom-2 -right-2" />
                    </div>
                    
                    <h1 className="text-xl font-semibold mb-2">
                      {profile?.displayName || user.name}
                    </h1>
                    
                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground mb-3 max-w-xs">
                        {profile.bio}
                      </p>
                    )}
                    
                    {profile?.location && (
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </div>
                    )}

                    {/* Social Links */}
                    {(profile?.website || profile?.github || profile?.twitter || profile?.linkedin) && (
                      <div className="flex items-center gap-3 mb-4">
                        {profile.website && (
                          <a 
                            href={profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-orange-600 transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {profile.github && (
                          <a 
                            href={`https://github.com/${profile.github}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-orange-600 transition-colors"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        {profile.twitter && (
                          <a 
                            href={`https://twitter.com/${profile.twitter.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-orange-600 transition-colors"
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {profile.linkedin && (
                          <a 
                            href={`https://linkedin.com/in/${profile.linkedin}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-orange-600 transition-colors"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6 w-full">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-lg font-bold mb-1">
                          <BarChart3 className="h-4 w-4 text-orange-600" />
                          {stats.totalProjects}
                        </div>
                        <div className="text-xs text-muted-foreground">Projects</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-lg font-bold mb-1">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          {stats.totalVotesReceived}
                        </div>
                        <div className="text-xs text-muted-foreground">Votes</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-lg font-bold mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          {stats.totalCommentsReceived}
                        </div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                      <Link href="/connections" className="block">
                        <div className="text-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-center gap-1 text-lg font-bold mb-1">
                            <Users className="h-4 w-4 text-purple-600" />
                            {stats.totalConnections}
                          </div>
                          <div className="text-xs text-muted-foreground">Connections</div>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="w-full space-y-3">
                      <SignOutButton>
                        <Button variant="outline" className="w-full justify-start" size="sm">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </SignOutButton>
                      
                      <ManageAccountButton />
                      
                      <Link href="/submit" className="block">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Submit Project
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* Projects Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Projects</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Share your first project with the community and get feedback from other makers.
                    </p>
                    <Link href="/submit">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Submit Your First Project
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((p, index) => (
                      <CardTransition key={p.id} index={index}>
                        <ProjectCard project={p} />
                      </CardTransition>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </PageTransition>
    </main>
  )
}
