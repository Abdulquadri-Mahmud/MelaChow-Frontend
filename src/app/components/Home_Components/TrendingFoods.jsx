"use client";

import { useMemo } from "react";
import { Star, Flame, Clock, Truck, Store, Plus, MapPin } from "lucide-react";
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
            const token = localStorage.getItem("userToken");

            // Using the user's location if available to get relevant trending foods
            const res = await axios.get(`${baseUrl}/user/trending`, {
                params: {
                    city: defaultAddr?.city,
                    state: defaultAddr?.state,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res?.data?.trending || [];
        },
        refetchInterval: 60000,
        refetchOnWindowFocus: true,
    });

    if (isLoading) return (
        <div className="mt-4 px-3">
            <div className="flex items-center gap-2 mb-3">
                <Flame className="text-orange-600 fill-orange-600" size={20} />
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Trending Near You</h2>
            </div>
            <HomeFoodListSkeleton categories={1} itemsPerCategory={3} />
        </div>
    );

    // If there's a location error, we handle it gracefully or show nothing if targeted at "Trending"
    // but usually trending should show something even if location is off.
    // We'll follow the pattern of the other components if the backend requires location.

    if (isError) {
        const errorMsg = error?.response?.data?.message;
        if (errorMsg === "Please provide both city and state query parameters.") {
            return null; // Don't show trending if location is missing, let the main list handle the prompt
        }
        return null; // Silent fail for trending to keep UI clean
    }

    if (trendingFoods.length === 0) return null;

    return (
        <div className="mt-6 px-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-1.5 rounded-lg">
                        <Flame className="text-orange-600 fill-orange-600" size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Trending Near You</h2>
                </div>
                <button
                    onClick={() => router.push('/trending-foods')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                    See All
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto scroll no-scrollbar snap-x snap-mandatory pb-4 scroll-smooth">
                {trendingFoods.map((food) => (
                    <div
                        key={food._id}
                        className="bg-white rounded-md min-w-[250px] cursor-pointer snap-start hover:shadow-lg transition flex flex-col h-full border border-gray-50"
                        onClick={() => router.push(`/food-details/${food._id}`)}
                    >
                        {/* Image Section */}
                        <div className="relative rounded-md overflow-hidden">
                            <img
                                src={food.image || "/placeholder.jpg"}
                                alt={food.name}
                                className="w-full h-32 object-cover rounded-md"
                            />
                            <div className="absolute top-2 right-2 bg-white backdrop-blur-md text-orange-600 px-2 py-1 rounded text-[10px] font-bold shadow-sm border border-orange-100">
                                from | ₦{food.price?.toLocaleString()}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-2 flex flex-col flex-1">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="text-sm font-bold text-gray-800 truncate flex-1 uppercase tracking-tight">
                                    {food.name}
                                </h3>
                                <div className="bg-orange-50 p-1.5 rounded-lg text-orange-500">
                                    <Plus size={16} />
                                </div>
                            </div>

                            <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                                <Store className="text-orange-500" size={12} />
                                <span className="truncate">{food?.restaurant?.storeName || "Vendor"}</span>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                    <Truck size={12} className="text-orange-400" />
                                    <span>from | ₦{food.deliveryFee || food?.restaurant?.deliveryFee || 0}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                    <Clock size={12} className="text-orange-400" />
                                    <span>{food?.estimatedDeliveryTime || "25"}m</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
