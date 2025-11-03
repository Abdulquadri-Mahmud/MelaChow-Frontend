"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the full search page
    router.push("/search");
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex items-center bg-white rounded-xl mt-4 shadow-sm p-3 cursor-pointer"
      onClick={handleClick}
    >
      <Search className="text-gray-400" size={20} />
      <span className="flex-1 px-2 text-sm text-gray-500">
        Search food or restaurants
      </span>
      <SlidersHorizontal className="text-gray-500" size={20} />
    </motion.div>
  );
}
