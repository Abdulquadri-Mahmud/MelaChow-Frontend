"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function FoodCard({ food, onSelect }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="bg-white shadow-md rounded-xl overflow-hidden cursor-pointer transition-all"
    >
      <div className="relative">
        <Image
          src={food.image || (food.images && food.images[0]) || "/placeholder.jpg"}
          alt={food.name}
          width={400}
          height={200}
          className={`w-full md:h-[200px] h-[170px] object-cover p-2 rounded-xl ${(food.stock !== null && Number(food.stock) <= 0) ? "grayscale opacity-80" : ""
            }`}
        />
        {food.stock !== null && food.stock !== undefined && Number(food.stock) <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl m-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-sm font-semibold text-gray-800">{food.name}</h3>
        <p className="text-xs text-gray-500">{food.restaurant}</p>
        <p className="text-orange-500 text-sm font-bold mt-1">₦{food.price}</p>
      </div>
    </motion.div>
  );
}
