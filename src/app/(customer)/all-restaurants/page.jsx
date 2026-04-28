"use client";

import { useMemo, useState, useEffect } from "react";
import {
    ArrowLeft, Store, Clock, MapPin, Truck, Plus, Star, Heart,
    Search, SlidersHorizontal, AlertCircle, RefreshCw, X, Utensils,
    StarHalf, Star as StarEmpty,
    Bike, Gift, Globe, Sparkles, ChefHat
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FreeDeliveryBadge from "@/components/ui/FreeDeliveryBadge";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/app/context/ApiContext";
import { fetchUser } from "@/app/lib/api";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import axios from "axios";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { getNearbyVendors } from "@/app/lib/userApi";

const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
    <div
        className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-xl ${className}`}
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

    // Use cookie-based authentication via useUserStorage
    const { user, isLoading: isUserLoading } = useUserStorage();

    const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

    const { data: responseData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["vendors-nearby", defaultAddr?.city, defaultAddr?.state],
        queryFn: () => getNearbyVendors({
            city: defaultAddr.city,
            state: defaultAddr.state,
        }),
        enabled: !!defaultAddr && !isUserLoading,
    });

    const allVendors = useMemo(() => {
        const raw = responseData?.vendors || [];
        return raw.map((v) => ({
            _id: v._id,
            storeName: v.storeName,
            city: v.address?.city,
            image: v.logo || null,
            deliveryFee: v.deliveryFee ?? 0,
            rating: v.rating || 0,
            ratingCount: v.ratingCount || 0,
            openingHours: v.openingHours,
            cuisineTypes: v.cuisineTypes || [],
            locationStatus: v.locationStatus || "approved",
            hasActiveDeliveryPromo: v.hasActiveDeliveryPromo || false,
            isOpen: getVendorOpenAndCloseStatus(v.openingHours).startsWith("Open now"),
        }));
    }, [responseData]);

    const filteredVendors = useMemo(() => {
        if (!searchQuery) return allVendors;
        return allVendors.filter(v =>
            v.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.city?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allVendors, searchQuery]);

    const cuisineOptions = useMemo(() => {
        const allCuisines = allVendors.flatMap(v => v.cuisineTypes || []);
        return [...new Set(allCuisines.map(c => c.trim()))].sort();
    }, [allVendors]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-display pb-24 transition-colors duration-300">
            {/* Header Section */}
            <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-all duration-300">
                <div className="max-w-md mx-auto px-4 py-3">
                    {!isSearching ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
                                </button>
                                <div className="flex flex-col">
                                    <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Discover</h1>
                                    <div className="flex items-center gap-1 text-orange-600">
                                        <MapPin size={12} className="fill-orange-600/20" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                                            {defaultAddr ? `${defaultAddr.city}, ${defaultAddr.state}` : "Set Location"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setIsSearching(true)}
                                    className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Search size={22} />
                                </button>
                                <button className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <SlidersHorizontal size={22} />
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

            <main className="max-w-md mx-auto py-6 px-1">
                {/* Hero Header */}
                <div className="mb-10 px-4 space-y-2">
                    <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-500/20">
                        <Sparkles size={12} className="text-orange-500" />
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Curated Selection</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter leading-none">
                        Culinary <br /> Discovery
                    </h1>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed max-w-[280px]">
                        Explore the finest kitchens and authentic flavors nearby.
                    </p>
                </div>
                {isLoading ? (
                    <div className="space-y-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="px-4 space-y-2">
                                    <Skeleton width="40%" height={24} />
                                    <Skeleton width="60%" height={14} />
                                </div>
                                <div className="flex gap-4 overflow-x-auto px-4 scrollbar-none">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden w-[280px]">
                                            <Skeleton height={120} />
                                            <div className="p-3 space-y-3">
                                                <Skeleton width="80%" height={16} />
                                                <div className="flex justify-between">
                                                    <Skeleton width="40%" height={12} />
                                                    <Skeleton width="20%" height={12} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="px-6 py-12 text-center space-y-4">
                        <AlertCircle className="mx-auto text-red-500" size={48} />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Error loading restaurants</p>
                        <button onClick={() => refetch()} className="text-orange-600 font-black uppercase text-[10px] tracking-widest">Retry</button>
                    </div>
                ) : allVendors.length === 0 ? (
                    <div className="py-20 text-center">
                        <MapPin className="mx-auto text-zinc-300 mb-4" size={48} />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No restaurants in your area</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* ── Open Now ─────────────────────────────────────────────────────── */}
                        {filteredVendors.filter(v => v.isOpen).length > 0 && (
                            <div>
                                <SectionHeader
                                    title={
                                        <span className="flex items-center gap-2">
                                            <Clock size={18} className="text-emerald-500" />
                                            Open Now
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                            </span>
                                        </span>
                                    }
                                    subtitle="Restaurants currently taking orders"
                                />
                                <VendorRow vendors={filteredVendors.filter(v => v.isOpen)} />
                            </div>
                        )}

                        {/* ── Top Rated ────────────────────────────────────────────────────── */}
                        {filteredVendors.filter(v => v.rating >= 4.5).length > 0 && (
                            <div>
                                <SectionHeader
                                    title={
                                        <span className="flex items-center gap-2">
                                            <Star size={18} className="text-orange-500 fill-orange-500" />
                                            Top Rated
                                        </span>
                                    }
                                    subtitle="Highly recommended by local foodies"
                                />
                                <VendorRow vendors={filteredVendors.filter(v => v.rating >= 4.5)} />
                            </div>
                        )}

                        {/* ── Cuisine Categories ────────────────────────────────────────── */}
                        {cuisineOptions.map((cuisine) => {
                            const cuisineVendors = filteredVendors.filter(v => 
                                v.cuisineTypes?.some(t => t.trim() === cuisine)
                            );

                            if (cuisineVendors.length === 0) return null;

                            // Sort to put open ones first
                            const sortedCuisineVendors = [...cuisineVendors].sort((a, b) => 
                                (b.isOpen === a.isOpen) ? 0 : b.isOpen ? 1 : -1
                            );

                            return (
                                <div key={cuisine}>
                                    <SectionHeader
                                        title={
                                            <span className="flex items-center gap-2 text-orange-500">
                                                <ChefHat size={18} />
                                                {cuisine} Specials
                                            </span>
                                        }
                                        subtitle={`Popular ${cuisine.toLowerCase()} spots near you`}
                                    />
                                    <VendorRow vendors={sortedCuisineVendors} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Shared Layout Components ──────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-end justify-between px-4 mb-5">
    <div className="space-y-1">
      <h2 className="text-[22px] font-black text-zinc-950 dark:text-zinc-50 tracking-tighter uppercase italic leading-none">
        {title}
      </h2>
      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
        {subtitle}
      </p>
    </div>
  </div>
);

const VendorRow = ({ vendors }) => (
  <div className="flex gap-4 scroll overflow-x-auto px-4 pb-4 scrollbar-none snap-x snap-mandatory">
    {vendors.map((vendor) => (
      <VendorCard key={vendor._id} vendor={vendor} />
    ))}
  </div>
);

const VendorCard = ({ vendor }) => {
  return (
    <Link
      href={`/restaurants/${vendor._id}`}
      className="group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[20px] scroll overflow-hidden cursor-pointer snap-start transition-all duration-300 block border border-zinc-100 dark:border-zinc-800/50 shadow-sm"
      style={{ width: "75vw", maxWidth: "280px" }}
    >
      <div className="relative h-[120px] w-full scroll overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {vendor.image ? (
          <img
            src={vendor.image}
            alt={vendor.storeName}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!vendor.isOpen ? "grayscale-[30%]" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
            <Utensils className="text-zinc-300 dark:text-zinc-600" size={40} />
          </div>
        )}

        {vendor.hasActiveDeliveryPromo ? (
          <div className="absolute bottom-3 right-3 shadow-sm flex items-center">
            <FreeDeliveryBadge type="vendor" />
          </div>
        ) : (!vendor.deliveryFee || vendor.deliveryFee === 0) ? (
          <div className="absolute bottom-3 right-3 bg-[#FFF9E5] border border-black/10 px-3 py-1.5 rounded-[12px] shadow-sm flex items-center gap-2">
            <Gift size={14} className="text-orange-500" />
            <span className="text-[10px] font-bold text-zinc-800 tracking-tight">
              Free delivery
            </span>
          </div>
        ) : null}
      </div>

      <div className="px-3 pt-3 pb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate uppercase italic tracking-tight">
            {vendor.storeName} - {vendor.city}
          </h3>
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Globe size={10} className="text-orange-600 dark:text-indigo-400" />
            </div>
            <span className="text-zinc-300">|</span>
            <div className="flex items-center gap-1">
              <Bike size={14} className="text-zinc-800 dark:text-zinc-200" />
              <span className="text-zinc-800 dark:text-zinc-200">
                {!vendor.deliveryFee || vendor.deliveryFee === 0 ? "Free" : `₦${vendor.deliveryFee}`}
              </span>
            </div>
            <span className="text-zinc-300">|</span>
            <span className={vendor.isOpen ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
              {vendor.isOpen ? "Open" : "Closed"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-zinc-900 dark:text-white font-black">
              {Number(vendor.rating || 0) === 0 ? "New" : Number(vendor.rating).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
