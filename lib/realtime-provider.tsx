"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/utils/supabase/client'
import { useSWRConfig } from 'swr'
import { toast } from '@/hooks/use-toast'

interface RealtimeContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  connectionStatus: 'disconnected'
})

export function useRealtime() {
  return useContext(RealtimeContext)
}

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { isSignedIn, user } = useUser()
  const { mutate } = useSWRConfig()
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    if (!isSignedIn) return

    console.log('🔄 Setting up real-time subscriptions...')
    setConnectionStatus('connecting')

    // 1. VOTES REAL-TIME - Fix voting sync issues
    const votesChannel = supabase
      .channel('public:votes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes'
      }, (payload) => {
        console.log('🗳️ Vote update:', payload)
        
        // Refresh projects list and individual project data
        mutate('/api/projects')
        if (payload.new?.project_id) {
          mutate(`/api/projects/${payload.new.project_id}`)
        }
        if (payload.old?.project_id) {
          mutate(`/api/projects/${payload.old.project_id}`)
        }
      })
      .subscribe((status) => {
        console.log('Votes subscription status:', status)
      })

    // 2. COMMENTS REAL-TIME - Fix comment sync issues  
    const commentsChannel = supabase
      .channel('public:comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, (payload) => {
        console.log('💬 Comment update:', payload)
        
        // Refresh comments for the specific project
        if (payload.new?.project_id) {
          mutate(`/api/projects/${payload.new.project_id}/comments`)
          mutate(`/api/projects/${payload.new.project_id}`) // Also refresh project for comment count
        }
        if (payload.old?.project_id) {
          mutate(`/api/projects/${payload.old.project_id}/comments`)
          mutate(`/api/projects/${payload.old.project_id}`)
        }

        // Show toast for new comments on user's projects
        if (payload.eventType === 'INSERT' && payload.new) {
          // Only show if it's not the current user's comment
          if (payload.new.author_id !== user?.id) {
            toast({
              title: "New comment",
              description: `${payload.new.author_name} commented on a project`
            })
          }
        }
      })
      .subscribe((status) => {
        console.log('Comments subscription status:', status)
      })

    // 3. NOTIFICATIONS REAL-TIME - Fix notification sync issues
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('🔔 Notification update:', payload)
        
        // Refresh notifications
        mutate('/api/notifications')
        
        // Show toast for new notifications
        if (payload.eventType === 'INSERT' && payload.new) {
          const notification = payload.new
          let message = ''
          
          switch (notification.type) {
            case 'connection_request':
              message = `${notification.actor?.name || 'Someone'} wants to connect with you`
              break
            case 'connection_accepted':
              message = `${notification.actor?.name || 'Someone'} accepted your connection request`
              break
            case 'new_vote':
              message = `${notification.actor?.name || 'Someone'} voted on your project`
              break
            case 'new_comment':
              message = `${notification.actor?.name || 'Someone'} commented on your project`
              break
            default:
              message = 'New notification'
          }
          
          toast({
            title: "New notification",
            description: message
          })
        }
      })
      .subscribe((status) => {
        console.log('Notifications subscription status:', status)
      })

    // 4. CONNECTIONS REAL-TIME - Fix connection sync issues
    const connectionsChannel = supabase
      .channel('public:connections')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'connections'
      }, (payload) => {
        console.log('🤝 Connection update:', payload)
        
        // Refresh connections and related data
        mutate('/api/connections')
        mutate('/api/connections/my-connections')
        
        // Refresh user profiles that might show connection status
        if (payload.new?.requester_id) {
          mutate(`/api/user/profile?id=${payload.new.requester_id}`)
        }
        if (payload.new?.recipient_id) {
          mutate(`/api/user/profile?id=${payload.new.recipient_id}`)
        }
        if (payload.old?.requester_id) {
          mutate(`/api/user/profile?id=${payload.old.requester_id}`)
        }
        if (payload.old?.recipient_id) {
          mutate(`/api/user/profile?id=${payload.old.recipient_id}`)
        }
      })
      .subscribe((status) => {
        console.log('Connections subscription status:', status)
      })

    // 5. PROJECTS REAL-TIME - For new project submissions
    const projectsChannel = supabase
      .channel('public:projects')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'projects'
      }, (payload) => {
        console.log('📝 New project:', payload)
        
        // Refresh projects list
        mutate('/api/projects')
        
        // Show toast for new projects (optional)
        if (payload.new && payload.new.author_id !== user?.id) {
          toast({
            title: "New project",
            description: `${payload.new.author_name} shared a new project: ${payload.new.title}`
          })
        }
      })
      .subscribe((status) => {
        console.log('Projects subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
        }
      })

    // Monitor overall connection status
    supabase.realtime.onOpen(() => {
      console.log('✅ Supabase realtime connected')
      setConnectionStatus('connected')
    })

    supabase.realtime.onClose(() => {
      console.log('❌ Supabase realtime disconnected')
      setConnectionStatus('disconnected')
    })

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions')
      votesChannel.unsubscribe()
      commentsChannel.unsubscribe()
      notificationsChannel.unsubscribe()
      connectionsChannel.unsubscribe()
      projectsChannel.unsubscribe()
    }
  }, [isSignedIn, user?.id, mutate])

  return (
    <RealtimeContext.Provider value={{
      isConnected: connectionStatus === 'connected',
      connectionStatus
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}
