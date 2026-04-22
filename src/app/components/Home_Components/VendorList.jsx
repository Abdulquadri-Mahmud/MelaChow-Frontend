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
import { Store, MapPin, Star, BadgeCheck, Heart, Globe, Bike, Gift, Utensils, Sparkles, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

import { getNearbyVendors } from "@/app/lib/userApi";
import { useLocationStore } from "@/app/store/userLocationStore";

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
        <Link
            href={`/restaurants/${_id}`}
            className={`group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden cursor-pointer snap-start transition-all duration-300 block border border-zinc-100 dark:border-zinc-800 hover:shadow-xl`}
            style={{ width: "58vw", maxWidth: "240px" }}
        >
            {/* Image Block */}
            <div className="relative h-[120px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {image ? (
                    <img src={image} alt={storeName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
                        <Utensils className="text-zinc-300 dark:text-zinc-600" size={40} />
                    </div>
                )}

                {/* Rating - Floating Badge */}
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-zinc-900/90 px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-white/20">
                    <Star size={12} className="fill-orange-500 text-orange-500" />
                    <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                        {Number(rating || 0).toFixed(1)}
                    </span>
                    {ratingCount > 0 && (
                      <span className="text-[8px] font-bold text-zinc-400">
                        ({ratingCount.toLocaleString()})
                      </span>
                    )}
                </div>

                {/* Status Overlay */}
                <div className="absolute top-2 right-2">
                    <span className={`${isOpen ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest`}>
                        {isOpen ? "Open" : "Closed"}
                    </span>
                </div>

                {/* Badge Overlay */}
                {badge && (
                    <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-zinc-800/90 px-2 py-1 rounded-lg shadow-sm backdrop-blur-md max-w-[90%]">
                        <span className="text-[9px] font-black text-zinc-900 dark:text-white truncate uppercase tracking-widest leading-none flex items-center gap-1">
                          <Gift size={10} className="text-orange-500" /> {badge}
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-3 pb-3.5">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight italic leading-tight">
                            {storeName}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 font-bold text-zinc-400 text-[9px] uppercase tracking-widest">
                            <MapPin size={10} className="text-orange-500" />
                            <span className="truncate">{city || "Nearby"}</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLiked(!liked); }}
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
                        <Bike size={14} className="text-orange-600" />
                        <span>{(!deliveryFee || deliveryFee === 0) ? "Free Delivery" : `₦${deliveryFee.toLocaleString()} Fee`}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
                        <Clock size={12} className="text-orange-500" />
                        <span>15-25 min</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default function VendorList({ user }) {
    const router = useRouter();

    const { userLocation, syncWithUserAddress } = useLocationStore();
    const { data: responseData, isLoading, isError } = useQuery({
        queryKey: ["vendors-nearby", userLocation?.city, userLocation?.state],
        queryFn: () => getNearbyVendors({
            city: userLocation.city,
            state: userLocation.state,
        }),
        enabled: !!userLocation?.city && !!userLocation?.state,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const vendors = responseData?.vendors || [];

    const uniqueVendors = useMemo(() => {
        return vendors.map(v => ({
            _id: v._id,
            storeName: v.storeName,
            city: v.address?.city,
            // Use logo as card image — no coverImage in this payload
            image: v.logo || null,
            isOpen: getVendorOpenAndCloseStatus(v.openingHours).startsWith("Open now"),
            status: getVendorOpenAndCloseStatus(v.openingHours),
            // deliveryFee is resolved in the backend for nearby vendors
            deliveryFee: v.deliveryFee ?? 0,
            rating: v.rating || null,
            ratingCount: v.ratingCount || null,
            badge: null,
        }));
    }, [vendors]);

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
