"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Flame, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Store, 
  Truck, 
  ArrowLeft, 
  Star, 
  Plus,
  Heart,
  Globe,
  Bike,
  Sparkles
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import Link from "next/link";
import NoFoodsFound from "../NoFoodsFound";
import SearchFoodSkeleton from "@/app/skeleton/SearchFoodSkeleton";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useCategories } from "@/app/hooks/useCategories";

export const dynamic = "force-dynamic";

const DIETARY_COLORS = {
  veg: "bg-green-500 text-white shadow-lg shadow-green-500/20",
  vegan: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
  halal: "bg-teal-500 text-white shadow-lg shadow-teal-500/20",
  kosher: "bg-blue-500 text-white shadow-lg shadow-blue-500/20",
  "non-veg": "bg-red-500 text-white shadow-lg shadow-red-500/20",
};

const FoodCard = ({ food }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    
    // Check both potential properties for vendor/restaurant
    const vendor = food.restaurant || food.vendor;
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");

    return (
        <div
            onClick={() => router.push(`/food-details/${food._id}`)}
            className="group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden cursor-pointer snap-start transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-none border border-zinc-100 dark:border-zinc-800"
            style={{ width: "72vw", maxWidth: "280px" }}
        >
            {/* Image Container */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={food.image || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Hot/New Badge */}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Flame size={8} fill="currentColor" /> HOT
                    </span>
                </div>

                {/* Dietary Badge - Bottom Left */}
                {food.dietary_type && food.dietary_type !== "mixed" && (
                    <div className="absolute bottom-2 left-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${DIETARY_COLORS[food.dietary_type] || "bg-zinc-100 text-zinc-500"}`}>
                            {food.dietary_type}
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1: Name + Heart */}
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate max-w-[calc(100%-28px)] uppercase italic tracking-tight">
                        {food.name}
                    </h3>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors"
                    >
                        <Heart
                            size={18}
                            className={liked ? "fill-red-500 text-red-500" : "text-zinc-300 dark:text-zinc-700"}
                            strokeWidth={liked ? 0 : 2}
                        />
                    </button>
                </div>

                {/* Row 2: Vendor Name â€¢ Location */}
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1 font-bold uppercase tracking-widest">
                    {vendor?.storeName} â€¢ {vendor?.city || "Nearby"}
                </p>

                {/* Row 3: Metadata Line: Globe | Delivery | Status | Rating */}
                <div className="mt-3 flex items-center gap-1.5 overflow-hidden border-t border-zinc-50 dark:border-zinc-800 pt-3">
                    <Globe size={14} className="text-zinc-400 dark:text-zinc-600" />
                    
                    <span className="text-zinc-100 dark:text-zinc-800 text-xs">|</span>

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Bike size={14} className="text-orange-500" />
                        {(() => {
                            const fee = food.deliveryFee;
                            return (!fee || fee === 0) ? (
                                <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase">Free</span>
                            ) : (
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">₦{fee.toLocaleString()}</span>
                            );
                        })()}
                    </div>

                    <span className="text-zinc-100 dark:text-zinc-800 text-xs">|</span>

                    {/* Status */}
                    <span className={`text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {status}
                    </span>

                    <span className="text-zinc-100 dark:text-zinc-800 text-xs">|</span>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                        <Star size={10} className="fill-orange-500 text-orange-500" />
                        <span className="text-[10px] font-black text-zinc-900 dark:text-white tabular-nums">
                            {Number(food.rating || vendor?.rating || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function FoodSearchMobile() {
  const { baseUrl } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(null);
  const [trending, setTrending] = useState([]);
  const [autocomplete, setAutocomplete] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const selectedCategory = searchParams.get("category");

  const { data: categories = [] } = useCategories();

  // Hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch trending searches
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${baseUrl}/search/food/trending`, {
          params: { limit: 8 },
          withCredentials: true,
        });
        setTrending(res.data.trending || []);
      } catch (err) {
        console.error("Trending Error:", err);
      }
    };
    fetchTrending();
  }, [baseUrl]);

  // Fetch foods based on category or query
  useEffect(() => {
    if (!hydrated) return;

    const fetchFoods = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simple params â€” category filtering is done on the frontend
        const params = query.trim() ? { q: query } : { q: '' };

        const res = await axios.get(`${baseUrl}/search/food/search`, {
          params,
          withCredentials: true,
        });
        setFoods(res.data.data || []);
      } catch (err) {
        console.error("Fetch Foods Error:", err?.response?.data || err.message || err);
        setError("Failed to load foods. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [baseUrl, hydrated, query]);

  // Autocomplete
  useEffect(() => {
    const fetchSearch = async () => {
      const sanitizedQuery = (query || "").trim();

      if (sanitizedQuery.length < 2) {
        setAutocomplete([]);
        setShowDropdown(false);
        return;
      }

      try {
        const res = await axios.get(`${baseUrl}/search/food/autocomplete`, {
          params: { q: sanitizedQuery },
          withCredentials: true,
        });

        setAutocomplete(res.data?.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Autocomplete Error:", err);
        setAutocomplete([]);
        setShowDropdown(false);
      }
    };

    const timeout = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, baseUrl]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Category grouping â€” always use all foods, filtered client-side by selectedCategory
  const displayedFoods = useMemo(() => {
    if (!selectedCategory || !foods.length) return foods;
    const lower = selectedCategory.toLowerCase();
    return foods.filter(food => {
      const childName = food.platform_category?.name?.toLowerCase() || '';
      const parentName = food.platform_category?.parent?.name?.toLowerCase() || '';
      return childName === lower || parentName === lower;
    });
  }, [foods, selectedCategory]);

  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(displayedFoods) || displayedFoods.length === 0) return {};
    return displayedFoods.reduce((acc, food) => {
      const primaryCategory = food.platform_category?.parent?.name 
        || food.platform_category?.name
        || (Array.isArray(food.categories) && food.categories[0])
        || food.category
        || "Others";
      if (!acc[primaryCategory]) acc[primaryCategory] = [];
      acc[primaryCategory].push(food);
      return acc;
    }, {});
  }, [displayedFoods]);

  // Category click â€” just updates the URL; filtering is handled by displayedFoods memo
  const handleCategoryClick = async (category) => {
    if (activeCategory === category) {
      setActiveCategory("");
      router.push("?");
      return;
    }
    setActiveCategory(category);
    setQuery("");
    router.push(`?category=${encodeURIComponent(category)}`);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Search submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Dropdown selection
  const handleDropdownSelect = async (value, type) => {
    setQuery(value);
    setShowDropdown(false);

    if (type === "category") {
      handleCategoryClick(value);
    }
    
    // Keep focus
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300">
        <div className="max-w-xl mx-auto px-2 pt-2 pb-2">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-95"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>

            <div className="flex flex-col items-center">
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
                Search
              </h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                  MelaChow
                </span>
              </div>
            </div>

            <div className="w-10"></div>
          </div>

          {/* Search Input Area */}
          <div className="relative px-2">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

              <div className="relative flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-inner transition-all duration-300">
                <Search size={22} className="text-zinc-400 transition-colors ml-1" />

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What are you craving?"
                  className="flex-1 outline-none bg-transparent text-base font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                  value={query || ""}
                  onChange={(e) => {
                    setQuery(e.target.value || "");
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  autoFocus
                />

                <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-zinc-500">
                  <SlidersHorizontal size={18} strokeWidth={2.5} />
                </div>
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showDropdown && (autocomplete.length > 0 || trending.length > 0) && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-full left-0 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 mt-4 rounded-[28px] z-[60] max-h-96 overflow-y-auto p-2"
                  >
                    {autocomplete.length > 0 && (
                      <div className="mb-4">
                        <div className="px-4 py-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Suggestions</span>
                        </div>
                        <div className="space-y-1">
                          {autocomplete.map((item, idx) => (
                            <div
                              key={`auto-${idx}`}
                              onClick={() => handleDropdownSelect(item.name, "autocomplete")}
                              className="group px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-700 dark:text-zinc-200 text-sm flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Search size={16} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                                <span className="font-bold">{item.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {trending.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Trending Now</span>
                        </div>
                        <div className="flex flex-wrap gap-2 px-3 pb-2">
                          {trending.map((trend) => (
                            <div
                              key={`trend-${trend._id}`}
                              onClick={() => handleDropdownSelect(trend.keyword, "trending")}
                              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/30 cursor-pointer text-xs font-bold flex items-center gap-1.5 transition-all text-zinc-600 dark:text-zinc-300 hover:text-orange-600"
                            >
                              <Flame size={12} className="text-orange-500 fill-orange-500/20" />
                              <span>{trend.keyword}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Categories scroll area */}
        <div className="max-w-xl mx-auto px-2 pb-4">
          <div className="flex scroll overflow-x-auto no-scrollbar gap-2.5 pt-4 px-2">
            {categories.map((category) => (
              <motion.button
                key={category._id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category.name)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300
                  ${activeCategory === category.name
                    ? "bg-orange-600 text-white font-bold"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800"
                  }
                `}
              >
                <Flame
                  size={14}
                  className={activeCategory === category.name ? "text-white fill-white" : "text-orange-500"}
                />
                <span className="text-xs uppercase tracking-widest font-bold">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-xl mx-auto pt-3">
        {loading ? (
          <div className="px-4">
            <SearchFoodSkeleton items={6} />
          </div>
        ) : displayedFoods.length === 0 ? (
          <NoFoodsFound />
        ) : (
          <div className="space-y-8 pb-10 pl-2">
            {Object.entries(foodsByCategory).map(([category, categoryFoods]) => (
              <div key={category} className="px-0">
                <div className="flex items-center gap-2 px-4 mb-4">
                  <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight capitalize">
                    {category}
                  </h2>
                </div>

                <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar">
                  {categoryFoods.map((food) => (
                    <FoodCard key={food._id} food={food} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button 
           onClick={() => router.push('/home')}
           className="bg-orange-500 text-white rounded-full p-4 hover:bg-orange-600 transition-all hover:scale-110 active:scale-95"
        >
          <Store size={24} />
        </button>
      </div>
    </div>
  );
}

