/*
 * PAYLOAD REFERENCE — do not guess field names
 *
 * food.image           → flat string (NOT images[])
 * food.price           → naira (NOT kobo, do NOT ÷100)
 * food.portions[].price_naira → naira
 * food.choiceGroups    → array (same key as before)
 * food.restaurant._id  → use for navigation
 * food.dietary_type    → "halal"|"veg"|"mixed" etc.
 * food.item_type       → "FOOD"|"DRINK"|"SOUP" etc.
 *
 * Navigate to vendor storefront:
 *   /restaurants/${food.restaurant._id}
 * NOT:
 *   /foods/${food.slug}  ← slug removed from MenuItem
 */

import { useMemo, useState, useEffect } from "react";
import { Store, MapPin, Star, BadgeCheck, Heart, Globe, Bike, Gift, Utensils, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

import { getFoodsByLocation } from "@/app/lib/userApi";

const VendorCardSkeleton = () => (
    <div
        className="flex-shrink-0 h- rounded-2xl overflow-hidden bg-white dark:bg-zinc-900"
        style={{
            width: "72vw", maxWidth: "280px",
            boxShadow: ""
        }}
    >
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            style={{ height: 100 }} />
        <div className="px-3 pt-3 pb-4 space-y-2">
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full w-4/5" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full w-3/5" />
        </div>
    </div>
);

const VendorCard = ({ _id, storeName, city, image, status, isOpen, rating, ratingCount, deliveryFee, badge }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(false);

    return (
        <div
            onClick={() => router.push(`/restaurants/${_id}`)}
            className={`flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer snap-start transition-all duration-300 ${!isOpen ? '' : ''}`}
            style={{
                width: "72vw", maxWidth: "280px",
                boxShadow: ""
            }}
        >
            {/* Image Block */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {image ? (
                    <img src={image} alt={storeName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
                        <Utensils className="text-zinc-300 dark:text-zinc-600" size={40} />
                    </div>
                )}

                {/* Badge Overlay */}
                {badge && (
                    <div className="absolute bottom-[10px] left-[10px] bg-white dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 max-w-[90%]">
                        <Gift size={12} className="text-orange-500" />
                        <span className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{badge}</span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1 */}
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[calc(100%-28px)]">
                        {storeName}
                        <span className="text-[11px] font-normal text-gray-500 dark:text-zinc-400 ml-1.5">• {city || "Nearby"}</span>
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

                {/* Row 2: Metadata Line */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                    <Globe size={14} className="text-gray-400 dark:text-zinc-500" />
                    
                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-[13px]">🛵</span>
                        {(() => {
                            const isFree = !deliveryFee || deliveryFee === 0;
                            const deliveryText = isFree ? "Free" : `From ₦${deliveryFee.toLocaleString()}`;
                            return (
                                <span className={`text-[12px] ${isFree ? "font-bold text-gray-900 dark:text-white" : "font-normal text-gray-500 dark:text-zinc-400"}`}>
                                    {deliveryText}
                                </span>
                            );
                        })()}
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Status */}
                    <span className={`text-[10px] font-black uppercase italic whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {status}
                    </span>

                    {/* Rating — only render if rating data exists */}
                    {rating != null && rating > 0 && (
                        <>
                            <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <span className="text-[13px]">⭐</span>
                                <span className="text-[12px] font-bold text-gray-900 dark:text-white">
                                    {rating.toFixed(1)}
                                </span>
                                {ratingCount != null && (
                                    <span className="text-[11px] text-gray-400">
                                        ({ratingCount.toLocaleString()})
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function VendorList({ user }) {
    const router = useRouter();

    // Location state with localStorage fallback
    const [userLocation, setUserLocation] = useState(() => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem("grubdash_location");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Sync with default address
    useEffect(() => {
        if (!userLocation && user?.addresses) {
            const defaultAddr = user.addresses.find((a) => a.isDefault);
            if (defaultAddr?.city && defaultAddr?.state) {
                const loc = { city: defaultAddr.city, state: defaultAddr.state };
                setUserLocation(loc);
                localStorage.setItem("grubdash_location", JSON.stringify(loc));
            }
        } else if (!userLocation && !user) {
            // Optional: Default location for guests so they see content
            // const defaultLoc = { city: "Sagamu", state: "Ogun State" };
            // setUserLocation(defaultLoc);
        }
    }, [user, userLocation]);

    const { data: responseData, isLoading, isError } = useQuery({
        queryKey: ["foods-by-location", userLocation?.city, userLocation?.state],
        queryFn: () => getFoodsByLocation({
            city: userLocation.city,
            state: userLocation.state,
        }),
        enabled: !!userLocation?.city && !!userLocation?.state,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // console.log(responseData);

    const foods = responseData?.foods || [];

    const uniqueVendors = useMemo(() => {
        const seen = new Set();
        const result = [];

        for (const food of (foods || [])) {
            const vendor = food.restaurant || food.vendor;
            const id = vendor?._id?.toString();
            if (!id || seen.has(id)) continue;
            seen.add(id);

            result.push({
                _id: vendor._id,
                storeName: vendor.storeName,
                city: vendor.city,
                // Use logo as card image — no coverImage in this payload
                image: vendor.logo || null,
                isOpen: getVendorOpenAndCloseStatus(vendor.openingHours).startsWith("Open now"),
                status: getVendorOpenAndCloseStatus(vendor.openingHours),
                // deliveryFee is on the food item, not the restaurant
                deliveryFee: food.deliveryFee ?? vendor.deliveryFee ?? vendor.flatRateDeliveryFee ?? null,
                // rating/ratingCount NOT in this payload
                // render conditionally — show nothing if 0
                rating: vendor.rating || null,
                ratingCount: vendor.ratingCount || null,
                badge: null,
            });
        }

        return result;
    }, [foods]);

    const featuredVendors = uniqueVendors.slice(0, 6);
    const handpickedVendors = uniqueVendors.slice(6, 12);

    if (isLoading) return (
        <div className="mb-6">
            <div className="flex items-center gap-2 px-4 mb-3.5">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg animate-pulse">
                    <div className="w-4.5 h-4.5" />
                </div>
                <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />
            </div>
            <div className="flex scroll overflow-x-auto gap-3 px-4 pb-3 scrollbar-none">
                {[1, 2, 3].map(n => <VendorCardSkeleton key={n} />)}
            </div>
        </div>
    );

    if (isError) return null;

    if (!uniqueVendors.length) {
        if (!userLocation) return null;

        return (
            <div className="px-0 mb-6">
                <div className="flex items-center gap-2 px-4 mb-4">
                    <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-lg">
                        <Sparkles className="text-orange-600 fill-orange-600" size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Featured Restaurants</h2>
                </div>

                <div className="px-4">
                    <div className="bg-orange-50/50 dark:bg-orange-500/5 rounded-[24px] p-8 text-center border border-orange-100/50 dark:border-orange-500/20 flex flex-col items-center">
                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-full mb-3">
                            <MapPin className="text-orange-500" size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1">Coming Soon to {userLocation?.city}!</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] leading-relaxed">
                            We're currently onboarding top-tier restaurants in your area. Get your appetite ready!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-0">
            <div className="">
                <div className="flex items-center justify-between px-4 mb-3.5">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-lg">
                            <Sparkles className="text-orange-600 fill-orange-600" size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                            Featured Restaurants
                        </h2>
                    </div>
                    <Link
                        href="/all-restaurants"
                        className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                        View all
                    </Link>
                </div>
                <div
                    className="flex scroll overflow-x-auto gap-3 pb-3 scrollbar-hide no-scrollbar"
                    style={{
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch"
                    }}
                >
                    {featuredVendors.map(v => <VendorCard key={v._id} {...v} />)}
                </div>
            </div>

            {/* Handpicked section — only if enough vendors */}
            {handpickedVendors.length > 0 && (
                <div className="">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white px-4 mb-3.5 flex items-center gap-2">
                        Handpicked for you <Heart size={18} className="text-green-500 fill-green-500" />
                    </h2>
                    <div
                        className="flex overflow-x-auto gap-3 px-4 pb-3 scrollbar-hide no-scrollbar"
                        style={{
                            scrollSnapType: "x mandatory",
                            WebkitOverflowScrolling: "touch"
                        }}
                    >
                        {handpickedVendors.map(v => <VendorCard key={v._id} {...v} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
