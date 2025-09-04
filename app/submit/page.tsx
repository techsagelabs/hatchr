import { Navbar } from "@/components/navbar"
import { SubmitProjectForm } from "@/components/forms/submit-project-form"
import { getCurrentUser } from "@/lib/auth"
import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default async function SubmitPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return (
      <main>
        <Navbar />
        <section className="mx-auto max-w-2xl px-4 py-6">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold mb-4">Sign in to submit projects</h1>
            <p className="text-muted-foreground mb-6">
              Join our community to share your amazing projects and get feedback from others.
            </p>
            <SignInButton mode="modal">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Sign in to submit
              </Button>
            </SignInButton>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-pretty text-2xl font-semibold">Submit a Project</h1>
        <p className="text-muted-foreground">Share your creation with the community.</p>
        <div className="mt-6">
          <SubmitProjectForm />
        </div>
      </section>
    </main>
  )
}
