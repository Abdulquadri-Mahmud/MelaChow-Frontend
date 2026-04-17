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

                {/* Row 2: Vendor Name • Location */}
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1 font-bold uppercase tracking-widest">
                    {vendor?.storeName} {" \u2022 "} {vendor?.city || "Nearby"}
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

        // Simple params — category filtering is done on the frontend
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

  // Category grouping — always use all foods, filtered client-side by selectedCategory
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

  // Category click — just updates the URL; filtering is handled by displayedFoods memo
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 selection:bg-orange-500/30">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 🎭 Premium Floating Search Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800 transition-colors hover:text-orange-500"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </motion.button>

            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-orange-500 tracking-[0.2em] italic opacity-70 leading-none mb-1">Explore</span>
                <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tighter leading-none">Cravings</h1>
            </div>

            <motion.button 
                whileHover={{ rotate: 180 }}
                className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200/50 dark:border-zinc-800"
            >
                <Sparkles size={20} />
            </motion.button>
          </div>

          {/* 🔍 Elite Search Bar */}
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              
              <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-14 px-4 rounded-2xl transition-all duration-300 group-focus-within:border-orange-500/50 group-focus-within:shadow-2xl group-focus-within:shadow-orange-500/10">
                <Search size={20} className="text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What's your mood today?"
                  className="flex-1 outline-none bg-transparent text-sm font-bold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400/70"
                  value={query || ""}
                  onChange={(e) => {
                    setQuery(e.target.value || "");
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  autoFocus
                />

                <div className="flex items-center gap-2">
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <button type="button" className="p-2 text-zinc-400 hover:text-orange-500">
                        <SlidersHorizontal size={18} strokeWidth={2.5} />
                    </button>
                </div>
              </div>

              {/* 💧 Dropdown */}
              <AnimatePresence>
                {showDropdown && (autocomplete.length > 0 || trending.length > 0) && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800/80 mt-4 rounded-3xl z-[60] shadow-2xl shadow-black/20 overflow-hidden"
                  >
                    <div className="p-3">
                        {autocomplete.length > 0 && (
                        <div className="mb-4">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">Matching Now</span>
                            </div>
                            <div className="space-y-1">
                            {autocomplete.map((item, idx) => (
                                <motion.div
                                    key={`auto-${idx}`}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handleDropdownSelect(item.name, "autocomplete")}
                                    className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 ">
                                        <Search size={14} />
                                    </div>
                                    <span className="font-bold">{item.name}</span>
                                </motion.div>
                            ))}
                            </div>
                        </div>
                        )}

                        {trending.length > 0 && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">🔥 Buzzing Searches</span>
                            </div>
                            <div className="flex flex-wrap gap-2 px-3 pb-2">
                            {trending.map((trend) => (
                                <motion.div
                                    key={`trend-${trend._id}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDropdownSelect(trend.keyword, "trending")}
                                    className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-orange-500/40 hover:text-orange-600 cursor-pointer text-[11px] font-black uppercase tracking-tight flex items-center gap-2 transition-all"
                                >
                                    <Flame size={12} className="text-orange-500" />
                                    <span>{trend.keyword}</span>
                                </motion.div>
                            ))}
                            </div>
                        </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* 🚀 Category Pill Navigation (Horizontal Segmented Style) */}
        <div className="max-w-xl mx-auto border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex scroll overflow-x-auto no-scrollbar gap-2 py-4 px-4 items-center">
            {categories.map((category) => (
              <motion.button
                key={category._id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(category.name)}
                className={`relative px-6 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-500 text-[11px] font-black uppercase tracking-wider
                  ${activeCategory === category.name
                    ? "text-white"
                    : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }
                `}
              >
                {activeCategory === category.name && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-orange-600 rounded-2xl shadow-lg shadow-orange-500/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Refinement Toolbar / Result Counter */}
      <div className="max-w-xl mx-auto px-6 pt-6">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-end justify-between border-b border-zinc-200/50 dark:border-zinc-800 pb-3"
          >
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">
                      {query ? `Results for "${query}"` : 'Discovery Feed'}
                  </span>
                  <p className="text-sm font-black text-zinc-900 dark:text-white italic tracking-tighter">
                      <span className="text-orange-500">{displayedFoods.length}</span> exquisite items found
                  </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  Sort: <span className="text-zinc-900 dark:text-zinc-200">Relevance</span>
              </div>
          </motion.div>
      </div>

      {/* 🍱 Results Feed */}
      <div className="max-w-xl mx-auto mt-6">
        {loading ? (
          <div className="px-4">
            <SearchFoodSkeleton items={6} />
          </div>
        ) : displayedFoods.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <NoFoodsFound />
          </div>
        ) : (
          <div className="space-y-12 pb-24 pl-2 overflow-hidden">
            <AnimatePresence mode="popLayout">
                {Object.entries(foodsByCategory).map(([category, categoryFoods], sectionIdx) => (
                <motion.div 
                    key={category} 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIdx * 0.1 }}
                    className="px-0 relative"
                >
                    {/* Floating Glow in Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3 px-6 mb-6">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] leading-none mb-1 opacity-50 italic">Section</span>
                           <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tighter uppercase italic leading-none">
                                {category}
                            </h2>
                        </div>
                    </div>

                    <div className="flex gap-5 scroll overflow-x-auto pb-4 px-6 snap-x snap-mandatory no-scrollbar">
                    {categoryFoods.map((food, foodIdx) => (
                        <motion.div 
                            key={food._id} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (sectionIdx * 0.1) + (foodIdx * 0.05) }}
                            className="snap-start"
                        >
                            <FoodCard food={food} />
                        </motion.div>
                    ))}
                    </div>
                </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button 
           onClick={() => router.push('/home')}
           className="bg-orange-500 text-white rounded-full p-4 hover:bg-orange-600 transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-orange-500/40"
        >
          <Store size={24} />
        </button>
      </div>
    </div>
  );
}
