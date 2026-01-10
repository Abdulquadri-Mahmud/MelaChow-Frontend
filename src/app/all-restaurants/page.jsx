"use client";

import { useMemo, useState, useEffect } from "react";
import {
    ArrowLeft, Store, Clock, MapPin, Truck, Plus, Star, Heart,
    Search, SlidersHorizontal, AlertCircle, RefreshCw, X, Utensils
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/app/context/ApiContext";
import { fetchUser } from "@/app/lib/api";
import axios from "axios";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

const Skeleton = () => (
    <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-3 shadow-sm border border-gray-100">
        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-gray-100 animate-pulse" />
        <div className="flex justify-between items-start pt-1">
            <div className="space-y-2 flex-1">
                <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="h-8 w-12 bg-gray-50 rounded animate-pulse" />
        </div>
    </div>
);

export default function AllRestaurants() {
    const router = useRouter();
    const { baseUrl } = useApi();
    const [favorites, setFavorites] = useState({});
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

    const { data: vendors = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["all-vendors", defaultAddr?.city, defaultAddr?.state],
        queryFn: async () => {
            const res = await axios.get(`${baseUrl}/user/vendors/nearby`, {
                params: {
                    city: defaultAddr?.city,
                    state: defaultAddr?.state,
                },
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.vendors || [];
        },
        enabled: !!defaultAddr,
    });

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

    const toggleFavorite = (e, id) => {
        e.stopPropagation();
        setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-display pb-24 transition-colors duration-300">
            {/* Header Section */}
            <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-all duration-300">
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

            <main className="max-w-md mx-auto px-4 pt-6">
                {/* Intro */}
                <div className="mb-6 px-1">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight leading-none">
                        {searchQuery ? `Search: ${searchQuery}` : "Global Kitchens"}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1.5 font-bold uppercase tracking-widest">
                        {filteredVendors.length} spots filtered near you
                    </p>
                </div>

                {isLoading ? (
                    <div className="space-y-5">
                        {[1, 2, 3].map(i => <Skeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-4">
                        <div className="bg-red-50 p-3 rounded-full w-fit mx-auto">
                            <AlertCircle className="text-red-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Syncing problem</p>
                            <p className="text-xs text-zinc-500 font-medium mt-1">We couldn't reach the restaurants. Check your connection.</p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                        >
                            Try Again
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
                    <div className="space-y-6">
                        {filteredVendors.map(vendor => {
                            const { isOpen, status } = getStatusInfo(vendor);
                            return (
                                <div
                                    key={vendor._id}
                                    onClick={() => router.push(`/restataurants/${vendor._id}`)}
                                    className={`group relative flex flex-col gap-4 rounded-[2rem] bg-white dark:bg-zinc-900 p-2.5 shadow-sm border border-transparent hover:border-orange-600/10 hover:shadow-xl hover:shadow-zinc-200/30 dark:hover:shadow-none transition-all duration-300 cursor-pointer ${!isOpen ? '' : ''}`}
                                >
                                    <div className="relative h-48 w-full overflow-hidden rounded-[1.75rem]">
                                        <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-sm border border-white/20 ${isOpen ? 'bg-white/90 text-orange-600' : 'bg-zinc-900/90 text-zinc-400'}`}>
                                            <p className="text-[10px] font-black uppercase tracking-widest">
                                                {isOpen ? status : 'Closed'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => toggleFavorite(e, vendor._id)}
                                            className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md size-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-red-500 transition-all duration-300 shadow-sm border border-white/20"
                                        >
                                            <Heart size={20} className={favorites[vendor._id] ? 'fill-red-500 text-red-500' : ''} />
                                        </button>
                                        <img
                                            src={vendor.logo}
                                            alt={vendor.storeName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        {/* Status Icon */}
                                        <div className="absolute bottom-4 right-4 bg-orange-600 p-2.5 rounded-2xl shadow-lg border border-white/20 transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                                            <Plus size={20} className="text-white" />
                                        </div>
                                    </div>

                                    <div className="px-3 pb-1 flex justify-between items-end">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black tracking-tight uppercase italic text-zinc-900 dark:text-white leading-none">
                                                {vendor.storeName}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                                <div className="flex items-center gap-0.5">
                                                    <Star size={14} className="text-orange-500 fill-orange-500" />
                                                    <span className="text-xs font-black">{vendor.rating || "4.5"}</span>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">•</span>
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={12} className="text-zinc-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">
                                                        {vendor.address?.city}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <div className="flex items-center gap-1 justify-end text-orange-600">
                                                <Truck size={14} strokeWidth={2.5} />
                                                <p className="text-sm font-black italic">
                                                    {vendor.deliveryFee ? `₦${vendor.deliveryFee}` : "FREE"}
                                                </p>
                                            </div>
                                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-[8px]">Delivery</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
