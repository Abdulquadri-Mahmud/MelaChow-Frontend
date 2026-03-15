"use client";

import React from "react";

export default function OrderTrackingSkeleton() {
  return (
    <div className="md:p-4 p-2 max-w-md w-full mx-auto bg-white rounded-xl shadow-md space-y-6 animate-pulse">
      {/* Top Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full"></div>

      {/* Order ID */}
      <div className="h-6 w-3/5 bg-gray-200 rounded"></div>

      {/* Items */}
      <div className="space-y-2 border-t pt-4">
        <div className="h-4 w-1/4 bg-gray-200 rounded mb-2"></div>
        {[1, 2].map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      <div className="space-y-2 border-t pt-4">
        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        <div className="h-3 w-full bg-gray-200 rounded"></div>
        <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
      </div>

      {/* Payment Summary */}
      <div className="space-y-2 border-t pt-4">
        <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
      </div>

      {/* Status Timeline */}
      <div className="border-t pt-4">
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((_, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 mb-2" />
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
