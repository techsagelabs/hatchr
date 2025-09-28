"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import dynamic from "next/dynamic"
import { RealtimeStatus } from "./realtime-status"
import { useAuth } from "@/lib/auth-context"

// ✅ OPTIMIZED: Lazy load notifications component (heavy with SWR, modals)
const NotificationsBell = dynamic(() => import("./notifications-bell").then(mod => ({ default: mod.NotificationsBell })), {
  ssr: false,
  loading: () => <div className="w-10 h-10" />, // Placeholder to prevent layout shift
})

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const initialQ = sp.get("q") ?? ""
  const [q, setQ] = useState(initialQ)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    setQ(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(sp.toString())
    if (q) params.set("q", q)
    else params.delete("q")
    router.push(`/?${params.toString()}`)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_minmax(280px,640px)_1fr] items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-orange-600 text-white font-semibold">H</div>
          <span className="font-semibold" key={`hatchr-brand-${Date.now()}`}>Hatchr</span>
        </Link>

        <form onSubmit={onSearch} className="hidden md:block justify-self-center w-full">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects"
            className="w-full"
            aria-label="Search projects"
          />
        </form>

        <div className="flex items-center gap-2 justify-self-end">
          <ModeToggle />
          {loading ? (
            <div className="w-24 h-10 bg-muted rounded animate-pulse" />
          ) : user ? (
            <>
              <NotificationsBell />
              <Link href="/submit">
                <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                  Submit Project
                </Button>
              </Link>
              <Link href="/profile" className="ml-1">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  {user?.user_metadata?.avatar_url?.includes('googleusercontent.com') ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user?.user_metadata?.username || "Profile"}
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url} 
                      alt={user?.user_metadata?.username || "Profile"} 
                    />
                  )}
                  <AvatarFallback className="bg-orange-600 text-white text-sm">
                    {user?.user_metadata?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="outline" aria-label="Login">
                  Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-orange-600 hover:bg-orange-700" aria-label="Sign up">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* mobile search */}
      <div className="mx-auto mt-2 block w-full max-w-6xl px-4 pb-3 md:hidden">
        <form onSubmit={onSearch}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
          />
        </form>
      </div>
      <RealtimeStatus />
    </header>
  )
}
