"use client"

import { useRealtime } from '@/lib/realtime-provider'
import { Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function RealtimeStatus() {
  const { isConnected, connectionStatus } = useRealtime()

  if (connectionStatus === 'disconnected') {
    return null // Don't show anything when not trying to connect
  }

  return (
    <Badge 
      variant={isConnected ? "default" : "secondary"} 
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1 text-xs"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
        </>
      )}
    </Badge>
  )
}
