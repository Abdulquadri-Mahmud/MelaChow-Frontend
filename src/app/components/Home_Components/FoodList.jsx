/*
 * PAYLOAD REFERENCE — do not guess field names
 *
 * food.image           → flat string (NOT images[])
 * food.price           → naira
 * food.restaurant._id  → use for navigation
 * food.restaurant.storeName
 * food.restaurant.city
 * food.restaurant.openingHours
 * food.restaurant.flatRateDeliveryFee
 * food.restaurant.rating
 * food.restaurant.ratingCount
 */

import { useMemo, useState, useEffect } from "react";
import { Utensils, Star, Heart, Globe, Bike, MapPin, Flame, ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import { getFoodsByLocation } from "@/app/lib/userApi";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useLocationStore } from "@/app/store/userLocationStore";

const DIETARY_COLORS = {
  veg: "bg-green-100 text-green-700",
  vegan: "bg-emerald-100 text-emerald-700",
  halal: "bg-teal-100 text-teal-700",
  kosher: "bg-blue-100 text-blue-700",
  "non-veg": "bg-red-100 text-red-700",
};

const FoodCard = ({ food, showVendorCount = false }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const vendor = food.restaurant || food.vendor;
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");

    const isHot = (food.rating || vendor?.rating || 0) >= 4.5 && (food.ratingCount || vendor?.ratingCount || 0) > 10;
    
    return (
        <Link
            href={`/food-details/${food._id}`}
            className={`group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden cursor-pointer snap-start transition-all duration-300 block border border-zinc-100 dark:border-zinc-800 hover:shadow-xl`}
            style={{ width: "58vw", maxWidth: "240px" }}
        >
            {/* Image Container */}
            <div className="relative h-[120px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={food.image || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Hot Badge - Dynamic */}
                {isHot && (
                    <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-0.5 rounded-lg shadow-lg backdrop-blur-md">
                        <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Flame size={8} fill="currentColor" /> HOT
                        </span>
                    </div>
                )}

                {/* Rating - Floating Badge */}
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm border border-white/20">
                    <Star size={10} className="fill-orange-500 text-orange-500" />
                    <span className="text-[10px] font-black text-zinc-900 dark:text-white">
                        {Number(food.rating || vendor?.rating || 0).toFixed(1)}
                    </span>
                </div>

                {/* Dietary Badge - Bottom Left */}
                {food.dietary_type && food.dietary_type !== "mixed" && (
                    <div className="absolute bottom-2 left-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${DIETARY_COLORS[food.dietary_type] || "bg-zinc-100 text-zinc-500"}`}>
                            {food.dietary_type}
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1: Name + Heart */}
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight italic leading-tight">
                          {food.name}
                      </h3>
                      {showVendorCount && food._vendorCount > 1 && (
                        <p className="text-[8px] font-bold text-orange-600 uppercase tracking-widest mt-0.5 italic">
                          At {food._vendorCount} restaurants →
                        </p>
                      )}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLiked(!liked); }}
                        className="transition-colors mt-0.5"
                    >
                        <Heart
                            size={16}
                            className={liked ? "fill-red-500 text-red-500" : "text-zinc-300 dark:text-zinc-700"}
                            strokeWidth={liked ? 0 : 2}
                        />
                    </button>
                </div>

                {/* Row 2: Vendor Name • Location */}
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1 font-medium">
                    {vendor?.storeName} {" \u2022 "} {vendor?.address?.city || vendor?.city || "Nearby"}
                </p>

                {/* Row 3: Metadata Line: Status | Price | Delivery */}
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`text-[9px] font-black uppercase italic whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isOpen ? "Open" : "Closed"}
                      </span>
                      <span className="text-zinc-200 dark:text-zinc-800 text-[10px]">|</span>
                      <div className="flex items-center gap-1">
                          <Bike size={12} className="text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-500">
                            {(!vendor?.resolvedDeliveryFee || vendor?.resolvedDeliveryFee === 0) ? "Free" : `₦${vendor.resolvedDeliveryFee.toLocaleString()}`}
                          </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-zinc-900 dark:text-white italic">
                        ₦{food.price ? food.price.toLocaleString() : "..."}
                      </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default function FoodList({ user }) {
  const router = useRouter();
  const { userLocation, syncWithUserAddress } = useLocationStore();

  useEffect(() => {
    if (user) {
      syncWithUserAddress(user);
    }
  }, [user, syncWithUserAddress]);

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["foods-by-location", userLocation?.city, userLocation?.state],
    queryFn: () => getFoodsByLocation({
      city: userLocation.city,
      state: userLocation.state,
    }),
    enabled: !!userLocation?.city && !!userLocation?.state,
    staleTime: 1000 * 60 * 5,
  });

  const foods = responseData?.foods || [];

  // 1. DEDUPLICATED POPULAR DISHES (Most Ordered)
  const popularDishes = useMemo(() => {
    if (!foods.length) return [];
    
    // Group by normalized name
    const byName = foods.reduce((acc, food) => {
      const key = food.name.trim().toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(food);
      return acc;
    }, {});

    // For each name, pick the best vendor
    return Object.values(byName)
      .map(group => {
        const best = [...group].sort((a, b) => {
          const ratingA = a.rating || a.restaurant?.rating || 0;
          const ratingB = b.rating || b.restaurant?.rating || 0;
          return ratingB - ratingA;
        })[0];
        return { ...best, _vendorCount: group.length };
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);
  }, [foods]);

  // 2. CATEGORY ROWS (Grouped, Limited, and Sorted)
  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(foods) || foods.length === 0) return {};
    
    const groups = foods.reduce((acc, food) => {
      const category = food.platform_category?.parent?.name 
        || food.platform_category?.name
        || (Array.isArray(food.categories) && food.categories[0])
        || food.category
        || "Recommended";

      if (!acc[category]) acc[category] = { items: [], vendorCount: {} };

      const vendorId = food.restaurant?._id?.toString();
      const currentCount = acc[category].vendorCount[vendorId] || 0;

      // Limit to 2 foods per vendor per category
      if (currentCount < 2) {
        acc[category].items.push(food);
        acc[category].vendorCount[vendorId] = currentCount + 1;
      }
      
      return acc;
    }, {});

    // Sort items within each category by rating
    Object.keys(groups).forEach(cat => {
      groups[cat].items.sort((a, b) => {
        const ratingA = a.rating || a.restaurant?.rating || 0;
        const ratingB = b.rating || b.restaurant?.rating || 0;
        return ratingB - ratingA;
      });
    });

    return groups;
  }, [foods]);

  if (isLoading) return <HomeFoodListSkeleton />;

  if (!userLocation) return null;

  if (isError || foods.length === 0) return null;

  return (
    <div className="space-y-10 pb-10">
      {/* Popular Section */}
      {popularDishes.length > 0 && (
        <div className="px-0">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 p-2 rounded-xl border border-orange-500/20">
                <Flame className="text-white fill-white/20" size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">Popular <span className="text-orange-600">Near You</span></h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">What your neighbors are eating</p>
              </div>
            </div>
            <Link href="/trending-foods" className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:opacity-70 flex items-center gap-1 group">
              View All
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar px-4">
            {popularDishes.map((food) => (
              <FoodCard key={`popular-${food._id}`} food={food} showVendorCount={true} />
            ))}
          </div>
        </div>
      )}

      {/* Category Sections */}
      {Object.entries(foodsByCategory).map(([category, group]) => (
        <div key={category} className="px-0">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white tracking-tight">{category}</h2>
            </div>
            
            <Link
               href={`/search?category=${encodeURIComponent(category)}`}
               className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:opacity-70 flex items-center gap-1 group"
            >
              Discover
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar px-4 text-xs">
            {group.items.map((food) => (
              <FoodCard key={food._id} food={food} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
