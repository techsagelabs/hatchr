"use client"

export function Footer() {
  return (
    <footer className="border-t bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Project Hunt clone</p>
        <nav className="flex items-center gap-4">
          <a className="hover:underline" href="/about">
            About
          </a>
          <a className="hover:underline" href="/privacy">
            Privacy
          </a>
          <a className="hover:underline" href="/terms">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  )
}
