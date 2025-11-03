"use client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function RecommendedList() {
  const items = [
    { id: 1, name: "Asun Delight", vendor: "BBQ Hub", price: 4500, image: "/images/asun.jpg" },
    { id: 2, name: "Amala Combo", vendor: "Iya Meta", price: 2800, image: "/images/amala.jpg" },
    { id: 3, name: "Jollof Rice", vendor: "ChopLife", price: 3000, image: "/images/jollof.jpg" },
    { id: 4, name: "Shawarma Wrap", vendor: "Grill Master", price: 2500, image: "/images/shawarma.jpg" },
    { id: 5, name: "Fried Rice Deluxe", vendor: "TasteBuds", price: 3200, image: "/images/friedrice.jpg" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 overflow-hidden"
    >
      <h2 className="font-semibold text-lg mb-3 text-gray-800 px-4">
        Recommended for You
      </h2>

      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.2}
        className="flex gap-4 px-3 mb-3 cursor-grab active:cursor-grabbing"
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            whileTap={{ scale: 0.97 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl shadow-sm min-w-[180px] overflow-hidden"
          >
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="h-28 w-full object-cover"
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full text-[#FF6B00]"
              >
                <Heart size={14} />
              </motion.div>
            </div>

            <div className="p-3">
              <h3 className="font-medium text-sm text-gray-800">{item.name}</h3>
              <p className="text-xs text-gray-500">{item.vendor}</p>
              <p className="text-sm font-semibold text-[#FF6B00] mt-1">
                ₦{item.price.toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
