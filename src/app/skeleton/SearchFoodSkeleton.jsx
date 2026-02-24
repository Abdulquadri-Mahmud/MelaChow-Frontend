"use client";

import { motion } from "framer-motion";

const Skeleton = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
);

export default function SearchFoodSkeleton({ items = 6 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] p-2 pr-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4"
        >
          {/* Image skeleton */}
          <Skeleton className="w-28 h-28 rounded-[24px] flex-shrink-0" />

          {/* Details skeleton */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-4 w-12 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-24 rounded-lg" />
            <div className="flex justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-lg" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
