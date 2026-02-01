"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Clock,
    Store,
    Truck,
    Sparkles,
    TrendingUp,
    Wallet,
    Flame
} from "lucide-react";
import { getRecommendations } from "@/app/lib/api";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

// --- Sub-Component: Food Card (Styled exactly like TrendingFoods) ---
const RecommendationCard = ({ food, router }) => {
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

    // A. Check Restaurant Global Status
    const restaurantStatusMsg = getVendorOpenAndCloseStatus(food.restaurant?.openingHours);
    const isRestaurantOpen = restaurantStatusMsg ? restaurantStatusMsg.toLowerCase().startsWith("open now") : true;

    // B. Check Food Specific Schedule
    let isFoodScheduleOpen = true;
    if (food.availabilitySchedule?.enabled) {
        const now = new Date();
        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDay = daysMap[now.getDay()];

        if (!food.availabilitySchedule.days.includes(currentDay)) {
            isFoodScheduleOpen = false;
        } else {
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
    const isOpen = isRestaurantOpen && isFoodScheduleOpen;

    // Helper for friendly status
    const getFriendlyStatus = () => {
        if (!isRestaurantOpen && restaurantStatusMsg) {
            const parts = restaurantStatusMsg.split("open by");
            if (parts.length > 1) {
                return `Opens ${parts[1].replace('.', '').trim()}`;
            }
        }
        return "Opens Later";
    };
    const friendlyStatus = getFriendlyStatus();

    return (
        <div
            onClick={() => router.push(`/food-details/${food._id}`)}
            className={`group relative flex-none w-[250px] bg-white rounded-[24px] transition-all duration-300 cursor-pointer snap-start overflow-hidden ${!isOpen ? 'opacity-80 grayscale-[0.5]' : ''}`}
        >
            {/* Image Container */}
            <div className="relative h-[140px] w-full bg-gray-100 overflow-hidden">
                <img
                    src={food.images?.[0]?.url || "/placeholder.jpg"}
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

                {/* Price Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 rounded-xl">
                    <span className="text-[10px] font-black text-gray-900 tracking-tighter">
                        ₦{finalPrice.toLocaleString()}
                    </span>
                </div>

                {/* Discount Badge */}
                {hasDiscount && isOpen && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-0.5 rounded-lg">
                        <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            {discountLabel}
                        </span>
                    </div>
                )}

                {/* Use generic 'Recommended' badge if no discount */}
                {!hasDiscount && isOpen && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                        <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={8} fill="currentColor" /> BEST
                        </span>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 pointer-events-none" />
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

                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${!isOpen ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <Clock size={10} className={!isOpen ? "text-red-500" : "text-orange-500"} />
                        <span className={`text-[9px] font-bold ${!isOpen ? 'text-red-500' : 'text-gray-700'}`}>
                            {isOpen ? `${food?.estimatedDeliveryTime || "25"}m` : friendlyStatus}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Recommendation Section Layout ---
const RecommendationSection = ({ title, icon: Icon, items, router, accentColor = "text-orange-600" }) => {
    if (!items || items.length === 0) return null;

    // Map accent colors to background colors roughly
    const getBgColor = (textClass) => {
        if (textClass.includes('orange')) return 'bg-orange-100';
        if (textClass.includes('rose')) return 'bg-rose-100';
        if (textClass.includes('purple')) return 'bg-purple-100';
        if (textClass.includes('emerald')) return 'bg-emerald-100';
        return 'bg-gray-100';
    }

    return (
        <div className="mt-8 px-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${getBgColor(accentColor)}`}>
                        <Icon className={accentColor} size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight capitalize">
                        {title}
                    </h2>
                </div>
            </div>

            <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
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
        queryFn: () => getRecommendations(), // No args, let API handle location via cookie
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="mt-8 px-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="w-48 h-6 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[250px] h-[220px] rounded-[24px] bg-gray-100 animate-pulse flex-none" />
                    ))}
                </div>
            </div>
        );
    }

    if (!recommendations?.success || !recommendations?.data) return null;

    const { meta, data: arrays } = recommendations;

    // console.log(recommendations);

    return (
        <div className="flex flex-col gap-2 pb-2 border-b border-gray-100">
            {/* 1. Time Based Hero */}
            <RecommendationSection
                title={meta?.timeOfDayLabel || "Recommended for you"}
                icon={Clock}
                items={arrays.timeOfDay}
                router={router}
                accentColor="text-orange-600"
            />

            {/* 2. Trending Nearby */}
            <RecommendationSection
                title={`Trending in ${meta?.location?.city || "your area"}`}
                icon={TrendingUp}
                items={arrays.trendingNearby}
                router={router}
                accentColor="text-rose-600"
            />

            {/* 3. Hidden Gems */}
            <RecommendationSection
                title="Curated Choices"
                icon={Sparkles}
                items={arrays.underrated}
                router={router}
                accentColor="text-purple-600"
            />

            {/* 4. Budget Friendly */}
            <RecommendationSection
                title="Everyday Favorites"
                icon={Wallet}
                items={arrays.budgetFriendly}
                router={router}
                accentColor="text-emerald-600"
            />
        </div>
    );
}
