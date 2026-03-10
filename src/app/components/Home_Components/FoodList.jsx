"use client";

import { useMemo } from "react";
import { Utensils, Clock, Truck, Store, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

export default function FoodList({ user }) {
  const router = useRouter();
  const { baseUrl } = useApi();

  const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

  const { data: foods = [], isLoading, isError, error } = useQuery({
    queryKey: ["foods", defaultAddr?.city, defaultAddr?.state],
    queryFn: async () => {
      if (!defaultAddr?.city || !defaultAddr?.state) {
        // Throw a mock axios-like error to trigger our custom error UI without a failed network request
        const err = new Error("Missing location");
        err.response = { data: { message: "Please provide both city and state query parameters." } };
        throw err;
      }

      const res = await axios.get(`${baseUrl}/user/foods`, {
        params: {
          city: defaultAddr.city,
          state: defaultAddr.state,
        },
        withCredentials: true, // ✅ Use cookie-based auth
      });
      return res?.data?.foods || [];
    },
    refetchInterval: 60000,
    retry: false,
  });

  // console.log(foods)

  // Group foods by category
  // Using the primary category (first element of categories array)
  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(foods) || foods.length === 0) return {};
    return foods.reduce((acc, food) => {
      // Handle both array 'categories' and legacy string 'category'
      const primaryCategory = (Array.isArray(food.categories) && food.categories[0])
        || food.category
        || "Recommended";

      if (!acc[primaryCategory]) acc[primaryCategory] = [];
      acc[primaryCategory].push(food);
      return acc;
    }, {});
  }, [foods]);

  if (isLoading) return <HomeFoodListSkeleton />;

  if (isError) {
    const errorMsg = error?.response?.data?.message || "Failed to load foods.";
    if (errorMsg.includes("city and state")) {
      return (
        <div className="mt-8 px-4">
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
              <MapPin className="text-orange-500" size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Location Required</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-[200px]">Please set your City and State to discover amazing food near you.</p>
          </div>
        </div>
      );
    }
    return null; // Silent fail for other errors
  }

  if (foods.length === 0) return null;

  return (
    <div className="space-y-8 pb-10">

      {Object.entries(foodsByCategory).map(([category, categoryFoods]) => (
        <div key={category} className="px-0">

          {/* Category Header */}
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight capitalize">{category}</h2>
            </div>
          </div>

          {/* Horizontal Scroll List */}
          <div className="flex gap-2 overflow-x-auto scroll snap-x snap-mandatory scrollbar-hide">
            {categoryFoods.map((food) => {
              // --- 1. Discount Logic ---
              const hasDiscount = food.discount?.active && new Date(food.discount.expiresAt) > new Date();
              let finalPrice = Number(food.price);
              let discountLabel = null;

              if (hasDiscount) {
                if (food.discount.flatAmount > 0) {
                  finalPrice = Math.max(0, finalPrice - food.discount.flatAmount);
                  discountLabel = `₦${food.discount.flatAmount} OFF`;
                } else if (food.discount.percentage > 0) {
                  finalPrice = Math.max(0, finalPrice - (finalPrice * (food.discount.percentage / 100)));
                  discountLabel = `-${food.discount.percentage}%`;
                }
              }

              // --- 2. Availability Logic ---
              // Use 'vendor' from API response (fallback to 'restaurant' for compatibility)
              const vendor = food.vendor || food.restaurant;

              // A. Check Vendor/Restaurant Global Status
              const vendorStatusMsg = vendor?.openingHours ? getVendorOpenAndCloseStatus(vendor.openingHours) : null;
              const isVendorOpen = vendorStatusMsg ? vendorStatusMsg.toLowerCase().startsWith("open now") : true;

              // B. Check Food Specific Schedule
              let isFoodScheduleOpen = true;
              if (food.availabilitySchedule?.enabled) {
                const now = new Date();
                const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const currentDay = daysMap[now.getDay()];

                // Check Day
                if (!food.availabilitySchedule.days.includes(currentDay)) {
                  isFoodScheduleOpen = false;
                } else {
                  // Check Time
                  const currentMinutes = now.getHours() * 60 + now.getMinutes();
                  const [startH, startM] = food.availabilitySchedule.startTime.split(':').map(Number);
                  const [endH, endM] = food.availabilitySchedule.endTime.split(':').map(Number);

                  const startTotal = startH * 60 + startM;
                  const endTotal = endH * 60 + endM;

                  if (currentMinutes < startTotal || currentMinutes >= endTotal) {
                    isFoodScheduleOpen = false;
                  }
                }
              }

              // Final Combined Status
              const isOpen = isVendorOpen && isFoodScheduleOpen;

              // Helper for friendly status
              const getFriendlyStatus = () => {
                if (!isVendorOpen && vendorStatusMsg) {
                  const parts = vendorStatusMsg.split("open by");
                  if (parts.length > 1) {
                    return `Opens ${parts[1].replace('.', '').trim()}`;
                  }
                }
                return "Opens Later";
              };
              const friendlyStatus = getFriendlyStatus();

              // Get vendor location
              // Support both flat structure (from provided sample) and nested address
              const vendorLocation = (vendor?.city && vendor?.state)
                ? `${vendor.city}, ${vendor.state}`
                : (vendor?.address
                  ? `${vendor.address.city}, ${vendor.address.state}`
                  : "Location not available");

              // --- 3. Schedule Label Logic ---
              let scheduleLabel = null;
              if (food.availabilitySchedule?.enabled) {
                const { days, startTime, endTime } = food.availabilitySchedule;
                const isWeekend = days.includes("Sat") || days.includes("Sun");
                const isDaily = days.length >= 7;
                const isWeekdays = days.length === 5 && !isWeekend;

                let dayText = days.slice(0, 3).join(",");
                if (isDaily) dayText = "Daily";
                else if (isWeekdays) dayText = "Mon-Fri";
                else if (days.length > 2) dayText = `${days[0]}..${days[days.length - 1]}`;

                scheduleLabel = `${dayText} • ${startTime}-${endTime}`;
              }

              return (
                <div
                  key={food._id}
                  onClick={() => router.push(`/food-details/${food._id}`)}
                  className={`group relative flex-none w-[250px] bg-white dark:bg-slate-900 rounded-[24px] transition-all duration-300 cursor-pointer snap-start overflow-hidden border border-gray-100 dark:border-slate-800 ${!isOpen ? 'opacity-80 grayscale-[0.5]' : ''}`}
                >
                  {/* Image Container */}
                  <div className="relative h-[140px] w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={food.image || "/placeholder.jpg"}
                      alt={food.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Closed Overlay */}
                    {!isOpen && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                        <span className="text-white font-black uppercase tracking-widest text-[12px] border-2 border-white px-3 py-1 rounded mb-1">
                          Closed
                        </span>
                        <span className="text-white/90 text-[10px] font-medium tracking-wide">
                          {friendlyStatus}
                        </span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {hasDiscount && isOpen && (
                      <div className="absolute top-3 left-3 bg-red-500 shadow-red-500/30 shadow-lg px-2 py-1 rounded-lg z-10">
                        <span className="text-[10px] font-black text-white tracking-wide">
                          {discountLabel}
                        </span>
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-xl flex flex-col items-end leading-none gap-0.5 shadow-sm">
                      <span className="text-[12px] font-black text-gray-900 dark:text-white tracking-tighter">
                        ₦{finalPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 line-through decoration-red-400">
                          ₦{Number(food.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 pointer-events-none" />
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight tracking-tight mb-0.5">{food.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-1">
                        <Store size={10} className="text-orange-500" />
                        <span className="truncate max-w-[180px] font-medium opacity-80">{vendor?.storeName || "GrubDash Vendor"}</span>
                      </div>
                      {/* Vendor Location */}
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-500">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate max-w-[180px] font-medium">{vendorLocation}</span>
                      </div>

                      {/* Schedule Info Badge */}
                      {scheduleLabel && (
                        <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded text-orange-600 dark:text-orange-400 w-fit">
                          <Clock size={10} className="stroke-[2.5]" />
                          <span className="text-[9px] font-bold tracking-tight">{scheduleLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-1">
                        <Truck size={12} className="text-gray-400 dark:text-slate-500" />
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                          ₦{food.deliveryFee || vendor?.flatRateDeliveryFee || 0}
                        </span>
                      </div>

                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${!isOpen ? 'bg-red-50 dark:bg-rose-500/10' : 'bg-gray-50 dark:bg-slate-800'}`}>
                        <Clock size={10} className={!isOpen ? "text-red-500" : "text-orange-500"} />
                        <span className={`text-[9px] font-bold ${!isOpen ? 'text-red-500' : 'text-gray-700 dark:text-slate-300'}`}>
                          {isOpen ? `${food?.estimatedDeliveryTime || "25"}m` : friendlyStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
