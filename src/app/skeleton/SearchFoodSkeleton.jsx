"use client";

import { motion } from "framer-motion";

// Skeleton with shimmer
const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
  </div>
);

export default function FoodCardSkeleton({ items = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-xl overflow-hidden cursor-pointer"
        >
          {/* Image skeleton */}
          <Skeleton width="100%" height={144} className="rounded-t-xl" />

          <div className="p-3 space-y-2">
            {/* Food name */}
            <Skeleton width="70%" height={20} className="rounded-md" />
            
            {/* Vendor */}
            <Skeleton width="50%" height={16} className="rounded-md" />
            
            {/* Delivery info */}
            <div className="flex justify-between mt-2">
              <Skeleton width="40%" height={14} className="rounded-md" />
              <Skeleton width="25%" height={14} className="rounded-md" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
