"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Star, Utensils, Clock, Truck, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";

export default function FoodList() {
  const router = useRouter();
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { baseUrl } = useApi();

  // Fetch foods from API
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${baseUrl}/vendors/foods/get-foods`);
        const data = res?.data?.data || [];
        setFoods(data);
      } catch (err) {
        console.error("❌ Error fetching foods:", err);
        setError("Failed to load foods. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoods();
  }, [baseUrl]);

  // Group foods by category
  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(foods) || foods.length === 0) return {};
    return foods.reduce((acc, food) => {
      const category = food.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(food);
      return acc;
    }, {});
  }, [foods]);

  if (isLoading) return <HomeFoodListSkeleton />;

  if (error)
    return (
      <div className="text-center text-red-500 py-6">
        {error}
      </div>
    );

  if (!foods || foods.length === 0)
    return (
      <div className="text-center text-gray-500 py-6">
        No foods available yet.
      </div>
    );

  return (
    <div className="flex-1 pb-5">
      {Object.entries(foodsByCategory).map(([category, foods]) => (
        <div key={category} className=" md:p-3 p-2 rounded-xl">
          <h2 className="md:text-lg text-md font-semibold text-gray-800">
            {category}
          </h2>

          {/* Horizontal scroll container */}
          <div className="flex gap-2 overflow-x-auto scroll pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {foods.map((food) => (
              <div
                key={food._id}
                className="bg-white p-2 rounded-md min-w-[250px] cursor-pointer snap-start hover:shadow-lg transition"
                onClick={() => router.push(`/food-details/${food._id}`)}
              >
                {/* Image */}
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

                {/* Details */}
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
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <p className="flex items-center gap-1">
                      <Truck size={12} className="text-orange-500" />
                      {food?.vendor?.address
                        ? ` ${food.vendor.address.city}`
                        : "Address not available"}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock size={13} className="text-orange-500" />
                      {food?.estimatedDeliveryTime - 5 || "0"} -{" "}
                      {food?.estimatedDeliveryTime || "0"} mins
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
