"use client"

import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import useSWR, { useSWRConfig } from 'swr'
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { ConnectButton } from "./connect-button"
import { timeAgo } from "@/lib/utils"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  
  // If API returns error, throw to trigger SWR error state
  if (!res.ok || data.error) {
    throw new Error(data.error || `API Error: ${res.status}`)
  }
  
  // Ensure we always return an array
  return Array.isArray(data) ? data : []
}

// A simplified ConnectButton just for notifications
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

function NotificationItem({ notification, onRead }: { notification: any, onRead: (id: string) => void }) {
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
        <Link href={linkUrl} onClick={() => onRead(notification.id)}>
            <div className={`p-3 hover:bg-muted/50 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={notification.actor?.avatarUrl} />
                        <AvatarFallback>{actorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-sm">
                            <span className="font-semibold">{actorName}</span> {message}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(notification.created_at)}</p>
                        {notification.type === 'connection_request' && notification.data?.connectionId && (
                           <NotificationConnectActions notificationId={notification.data.connectionId} otherUserId={notification.actor_id} />
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}


export function NotificationsBell() {
    const { isSignedIn } = useUser()
    const { data: notifications, error, mutate } = useSWR(isSignedIn ? '/api/notifications' : null, fetcher)
    const [isOpen, setIsOpen] = useState(false)

    if (!isSignedIn) return null

    // Handle loading and error states gracefully
    const safeNotifications = notifications || []
    const unreadCount = safeNotifications.filter((n: any) => !n.is_read).length ?? 0
    
    // If there's an error, show the bell but don't show error to user (graceful degradation)
    if (error) {
        console.error('Notifications API error:', error)
    }

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open)
        if (!open && unreadCount > 0 && !error) {
            // Mark all visible unread notifications as read when closing
            try {
                const unreadIds = safeNotifications.filter((n: any) => !n.is_read).map((n: any) => n.id)
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: unreadIds })
                })
                mutate() // Re-fetch to update UI
            } catch (err) {
                console.error('Failed to mark notifications as read:', err)
            }
        }
    }
    
    const handleNotificationClick = async (id: string) => {
        if (error) return // Don't try to mark as read if there's an API error
        
        try {
            const notification = safeNotifications.find((n: any) => n.id === id)
            if (notification && !notification.is_read) {
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [id] })
                })
                mutate()
            }
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-3">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                </div>
                <Separator />
                <div className="max-h-96 overflow-y-auto">
                    {error ? (
                        <p className="p-4 text-sm text-muted-foreground">Unable to load notifications.</p>
                    ) : safeNotifications.length > 0 ? (
                        safeNotifications.slice(0, 4).map((n: any) => (
                            <NotificationItem key={n.id} notification={n} onRead={handleNotificationClick} />
                        ))
                    ) : (
                        <p className="p-4 text-sm text-muted-foreground">No new notifications.</p>
                    )}
                </div>
                {!error && safeNotifications.length > 4 && (
                    <div className="p-2 border-t text-center">
                        <Link href="/notifications">
                            <Button variant="ghost" className="w-full">Show more</Button>
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
