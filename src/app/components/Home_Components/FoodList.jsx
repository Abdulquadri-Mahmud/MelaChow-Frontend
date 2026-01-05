"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Star, Utensils, Clock, Truck, Store, Plus } from "lucide-react";
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
          <h2 className="md:text-lg text-md font-semibold text-gray-800 tracking-tight">
            {category}
          </h2>

          <div className="flex gap-2 mt-2 overflow-x-auto scroll pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {foods.map((food) => (
              <div
                key={food._id}
                className="bg-white rounded-md min-w-[220px] cursor-pointer snap-start hover:shadow-lg transition flex flex-col h-full border border-gray-50"
                onClick={() => router.push(`/food-details/${food._id}`)}
              >
                {/* Image */}
                <div className="relative rounded-md overflow-hidden">
                  <img
                    src={food.images?.[0]?.url || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-30 object-cover rounded-md"
                  />
                  <div className="absolute top-2 right-2 bg-white backdrop-blur-md text-orange-600 px-2 py-1 rounded text-[10px] font-bold shadow-sm border border-orange-100">
                    from | ₦{food.price?.toLocaleString()}
                  </div>
                </div>

                {/* Details */}
                <div className="p-2 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-gray-800 truncate flex-1 md:text-md uppercase tracking-tight">
                      {food.name}
                    </h3>
                    <div className="bg-orange-50 p-1.5 rounded-lg text-orange-500">
                      <Plus size={16} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                    <Store className="text-orange-500" size={12} />
                    <span className="truncate">{food?.vendor?.storeName || "Vendor"}</span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                      <Truck size={12} className="text-orange-400" />
                      <span>from | ₦{food.deliveryFee || food?.vendor?.deliveryFee || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <Clock size={12} className="text-orange-400" />
                      <span>{food?.estimatedDeliveryTime || "25"}m</span>
                    </div>
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
