"use client";

import { useMemo } from "react";
import { Star, Utensils, Clock, Truck, Store, Plus, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeFoodListSkeleton from "@/app/skeleton/HomeFoodListSkeleton";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";

export default function FoodList({ user }) {
  const router = useRouter();
  const { baseUrl } = useApi();

  const defaultAddr = useMemo(() => user?.addresses?.find((a) => a.isDefault), [user]);

  const { data: foods = [], isLoading, isError, error } = useQuery({
    queryKey: ["foods", defaultAddr?.city, defaultAddr?.state],
    queryFn: async () => {
      if (!defaultAddr?.city || !defaultAddr?.state) {
        // Throw a mock axios-like error to trigger our custom error UI without a failed network request
        const err = new Error("Missing location");
        err.response = { data: { message: "Please provide both city and state query parameters." } };
        throw err;
      }

      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${baseUrl}/user/foods`, {
        params: {
          city: defaultAddr.city,
          state: defaultAddr.state,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res?.data?.foods || [];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    retry: false, // Don't retry since location won't change without user action
  });

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

  if (isError) {
    const errorMsg = error?.response?.data?.message || "Failed to load foods. Please try again later.";
    if (errorMsg === "Please provide both city and state query parameters.") {
      return (
        <div className="mt-4 px-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-orange-100 p-1.5 rounded-lg">
              <Utensils className="text-orange-600" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Available Foods</h2>
          </div>
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <MapPin className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-gray-500 text-sm font-medium">Please provide both city and state to see foods near you.</p>
            <p className="text-xs text-gray-400 mt-1">Try changing your location!</p>
          </div>
        </div>
      );
    }
    return (
      <div className="my-4 px-3 text-center py-6 bg-red-50 rounded-2xl">
        <p className="text-red-500 text-sm">{errorMsg}</p>
      </div>
    );
  }

  if (foods.length === 0)
    return (
      <div className="text-center text-gray-500 py-6">
        No foods available yet.
      </div>
    );

  return (
    <div className="flex-1 pb-5">
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Utensils className="text-orange-600" size={18} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Available Foods</h2>
        </div>
        <button
          onClick={() => router.push('/all-foods')}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
        >
          See All
        </button>
      </div>

      {Object.entries(foodsByCategory).map(([category, foods]) => (
        <div key={category} className=" md:p-3 p-2 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-100 p-1.5 rounded-lg">
              <Utensils className="text-orange-600" size={16} />
            </div>
            <h2 className="md:text-lg text-md font-semibold text-gray-800 tracking-tight">
              {category}
            </h2>
          </div>

          <div className="flex gap-2 mt-2 overflow-x-auto scroll pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {foods.map((food) => (
              <div
                key={food._id}
                className="bg-white rounded-md min-w-[250px] cursor-pointer snap-start hover:shadow-lg transition flex flex-col h-full border border-gray-50"
                onClick={() => router.push(`/food-details/${food._id}`)}
              >
                {/* Image */}
                <div className="relative rounded-md overflow-hidden">
                  <img
                    src={food.image || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-32 object-cover rounded-md"
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
                    <span className="truncate">{food?.restaurant?.storeName || "Vendor"}</span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                      <Truck size={12} className="text-orange-400" />
                      <span>from | ₦{food.deliveryFee || food?.restaurant?.deliveryFee || 0}</span>
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
