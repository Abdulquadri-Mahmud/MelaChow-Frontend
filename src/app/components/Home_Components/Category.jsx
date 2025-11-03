"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";

const categories = [
  { id: 1, name: "Rice Dishes", icon: "/category/rice.jpeg" },
  { id: 2, name: "Swallow", icon: "/category/swallow.jpg" },
  { id: 3, name: "Shawarma", icon: "/category/shawarma.jpg" },
  { id: 4, name: "Snacks", icon: "/category/snacks.webp" },
  { id: 5, name: "Drinks", icon: "/category/drinks.jpg" },
  { id: 6, name: "Local", icon: "/category/rice.jpeg" },
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
    <div className="mt-3 px-3">
      <h2 className="font-semibold text-lg mb-3 text-gray-800">
        Categories
      </h2>
      <div className="scroll flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.name)}
            className="flex flex-col items-center bg-white shadow p-3 rounded-xl min-w-[80px] flex-shrink-0 snap-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 mb-1 relative">
              {!loadedImages[cat.id] && pageLoaded && (
                <Skeleton
                  width={64}
                  height={64}
                  circle
                  className="absolute top-0 left-0 animate-pulse"
                />
              )}
              {pageLoaded && (
                <img
                  src={cat.icon}
                  alt={cat.name}
                  onLoad={() => handleImageLoad(cat.id)}
                  className={`w-16 h-16 rounded-full object-cover transition-opacity duration-500 absolute top-0 left-0 ${
                    loadedImages[cat.id] ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
