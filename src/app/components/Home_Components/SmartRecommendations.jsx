"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Clock,
    Store,
    Truck,
    Sparkles,
    TrendingUp,
    Wallet,
    Flame,
    Heart,
    Globe,
    Bike,
    Star
} from "lucide-react";
import { getRecommendations } from "@/app/lib/api";
import { isVendorOpen } from "@/app/lib/utils";

const DIETARY_COLORS = {
  veg: "bg-green-100 text-green-700",
  vegan: "bg-emerald-100 text-emerald-700",
  halal: "bg-teal-100 text-teal-700",
  kosher: "bg-blue-100 text-blue-700",
  "non-veg": "bg-red-100 text-red-700",
};

// --- Sub-Component: Food Card (Simplified Premium Style) ---
const RecommendationCard = ({ food, router }) => {
    const [liked, setLiked] = useState(false);
    const vendor = food.restaurant || food.vendor;
    const isOpen = isVendorOpen(vendor?.openingHours);

    return (
        <div
            onClick={() => router.push(`/food-details/${food._id}`)}
            className={`group shrink-0 w-[80vw] sm:w-[320px] bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer snap-center sm:snap-start transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:shadow-xl ${!isOpen ? 'opacity-75 grayscale-[0.2]' : ''}`}
        >
            {/* Image Container */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={food.image || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Popular Badge */}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={8} fill="currentColor" /> POPULAR
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
                    {vendor?.storeName} • {vendor?.city || "Nearby"}
                </p>

                {/* Row 3: Metadata Line: Globe | Delivery | Status | Rating */}
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

                    {/* Status */}
                    <span className={`text-xs font-bold whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isOpen ? "Open" : "Closed"}
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

// --- Recommendation Section Layout ---
const RecommendationSection = ({ title, icon: Icon, items, router, accentColor = "text-orange-600", accentBg = "bg-orange-100" }) => {
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
            </div>

            <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar px-4">
                {items.map((food) => (
                    <RecommendationCard key={food._id} food={food} router={router} />
                ))}
            </div>
        </div>
    );
};

// --- Main Container ---
export default function SmartRecommendations() {
    const router = useRouter();

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
            {/* 1. Time Based Hero */}
            <RecommendationSection
                title={meta?.timeOfDayLabel || "Recommended for you"}
                icon={Clock}
                items={arrays.timeOfDay}
                router={router}
                accentColor="text-orange-600"
                accentBg="bg-orange-100 dark:bg-orange-500/20"
            />

            {/* 2. Trending Nearby */}
            <RecommendationSection
                title={`Trending in ${meta?.location?.city || "your area"}`}
                icon={TrendingUp}
                items={arrays.trendingNearby}
                router={router}
                accentColor="text-rose-600"
                accentBg="bg-rose-100 dark:bg-rose-500/20"
            />

            {/* 3. Hidden Gems */}
            <RecommendationSection
                title="Curated Choices"
                icon={Sparkles}
                items={arrays.underrated}
                router={router}
                accentColor="text-purple-600"
                accentBg="bg-purple-100 dark:bg-purple-500/20"
            />

            {/* 4. Budget Friendly */}
            <RecommendationSection
                title="Everyday Favorites"
                icon={Wallet}
                items={arrays.budgetFriendly}
                router={router}
                accentColor="text-emerald-600"
                accentBg="bg-emerald-100 dark:bg-emerald-500/20"
            />
        </div>
    );
}
