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
      <Image
        src={food.image}
        alt={food.name}
        width={400}
        height={200}
        className="w-full md:h-[200px] h-[170px] object-cover p-2 rounded-xl"
      />
      <div className="p-2">
        <h3 className="text-sm font-semibold text-gray-800">{food.name}</h3>
        <p className="text-xs text-gray-500">{food.restaurant}</p>
        <p className="text-orange-500 text-sm font-bold mt-1">₦{food.price}</p>
      </div>
    </motion.div>
  );
}
