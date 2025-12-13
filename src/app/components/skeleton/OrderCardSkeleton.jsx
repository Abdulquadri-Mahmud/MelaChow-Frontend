"use client";

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl md:p-5 p-3 animate-pulse space-y-3">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <div className="w-32 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-16 h-4 bg-gray-300 rounded-full"></div>
          <div className="w-12 h-4 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
        <div className="w-20 h-4 bg-gray-300 rounded"></div>
      </div>
      <div className="w-32 h-3 bg-gray-200 rounded mt-2"></div>
    </div>
  );
}
