import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-9 w-72 rounded-full" />

      {/* Event rows */}
      <div className="mx-auto max-w-2xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-1 py-2">
            <Skeleton className="mt-0.5 h-5 w-20 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        ))}

        {/* Divider skeleton */}
        <div className="my-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <Skeleton className="h-3 w-12" />
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Active event skeleton */}
        <div className="my-1.5 rounded-xl border border-border px-4 py-3">
          <Skeleton className="h-3.5 w-24 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`future-${i}`} className="flex items-start gap-3 px-1 py-2">
            <Skeleton className="mt-0.5 h-5 w-20 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
