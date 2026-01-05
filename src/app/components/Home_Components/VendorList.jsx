"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, StarHalf, Star as StarEmpty, Store, Clock, Plus, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
// import Skeleton from "react-loading-skeleton";
import { useApi } from "@/app/context/ApiContext";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
  <div
    className={`relative overflow-hidden scroll bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
  </div>
);


export default function VendorList() {
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState({}); // track each vendor
  const { baseUrl } = useApi();

  // ✅ Auto refresh every 60 seconds (60000 ms)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await fetch(
        `${baseUrl}/admin/vendors/get-all`
      );
      const json = await res.json();
      return json.vendors || [];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });


  const openingMessage = data?.vendor?.openingHours
    ? getVendorOpenAndCloseStatus(data.vendor.openingHours)
    : "Opening hours not available.";

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) stars.push(<Star key={`full-${i}`} size={10} className="text-yellow-400 fill-yellow-400" />);
    if (halfStar) stars.push(<StarHalf key="half" size={10} className="text-yellow-400 fill-yellow-400" />);
    for (let i = 0; i < emptyStars; i++) stars.push(<StarEmpty key={`empty-${i}`} size={10} className="text-gray-300" />);
    return stars;
  };

  // ✅ Get robust status info
  const getStatusInfo = (vendor) => {
    const status = getVendorOpenAndCloseStatus(vendor.openHours || vendor.openingHours);
    const isOpen = status.startsWith("Open now");
    return { isOpen, status };
  };

  if (isLoading) {
    return (
      <div className="my-4 px-3">
        <h2 className="font-semibold text-lg mb-3 text-gray-800">Featured</h2>
        <div className="flex gap-4 pb-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[220px] rounded-2xl overflow-hidden bg-white shadow-sm snap-center">
              <Skeleton height={120} />
              <div className="p-2">
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="my-4 px-3 text-center py-6 bg-red-50 rounded-2xl">
        <p className="text-red-500 text-sm">Failed to load restaurants. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 px-3">
      <h2 className="pb-3 text-lg font-bold text-gray-800 tracking-tight">Featured Restaurants</h2>

      <div className="flex gap-4 overflow-x-auto scroll no-scrollbar snap-x snap-mandatory pb-4">
        {data?.map((vendor) => {
          const { isOpen, status } = getStatusInfo(vendor);
          return (
            <div
              key={vendor._id}
              className="bg-white rounded-2xl min-w-[220px] overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all cursor-pointer snap-center flex-shrink-0 group"
              onClick={() => router.push(`/restataurants/${String(vendor._id)}`)}
            >
              <div className="relative">
                {!imgLoaded[vendor._id] && <Skeleton height={128} width="100%" />}
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  onLoad={() => setImgLoaded((prev) => ({ ...prev, [vendor._id]: true }))}
                  className={`h-32 w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded[vendor._id] ? "opacity-100" : "opacity-0"}`}
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 pr-4 flex justify-between items-center w-full gap-1">
                  {vendor.metadata?.featured && (
                    <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      FEATURED
                    </span>
                  )}
                  <span
                    className={`${isOpen ? "bg-emerald-500" : "bg-rose-500"
                      } text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm`}
                  >
                    {isOpen ? "OPEN" : "CLOSED"}
                  </span>
                </div>

                {/* Rating */}
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm border border-gray-100">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="ml-0.5">{vendor.rating || 0}</span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store size={14} className="text-orange-500" />
                      <h3 className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">{vendor.storeName}</h3>
                    </div>
                    <div className="flex items-center text-[10px] text-gray-500 font-medium tracking-tight">
                      <Clock size={12} className="mr-1 text-gray-400" />
                      <span className="truncate italic">{status}</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-1.5 rounded-lg text-orange-500">
                    <Plus size={16} />
                  </div>
                </div>

                <div className="mt-2 flex justify-between items-center bg-gray-50/50 p-1.5 rounded-lg">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                    <MapPin size={10} />
                    <span className="truncate">{vendor.address?.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                    <Truck size={12} />
                    <span>₦{vendor.deliveryFee || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
