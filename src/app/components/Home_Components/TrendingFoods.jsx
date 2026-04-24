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
import { Flame, Star, Store, MapPin, Heart, Globe, Bike, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

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
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");

    return (
        <div
            onClick={() => router.push(`/food-details/${item._id}`)}
            className={`group shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer snap-start transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:shadow-xl`}
            style={{ width: "72vw", maxWidth: "250px" }}
        >
            {/* Image Container */}
            <div className="relative h-[140px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isOpen ? 'grayscale' : ''}`}
                />
                
                {/* Hot Badge */}
                <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded-lg shadow-lg z-10">
                    <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1 italic">
                        <Flame size={10} fill="currentColor" className="animate-pulse" /> Trending
                    </span>
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-zinc-900/95 px-2 py-1 rounded-xl shadow-lg border border-white/20 backdrop-blur-sm">
                    <span className="text-[11px] font-black text-zinc-900 dark:text-white italic">
                        ₦{item.price?.toLocaleString()}
                    </span>
                </div>

                {/* Closed Overlay */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/20">
                            Closed
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-3 pb-3">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight italic leading-tight">
                            {item.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 font-bold text-zinc-400 text-[9px] uppercase tracking-widest">
                             <Store size={9} className="text-orange-500" />
                             <span className="truncate">{item.restaurant?.storeName}</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors mt-0.5"
                    >
                        <Heart
                            size={18}
                            className={liked ? "fill-red-500 text-red-500" : "text-zinc-200 dark:text-zinc-800"}
                            strokeWidth={liked ? 0 : 2}
                        />
                    </button>
                </div>

                <div className="mt-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter italic">
                        <Star size={12} className="fill-orange-500 text-orange-500" />
                        <span>
                            {Number(item.rating || 0) === 0 
                                ? "New" 
                                : `${Number(item.rating).toFixed(1)} (${item.ratingCount || 0})`}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
                        <Bike size={12} className="text-orange-600" />
                        <span>
                            {(() => {
                                const fee = item.deliveryFee ?? item.restaurant?.deliveryFee ?? item.restaurant?.flatRateDeliveryFee;
                                return (!fee || fee === 0) ? "Free Delivery" : `₦${fee.toLocaleString()} Fee`;
                            })()}
                        </span>
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
        <div className="mt-6 px-0">
            <div className="flex items-center justify-between px-2 mb-3.5">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Flame className="text-orange-600 fill-orange-600 animate-pulse" size={20} />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight italic uppercase">Trending Now</h2>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                        Top picks based on search trends near you
                    </p>
                </div>
                <button 
                  onClick={() => router.push("/trending-foods")}
                  className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:opacity-70 flex items-center gap-1 group"
                >
                  View All
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            <div className="flex gap-3 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar">
                {trendingFoods.map((item) => (
                    <TrendingCard key={item._id} item={item} />
                ))}
            </div>
        </div>
    );
}
