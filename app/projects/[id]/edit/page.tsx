import { Navbar } from "@/components/navbar"
import { getProject } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { EditProjectForm } from "@/components/forms/edit-project-form"

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  const currentUser = await getCurrentUser()
  
  if (!project) return notFound()
  
  // Only allow the project owner to edit
  if (!currentUser || currentUser.id !== project.author.id) {
    redirect(`/projects/${id}`)
  }

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground mt-1">
            Update your project details below.
          </p>
        </div>
        
        <EditProjectForm project={project} />
      </div>
    </main>
  )
}
