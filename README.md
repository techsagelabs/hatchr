# Project Hunt clone (Takeo)

A Product Hunt–style app with an exact, minimalist card design, dark mode, and a GitHub-like code viewer. Built with Next.js App Router, Tailwind CSS v4 (shadcn styles), and shadcn/ui.

## Overview

- One project per row with a card layout matching the provided mock.
- Media (image/video) preserves its natural aspect ratio.
- Inter font with slightly reduced letter‑spacing for crisp, compact text.
- Centered navbar search, dark mode toggle, working “three dots” overflow menu.
- Vote control matches the reference (outlined up/down triangle with a centered count).
- GitHub-like code viewer: collapsible file tree on the left, code on the right, Copy button.
- Lightweight auth mock: Login/Sign up buttons; “Submit Project” appears after signing up.
- User profile pages at `/u/[username]`.
- Footer added site-wide.
- Central design tokens in `design/system.json`.

Reference images:
- Card layout: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-r0nuJtOynezSOHeMahyjsYKTXKDJsX.png
- Vote pill: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-09-02%20225928-znRuNAmp0AVnitaRHNgEWDfMka7gHF.png
- Code viewer layout: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-09-02%20230053-y5qWE64BJhnhUyl5AfHzvVlQ7cGERq.png

## Features

- Cards
  - Header with avatar + username left, overflow menu right
  - Bold title, large rounded media block (intrinsic ratio)
  - Bottom action pills: votes, comments, share; timestamp aligned right
- Voting
  - Single rounded pill with outlined ▲ / ▼ and centered count (optimistic UI ready)
- Code Viewer
  - Collapsible file tree (left), code panel (right), Copy to clipboard
  - No external CodePen dependency
- Auth (prototype)
  - Login / Sign up buttons in navbar
  - After Sign up, “Submit Project” button is shown
- Theming and Typography
  - Inter via `next/font`, global variable mapped to Tailwind `font-sans`
  - Dark mode via ThemeProvider + ModeToggle (class strategy)
- Accessibility
  - Semantic HTML, alt text for media, tokens for color contrast, keyboardable menus

## Tech Stack

- Next.js App Router (Next.js runtime in v0)
- Tailwind CSS v4 + shadcn/ui primitives
- TypeScript + React Server Components
- SWR for client caching/optimistic interactions (when needed)

## Key Files

- `app/layout.tsx` — global HTML, fonts, ThemeProvider
- `components/navbar.tsx` — centered search, auth buttons, submit button logic, theme toggle
- `components/project-card.tsx` — exact card UI (media with intrinsic ratio, pills, menu)
- `components/vote-controls.tsx` — pill with ▲ / ▼ and count
- `components/embed.tsx` — GitHub-like code viewer (left files, right code, Copy)
- `app/projects/[id]/page.tsx` — project detail page
- `app/u/[username]/page.tsx` — user profile page
- `components/footer.tsx` — global footer
- `design/system.json` — colors, type, radii, shadows, spacing tokens

## Customization

- Colors, radii, shadows, spacing: edit `design/system.json`
- Fonts: `app/layout.tsx` (Inter) and `app/globals.css` variable mapping
- Card spacings and actions: `components/project-card.tsx`
- Code viewer: `components/embed.tsx` (supply files: `{ name, content }[]`)

## Running and Deploying (v0)

- Use the Version preview in v0 to test changes.
- Click Publish to deploy to Vercel from the v0 UI.
- To install locally or on another project, use the Download ZIP option or push to GitHub from v0.

## Roadmap

- Replace mock auth with real auth (e.g., Supabase Auth)
- Persist data in a database (Neon or Supabase)
- Add syntax highlighting to the code viewer

## License

MIT
