"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Utensils, Clock, MapPin } from "lucide-react";
import FoodDetailsSkeleton from "@/app/skeleton/FoodDetailsSkeleton";

export default function FoodDetailsPage() {
  const { foodId } = useParams();
  const router = useRouter();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `https://grub-dash-api.vercel.app/api/vendors/foods/get-food?id=${foodId}`;

  useEffect(() => {
    if (!foodId) return;

    const fetchFood = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setFood(res?.data?.data || null);
      } catch (err) {
        console.error("Error fetching food details:", err);
        setError("Failed to load food details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [foodId]);

  if (loading) return <FoodDetailsSkeleton />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {error}
      </div>
    );
  if (!food)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Food not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <ArrowLeft
          onClick={() => router.back()}
          className="cursor-pointer text-gray-700 hover:text-orange-600"
        />
        <h2 className="text-lg font-semibold text-gray-800">Food Details</h2>
      </div>

      {/* Food Content */}
      <div className="max-w-2xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Image */}
          <div className="relative">
            <img
              src={food.images?.[0]?.url || "/placeholder.jpg"}
              alt={food.name}
              className="w-full h-64 object-cover"
            />
            <span
              className={`absolute top-3 right-3 px-3 py-1 text-sm rounded-full ${
                food.available ? "bg-green-500 text-white" : "bg-gray-400 text-white"
              }`}
            >
              {food.available ? "Available" : "Unavailable"}
            </span>
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">{food.name}</h1>
            <p className="text-sm text-gray-500">
              Sold by <span className="font-medium">{food.vendor?.storeName}</span>
            </p>

            <div className="flex items-center gap-2 text-yellow-500 mt-2">
              <Star size={16} />
              <span className="text-sm">
                {food.rating || 0} ({food.ratingCount || 0})
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
              <span className="flex items-center gap-1">
                <Utensils size={14} /> {food.category || "Uncategorized"}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {food.estimatedDeliveryTime || "--"} mins
              </span>
            </div>

            <p className="mt-3 text-gray-700">{food.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-2xl font-bold text-orange-600">
                ₦{(food.price || 0).toLocaleString()}
              </p>
              <button className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition-all">
                Add to Cart
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
