'use client';

export default function ComboCardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden">
      {/* Image skeleton */}
      <div className="h-40 bg-slate-200 dark:bg-slate-800" />

      {/* Body skeleton */}
      <div className="p-3 space-y-2.5">
        {/* Name skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2" />
        </div>

        {/* Price + time skeleton */}
        <div className="flex justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        </div>

        {/* Metadata chips skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-slate-100 dark:bg-slate-800/50 rounded w-1/3" />
          <div className="h-6 bg-slate-100 dark:bg-slate-800/50 rounded w-1/4" />
        </div>

        {/* Bottom skeleton */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
          <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}
