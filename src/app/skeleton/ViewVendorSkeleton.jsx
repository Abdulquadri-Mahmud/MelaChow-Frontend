"use client";

import { ArrowLeft } from "lucide-react";

export default function ViewVendorSkeleton() {
  return (
    <div className="pb-12 bg-gray-50 animate-pulse">
      {/* ===== Header ===== */}
      <div className="relative w-full h-56 bg-gradient-to-r from-orange-300 to-orange-200">
        <div className="absolute inset-0 bg-black/10"></div>

        <button
          className="absolute top-4 left-4 p-2 rounded-full bg-white/70 hover:bg-white transition"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="absolute bottom-4 left-5 flex items-center gap-3">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-300"></div>

          <div>
            <div className="h-5 bg-gray-300 rounded w-40 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-28"></div>
          </div>
        </div>
      </div>

      {/* ===== Vendor Info ===== */}
      <div className="md:p-5 p-2">
        {/* About */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-11/12"></div>
            <div className="h-3 bg-gray-200 rounded w-10/12"></div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-40 mb-2"></div>
          <div className="flex flex-col gap-2">
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="h-4 bg-gray-300 rounded w-40 mb-3"></div>
          <div className="grid sm:grid-cols-2 gap-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between border-b pb-1">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
