"use client";

import { motion } from "framer-motion";

const FoodDetailsSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">

        {/* 🕘 Vendor Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow overflow-hidden mt-3"
      >
        {/* Header / Open Hours */}
        <div className="flex items-center justify-center py-3 px-3 bg-gradient-to-r from-orange-50 to-white">
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Prep Time / Delivery Fee / Delivery Type */}
        <div className="flex flex-wrap justify-between md:justify-evenly items-center px-5 py-3 text-center text-gray-700">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* 🖼️ Image Section */}
      <div className="relative w-full h-60 bg-gray-200 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* 🧾 Basic Info */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>

      {/* 🍴 Meta Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/4" />
      </div>

      {/* 🔥 Metadata Section */}
      <div className="bg-orange-50 rounded-xl border border-orange-100 w-full p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>

      {/* 🏷️ Tags */}
      <div className="flex gap-2 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 h-6 w-16 rounded-full" />
        ))}
      </div>

      {/* 🍱 Variants */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-full" />
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
