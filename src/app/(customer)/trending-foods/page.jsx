"use client";

import { useMemo, useState } from "react";
import {
    ArrowLeft, Utensils, Clock, Truck, Store, Plus, MapPin, Star,
    Search, SlidersHorizontal, AlertCircle, SearchX, RefreshCw, X, Flame
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/app/context/ApiContext";
import { fetchUser } from "@/app/lib/api";
import axios from "axios";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

const Skeleton = () => (
    <div className="flex flex-col gap-3 rounded-[32px] bg-white dark:bg-zinc-900 p-2 shadow-sm border border-zinc-50 dark:border-zinc-800">
        <div className="relative h-44 w-full overflow-hidden rounded-[28px] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="p-3 space-y-3">
            <div className="flex justify-between">
                <div className="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-8 w-8 bg-zinc-50 dark:bg-zinc-800 rounded-xl animate-pulse" />
            </div>
            <div className="h-4 w-24 bg-zinc-50 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
    </div>
);

export default function TrendingPage() {
    const router = useRouter();
    const { baseUrl } = useApi();
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

    const { data: userData } = useQuery({
        queryKey: ["userProfile", token],
        queryFn: () => fetchUser(token),
        enabled: !!token,
    });

    const user = userData?.user;
    const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

    const { data: foods = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["trending-all", defaultAddr?.city, defaultAddr?.state],
        queryFn: async () => {
            try {
                const res = await axios.get(`${baseUrl}/user/trending`, {
                    params: {
                        city: defaultAddr?.city,
                        state: defaultAddr?.state,
                    },
                    withCredentials: true, // ✅ Use cookie-based auth
                });
                return res.data.trending || [];
            } catch (err) {
                console.error("[TrendingPage] ❌ Fetch Error:", {
                    status: err.response?.status,
                    message: err.message,
                    data: err.response?.data
                });
                throw err;
            }
        },
        enabled: !!baseUrl && !!defaultAddr,
    });

    const filteredFoods = useMemo(() => {
        if (!searchQuery) return foods;
        return foods.filter(f =>
            f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.restaurant?.storeName || f.vendor?.storeName || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [foods, searchQuery]);

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-display pb-20 transition-colors duration-300">
            {/* Sticky Header */}
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
                                    <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Trending</h1>
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
                                    placeholder="Search trending dishes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                />
                                <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-2.5 text-zinc-400"
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
                                className="text-sm font-bold text-orange-600 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 pt-6">
                {/* Intro */}
                <div className="mb-6 px-1">
                    <div className="flex items-center gap-2">
                        <Flame className="text-orange-600 fill-orange-600" size={24} />
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight leading-none">
                            Hot Right Now
                        </h2>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1.5 font-bold uppercase tracking-widest">
                        The most popular tastes in {defaultAddr?.city || "your area"}
                    </p>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <div className="p-8 bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-red-200 text-center space-y-4">
                        <AlertCircle className="text-red-500 mx-auto" size={32} />
                        <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Sync Failure</p>
                            <p className="text-xs text-zinc-500 mt-1">We couldn't fetch the trending menu. Try again soon.</p>
                        </div>
                        <button onClick={() => refetch()} className="bg-orange-600 text-white text-[10px] font-black uppercase px-8 py-2.5 rounded-full shadow-lg">Retry Sync</button>
                    </div>
                ) : filteredFoods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-100 shadow-xl shadow-zinc-200/50">
                        <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                            <div className="absolute inset-0 bg-orange-600/5 rounded-full scale-125 blur-3xl animate-pulse" />
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-8 rounded-full">
                                <Utensils className="text-orange-600 opacity-20" size={64} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-lg border border-zinc-50">
                                <SearchX className="text-[#73B8B8]" size={24} />
                            </div>
                        </div>

                        <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase italic leading-none">
                            No Trends Found
                        </h2>
                        <p className="text-zinc-500 text-sm mt-3 font-medium leading-relaxed max-w-[240px] mx-auto">
                            We don't have enough data for trending items in this area yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFoods.map((food) => {
                            const hours = food?.restaurant?.openingHours || {};
                            const status = getVendorOpenAndCloseStatus(hours);
                            const isOpen = status.startsWith("Open now");

                            return (
                                <div
                                    key={food._id}
                                    onClick={() => router.push(`/food-details/${food._id}`)}
                                    className="bg-white dark:bg-zinc-900 rounded-xl border border-transparent shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 dark:hover:shadow-none hover:border-orange-600/10 transition-all cursor-pointer group hover:-translate-y-1 active:scale-[0.98]"
                                >
                                    {/* Image Section */}
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden flex-shrink-0">
                                        <img
                                            src={food.image || "/placeholder.jpg"}
                                            alt={food.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black text-orange-600 shadow-sm border border-orange-50 uppercase tracking-tighter italic">
                                            ₦{food.price?.toLocaleString()}
                                        </div>
                                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-2">
                                            <span className={`${isOpen ? "bg-white/90 text-orange-600" : "bg-zinc-900/90 text-zinc-400"} text-[8px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest backdrop-blur-md`}>
                                                {isOpen ? "OPEN" : "CLOSED"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details Section */}
                                    <div className="flex-1 p-3 flex flex-col min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                            <h3 className="font-black text-zinc-900 dark:text-white text-sm uppercase tracking-tight italic line-clamp-2 leading-tight pr-4">
                                                {food.name}
                                            </h3>
                                            <div className="bg-orange-600/5 dark:bg-zinc-800 p-2 rounded-[1rem] text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                                <Plus size={18} strokeWidth={3} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 mb-auto uppercase tracking-wider italic">
                                            <Store size={12} className="text-orange-500" />
                                            <span className="truncate">{food?.restaurant?.storeName || food?.vendor?.storeName || "Vendor"}</span>
                                        </div>

                                        {/* Info Row */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-700 dark:text-zinc-300">
                                                <Truck size={14} className="text-orange-600" />
                                                <span>₦{food.deliveryFee || food?.restaurant?.deliveryFee || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-zinc-400 uppercase italic">
                                                <Clock size={14} className="text-orange-400" />
                                                <span>{food?.estimatedDeliveryTime || 25}m</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
