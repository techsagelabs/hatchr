"use client"

import { Navbar } from "@/components/navbar"
import { PageTransition } from "@/components/page-transitions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { timeAgo } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import useSWR, { useSWRConfig } from 'swr'
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Connection actions for the full notifications page
function NotificationConnectActions({ notificationId, otherUserId }: { notificationId: string, otherUserId: string }) {
    const { mutate } = useSWRConfig()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<null | 'accepted' | 'declined'>(null)

    const handle = async (status: 'accepted' | 'declined', e: React.MouseEvent) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)
        try {
            const res = await fetch(`/api/connections/${notificationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (!res.ok) {
                const text = await res.text()
                toast({ title: 'Action failed', description: text || 'Unable to update request' })
                return
            }
            await mutate('/api/notifications')
            setResult(status)
            toast({ title: status === 'accepted' ? 'Connection accepted' : 'Request declined' })
        } catch (err) {
            toast({ title: 'Network error', description: 'Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    if (result === 'accepted') {
        return <span className="mt-2 inline-block text-sm font-medium text-green-600">Accepted</span>
    }
    if (result === 'declined') {
        return <span className="mt-2 inline-block text-sm text-muted-foreground">Declined</span>
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <Button size="sm" onClick={(e) => handle('accepted', e)} disabled={loading} className="bg-green-600 hover:bg-green-700">Accept</Button>
            <Button size="sm" onClick={(e) => handle('declined', e)} disabled={loading} variant="outline">Decline</Button>
        </div>
    )
}

function NotificationItem({ notification }: { notification: any }) {
    const actorName = notification.actor?.name || 'Someone'
    const linkUrl = notification.type === 'new_comment' || notification.type === 'new_vote'
        ? `/projects/${notification.data?.projectId}`
        : `/u/${notification.actor?.name}` // Fallback for connection notifications

    let message = ''
    switch (notification.type) {
        case 'connection_request':
            message = `wants to connect with you.`
            break
        case 'connection_accepted':
            message = `accepted your connection request.`
            break
        case 'new_vote':
            message = `upvoted your project: "${notification.data?.projectName}"`
            break
        case 'new_comment':
            message = `commented on your project: "${notification.data?.projectName}"`
            break
        default:
            return null
    }

    return (
        <div className={`p-4 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
            <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={notification.actor?.avatarUrl} />
                    <AvatarFallback>{actorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm">
                                <Link href={linkUrl} className="font-semibold hover:underline">{actorName}</Link> {message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{timeAgo(notification.created_at)}</p>
                        </div>
                        {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                        )}
                    </div>
                    {notification.type === 'connection_request' && notification.data?.connectionId && (
                       <NotificationConnectActions notificationId={notification.data.connectionId} otherUserId={notification.actor_id} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function NotificationsPage() {
    const { isSignedIn } = useUser()
    const { data: notifications } = useSWR(isSignedIn ? '/api/notifications' : null, fetcher)

    if (!isSignedIn) {
        return (
            <main>
                <Navbar />
                <PageTransition>
                    <section className="mx-auto max-w-3xl px-6 py-6">
                        <p className="text-center text-muted-foreground">Please sign in to view notifications.</p>
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
                    <h1 className="text-2xl font-bold mb-6">Notifications</h1>
                    <div className="bg-card border rounded-xl divide-y">
                        {!notifications ? (
                            <p className="p-6 text-center text-muted-foreground">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="p-6 text-center text-muted-foreground">No notifications yet.</p>
                        ) : (
                            notifications.map((notification: any) => (
                                <NotificationItem key={notification.id} notification={notification} />
                            ))
                        )}
                    </div>
                </section>
            </PageTransition>
        </main>
    )
}


