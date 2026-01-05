"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { motion } from 'framer-motion';
import { Flame } from "lucide-react";

// const categories = [
//   { id: 1, name: "Rice Dishes", icon: "/category/rice.jpeg" },
//   { id: 2, name: "Swallow", icon: "/category/swallow.jpg" },
//   { id: 3, name: "Shawarma", icon: "/category/shawarma.jpg" },
//   { id: 4, name: "Snacks", icon: "/category/snacks.webp" },
//   { id: 5, name: "Drinks", icon: "/category/drinks.jpg" },
//   { id: 6, name: "Local", icon: "/category/rice.jpeg" },
// ];

const categories = [
  "Rice Dishes", "Swallow", "Soups & Stews", "Beans Dishes", "Yam Dishes",
  "Plantain Dishes", "Pasta", "Snacks", "Grills & Barbecue", "Shawarma",
  "Breakfast", "Drinks", "Desserts", "Seafood", "Vegetarian", "Salads",
  "Small Chops", "Porridge", "Native Delicacies", "Others",
];


export default function CategoryList() {
  const [loadedImages, setLoadedImages] = useState({});
  const [pageLoaded, setPageLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const handleImageLoad = (id) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleCategoryClick = (categoryName) => {
    router.push(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="mt-2">
      <div className="scroll mx-auto bg-white rounded-full w-[100%] flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory">
        <div className="flex scroll overflow-x-auto no-scrollbar gap-2 px-3 pb-3 mt-2">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              layout
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full whitespace-nowrap border  hover:shadow-md hover:border-orange-200 hover:bg-orange-50/30 bg-orange-50 border-orange-200 transition-all duration-300 group`}
            >
              <Flame
                size={14}
                className={"text-orange-500 fill-orange-500/10 group-hover:fill-orange-500/20 transition-colors"}
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">{category}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
