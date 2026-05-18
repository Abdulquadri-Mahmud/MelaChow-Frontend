"use client";

import React from "react";
import { ArrowLeft, Sparkles, Search, SlidersHorizontal } from "lucide-react";

export default function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pointer-events-none">
      {/* 🎭 Premium Floating Search Header (Skeleton) */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </div>
 
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-orange-500/50 tracking-[0.2em] italic leading-none mb-0.5">Explore</span>
                <h1 className="text-md font-black text-zinc-900/50 dark:text-zinc-100/50 uppercase italic tracking-tighter leading-none">Cravings</h1>
            </div>
 
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700">
                <Sparkles size={18} />
            </div>
          </div>

          {/* 🔍 Elite Search Bar */}
          <div className="relative">
            <div className="relative flex items-center gap-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-13 px-4.5 rounded-[18px]">
              <Search size={20} className="text-zinc-300 dark:text-zinc-700 shrink-0" />
              <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                  <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <div className="p-1.5 text-zinc-300 dark:text-zinc-700 shrink-0">
                      <SlidersHorizontal size={18} strokeWidth={2.5} />
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 Category Pill Navigation */}
        <div className="max-w-xl mx-auto border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex overflow-hidden gap-1.5 py-2 px-2 items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-4.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 animate-pulse h-6 w-20 shrink-0"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Refinement Toolbar */}
      <div className="max-w-xl mx-auto px-2 pt-2.5">
          <div className="flex items-end justify-between border-b border-zinc-200/50 dark:border-zinc-800 pb-1.5">
              <div className="flex flex-col space-y-1">
                  <div className="h-2 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-900 rounded-md animate-pulse" />
          </div>
      </div>
 
      {/* 🍱 Results Feed Skeleton */}
      <div className="max-w-xl mx-auto mt-3.5">
        <div className="animate-pulse space-y-4 px-2 pb-24">
          {Array.from({ length: 6 }).map((_, i) => (
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
      </div>
    </div>
  );
}
