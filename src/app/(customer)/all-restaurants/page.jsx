"use client";

import { useMemo, useState } from "react";
import {
    ArrowLeft, Clock, MapPin, Star,
    Search, AlertCircle, X, Utensils,
    Bike, Gift, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FreeDeliveryBadge from "@/components/ui/FreeDeliveryBadge";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { getAllVendors, getNearbyVendors } from "@/app/lib/userApi";

const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
    <div
        className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-2xl ${className}`}
        style={{ width, height }}
    >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
    </div>
);

export default function AllRestaurants() {
    const router = useRouter();
    const { baseUrl } = useApi();
    const [imgLoaded, setImgLoaded] = useState({});
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCuisine, setSelectedCuisine] = useState("All");
    const [activeFilter, setActiveFilter] = useState("All");

    // Use cookie-based authentication via useUserStorage
    const { user, isLoading: isUserLoading } = useUserStorage();
    const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

    const { data: responseData, isLoading, isError, refetch } = useQuery({
        queryKey: ["vendors-marketplace", defaultAddr?.city, defaultAddr?.state],
        queryFn: () => defaultAddr
            ? getNearbyVendors({
                city: defaultAddr.city,
                state: defaultAddr.state,
            })
            : getAllVendors(),
        enabled: !isUserLoading,
    });

    const allVendors = useMemo(() => {
        const raw = responseData?.vendors || [];
        return raw.map((v) => {
            const rawStatus = getVendorOpenAndCloseStatus(v.openingHours);
            return {
                _id: v._id,
                storeName: v.storeName,
                city: v.address?.city || v.cityId?.name || v.city,
                image: v.logo || null,
                deliveryFee: v.deliveryFee ?? 0,
                rating: v.rating || 0,
                ratingCount: v.ratingCount || 0,
                openingHours: v.openingHours,
                cuisineTypes: v.cuisineTypes || [],
                locationStatus: v.locationStatus || "approved",
                hasActiveDeliveryPromo: v.hasActiveDeliveryPromo || false,
                isOpen: rawStatus.startsWith("Open now"),
                rawStatus: rawStatus,
            };
        });
    }, [responseData]);

    const cuisineOptions = useMemo(() => {
        const allCuisines = allVendors.flatMap(v => v.cuisineTypes || []);
        const unique = [...new Set(allCuisines.map(c => c.trim()))].filter(Boolean).sort();
        return ["All", ...unique];
    }, [allVendors]);

    const filteredVendors = useMemo(() => {
        let result = allVendors;

        if (selectedCuisine !== "All") {
            result = result.filter(v =>
                v.cuisineTypes?.some(c => c.trim().toLowerCase() === selectedCuisine.toLowerCase())
            );
        }

        if (activeFilter === "Open Now") {
            result = result.filter(v => v.isOpen);
        } else if (activeFilter === "Top Rated") {
            result = result.filter(v => v.rating >= 4.0);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(v =>
                v.storeName?.toLowerCase().includes(q) ||
                v.city?.toLowerCase().includes(q) ||
                v.cuisineTypes?.some(c => c.toLowerCase().includes(q))
            );
        }

        return result;
    }, [allVendors, searchQuery, selectedCuisine, activeFilter]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-display pb-24 transition-colors duration-300">
            {/* Header Section */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 transition-all duration-300">
                <div className="max-w-md mx-auto px-4 py-3">
                    {!isSearching ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
                                </button>
                                <div className="flex flex-col">
                                    <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Discover</h1>
                                    <div className="flex items-center gap-1 text-orange-600">
                                        <MapPin size={12} className="fill-orange-600/20" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[140px]">
                                            {defaultAddr ? `${defaultAddr.city}, ${defaultAddr.state}` : "Set Location"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setIsSearching(true)}
                                    className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Search size={22} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <div className="flex-1 relative">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search restaurants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                />
                                <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearching(false);
                                    setSearchQuery("");
                                }}
                                className="text-sm font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-md mx-auto py-6 px-4">
                {/* Hero Header */}
                <div className="mb-6 space-y-2">
                    <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-500/20">
                        <Sparkles size={12} className="text-orange-500" />
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Curated Selection</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter leading-none">
                        All Restaurants
                    </h1>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed">
                        Explore authentic kitchens and top-rated spots nearby.
                    </p>
                </div>

                {/* Filter & Cuisine Chips */}
                {!isLoading && !isError && allVendors.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {/* Status Filters */}
                        <div className="flex gap-2">
                            {["All", "Open Now", "Top Rated"].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                                        activeFilter === filter
                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-105"
                                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Cuisine Chips Horizontal Scroll */}
                        {cuisineOptions.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {cuisineOptions.map((cuisine) => (
                                    <button
                                        key={cuisine}
                                        onClick={() => setSelectedCuisine(cuisine)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                                            selectedCuisine === cuisine
                                                ? "bg-orange-600 text-white shadow-sm"
                                                : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        {cuisine}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height={280} className="w-full rounded-3xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="px-6 py-12 text-center space-y-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <AlertCircle className="mx-auto text-red-500" size={48} />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Error loading restaurants</p>
                        <button onClick={() => refetch()} className="text-orange-600 font-black uppercase text-[10px] tracking-widest border border-orange-200 px-4 py-2 rounded-full">Retry</button>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                        <MapPin className="mx-auto text-zinc-300 dark:text-zinc-600" size={48} />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No restaurants match your filters</p>
                        {(selectedCuisine !== "All" || activeFilter !== "All" || searchQuery) && (
                            <button
                                onClick={() => {
                                    setSelectedCuisine("All");
                                    setActiveFilter("All");
                                    setSearchQuery("");
                                }}
                                className="text-orange-600 font-bold text-xs underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Header counter */}
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {filteredVendors.length} {filteredVendors.length === 1 ? "Restaurant" : "Restaurants"}
                            </span>
                        </div>

                        {/* VERTICAL STACKED CARDS LIST */}
                        <div className="space-y-4 w-full">
                            {filteredVendors.map((vendor) => (
                                <VendorCard
                                    key={vendor._id}
                                    vendor={vendor}
                                    imgLoaded={imgLoaded}
                                    setImgLoaded={setImgLoaded}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Shared Full-Width Vendor Card Component (Vertically Stacked) ───────────────

const VendorCard = ({ vendor, imgLoaded, setImgLoaded }) => {
    return (
        <Link
            href={`/restaurants/${vendor._id}`}
            className="group w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 block border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl"
        >
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {vendor.image ? (
                    <img
                        src={vendor.image}
                        alt={vendor.storeName}
                        onLoad={() => setImgLoaded?.(prev => ({ ...prev, [vendor._id]: true }))}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                            !vendor.isOpen ? "grayscale-[25%]" : ""
                        }`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                        <Utensils size={48} />
                    </div>
                )}

                {/* Gradient overlays for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                        vendor.isOpen
                            ? "bg-emerald-500/90 text-white"
                            : "bg-zinc-900/90 text-zinc-300"
                    }`}>
                        {vendor.isOpen ? "Open Now" : "Closed"}
                    </span>

                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-black shadow-md border border-white/10">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        <span>{Number(vendor.rating || 0) === 0 ? "New" : Number(vendor.rating).toFixed(1)}</span>
                        {vendor.ratingCount > 0 && (
                            <span className="text-[10px] text-zinc-300 font-normal">({vendor.ratingCount})</span>
                        )}
                    </div>
                </div>

                {/* Promo Badge bottom right */}
                {vendor.hasActiveDeliveryPromo ? (
                    <div className="absolute bottom-3 right-3 z-20 shadow-md">
                        <FreeDeliveryBadge type="vendor" />
                    </div>
                ) : (!vendor.deliveryFee || vendor.deliveryFee === 0) ? (
                    <div className="absolute bottom-3 right-3 z-20 bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                        <Gift size={12} className="text-zinc-950" />
                        Free Delivery
                    </div>
                ) : null}

                {/* Title overlay on image */}
                <div className="absolute bottom-3 left-3 right-24 z-20 text-white">
                    <h3 className="text-lg font-black tracking-tight drop-shadow-md truncate uppercase italic leading-tight">
                        {vendor.storeName}
                    </h3>
                    <p className="text-xs text-zinc-200 font-bold flex items-center gap-1 drop-shadow mt-0.5">
                        <MapPin size={12} className="text-orange-400" />
                        <span className="truncate">{vendor.city || "Location N/A"}</span>
                    </p>
                </div>
            </div>

            {/* Bottom details */}
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.2 rounded-full">
                        <Bike size={14} className="text-orange-500" />
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                            {!vendor.deliveryFee || vendor.deliveryFee === 0 ? "Free Delivery" : `₦${vendor.deliveryFee.toLocaleString()}`}
                        </span>
                    </div>

                    {vendor.rawStatus && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            <Clock size={13} className="text-zinc-400" />
                            <span className="truncate max-w-[150px]">{vendor.rawStatus}</span>
                        </div>
                    )}
                </div>

                {/* Cuisine Tags */}
                {vendor.cuisineTypes && vendor.cuisineTypes.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-hidden flex-wrap pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        {vendor.cuisineTypes.map((cuisine, idx) => (
                            <span
                                key={idx}
                                className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-200/50 dark:border-orange-500/20"
                            >
                                {cuisine}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
};
