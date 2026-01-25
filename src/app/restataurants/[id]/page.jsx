"use client";

import { ArrowLeft, Clock, Search, Star, ArrowRight, MapPin } from "lucide-react";
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
  const hours = vendor?.openHours || vendor?.openingHours;
  const openingMessage = hours
    ? getVendorOpenStatus(hours)
    : "Opening hours not available.";

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique categories (Flattening the categories array from each food item)
  const categories = useMemo(() => {
    const allCats = foodList.flatMap((f) => f.categories || [f.category]).filter(Boolean);
    return ["All", ...Array.from(new Set(allCats))];
  }, [foodList]);

  // Filtered foods logic
  const filteredFoods = useMemo(() => {
    let filtered = selectedCategory === "All"
      ? foodList
      : foodList.filter((food) => {
        // Supports both array 'categories' and string 'category'
        if (Array.isArray(food.categories)) {
          return food.categories.includes(selectedCategory);
        }
        return food.category === selectedCategory;
      });

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
      <header className="flex items-center gap-2 px-3 py-3 bg-white sticky top-0 z-50 shadow-sm border-b border-gray-50">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {vendor?.storeName || "Restaurant Details"}
        </h1>
      </header>

      <div className="max-w-4xl mx-auto px-3 pb-24 pt-3 space-y-6">
        {isLoading ? (
          <VendorSkeleton />
        ) : isError ? (
          <div className="text-center py-10 bg-red-50 rounded-3xl border border-dashed border-red-200 mx-3">
            <p className="text-red-500 font-medium">Failed to load restaurant details</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-md">Retry</button>
          </div>
        ) : !vendor ? (
          // Fallback if vendor object is missing within foodList (unlikely if foods exist, but safe)
          <div className="md:col-span-2 col-span-1 text-center py-12">
            <p className="text-gray-500">No menu items available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Vendor Info Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100" >
              {/* Banner */}
              <div className="relative w-full h-40">
                <img src={vendor.logo || "/vendor-banner-placeholder.jpg"} alt="Vendor Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* Floating Logo */}
                <div className="absolute -bottom-6 left-6 p-1 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <img src={vendor.logo || "/placeholder.jpg"} alt={vendor.storeName} className="w-20 h-20 rounded-xl object-cover" />
                </div>

                {/* Quick Badges */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {vendor.isPopular && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md">🔥 POPULAR</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="pt-10 p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-gray-900 text-2xl tracking-tight">{vendor.storeName}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-orange-500" />
                      {vendor.address?.city}, {vendor.address?.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-900 text-sm">{vendor.rating || 0}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{vendor.reviewsCount || 0} REVIEWS</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-6 py-3 border-y border-gray-50">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivery Time</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-500" />
                      <span className="font-bold text-sm text-gray-800">{estimatedTime} mins</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-gray-50 pl-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivery Fee</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-gray-800">from | ₦{deliveryFee || 0}</span>
                    </div>
                  </div>
                  {vendor.acceptsDelivery && (
                    <div className="flex flex-col gap-1 border-l border-gray-50 pl-4">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Method</p>
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 w-fit">INSTANT</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Filter & Search Section */}
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search dishes or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 outline-none text-sm transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:bg-white"
                />
              </div>

              {/* Categories Scroll */}
              <div className="flex gap-2 overflow-x-auto scroll no-scrollbar pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl border text-sm font-bold whitespace-nowrap transition-all
                      ${selectedCategory === cat
                        ? "bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200"
                        : "bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Foods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 mt-4">
              {filteredFoods.length === 0 ? (
                <div className="col-span-full py-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                filteredFoods.map((food, idx) => (
                  <motion.div
                    key={food._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => router.push(`/food-details/${food._id}`)}
                    className="bg-white border border-gray-100 rounded-[24px] p-3 cursor-pointer hover:shadow-xl hover:shadow-gray-100 hover:border-orange-100 transition-all flex gap-4 group h-fit"
                  >
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={food.image || food.images?.[0]?.url || food.variantImage || "/placeholder.jpg"}
                        alt={food.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        {/* Categories / Tags Display */}
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight">{food.name}</h4>
                          {(food.categories || [food.category]).slice(0, 1).map((cat) => (
                            <span key={cat} className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded capitalize shrink-0">
                              {cat}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {food.description || "Fresh and delicious meal crafted just for you."}
                        </p>
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        <p className="text-base font-black text-gray-900 tabular-nums">₦{food.price?.toLocaleString()}</p>
                        <div className="bg-gray-900 text-white p-2 rounded-xl shadow-lg group-hover:bg-orange-600 transition-colors">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
