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

export default function SearchFoodSkeleton({ categories = 2, itemsPerCategory = 3 }) {
  return (
    <div className="space-y-5 flex-1 scroll">
      {Array.from({ length: categories }).map((_, catIdx) => (
        <div key={catIdx}>
          {Array.from({ length: itemsPerCategory }).map((_, itemIdx) => (
            <div key={itemIdx}  className="min-w-[250px] flex p-2 mb-3 rounded-2xl overflow-hidden bg-white border border-gray-100 snap-start">
              <Skeleton height={70} width={70} />
              <div className="p-2 space-y-1 flex justify-between items-center flex-1">
                <Skeleton width={100} height={20} />
                <Skeleton width={100} height={20} />
                <div className="flex justify-between gap-3 items-center mt-1">
                  <Skeleton width={50} height={20} />
                  <Skeleton width={50} height={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
