"use client"

import { Navbar } from "@/components/navbar"
import { PageTransition } from "@/components/page-transitions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trash2, Users, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import useSWR, { useSWRConfig } from 'swr'
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function ConnectionItem({ connection }: { connection: any }) {
  const { mutate } = useSWRConfig()
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/connections/${connection.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        throw new Error('Failed to remove connection')
      }
      await mutate('/api/connections/my-connections')
      toast({ title: 'Connection removed' })
    } catch (err) {
      toast({ title: 'Failed to remove connection', description: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={connection.otherUser.avatarUrl} />
          <AvatarFallback>{connection.otherUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{connection.otherUser.name}</p>
          <p className="text-sm text-muted-foreground">
            Connected {new Date(connection.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/u/${connection.otherUser.name.toLowerCase().replace(/\s+/g, '-')}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Profile
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRemove}
          disabled={loading}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ConnectionsPage() {
  const { user, loading } = useAuth()
  const { data: connections, isLoading } = useSWR(
    user ? '/api/connections/my-connections' : null, 
    fetcher
  )

  if (loading) {
    return (
      <main>
        <Navbar />
        <PageTransition>
          <section className="mx-auto max-w-3xl px-6 py-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </section>
        </PageTransition>
      </main>
    )
  }

  if (!user) {
    return (
      <main>
        <Navbar />
        <PageTransition>
          <section className="mx-auto max-w-3xl px-6 py-6">
            <p className="text-center text-muted-foreground">Please sign in to view your connections.</p>
          </section>
        </PageTransition>
      </main>
    )
  }

  return (
    <main>
      <Navbar />
      <PageTransition>
        <section className="mx-auto max-w-3xl px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">My Connections</h1>
            <span className="text-sm text-muted-foreground">
              ({connections?.length || 0})
            </span>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="p-6 text-center text-muted-foreground">Loading connections...</p>
              ) : !connections || connections.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect with other users by visiting their profiles and sending connection requests.
                  </p>
                  <Link href="/">
                    <Button>Discover Users</Button>
                  </Link>
                </div>
              ) : (
                connections.map((connection: any) => (
                  <ConnectionItem key={connection.id} connection={connection} />
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </PageTransition>
    </main>
  )
}
