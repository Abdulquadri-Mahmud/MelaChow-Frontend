"use client";

import { useMemo, useState, useEffect } from "react";
import {
    ArrowLeft, Store, Clock, MapPin, Truck, Plus, Star, Heart,
    Search, SlidersHorizontal, AlertCircle, RefreshCw, X, Utensils,
    StarHalf, Star as StarEmpty
} from "lucide-react";
import { useRouter } from "next/navigation";
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

    const vendors = responseData?.vendors || [];

    console.log(vendors)

    const filteredVendors = useMemo(() => {
        if (!searchQuery) return vendors;
        return vendors.filter(v =>
            v.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [vendors, searchQuery]);

    const getStatusInfo = (vendor) => {
        const hours = vendor.openHours || vendor.openingHours || [];
        const status = getVendorOpenAndCloseStatus(hours);
        const isOpen = status.startsWith("Open now");
        return { isOpen, status };
    };

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

            <main className="max-w-md mx-auto px-2 pt-2">
                {/* Intro Removed for compactness */}

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-md overflow-hidden bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <Skeleton height={176} />
                                <div className="p-2.5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <Skeleton width={14} height={14} className="rounded-sm" />
                                                <Skeleton width="60%" height={14} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Skeleton width={12} height={12} className="rounded-sm" />
                                                <Skeleton width="40%" height={10} />
                                            </div>
                                        </div>
                                        <Skeleton width={32} height={32} className="rounded-xl" />
                                    </div>
                                    <div className="mt-3 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl">
                                        <div className="flex items-center gap-1">
                                            <Skeleton width={10} height={10} />
                                            <Skeleton width={40} height={10} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Skeleton width={12} height={12} />
                                            <Skeleton width={30} height={10} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-4">
                        <div className="bg-red-50 p-3 rounded-full w-fit mx-auto">
                            <AlertCircle className="text-red-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Syncing problem</p>
                            <p className="text-xs text-zinc-500 font-medium mt-1">
                                {error?.response?.data?.message || "We couldn't reach the restaurants. Check your connection."}
                            </p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none active:scale-95 transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-white dark:bg-zinc-900 rounded-[40px] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-50 dark:border-zinc-800/50">
                        <div className="bg-orange-50 dark:bg-orange-950/20 p-8 rounded-full mb-6 animate-pulse">
                            <MapPin className="text-orange-600" size={48} />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic leading-tight mb-2">
                            Coming Soon to {defaultAddr?.city}!
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[280px] mx-auto text-center">
                            We haven't launched in this area yet, but we're working on it. Check back later or try another location.
                        </p>
                        <button
                            onClick={() => router.push('/profile/address')}
                            className="mt-6 px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none italic"
                        >
                            Change Location
                        </button>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-white dark:bg-zinc-900 rounded-[40px] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-50 dark:border-zinc-800/50">
                        <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                            <div className="absolute inset-0 bg-orange-600/5 rounded-full scale-125 blur-3xl animate-pulse" />
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-8 rounded-full">
                                <Utensils className="text-orange-600 opacity-20" size={64} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-lg border border-zinc-50 dark:border-zinc-700">
                                <Search size={24} className="text-orange-600 fill-orange-600/10" />
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic leading-tight">
                            Kitchen is Empty
                        </h3>
                        <p className="text-zinc-500 text-sm mt-3 font-medium leading-relaxed max-w-[240px] mx-auto">
                            No restaurants match "{searchQuery}" in your current area.
                        </p>

                        <button
                            onClick={() => {
                                setIsSearching(false);
                                setSearchQuery("");
                            }}
                            className="mt-8 px-10 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest text-[10px] rounded-2xl active:scale-95 transition-all"
                        >
                            Reset Search
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-12 px-1">
                        {filteredVendors.map(vendor => {
                            const { isOpen } = getStatusInfo(vendor);
                            return (
                                <motion.div
                                    key={vendor._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -2 }}
                                    className="bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 transition-all duration-300 cursor-pointer group"
                                    onClick={() => router.push(`/restaurants/${String(vendor._id)}`)}
                                >
                                    {/* Image Section - Smaller */}
                                    <div className="relative h-28 md:h-36 overflow-hidden">
                                        {!imgLoaded[vendor._id] && (
                                            <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                                        )}
                                        <img
                                            src={vendor.logo}
                                            alt={vendor.storeName}
                                            onLoad={() => setImgLoaded((prev) => ({ ...prev, [vendor._id]: true }))}
                                            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${imgLoaded[vendor._id] ? "opacity-100" : "opacity-0"}`}
                                        />

                                        {/* Status Badge - Compact */}
                                        <div className="absolute top-2 left-2 flex gap-1">
                                            {!isOpen && (
                                                <span className="bg-zinc-950/80 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                                    Closed
                                                </span>
                                            )}
                                            {vendor.metadata?.featured && (
                                                <span className="bg-orange-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                                    Hot
                                                </span>
                                            )}
                                        </div>

                                        {/* Rating Overlay */}
                                        <div className="absolute bottom-2 left-2">
                                            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg px-1.5 py-1 flex items-center gap-1 shadow-sm">
                                                <Star size={8} className="text-orange-500 fill-orange-500" />
                                                <span className="text-[10px] font-black text-zinc-900 dark:text-white">
                                                    {Number(vendor.rating || 0).toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Section - Very Compact */}
                                    <div className="p-2.5 space-y-1.5">
                                        <h3 className="text-[13px] font-black text-zinc-900 dark:text-white truncate tracking-tight leading-none">
                                            {vendor.storeName}
                                        </h3>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Bike size={11} />
                                                <span className="text-[9px] font-bold">
                                                    {vendor.deliveryFee > 0 ? `₦${vendor.deliveryFee}` : "Free"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Clock size={11} />
                                                <span className="text-[9px] font-bold italic">25m</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
