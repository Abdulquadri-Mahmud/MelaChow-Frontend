"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Utensils, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import { useApi } from "@/app/context/ApiContext";

export default function FoodList() {
  const router = useRouter();
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef(null);
  const {baseUrl} = useApi();

  // ✅ Fetch foods from API
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${baseUrl}/vendors/foods/get-foods`);

        const data = res?.data || [];

        // console.log("API response data:", data?.data);

        setFoods(data?.data || []);
    } catch (err) {
        console.error("Error fetching foods:", err);
        setError("Failed to load foods. Please try again later.");
    } finally {
        setIsLoading(false);
    }
};

fetchFoods();
}, []);

// console.log("Fetched foods:", foods);

  // ✅ Group foods by category
  const foodsByCategory = useMemo(() => {
    if (!foods || foods.length === 0) return {};
    return foods.reduce((acc, food) => {
      const category = food.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(food);
      return acc;
    }, {});
  }, [foods]);

  useEffect(() => {
    if (scrollRef.current) {
      setWidth(scrollRef.current.scrollWidth - scrollRef.current.offsetWidth);
    }
  }, [foods]);

  if (isLoading) return <HomeFoodListSkeleton />;

  if (error) return <HomeFoodListSkeleton />

  if (foods.length === 0)
    return (
      <div className="text-center text-gray-500 py-10">
        <p>No foods available yet.</p>
      </div>
    );

  return (
    <div className="space-y-3 flex-1 mt-2">
      {Object.entries(foodsByCategory).map(([category, foods]) => (
        <div key={category} className="space-y-3 bg-white md:p-3 p-2 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-800">{category}</h2>

          <motion.div ref={scrollRef} className="cursor-grab active:cursor-grabbing overflow-x-auto no-scrollbar snap-x snap-mandatory scroll" whileTap={{ cursor: "grabbing" }}>
            <motion.div drag="x" dragConstraints={{ right: 0, left: -width }} dragElastic={0.15} className="flex gap-4">

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
                  {/* Image */}
                  <div className="relative rounded-md overflow-hidden">
                    <img
                      src={food.images?.[0]?.url || "/placeholder.jpg"}
                      alt={food.name}
                      className="w-full h-32 object-cover rounded-md"
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

                  {/* Details */}
                  <div className="mt-2">
                    <h3 className="truncate text-md font-semibold text-gray-800">
                      {food.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1 truncate">
                      {food.vendor?.storeName || "Unknown Store"}
                    </p>

                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} />
                        <span className="text-xs">
                          {food.rating || 0} ({food.ratingCount || 0})
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        ₦{(food.price || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Utensils size={12} /> {food.category || "Uncategorized"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {food.estimatedDeliveryTime || "--"} mins
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          {/* <div className="flex md:space-x-4 space-x-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scroll-smooth touch-pan-x">
          </div> */}
        </div>
      ))}
    </div>
  );
}
