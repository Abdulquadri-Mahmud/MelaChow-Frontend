"use client";

import { useMemo, useState } from "react";
import { Store, MapPin, Star, BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";

import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

// Simple skeleton for internal use or import existing if preferred
const VendorSkeleton = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[250px] h-48 bg-gray-100 rounded-[24px] animate-pulse"></div>
        ))}
    </div>
);

export default function VendorList({ user }) {
    const router = useRouter();
    const { baseUrl } = useApi();
    const [imgLoaded, setImgLoaded] = useState({});

    const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

    const { data: vendors = [], isLoading, isError } = useQuery({
        queryKey: ["vendors", defaultAddr?.city, defaultAddr?.state],
        queryFn: async () => {
            if (!defaultAddr?.city || !defaultAddr?.state) {
                // Return empty or throw generic error silently handled
                return [];
            }

            const res = await axios.get(`${baseUrl}/user/vendors/nearby`, {
                params: {
                    city: defaultAddr.city,
                    state: defaultAddr.state,
                },
                withCredentials: true, // ✅ Use cookie-based auth
            });
            return res.data.vendors || [];
        },
        refetchInterval: 60000,
        retry: false,
    });

    if (isLoading) return (
        <div className="mt-8 px-4 space-y-4">
            <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
            <VendorSkeleton />
        </div>
    );

    if (isError) return null;

    if (!vendors.length) {
        if (!defaultAddr) return null;

        return (
            <div className="px-0 mb-6">
                <div className="flex items-center justify-between px-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Featured Restaurants</h2>
                    </div>
                </div>

                <div className="px-4">
                    <div className="bg-orange-50/50 rounded-[24px] p-8 text-center border border-orange-100/50 flex flex-col items-center">
                        <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                            <MapPin className="text-orange-500" size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">Coming Soon to {defaultAddr?.city}!</h3>
                        <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed">
                            We're currently onboarding top-tier restaurants in your area.
                            Get your appetite ready!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-0">
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Featured Restaurants</h2>
                </div>
                <button
                    onClick={() => router.push('/all-restaurants')} // Assuming this route exists based on context
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-full"
                >
                    View All
                </button>
            </div>

            <div className="flex gap-4 scroll overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide">
                {vendors.map((vendor) => {
                    const statusMsg = getVendorOpenAndCloseStatus(vendor.openingHours);
                    const isOpen = statusMsg?.toLowerCase().startsWith("open now");

                    return (
                        <div
                            key={vendor._id}
                            onClick={() => router.push(`/restataurants/${vendor._id}`)}
                            className="group relative flex-none w-[250px] bg-white rounded-[24px] transition-all duration-300 cursor-pointer snap-start border border-gray-100 overflow-hidden"
                        >
                            {/* Image Container */}
                            <div className="relative h-[140px] w-full bg-gray-100 overflow-hidden">
                                <img
                                    src={vendor.logo || "/placeholder.jpg"}
                                    alt={vendor.storeName}
                                    onLoad={() => setImgLoaded((prev) => ({ ...prev, [vendor._id]: true }))}
                                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded[vendor._id] ? 'opacity-100' : 'opacity-0'}`}
                                />

                                {/* Rating Badge */}
                                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1">
                                    <Star size={10} className="fill-orange-500 text-orange-500" />
                                    <span className="text-[10px] font-black text-gray-900 tracking-tighter">
                                        {vendor.rating || "NEW"}
                                    </span>
                                </div>

                                {/* Featured Badge */}
                                {vendor.metadata?.featured && (
                                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
                                        <BadgeCheck size={10} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">Featured</span>
                                    </div>
                                )}

                                {/* Open/Closed Badge */}
                                <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg flex items-center gap-1 shadow-md ${isOpen ? "bg-emerald-500" : "bg-rose-500"} text-white`}>
                                    <span className="text-[9px] font-bold uppercase tracking-wider">{isOpen ? "Open" : "Closed"}</span>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40" />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="mb-2">
                                    <h3 className="font-bold text-gray-900 text-sm truncate leading-tight tracking-tight mb-1">{vendor.storeName}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <MapPin size={12} className="text-gray-400" />
                                        <span className="truncate max-w-[180px] font-medium opacity-80">{vendor.address?.city || "Location info"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
