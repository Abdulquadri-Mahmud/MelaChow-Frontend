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
import { Utensils, Star, Heart, Globe, Bike, MapPin, Flame, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import { getFoodsByLocation } from "@/app/lib/userApi";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useLocationStore } from "@/app/store/userLocationStore";
import { useFoodModalStore } from "@/app/store/foodModalStore";

const DIETARY_COLORS = {
  veg: "bg-green-100 text-green-700",
  vegan: "bg-emerald-100 text-emerald-700",
  halal: "bg-teal-100 text-teal-700",
  kosher: "bg-blue-100 text-blue-700",
  "non-veg": "bg-red-100 text-red-700",
};

const FoodCard = ({ food }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const vendor = food.restaurant || food.vendor;
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");
    const openFoodModal = useFoodModalStore(state => state.openFoodModal);

    // console.log(food);
    
    return (
        <div
            onClick={() => openFoodModal(food._id, { food })}
            className={`group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer snap-start transition-all duration-300 block ${!isOpen ? '' : ''}`}
            style={{ width: "72vw", maxWidth: "280px" }}
        >
            {/* Image Container */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={food.image || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Hot/New Badge */}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Flame size={8} fill="currentColor" /> HOT
                    </span>
                </div>

                {/* Dietary Badge - Bottom Left */}
                {food.dietary_type && food.dietary_type !== "mixed" && (
                    <div className="absolute bottom-2 left-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${DIETARY_COLORS[food.dietary_type] || "bg-zinc-100 text-zinc-500"}`}>
                            {food.dietary_type}
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1: Name + Heart */}
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[calc(100%-28px)]">
                        {food.name}
                    </h3>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors"
                    >
                        <Heart
                            size={18}
                            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"}
                            strokeWidth={liked ? 0 : 1.5}
                        />
                    </button>
                </div>

                {/* Row 2: Vendor Name • Location */}
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                    {vendor?.storeName} {" \u2022 "} {vendor?.city || "Nearby"}
                </p>

                {/* Row 3: Metadata Line: Globe | Delivery | Status | Rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                    <Globe size={14} className="text-gray-400 dark:text-zinc-500" />
                    
                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Bike size={14} className="text-gray-400 dark:text-zinc-500" />
                        {(() => {
                            const fee = food.deliveryFee ?? vendor?.deliveryFee ?? vendor?.flatRateDeliveryFee;
                            return (!fee || fee === 0) ? (
                                <span className="text-xs font-bold text-gray-900 dark:text-white">Free</span>
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-zinc-400">₦{fee.toLocaleString()}</span>
                            );
                        })()}
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Status */}
                    <span className={`text-[10px] font-black uppercase italic whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {status}
                    </span>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                        <Star size={10} className="fill-orange-500 text-orange-500" />
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                            {Number(food.rating || vendor?.rating || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
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

  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(foods) || foods.length === 0) return {};
    return foods.reduce((acc, food) => {
      const primaryCategory = food.platform_category?.parent?.name 
        || food.platform_category?.name
        || (Array.isArray(food.categories) && food.categories[0])
        || food.category
        || "Recommended";
      if (!acc[primaryCategory]) acc[primaryCategory] = [];
      acc[primaryCategory].push(food);
      return acc;
    }, {});
  }, [foods]);

  if (isLoading) return <HomeFoodListSkeleton />;

  if (!userLocation) return null;

  if (isError || foods.length === 0) return null;

  return (
    <div className="space-y-8 pb-10">
      {Object.entries(foodsByCategory).map(([category, categoryFoods]) => (
        <div key={category} className="px-0">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight capitalize">{category}</h2>
            </div>
            
            <Link
               href={`/search?category=${encodeURIComponent(category)}`}
               className="text-orange-600 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-orange-50 dark:hover:bg-orange-500/10 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 group"
            >
              View All
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar">
            {categoryFoods.map((food) => (
              <FoodCard key={food._id} food={food} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
