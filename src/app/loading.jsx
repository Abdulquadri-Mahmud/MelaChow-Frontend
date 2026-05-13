export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-7 w-52 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl bg-white dark:bg-zinc-900">
              <div className="h-36 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
