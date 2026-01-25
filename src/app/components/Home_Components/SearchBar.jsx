"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/search");
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative z-20 group"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-orange-500 blur-lg opacity-10 rounded-2xl group-hover:opacity-20 transition-opacity duration-300" />

      <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent group-hover:border-orange-100 dark:group-hover:border-zinc-700 transition-all duration-300 cursor-pointer">
        <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl mr-3 group-hover:bg-orange-50 dark:group-hover:bg-zinc-700 transition-colors">
          <Search className="text-gray-400 group-hover:text-orange-500 transition-colors" size={22} />
        </div>

        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
            What are you craving?
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
            Search "Jollof Rice" or "Chicken"
          </span>
        </div>

        <div className="pl-3 border-l border-gray-100 dark:border-zinc-800">
          <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300 text-gray-400">
            <SlidersHorizontal size={20} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
