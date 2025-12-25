"use client";

import { ArrowLeft, Clock, Truck, ChevronRight } from "lucide-react";
import { TbCurrencyNaira } from "react-icons/tb";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useVendorFood } from "@/app/hooks/useVendorFoodQuery";
import VendorSkeleton from "@/app/skeleton/VendorSkeleton";
import { getVendorOpenStatus } from "@/app/lib/vendor-time/vendorTime";
import { useState, useMemo } from "react";

export default function ViewVendor() {
  const { id } = useParams();
  const router = useRouter();

  const { foods, isLoading, isError } = useVendorFood(id);

  const foodList = foods?.data || [];
  const vendor = foodList?.[0]?.vendor;
  const deliveryFee = foodList?.[0]?.deliveryFee;
  const estimatedTime = foodList?.[0]?.estimatedDeliveryTime;
  const openingMessage = vendor?.openingHours
    ? getVendorOpenStatus(vendor.openingHours)
    : "Opening hours not available.";

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = foodList.map((f) => f.category).filter(Boolean);
    return ["All", ...Array.from(new Set(cats))];
  }, [foodList]);

  // Filtered foods
  const filteredFoods = useMemo(() => {
    let filtered = selectedCategory === "All"
      ? foodList
      : foodList.filter((food) => food.category === selectedCategory);

    if (searchQuery.trim()) {
      filtered = filtered.filter((food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [foodList, selectedCategory, searchQuery]);

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 bg-white sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {vendor?.storeName || "Restaurant"}
        </h1>
      </header>

      <div className="px-3 pb-24 pt-3 space-y-4">
        {isLoading ? (
          <VendorSkeleton />
        ) : isError ? (
          <p className="text-center text-red-500 mt-10">Failed to load restaurant</p>
        ) : !vendor ? (
          <p className="text-center text-gray-500 mt-10">Restaurant not found</p>
        ) : (
          <>
            {/* Vendor Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl border border-gray-100 transition overflow-hidden" >
                {/* Vendor Banner */}
                <div className="relative w-full h-32">
                    <img src={vendor.logo || "/vendor-banner-placeholder.jpg"} alt="Vendor Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/25"></div>
                    <img src={vendor.logo || "/placeholder.jpg"} alt={vendor.storeName} className="w-16 h-16 rounded-xl object-cover border absolute left-4 bottom-[-20px]" />
                </div>

                {/* Vendor Info */}
                <div className="pt-6 px-4 pb-4">
                    <h2 className="font-semibold text-gray-800 text-lg">{vendor.storeName}</h2>

                    {/* Ratings */}
                    <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-yellow-400">
                        {Array.from({ length: Math.round(vendor.rating || 0) }).map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.954L10 0l2.949 5.956 6.561.954-4.755 4.635 1.123 6.545z" />
                        </svg>
                        ))}
                    </div>
                    <span className="text-xs text-gray-500">{vendor.reviewsCount || 0} reviews</span>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {vendor.isPopular && (
                            <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
                            🔥 Popular
                            </span>
                        )}
                        {vendor.isNew && (
                            <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-[10px] font-semibold">
                            🌟 New
                            </span>
                        )}
                        {vendor.discount && (
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-[10px] font-semibold">
                            {vendor.discount}% Off
                            </span>
                        )}
                    </div>

                    {/* Delivery & Fee */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <Clock size={12} />
                        <span>{estimatedTime} mins</span>
                        <span>•</span>
                        <TbCurrencyNaira size={12} />
                        <span>{deliveryFee}</span>
                    </div>
                    {vendor.acceptsDelivery && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                        <Truck size={12} />
                        Instant delivery
                    </div>
                    )}

                    {/* Opening Status */}
                    <motion.div
                    onClick={() => router.push(`/view-vendor/${vendor._id}`)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 text-gray-600 text-sm mt-2 cursor-pointer group"
                    >
                    <Clock className="text-orange-500 group-hover:text-orange-600 transition" size={15} />
                    <p className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition flex items-center">
                        {openingMessage}
                        <ChevronRight size={16} className="ml-1" />
                    </p>
                    </motion.div>

                    {/* Delivery Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                        className="h-1 bg-orange-500 rounded-full"
                        style={{ width: `${Math.min(100, (estimatedTime / 60) * 100)}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-500">{estimatedTime} mins</span>
                    </div>
                </div>
                </motion.div>

            {/* Search Bar */}
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 mt-2">
              <input
                type="text"
                placeholder="Search for foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent flex-1 py-1 outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Sticky Category Filter */}
            <div className="sticky top-[72px] bg-white rounded-2xl py-2 z-40">
              <div className="flex gap-2 overflow-x-auto scroll px-1 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full border text-sm font-medium whitespace-nowrap transition
                      ${selectedCategory === cat
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Foods */}
            <div className="space-y-4 mt-2">
              {filteredFoods.length === 0 ? (
                <p className="text-gray-500 text-sm">No food matches your search.</p>
              ) : (
                <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                  {filteredFoods.map((food) => (
                    <motion.div
                      key={food._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push(`/food-details/${food._id}`)}
                      className="bg-white border border-gray-100 rounded-2xl cursor-pointer transition"
                    >
                      <img
                        src={food.images?.[0]?.url || "/placeholder.jpg"}
                        alt={food.name}
                        className="w-full h-32 rounded-xl object-cover"
                      />
                      <div className="mt-2 p-2">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2 truncate">{food.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{food.category}</p>
                        <p className="text-orange-600 font-semibold text-sm mt-1">₦{food.price?.toLocaleString()}</p>

                        <div className="mt-2 text-xs text-gray-600 space-y-1 flex justify-between">
                          <p className="flex items-center gap-1">
                            <Truck size={12} className="text-orange-500" />
                            {food?.vendor?.address?.city || "Address not available"}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock size={13} className="text-orange-500" />
                            {food?.estimatedDeliveryTime - 5 || "0"} - {food?.estimatedDeliveryTime || "0"} mins
                          </p>
                        </div>

                        {food.metadata && (
                          <div className="mt-2 bg-orange-50 p-2 rounded-lg border border-orange-100 text-xs text-gray-700">
                            <p><strong>Portion:</strong> {food.metadata.portionSize}</p>
                            <p><strong>Spice:</strong> {food.metadata.spiceLevel}</p>
                            <p><strong>Chef Special:</strong> {food.metadata.chefSpecial ? "Yes" : "No"}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
