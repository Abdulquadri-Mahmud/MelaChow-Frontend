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

import { useMemo, useState, useEffect } from "react";
import { Flame, Star, Store, MapPin, Heart, Globe, Bike, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useFoodModalStore } from "@/app/store/foodModalStore";

const DIETARY_COLORS = {
  veg: "bg-green-100 text-green-700",
  vegan: "bg-emerald-100 text-emerald-700",
  halal: "bg-teal-100 text-teal-700",
  kosher: "bg-blue-100 text-blue-700",
  "non-veg": "bg-red-100 text-red-700",
};

const TrendingCard = ({ item }) => {
    const router = useRouter();
    const vendor = item.restaurant || item.vendor;
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");
    const openFoodModal = useFoodModalStore(state => state.openFoodModal);

    const fee = item.deliveryFee ?? vendor?.deliveryFee ?? vendor?.flatRateDeliveryFee;
    const isFreeDelivery = !fee || fee === 0;

    return (
        <div
            onClick={() => openFoodModal(item._id, { food: item })}
            className={`group shrink-0 bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden cursor-pointer snap-start transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:shadow-xl`}
            style={{ width: "75vw", maxWidth: "280px" }}
        >
            {/* Image Container */}
            <div className="relative h-[140px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!isOpen ? 'grayscale' : ''}`}
                />
                
                {/* Hot Badge */}
                <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded-lg shadow-lg z-10">
                    <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1 italic">
                        <Flame size={10} fill="currentColor" className="animate-pulse" /> Trending
                    </span>
                </div>

                {/* Price Badge - Moved to top-right to avoid collision */}
                <div className="absolute top-2 right-2 bg-white/95 dark:bg-zinc-900/95 px-2 py-1 rounded-xl shadow-lg border border-white/20 backdrop-blur-sm z-10">
                    <span className="text-[11px] font-black text-zinc-900 dark:text-white italic">
                        ₦{item.price?.toLocaleString()}
                    </span>
                </div>

                {/* Floating Promo Badge - Conditionally shown if delivery is free */}
                {isFreeDelivery && (
                  <div className="absolute bottom-3 right-3 bg-[#FFF9E5] border border-black/10 px-3 py-1.5 rounded-[12px] shadow-sm flex items-center gap-2">
                    <Gift size={14} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-zinc-800 tracking-tight">
                      Free delivery
                    </span>
                  </div>
                )}

                {/* Closed Overlay */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/20">
                            Closed
                        </span>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="px-1 pt-3 pb-4">
                {/* Title Row */}
                <div className="mb-2">
                    <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate">
                        {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
                         <Store size={10} className="text-orange-500" />
                         <span className="truncate">{vendor?.storeName} - {vendor?.city}</span>
                    </div>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-[11px] font-medium mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-500">
                        {/* Global Icon */}
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Globe size={10} className="text-indigo-600 dark:text-indigo-400" />
                        </div>

                        <span className="text-zinc-200">|</span>

                        {/* Delivery */}
                        <div className="flex items-center gap-1">
                            <Bike size={14} className="text-zinc-800 dark:text-zinc-200" />
                            <span className="text-zinc-800 dark:text-zinc-200">
                                From {isFreeDelivery ? "Free" : `₦${fee}`}
                            </span>
                        </div>

                        <span className="text-zinc-200">|</span>

                        {/* Status */}
                        <span className={isOpen ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                            {isOpen ? "Open" : "Closed"}
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-zinc-900 dark:text-white font-bold">
                            {Number(item.rating || 0) === 0 ? "New" : Number(item.rating).toFixed(1)}
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

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

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
        enabled: !!baseUrl && !!defaultAddr?.city && !!defaultAddr?.state && mounted,
        staleTime: 1000 * 60 * 5,
    });

    if (!mounted || isLoading) return (
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
