"use client";

import { useMemo } from "react";
import { Flame, Clock, Truck, Store, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";

export default function TrendingFoods({ user }) {
    const router = useRouter();
    const { baseUrl } = useApi();

    const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

    const { data: trendingFoods = [], isLoading, isError, error } = useQuery({
        queryKey: ["trendingFoods", defaultAddr?.city, defaultAddr?.state],
        queryFn: async () => {
            // Using the user's location if available to get relevant trending foods
            const res = await axios.get(`${baseUrl}/user/trending`, {
                params: {
                    city: defaultAddr?.city,
                    state: defaultAddr?.state,
                },
                withCredentials: true, // ✅ Use cookie-based auth
            });
            return res?.data?.trending || [];
        },
        refetchInterval: 60000,
        refetchOnWindowFocus: true,
    });

    if (isLoading) return (
        <div className="mt-8 px-4">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-600 fill-orange-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Trending Near You</h2>
            </div>
            <HomeFoodListSkeleton categories={1} itemsPerCategory={3} />
        </div>
    );

    if (isError) {
        // Silent fail for trending or minimal logs
        return null;
    }

    // console.log(trendingFoods)

    if (trendingFoods.length === 0) return null;

    return (
        <div className="mt-8 px-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-1.5 rounded-lg">
                        <Flame className="text-orange-600 fill-orange-600" size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Trending Near You</h2>
                </div>
                <button
                    onClick={() => router.push('/trending-foods')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-full"
                >
                    View All
                </button>
            </div>

            {/* Horizontal Scroll List */}
            <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {trendingFoods.map((food) => (
                    <div
                        key={food._id}
                        onClick={() => router.push(`/food-details/${food._id}`)}
                        className="group relative flex-none w-[250px] bg-white rounded-[24px] transition-all duration-300 cursor-pointer snap-start overflow-hidden"
                    >
                        {/* Image Container */}
                        <div className="relative h-[140px] w-full bg-gray-100 overflow-hidden">
                            <img
                                src={food.image || "/placeholder.jpg"}
                                alt={food.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Price Badge */}
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 rounded-xl">
                                <span className="text-[10px] font-black text-gray-900 tracking-tighter">
                                    ₦{Number(food.price).toLocaleString()}
                                </span>
                            </div>

                            {/* Trending Badge (Rank) */}
                            <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                                <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Flame size={8} fill="currentColor" /> HOT
                                </span>
                            </div>

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                        </div>

                        {/* Content */}
                        <div className="p-3">
                            <div className="mb-2">
                                <h3 className="font-bold text-gray-900 text-sm truncate leading-tight tracking-tight mb-0.5">{food.name}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Store size={10} className="text-orange-500" />
                                    <span className="truncate max-w-[140px] font-medium opacity-80">{food?.restaurant?.storeName || "GrubDash Vendor"}</span>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-1">
                                    <Truck size={12} className="text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400">
                                        ₦{food.deliveryFee || food?.restaurant?.deliveryFee || 0}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md">
                                    <Clock size={10} className="text-orange-500" />
                                    <span className="text-[9px] font-bold text-gray-700">
                                        {food?.estimatedDeliveryTime || "25"}m
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
