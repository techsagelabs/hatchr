import { Navbar } from "@/components/navbar"
import { getProject } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { notFound } from "next/navigation"
import { VoteControls } from "@/components/vote-controls"
import { Embed } from "@/components/embed"
import { CommentThread } from "@/components/comment-thread"
import { ProjectActions } from "@/components/project-actions"

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  const currentUser = await getCurrentUser()
  if (!project) return notFound()

  return (
    <main>
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 py-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-pretty text-2xl font-semibold">{project.title}</h1>
              <ProjectActions 
                project={project} 
                currentUserId={currentUser?.id}
                className="ml-2"
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <img
                src={
                  project.author.avatarUrl || "/placeholder.svg?height=32&width=32&query=avatar" || "/placeholder.svg"
                }
                alt={`${project.author.name} avatar`}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span>by {project.author.name}</span>
            </div>
          </div>
          <VoteControls projectId={project.id} initial={project} />
        </header>

        <section className="mt-6 space-y-4">
          <img
            src={
              project.thumbnailUrl || "/placeholder.svg?height=360&width=640&query=project hero" || "/placeholder.svg"
            }
            alt={`${project.title} thumbnail large`}
            className="w-full rounded-md border object-cover"
          />
          {project.mediaUrl && (
            <div className="overflow-hidden rounded-md border">
              <iframe
                src={project.mediaUrl}
                title={`${project.title} media`}
                sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
                loading="lazy"
                className="aspect-video w-full"
              />
            </div>
          )}
          <p className="leading-relaxed">{project.fullDescription}</p>
        </section>

        {(() => {
          const any = project as unknown as {
            codeFiles?: { path: string; content: string }[]
            code?: string
            filename?: string
          }
          if (any?.codeFiles?.length) {
            return (
              <section className="mt-8">
                <h2 className="mb-2 text-lg font-semibold">Code</h2>
                <Embed title={`${project.title} code`} files={any.codeFiles} />
              </section>
            )
          }
          if (any?.code) {
            return (
              <section className="mt-8">
                <h2 className="mb-2 text-lg font-semibold">Code</h2>
                <Embed title={`${project.title} code`} filename={any.filename || "index.ts"} code={any.code} />
              </section>
            )
          }
          return project.codeEmbedUrl ? (
            <section className="mt-8">
              <h2 className="mb-2 text-lg font-semibold">Code</h2>
              <Embed url={project.codeEmbedUrl} title={`${project.title} code`} />
            </section>
          ) : null
        })()}

        <CommentThread projectId={project.id} />
      </article>
    </main>
  )
}
