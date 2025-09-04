"use client"

import { useMemo, useState } from "react"
import { Copy, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export type EmbedFile = {
  path: string
  content: string
}

export type EmbedProps = {
  url?: string
  title: string
  filename?: string
  code?: string
  files?: EmbedFile[]
}

export function Embed({ url, title, filename = "index.ts", code, files }: EmbedProps) {
  const initialIndex = 0
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const normalizedFiles = useMemo<EmbedFile[] | null>(() => {
    if (files && files.length > 0) return files
    if (code) return [{ path: filename, content: code }]
    return null
  }, [files, code, filename])

  if (normalizedFiles) {
    const active = normalizedFiles[activeIndex] ?? normalizedFiles[0]

    return (
      <div className="overflow-hidden rounded-md border">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" aria-hidden />
            <span className="ml-2 truncate font-mono text-xs text-muted-foreground" title={title}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={collapsed ? "Expand file panel" : "Collapse file panel"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                View repo
              </a>
            ) : null}
          </div>
        </div>

        {/* Two-pane viewer */}
        <div className={`grid ${collapsed ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[220px_1fr]"} `}>
          {!collapsed && (
            <nav aria-label="Files" className="border-r bg-background/50">
              <ul className="max-h-[420px] overflow-auto py-2">
                {normalizedFiles.map((f, i) => (
                  <li key={f.path}>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={`w-full truncate px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                        i === activeIndex ? "bg-muted text-foreground" : "hover:bg-muted/70 text-muted-foreground"
                      }`}
                      aria-current={i === activeIndex ? "page" : undefined}
                      title={f.path}
                    >
                      {f.path}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Code panel */}
          <div className="min-w-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="truncate font-mono text-xs text-muted-foreground" title={active.path}>
                {active.path}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Copy code"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(active.content)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1200)
                  } catch {
                    /* noop */
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="max-h-[480px] overflow-auto bg-card px-4 py-3 text-sm leading-6">
              <code className="font-mono whitespace-pre">{active.content}</code>
            </pre>
            <span aria-live="polite" className="sr-only">
              {copied ? "Copied" : ""}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Backward-compatible single-file
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" aria-hidden />
          <span className="ml-2 font-mono text-xs text-muted-foreground">{filename}</span>
        </div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
            View source
          </a>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="truncate font-mono text-xs text-muted-foreground">{filename}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copy code"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code || "")
              setCopied(true)
              setTimeout(() => setCopied(false), 1200)
            } catch {
              /* noop */
            }
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <pre className="max-h-[480px] overflow-auto bg-card px-4 py-3 text-sm leading-6">
        <code className="font-mono whitespace-pre">
          {code ? code : "// Source code preview\n// Provide `files`, or `code` + `filename`, or a `url`."}
        </code>
      </pre>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  )
}
