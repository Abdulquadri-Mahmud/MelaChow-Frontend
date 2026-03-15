"use client";

export default function VendorDashboardSkeleton() {
  const shimmer = "relative overflow-hidden bg-gray-200 rounded-lg";
  const bar = "h-4 w-full bg-gray-200 overflow-hidden relative rounded-md";
  const pulse =
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-200 before:via-gray-100 before:to-gray-200 before:animate-[shimmer_1.6s_infinite] before:bg-[length:200%_100%]";

  return (
    <div className="min-h-screen animate-none p-3 space-y-8">
      {/* ====== Header Skeleton ====== */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
        <div className={`${shimmer} ${pulse} w-14 h-14 rounded-full`} />
        <div className="flex-1 space-y-2">
          <div className={`${bar} ${pulse} w-40`} />
          <div className={`${bar} ${pulse} w-24`} />
        </div>
      </div>

      {/* ====== Stat Cards ====== */}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border shadow-sm space-y-3"
          >
            <div className={`${bar} ${pulse} w-24`} />
            <div className="flex items-center gap-2">
              <div className={`${shimmer} ${pulse} w-8 h-8 rounded-md`} />
              <div className={`${bar} ${pulse} w-12`} />
            </div>
          </div>
        ))}
      </div>

      {/* ====== Category Cards Section ====== */}
      <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
        <div className={`${bar} ${pulse} w-56`} />

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-gray-100 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`${shimmer} ${pulse} w-8 h-8 rounded-md`} />
                  <div className={`${bar} ${pulse} w-24`} />
                </div>
                <div className={`${bar} ${pulse} w-10`} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts skeletons */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="p-4 border rounded-xl shadow-sm space-y-3">
            <div className={`${bar} ${pulse} w-48`} />
            <div className={`${shimmer} ${pulse} w-full h-60 rounded-lg`} />
          </div>

          <div className="p-4 border rounded-xl shadow-sm space-y-3">
            <div className={`${bar} ${pulse} w-48`} />
            <div className={`${shimmer} ${pulse} w-full h-60 rounded-lg`} />
          </div>
        </div>
      </div>

      {/* ====== Sales & Orders ====== */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-4 bg-white border rounded-xl shadow-sm space-y-3">
          <div className={`${bar} ${pulse} w-40`} />
          <div className={`${shimmer} ${pulse} w-full h-64 rounded-lg`} />
        </div>

        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
          <div className={`${bar} ${pulse} w-40`} />
          <div className={`${shimmer} ${pulse} w-full h-64 rounded-lg`} />
        </div>
      </div>

      {/* ====== Store Details / Location ====== */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
          <div className={`${bar} ${pulse} w-40`} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${bar} ${pulse} w-3/4`} />
          ))}
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
          <div className={`${bar} ${pulse} w-40`} />
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${bar} ${pulse} w-2/3`} />
          ))}
        </div>
      </div>

      {/* ====== Opening Hours ====== */}
      <div className="p-4 bg-white border rounded-xl shadow-sm space-y-4">
        <div className={`${bar} ${pulse} w-56`} />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border bg-gray-100 space-y-2"
            >
              <div className={`${bar} ${pulse} w-20`} />
              <div className={`${bar} ${pulse} w-32`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
