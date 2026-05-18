"use client";

import React from "react";

export default function SearchFoodSkeleton({ items = 6 }) {
  return (
    <div className="animate-pulse space-y-4 px-2 pb-24">
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800/70 last:border-0"
        >
          {/* Text Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
            <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/3" />
            <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/50 rounded w-5/6" />
            <div className="flex items-center gap-2 pt-1">
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
              <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800/50 rounded w-8" />
            </div>
          </div>

          {/* Image Block */}
          <div className="relative w-[70px] h-[70px] rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0">
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-zinc-300 dark:bg-zinc-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
