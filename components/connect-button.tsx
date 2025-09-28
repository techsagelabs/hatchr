"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, UserPlus, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

type Status = 'none' | 'pending_out' | 'pending_in' | 'connected'

export function ConnectButton({ otherUserId }: { otherUserId: string }) {
  const { user, loading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('none')
  const [requestId, setRequestId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/connections?with=${encodeURIComponent(otherUserId)}`)
        if (!res.ok) return
        const rows = await res.json()
        if (cancelled) return
        if (!Array.isArray(rows) || rows.length === 0) {
          setStatus('none'); setRequestId(null); return
        }
        const row = rows[0]
        setRequestId(row.id)
        if (row.status === 'accepted') setStatus('connected')
        else if (row.status === 'pending') {
          // Determine direction
          const meIsRequester = row.requester_id && typeof row.requester_id === 'string' && row.requester_id !== otherUserId
          setStatus(meIsRequester ? 'pending_out' : 'pending_in')
        } else setStatus('none')
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [otherUserId])

  const sendRequest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: otherUserId }) })
      if (res.ok) {
        const row = await res.json()
        setRequestId(row.id)
        setStatus('pending_out')
      }
    } finally { setLoading(false) }
  }

  const accept = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/connections/${requestId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' }) })
      if (res.ok) setStatus('connected')
    } finally { setLoading(false) }
  }

  const decline = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/connections/${requestId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'declined' }) })
      if (res.ok) setStatus('none')
    } finally { setLoading(false) }
  }

  if (loading) {
    return <div className="h-10 w-24 bg-muted rounded animate-pulse" />
  }
  if (!user) {
    return (
      <Link href="/sign-in">
        <Button variant="outline"><UserPlus className="mr-2 h-4 w-4"/>Connect</Button>
      </Link>
    )
  }

  if (status === 'connected') {
    return <Button disabled><Check className="mr-2 h-4 w-4"/>Connected</Button>
  }
  if (status === 'pending_out') {
    return <Button disabled><UserPlus className="mr-2 h-4 w-4"/>Request sent</Button>
  }
  if (status === 'pending_in') {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={accept} disabled={loading} className="bg-green-600 hover:bg-green-700"><Check className="mr-2 h-4 w-4"/>Accept</Button>
        <Button onClick={decline} disabled={loading} variant="outline"><X className="mr-2 h-4 w-4"/>Decline</Button>
      </div>
    )
  }
  return <Button onClick={sendRequest} disabled={loading}><UserPlus className="mr-2 h-4 w-4"/>Connect</Button>
}


