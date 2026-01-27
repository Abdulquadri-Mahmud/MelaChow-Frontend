"use client";

// Skeleton with shimmer
const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
  <div
    className={`relative overflow-hidden scroll bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
  </div>
);

export default function HomeFoodListSkeleton({ categories = 2, itemsPerCategory = 3 }) {
  return (
    <div className="space-y-3 flex-1 scroll">
      {Array.from({ length: categories }).map((_, catIdx) => (
        <div key={catIdx}>
          <div className="flex gap-2 scroll overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scroll-smooth">
            {Array.from({ length: itemsPerCategory }).map((_, itemIdx) => (
              <div
                key={itemIdx}
                className="min-w-[220px] rounded-md overflow-hidden bg-white border border-gray-50 flex flex-col h-full snap-start"
              >
                <div className="relative">
                  <Skeleton height={120} />
                  <div className="absolute top-2 right-2">
                    <Skeleton width={80} height={20} className="rounded" />
                  </div>
                </div>
                <div className="p-2 space-y-2 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <Skeleton width="70%" height={16} />
                    <Skeleton width={28} height={28} className="rounded-lg" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton width={12} height={12} className="rounded-sm" />
                    <Skeleton width="50%" height={12} />
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Skeleton width={12} height={12} />
                      <Skeleton width={40} height={10} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton width={12} height={12} />
                      <Skeleton width={30} height={10} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
