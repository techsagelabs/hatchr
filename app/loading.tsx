import { Navbar } from "@/components/navbar"
import { LoadingCard } from "@/components/ui/loading"

export default function Loading() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-5 w-96 bg-muted rounded animate-pulse"></div>
        </div>
        
        <div className="flex flex-col gap-4 items-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} className="w-full max-w-sm" />
          ))}
        </div>
      </section>
    </main>
  )
}
