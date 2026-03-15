/*
 * PAYLOAD REFERENCE — do not guess field names
 *
 * item.image           → flat string
 * item.price           → naira
 * item.restaurant._id  → use for navigation
 * item.restaurant.storeName
 * item.restaurant.city
 * item.restaurant.openingHours
 * item.restaurant.flatRateDeliveryFee
 * item.rating
 * item.ratingCount
 */

import { useMemo, useState } from "react";
import { Flame, Star, Store, MapPin, Heart, Globe, Bike } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { isVendorOpen } from "@/app/lib/utils";

const DIETARY_COLORS = {
  veg: "bg-green-100 text-green-700",
  vegan: "bg-emerald-100 text-emerald-700",
  halal: "bg-teal-100 text-teal-700",
  kosher: "bg-blue-100 text-blue-700",
  "non-veg": "bg-red-100 text-red-700",
};

const TrendingCard = ({ item }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const vendor = item.restaurant || item.vendor;
    const isOpen = isVendorOpen(vendor?.openingHours);

    console.log(item)

    return (
        <div
            onClick={() => router.push(`/restaurants/${vendor?._id}`)}
            className={`group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer snap-start transition-all duration-300 ${!isOpen ? '' : ''}`}
            style={{ width: "72vw", maxWidth: "280px" }}
        >
            {/* Image Container */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Hot Badge */}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Flame size={8} fill="currentColor" /> HOT
                    </span>
                </div>

                {/* Dietary Badge - Bottom Left */}
                {item.dietary_type && item.dietary_type !== "mixed" && (
                    <div className="absolute bottom-2 left-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${DIETARY_COLORS[item.dietary_type] || "bg-zinc-100 text-zinc-500"}`}>
                            {item.dietary_type}
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1: Name + Heart */}
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[calc(100%-28px)]">
                        {item.name}
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

                {/* Row 2: Price • Vendor Name */}
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                    <span className="font-bold text-gray-900 dark:text-white">₦{item.price?.toLocaleString()}</span> • {item.restaurant?.storeName}
                </p>

                {/* Row 3: Metadata Line: Globe | Delivery | Status | Rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                    <Globe size={14} className="text-gray-400 dark:text-zinc-500" />
                    
                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Bike size={14} className="text-gray-400 dark:text-zinc-500" />
                        {(() => {
                            const fee = item.deliveryFee ?? item.restaurant?.deliveryFee ?? item.restaurant?.flatRateDeliveryFee;
                            return (!fee || fee === 0) ? (
                                <span className="text-xs font-bold text-gray-900 dark:text-white">Free</span>
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-zinc-400">₦{fee.toLocaleString()}</span>
                            );
                        })()}
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Status */}
                    <span className={`text-xs font-bold whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isOpen ? "Open" : "Closed"}
                    </span>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                        <Star size={10} className="fill-orange-500 text-orange-500" />
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white">{Number(item.rating || 0).toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TrendingFoods({ user }) {
    const router = useRouter();
    const { baseUrl } = useApi();

    const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

    const { data: trendingFoods = [], isLoading, isError } = useQuery({
        queryKey: ["trendingFoods", defaultAddr?.city, defaultAddr?.state],
        queryFn: async () => {
            const res = await axios.get(`${baseUrl}/user/trending`, {
                params: {
                    city: defaultAddr?.city,
                    state: defaultAddr?.state,
                },
                withCredentials: true,
            });
            return res?.data?.trending || [];
        },
        enabled: !!baseUrl && !!defaultAddr?.city && !!defaultAddr?.state,
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) return (
        <div className="mt-8 px-4">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-600 fill-orange-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Trending Near You</h2>
            </div>
            <HomeFoodListSkeleton categories={1} itemsPerCategory={3} />
        </div>
    );

    if (isError || trendingFoods.length === 0) return null;

    return (
        <div className="mt-8 px-0">
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-lg">
                        <Flame className="text-orange-600 fill-orange-600" size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Trending Near You</h2>
                </div>
            </div>

            <div className="flex gap-4 scroll overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar">
                {trendingFoods.map((item) => (
                    <TrendingCard key={item._id} item={item} />
                ))}
            </div>
        </div>
    );
}
