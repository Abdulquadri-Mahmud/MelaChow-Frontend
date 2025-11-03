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
                className="min-w-[220px] rounded-2xl overflow-hidden bg-white shadow-sm snap-start"
              >
                <Skeleton height={140} />
                <div className="p-2 space-y-1">
                  <Skeleton width="70%" height={16} />
                  <Skeleton width="50%" height={14} />
                  <div className="flex justify-between items-center mt-1">
                    <Skeleton width="30%" height={12} />
                    <Skeleton width="20%" height={12} />
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
