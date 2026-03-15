"use client";

import { motion } from "framer-motion";

const FoodDetailsSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">

      {/* 🧾 Main Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] border border-gray-100 overflow-hidden"
      >
        {/* 🖼️ Image Section Placeholder */}
        <div className="p-2">
          <div className="w-full h-[200px] bg-gray-200 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-3 left-3 flex gap-2 w-full pr-6">
              <div className="h-6 bg-gray-300 rounded-full w-24" />
              <div className="h-6 bg-gray-300 rounded-full w-28 ml-auto" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="p-4 space-y-4">
          <div className="h-7 bg-gray-200 rounded w-2/3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-12" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 bg-gray-100 rounded-full w-14" />
            ))}
          </div>
        </div>
      </motion.div>

      {/* 🏪 Vendor Status Bar */}
      <div className="bg-gray-900 rounded-[32px] p-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-2 bg-orange-400/30 rounded w-16" />
            <div className="h-4 bg-white/10 rounded w-24" />
          </div>
        </div>
        <div className="h-6 bg-white/10 rounded-full w-20" />
      </div>

      {/*  Bento Variants */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-gray-900 rounded-full" />
          <div className="h-5 bg-gray-200 rounded w-32" />
        </div>

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white border border-gray-100 rounded-[32px] p-2"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-16 h-16 bg-gray-100 rounded-[16px]" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-16 mt-2" />
              </div>
            </div>
            <div className="w-14 h-14 bg-gray-900 rounded-[20px]" />
          </div>
        ))}
      </div>

      {/* ✨ Shimmer effect keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
        .animate-[shimmer_1.5s_infinite] {
          background-size: 800px 104px;
        }
      `}</style>
    </div>
  );
};

export default FoodDetailsSkeleton;
