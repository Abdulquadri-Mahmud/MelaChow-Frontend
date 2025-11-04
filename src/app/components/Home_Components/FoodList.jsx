"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Utensils, Clock, Truck, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";

export default function FoodList() {
  const router = useRouter();
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const [width, setWidth] = useState(0);

  const API_URL = "https://grub-dash-api.vercel.app/api/vendors/foods/get-foods";

  useEffect(() => {
    if (scrollRef.current) {
      setWidth(scrollRef.current.scrollWidth - scrollRef.current.offsetWidth);
    }
  }, [foods]);

  // ✅ Fetch foods from API
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(API_URL);
        const data = res?.data?.data || [];
        console.log("✅ API response data:", data);
        setFoods(data);
      } catch (err) {
        console.error("❌ Error fetching foods:", err);
        setError("Failed to load foods. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoods();
  }, []);

  // ✅ Group foods by category safely
  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(foods) || foods.length === 0) return {};
    return foods.reduce((acc, food) => {
      const category = food.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(food);
      return acc;
    }, {});
  }, [foods]);

  // ✅ Handle loading state
  if (isLoading) return <HomeFoodListSkeleton />;

  // ✅ Handle error state
  if (error) {
    return (
      <HomeFoodListSkeleton />
    );
  }

  // ✅ Handle empty data
  if (!foods || foods.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        No foods available yet.
      </div>
    );
  }

  return (
    <div className="flex-1 ">
      {Object.keys(foodsByCategory).length > 0 ? (
        Object.entries(foodsByCategory).map(([category, foods]) => (
          <div key={category} className="space-y-1 md:p-3 p- rounded-xl">
            <h2 className="md:text-lg text-md font-semibold text-gray-800">{category}</h2>
            <motion.div ref={scrollRef} className="cursor-grab pb-2 active:cursor-grabbing overflow-x-auto no-scrollbar snap-x snap-mandatory scroll" whileTap={{ cursor: "grabbing" }}>
              <motion.div drag="x" dragConstraints={{ right: 0, left: -width }} dragElastic={0.15} className="flex md:gap-4 gap-2">
                {foods.map((food) => (
                  <motion.div
                    key={food._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="bg-white p-2 rounded-md shadow-md min-w-[250px] cursor-pointer snap-start"
                    onClick={() => router.push(`/food-details/${food._id}`)}
                  >
                    {/* 🖼️ Image */}
                    <div className="relative rounded-md overflow-hidden">
                      <img
                        src={food.images?.[0]?.url || "/placeholder.jpg"}
                        alt={food.name}
                        className="w-full h-30 object-cover rounded-md"
                      />
                      <span
                        className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
                          food.available
                            ? "bg-green-500 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {food.available ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    {/* 📝 Details */}
                    <div>
                      <h3 className="md:text-md text-sm font-semibold text-gray-800 truncate">
                        {food.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <p className="flex items-center gap-1 text-sm font-medium text-gray-600 truncate">
                          <Store className="text-[#FF6600] w-4" />
                          {food?.vendor?.storeName || "Unknown Vendor"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Truck size={12} className="text-orange-500" />
                          {food?.vendor?.address
                            ? ` ${food.vendor.address.city}`
                            : "Address not available"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={13} className="text-orange-500" />
                          {food?.estimatedDeliveryTime - 5 || "0"} - {food?.estimatedDeliveryTime || "0"} mins
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-6">
          No categories available.
        </div>
      )}
    </div>
  );
}
