"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, StarHalf, Star as StarEmpty, Store, Clock, Plus, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
// import Skeleton from "react-loading-skeleton";
import { useApi } from "@/app/context/ApiContext";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import axios from "axios";

const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
  <div
    className={`relative overflow-hidden scroll bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
  </div>
);


export default function VendorList({ user }) {
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState({}); // track each vendor
  const { baseUrl } = useApi();

  const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

  // ✅ Auto refresh every 60 seconds (60000 ms)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["vendors", defaultAddr?.city, defaultAddr?.state],
    queryFn: async () => {
      if (!defaultAddr?.city || !defaultAddr?.state) {
        const err = new Error("Missing location");
        err.response = { data: { message: "Please provide both city and state query parameters." } };
        throw err;
      }

      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${baseUrl}/user/vendors/nearby`, {
        params: {
          city: defaultAddr.city,
          state: defaultAddr.state,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(res.data);
      return res.data.vendors || [];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    retry: false,
  });


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
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Store className="text-orange-600" size={18} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Featured Restaurants</h2>
        </div>
        <div className="flex gap-4 pb-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[250px] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-50 snap-center">
              <Skeleton height={128} />
              <div className="p-2">
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
                  <Skeleton width={28} height={28} className="rounded-lg" />
                </div>
                <div className="mt-2 flex justify-between items-center bg-gray-50/50 p-1.5 rounded-lg">
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
      </div>
    );
  }

  if (isError) {
    const errorMsg = error?.response?.data?.message;
    if (errorMsg === "Please provide both city and state query parameters.") {
      return (
        <div className="mt-4 px-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-orange-100 p-1.5 rounded-lg">
              <Store className="text-orange-600" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Featured Restaurants</h2>
          </div>
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <MapPin className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-gray-500 text-sm font-medium">Please provide both city and state to see restaurants near you.</p>
            <p className="text-xs text-gray-400 mt-1">Try changing your location or check back later!</p>
          </div>
        </div>
      );
    }
    return (
      <div className="my-4 px-3 text-center py-6 bg-red-50 rounded-2xl">
        <p className="text-red-500 text-sm">Failed to load restaurants. Please try again.</p>
      </div>
    );
  }

  if (!isLoading && !isError && (!data || data.length === 0)) {
    return (
      <div className="mt-4 px-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Store className="text-orange-600" size={18} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Featured Restaurants</h2>
        </div>
        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <MapPin className="mx-auto text-gray-400 mb-2" size={24} />
          <p className="text-gray-500 text-sm font-medium">No restaurants found near you yet.</p>
          <p className="text-xs text-gray-400 mt-1">Try changing your location or check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 px-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Store className="text-orange-600" size={18} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Featured Restaurants</h2>
        </div>
        <button
          onClick={() => router.push('/all-restaurants')}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
        >
          See All
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scroll no-scrollbar snap-x snap-mandatory pb-4">
        {data?.map((vendor) => {
          const { isOpen, status } = getStatusInfo(vendor);
          return (
            <div
              key={vendor._id}
              className="bg-white rounded-2xl min-w-[250px] overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all cursor-pointer snap-center flex-shrink-0 group"
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

              <div className="p-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store size={14} className="text-orange-500" />
                      <h3 className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">{vendor.storeName}</h3>
                    </div>
                    <div className="flex items-center text-[10px] text-gray-500 font-medium tracking-tight">
                      <Clock size={12} className="mr-1 text-gray-400" />
                      <span className="truncate italic w-[220px]">{status}</span>
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
