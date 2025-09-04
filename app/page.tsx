import { Navbar } from "@/components/navbar"
import { ProjectCard } from "@/components/project-card"
import { listProjects } from "@/lib/data"
import { PageTransition, CardTransition } from "@/components/page-transitions"
import type { ProjectWithUserVote } from "@/lib/types"

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const all = await listProjects()
  const { q: searchQuery } = await searchParams
  const q = (searchQuery ?? "").toLowerCase()
  const projects: ProjectWithUserVote[] = q
    ? all.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.fullDescription.toLowerCase().includes(q),
      )
    : all

  return (
    <main>
      <Navbar />
      <PageTransition>
        <section className="mx-auto max-w-4xl px-4 py-6">
          {/* one column list */}
          <div className="flex flex-col gap-4 items-center">
            <div className="w-full max-w-2xl mb-2">
              <h1 className="text-pretty text-2xl font-semibold tracking-[-0.01em]">Discover Projects</h1>
              <p className="text-muted-foreground">Vote on the most interesting builds. Join the discussion.</p>
            </div>
            {projects.map((p, index) => (
              <CardTransition key={p.id} index={index} className="w-full max-w-2xl">
                <ProjectCard project={p} />
              </CardTransition>
            ))}
          </div>
        </section>
      </PageTransition>
    </main>
  )
}
