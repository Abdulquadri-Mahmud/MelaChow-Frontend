"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, StarHalf, Star as StarEmpty, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { useApi } from "@/app/context/ApiContext";

// ✅ Get current day (e.g. "monday", "tuesday")
const getCurrentDay = () => {
  return new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
};

// ✅ Get current time in HH:mm format
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export default function VendorList() {
  const scrollRef = useRef(null);
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState({}); // track each vendor

  const {baseUrl} = useApi();

  // ✅ Auto refresh every 60 seconds (60000 ms)
  const { data, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await fetch(
        `${baseUrl}/admin/vendors/get-all`
      );
      const json = await res.json();
      return json.vendors || [];
    },
    refetchInterval: 60000, // <--- 🔄 auto-refresh every 1 minute
    refetchOnWindowFocus: true, // also refresh when user comes back to tab
  });

  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (scrollRef.current) {
      setWidth(scrollRef.current.scrollWidth - scrollRef.current.offsetWidth);
    }
  }, [data]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) stars.push(<Star key={`full-${i}`} size={12} className="text-yellow-400" />);
    if (halfStar) stars.push(<StarHalf key="half" size={12} className="text-yellow-400" />);
    for (let i = 0; i < emptyStars; i++) stars.push(<StarEmpty key={`empty-${i}`} size={12} className="text-gray-300" />);
    return stars;
  };

  // ✅ Determine if vendor is open
  const isOpen = (vendor) => {
    const day = getCurrentDay();
    const todayHours = vendor.openHours?.[day]; // e.g. { open: "08:00", close: "22:00", closed: false }

    if (!todayHours || todayHours.closed) return false;

    const now = getCurrentTime();

    // Compare time strings
    return now >= todayHours.open && now <= todayHours.close;
  };

  if (isLoading) {
    return (
      <div className="my-4 px-3">
        <h2 className="font-semibold text-lg mb-3 text-gray-800">Top Restaurants</h2>
        <div className="scroll flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[220px] rounded-2xl overflow-hidden bg-white shadow-sm snap-center">
              <Skeleton height={80} />
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

  return (
    <motion.div className=" mt-4 overflow-hidden" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="pb-2 text-lg text-shadow-md font-medium text-gray-800">Top Restaurants</h2>

      <motion.div ref={scrollRef} className="cursor-grab active:cursor-grabbing overflow-x-auto no-scrollbar snap-x snap-mandatory scroll" whileTap={{ cursor: "grabbing" }}>
        <motion.div drag="x" dragConstraints={{ right: 0, left: -width }} dragElastic={0.15} className="flex gap-4">
          {data?.map((vendor) => (
            <motion.div
              key={vendor._id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="bg-white mb-4 rounded-2xl shadow-sm min-w-[220px] overflow-hidden hover:shadow-md cursor-pointer snap-center flex-shrink-0"
              onClick={() => router.push(`/view-vendor/${String(vendor._id)}`)}
            >
              <div className="relative">
                {!imgLoaded[vendor._id] && <Skeleton height={128} width="100%" />}
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  onLoad={() => setImgLoaded((prev) => ({ ...prev, [vendor._id]: true }))}
                  className={`h-32 w-full object-cover transition-opacity duration-500 ${imgLoaded[vendor._id] ? "opacity-100" : "opacity-0"}`}
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex justify-between w-full pr-4 gap-1">
                  {vendor.metadata?.featured && (
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                  <span
                    className={`${
                      isOpen(vendor) ? "bg-green-500" : "bg-red-500"
                    } text-white text-[10px] px-2 py-0.5 rounded-full`}
                  >
                    {isOpen(vendor) ? "Open" : "Closed"}
                  </span>
                </div>

                {/* Rating */}
                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  {renderStars(vendor.rating || 0)}
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-1">
                  <Store size={12} className="text-orange-500"/>
                  <h3 className="font-medium text-gray-800 text-sm mb-1">{vendor.storeName}</h3>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin size={12} className="mr-1" />
                  {vendor.address?.city}, {vendor.address?.state}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
