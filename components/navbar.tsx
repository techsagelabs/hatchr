"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import dynamic from "next/dynamic"

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
  const { user } = useUser()

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
          <SignedOut>
            <SignInButton 
              mode="modal"
              forceRedirectUrl={typeof window !== 'undefined' ? window.location.origin : '/'}
              fallbackRedirectUrl="/"
            >
              <Button variant="outline" aria-label="Login">
                Login
              </Button>
            </SignInButton>
            <SignUpButton 
              mode="modal"
              forceRedirectUrl={typeof window !== 'undefined' ? window.location.origin : '/'}
              fallbackRedirectUrl="/"
            >
              <Button className="bg-orange-600 hover:bg-orange-700" aria-label="Sign up">
                Sign up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <NotificationsBell />
            <Link href="/submit">
              <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                Submit Project
              </Button>
            </Link>
            <Link href="/profile" className="ml-1">
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage 
                  src={user?.imageUrl} 
                  alt={user?.fullName || "Profile"} 
                />
                <AvatarFallback className="bg-orange-600 text-white text-sm">
                  {user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </SignedIn>
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
    </header>
  )
}
