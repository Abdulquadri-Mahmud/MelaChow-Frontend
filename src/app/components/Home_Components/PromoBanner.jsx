"use client";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const banners = [
  { id: 1, text: "Get ₦1000 off your first order!", emoji: "🍲", color: "bg-[#FF6B00]" },
  { id: 2, text: "Try our new spicy Jollof from The Place!", emoji: "🔥", color: "bg-[#FFD580] text-gray-800" },
  { id: 3, text: "Fast delivery in under 30 minutes!", emoji: "🛵", color: "bg-[#FF915A]" },
];

export default function PromoBanner() {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const scrollWidth = containerRef.current.scrollWidth;
      const offsetWidth = containerRef.current.offsetWidth;
      setWidth(scrollWidth - offsetWidth);
    }
  }, []);

  return (
    <motion.div className="mt-4 bg-zinc-100 py-2 rounded-2xl overflow-hidden px-3">
      <motion.div className="scroll flex gap-4 pb-2 cursor-grab active:cursor-grabbing snap-x snap-mandatory overflow-x-auto scrollbar-none">
        {banners.map((banner, index) => (
          <motion.div
            key={banner.id}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`${banner.color} px-5 py-6 rounded-2xl min-w-[70%] font-semibold shadow-lg flex-shrink-0 snap-center flex items-center gap-4`}
          >
            {/* Emoji with white circular background */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl">
              {banner.emoji}
            </div>

            {/* Banner text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-base leading-tight flex-1"
            >
              {banner.text}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
