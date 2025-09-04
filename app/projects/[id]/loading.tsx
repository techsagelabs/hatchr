import { Navbar } from "@/components/navbar"
import { Skeleton } from "@/components/ui/loading"

export default function Loading() {
  return (
    <main>
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 py-6">
        {/* Header skeleton */}
        <header className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <Skeleton className="h-8 w-72 mb-2" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-full" />
          </div>
        </header>

        {/* Content skeleton */}
        <section className="space-y-4">
          <Skeleton className="h-64 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </section>

        {/* Comments skeleton */}
        <section className="mt-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  )
}
