"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Clock,
    TrendingUp,
    Heart,
    Globe,
    Bike,
    Star,
    ChevronRight,
} from "lucide-react";
import { getRecommendations } from "@/app/lib/api";
import { getDeliveryEtaLabel } from "@/app/lib/deliveryEta";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useFoodModalStore } from "@/app/store/foodModalStore";

const DIETARY_COLORS = {
  veg: "bg-green-100 text-green-700",
  vegan: "bg-emerald-100 text-emerald-700",
  halal: "bg-teal-100 text-teal-700",
  kosher: "bg-blue-100 text-blue-700",
  "non-veg": "bg-red-100 text-red-700",
};

const RecommendationCard = ({ food, customerAddress }) => {
    const [liked, setLiked] = useState(false);
    const vendor = food.restaurant || food.vendor;
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");
    const openFoodModal = useFoodModalStore(state => state.openFoodModal);

    return (
        <div
            onClick={() => openFoodModal(food._id, { food })}
            className={`group shrink-0 snap-start bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:shadow-xl ${!isOpen ? '' : ''}`}
            style={{ width: "72vw", maxWidth: "280px" }}
        >
            {/* Image Container */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={food.image || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-bold text-white shadow-sm ${
                    isOpen ? "bg-emerald-600" : "bg-zinc-700"
                }`}>
                    {isOpen ? "Open now" : "Closed"}
                </span>

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

                <p className="mt-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Est. delivery {getDeliveryEtaLabel(customerAddress, vendor, vendor?.estimatedDeliveryTime)}
                </p>
                {/* Row 3: Delivery and rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                    <Globe size={14} className="text-gray-400 dark:text-zinc-500" />
                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Bike size={14} className="text-gray-400 dark:text-zinc-500" />
                        {(() => {
                            const fee = food.deliveryFee;
                            return (!fee || fee === 0) ? (
                                <span className="text-xs font-bold text-gray-900 dark:text-white">Free</span>
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-zinc-400">₦{fee.toLocaleString()}</span>
                            );
                        })()}
                    </div>

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

// --- Recommendation Section Layout ---
const RecommendationSection = ({ title, icon: Icon, items, router, viewAllRoute = "/all-foods", accentColor = "text-orange-600", accentBg = "bg-orange-100" }) => {
    if (!items || items.length === 0) return null;
 
    return (
        <div className="mt-8 px-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${accentBg}`}>
                        <Icon className={accentColor} size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight capitalize">
                        {title}
                    </h2>
                </div>

                <button
                    onClick={() => router.push(viewAllRoute)}
                    className={`${accentColor} text-[10px] font-black uppercase tracking-[0.1em] hover:opacity-70 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 group`}
                >
                    View All
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
 
            <div
                className="flex gap-3 overflow-x-auto scroll pb-3 snap-x snap-mandatory scrollbar-hide no-scrollbar"
                style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
            >
                {items.map((food) => (
                    <RecommendationCard key={food._id} food={food} customerAddress={customerAddress} />
                ))}
            </div>
        </div>
    );
};

// --- Main Container ---
export default function SmartRecommendations({ user }) {
    const router = useRouter();
    const customerAddress = user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0];

    const { data: recommendations, isLoading } = useQuery({
        queryKey: ["smartRecommendations"],
        queryFn: () => getRecommendations(),
        staleTime: 1000 * 60 * 5,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="mt-8 px-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    <div className="w-48 h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[280px] h-[220px] rounded-[24px] bg-zinc-100 dark:bg-zinc-800 animate-pulse flex-none" />
                    ))}
                </div>
            </div>
        );
    }

    if (!recommendations?.success || !recommendations?.data) return null;

    const { meta, data: arrays } = recommendations;

    return (
        <div className="flex flex-col gap-2 pb-2">
            {/* Popularity is based on completed orders in the customer's city. */}
            <RecommendationSection
                title="Popular Near You"
                icon={TrendingUp}
                items={arrays.trendingNearby}
                router={router}
                viewAllRoute="/trending-foods"
                accentColor="text-orange-600"
                accentBg="bg-orange-100 dark:bg-orange-500/20"
            />

            {/* Time-aware recommendations; use curated/budget items if no tag matches. */}
            <RecommendationSection
                title={meta?.timeOfDayLabel
                    ? `Recommended for you · ${meta.timeOfDayLabel}`
                    : "Recommended for you"}
                icon={Clock}
                items={arrays.timeOfDay?.length
                    ? arrays.timeOfDay
                    : arrays.underrated?.length
                        ? arrays.underrated
                        : arrays.budgetFriendly}
                router={router}
                viewAllRoute="/all-foods"
                accentColor="text-orange-600"
                accentBg="bg-orange-100 dark:bg-orange-500/20"
            />
        </div>
    );
}
