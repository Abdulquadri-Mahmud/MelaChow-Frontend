"use client";

export default function CheckoutPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-28 animate-pulse">
      {/* Header */}
      <div className="h-14 bg-white shadow-sm"></div>

      <div className="p-4 space-y-3">
        {/* Address block */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-3 w-2/3 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-3 w-1/2 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        {/* Items list */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="h-4 w-24 bg-gray-200 rounded-md mb-4"></div>

          {/* Repeat 3 skeleton items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>

              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-gray-200 rounded-md"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded-md"></div>
                <div className="h-3 w-1/3 bg-gray-200 rounded-md"></div>
                <div className="h-4 w-20 bg-gray-200 rounded-md mt-1"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <div className="h-4 w-28 bg-gray-200 rounded-md"></div>

          <div className="flex justify-between">
            <div className="h-3 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-3 w-16 bg-gray-200 rounded-md"></div>
          </div>

          {/* Removed delivery fee line */}

          <hr />

          <div className="flex justify-between items-center">
            <div className="h-4 w-16 bg-gray-200 rounded-md"></div>
            <div className="h-4 w-20 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-12 left-0 right-0 bg-white p-4 border-t shadow-xl">
        <div className="w-full bg-gray-200 h-14 rounded-xl"></div>
      </div>
    </div>
  );
}
