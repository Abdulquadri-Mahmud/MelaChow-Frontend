"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame, MapPin, Search, SlidersHorizontal, Store, Truck, ArrowLeft, Star, Plus } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import Link from "next/link";
import NoFoodsFound from "../NoFoodsFound";
import SearchFoodSkeleton from "@/app/skeleton/SearchFoodSkeleton";
import { getVendorOpenAndCloseStatus as checkVendorStatus } from "@/app/lib/vendor-time/OpenOrClose";

export const dynamic = "force-dynamic";

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
  const selectedCategory = searchParams.get("category");

  const categories = [
    "Rice Dishes", "Swallow", "Soups & Stews", "Beans Dishes", "Yam Dishes",
    "Plantain Dishes", "Pasta", "Snacks", "Grills & Barbecue", "Shawarma",
    "Breakfast", "Drinks", "Desserts", "Seafood", "Vegetarian", "Salads",
    "Small Chops", "Porridge", "Native Delicacies", "Others",
  ];

  // Hydration
  useEffect(() => setHydrated(true), []);

  // Fetch trending searches
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${baseUrl}/search/food/trending`, { params: { limit: 8 } });
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

        // Build search params
        const params = selectedCategory
          ? { category: selectedCategory }
          : { q: query || "" };

        const res = await axios.get(`${baseUrl}/search/food/search`, { params });
        setFoods(res.data.data || []);
        setActiveCategory(selectedCategory || "");
      } catch (err) {
        console.error("Fetch Foods Error:", err?.response?.data || err.message || err);
        setError("Failed to load foods. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [baseUrl, hydrated, selectedCategory, query]);

  // Autocomplete (safe version)
  useEffect(() => {
    const fetchSearch = async () => {
      const sanitizedQuery = (query || "").trim(); // always a string

      if (sanitizedQuery.length < 2) {
        setAutocomplete([]);
        setShowDropdown(false); // hide dropdown if query is too short
        return;
      }

      try {
        const res = await axios.get(`${baseUrl}/search/food/autocomplete`, {
          params: { q: sanitizedQuery },
        });

        setAutocomplete(res.data?.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Autocomplete Error:", err);
        setAutocomplete([]); // clear suggestions on error
        setShowDropdown(false);
      }
    };

    const timeout = setTimeout(fetchSearch, 300); // debounce 300ms
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

  // Category click
  const handleCategoryClick = async (category) => {
    if (activeCategory === category) {
      setActiveCategory("");
      router.push("?");

      try {
        setLoading(true);
        const res = await axios.get(`${baseUrl}/search/food/search`, { params: { q: "" } });
        setFoods(res.data.data || []);
      } catch (err) {
        console.error("Unselect Category Error:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    setActiveCategory(category);
    setQuery("");
    router.push(`?category=${encodeURIComponent(category)}`);

    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/search/food/search`, { params: { category } });
      setFoods(res.data.data || []);
    } catch (err) {
      console.error("Category Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/search/food/search`, { params: { q: query } });
      setFoods(res.data.data || []);
      setActiveCategory("");
      router.push("?");
    } catch (err) {
      console.error("Search Error:", err);
      setError("Search failed. Try again later.");
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  // Dropdown selection
  const handleDropdownSelect = async (value, type) => {
    setQuery(value);
    setShowDropdown(false);

    if (type === "category") {
      handleCategoryClick(value);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/search/food/search`, { params: { q: value } });
      setFoods(res.data.data || []);
      setActiveCategory("");
      router.push("?");
    } catch (err) {
      console.error("Dropdown Selection Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // console.log(foods);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header section with back button */}
      <div className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-all duration-300">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Search</h1>
              <div className="flex items-center gap-1 text-orange-600">
                <MapPin size={10} className="fill-orange-600/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">
                  FIND YOUR CRAVINGS
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex bg-zinc-100 dark:bg-zinc-800 items-center gap-2 p-1.5 rounded-2xl"
            >
              <Search size={18} className="text-zinc-400 ml-2" />
              <input
                type="text"
                placeholder="Dishes, restaurants or cuisines..."
                className="flex-1 outline-none bg-transparent text-sm font-medium text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                value={query || ""}
                onChange={(e) => {
                  setQuery(e.target.value || "");
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />

              <button
                type="submit"
                className="p-2 text-orange-500 rounded-xl hover:bg-orange-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <SlidersHorizontal size={18} />
              </button>

              {showDropdown && (autocomplete.length > 0 || trending.length > 0) && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="absolute top-full left-0 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 mt-3 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] max-h-96 overflow-y-auto p-3"
                >
                  {/* Autocomplete Section */}
                  {autocomplete.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-orange-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Suggestions</span>
                      </div>
                      <div className="space-y-1">
                        {autocomplete.map((item, idx) => (
                          <motion.div
                            key={`auto-${idx}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleDropdownSelect(item.name, "autocomplete")}
                            className="group px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl cursor-pointer text-zinc-700 dark:text-zinc-200 text-sm flex items-center justify-between transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30 group-hover:text-orange-600 transition-colors">
                                <Search size={14} />
                              </div>
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <span className="text-zinc-400 text-xs italic opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                              {item.vendorName ? `in ${item.vendorName}` : "Quick search"}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Section */}
                  {trending.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-orange-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Trending Now</span>
                      </div>
                      <div className="flex flex-wrap gap-2 px-3">
                        {trending.map((trend, idx) => (
                          <motion.div
                            key={`trend-${trend._id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (autocomplete.length + idx) * 0.05 }}
                            onClick={() => handleDropdownSelect(trend.keyword, "trending")}
                            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-xl hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-950/10 cursor-pointer text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            <Flame size={12} className="text-orange-500" />
                            <span>{trend.keyword}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories Header */}
                  <div className="px-3 py-2 mt-2 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div className="w-1 h-3 bg-orange-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Popular Categories</span>
                  </div>

                  {/* Categories in Dropdown */}
                  <div className="flex flex-wrap gap-2 px-2 pt-2 pb-2">
                    {categories.slice(0, 10).map((cat, idx) => (
                      <motion.div
                        key={`cat-${cat}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (autocomplete.length + trending.length + idx) * 0.03 }}
                        onClick={() => handleDropdownSelect(cat, "category")}
                        className="px-3 py-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors border border-orange-100/50 dark:border-orange-900/30"
                      >
                        {cat}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </form>
          </div>
        </div>

        {/* Categories scroll area */}
        <div className="max-w-md mx-auto px-4 pb-4">
          <div className="flex scroll overflow-x-auto no-scrollbar gap-2.5 pt-4">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 shadow-sm
                  ${activeCategory === category
                    ? "bg-orange-600 text-white shadow-orange-200 dark:shadow-none font-bold scale-105"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 hover:border-orange-500/30"
                  }
                `}
              >
                <Flame
                  size={14}
                  className={activeCategory === category ? "text-white fill-white" : "text-orange-500"}
                />
                <span className="text-xs uppercase tracking-widest font-bold font-display">{category}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-md mx-auto px-4 pt-3">
        {loading ? (
          <SearchFoodSkeleton items={6} />
        ) : foods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <NoFoodsFound />
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {foods.map((food) => {
              const hours = food?.vendor?.openingHours || food?.restaurant?.openingHours || {};
              const status = checkVendorStatus(hours);
              const isOpen = status.startsWith("Open now");

              return (
                <Link key={food._id} href={`/food-details/${food._id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 5 }}
                    className="group bg-white dark:bg-zinc-900 rounded-[32px] p-2 pr-4 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 transition-all hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none"
                  >
                    {/* Image Section */}
                    <div className="relative w-28 h-28 rounded-[24px] overflow-hidden flex-shrink-0">
                      <img
                        src={
                          Array.isArray(food?.images) && food.images.length > 0
                            ? food.images[0]?.url
                            : food?.image || "/placeholder.jpg"
                        }
                        alt={food?.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <span className={`${isOpen ? "bg-white/95 text-orange-600" : "bg-zinc-900/90 text-zinc-400"} text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-tight backdrop-blur-md`}>
                          {isOpen ? "OPEN" : "CLOSED"}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-zinc-900 dark:text-white text-sm uppercase italic tracking-tight line-clamp-1 leading-tight mb-1">
                          {food.name}
                        </h3>
                        <span className="text-orange-600 font-black text-xs italic">
                          ₦{food.price?.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider italic mb-2">
                        <Store size={12} className="text-orange-500" />
                        <span className="truncate">{food?.vendor?.storeName || food?.restaurant?.storeName || "Vendor"}</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Truck size={12} className="text-orange-500" />
                          <span className="text-[10px] font-black text-zinc-400">
                            {food?.vendor?.address?.city || "Local"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-orange-500" />
                          <span className="text-[10px] font-black text-zinc-400 uppercase italic">
                            {food?.estimatedDeliveryTime || 25}m
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-600/5 dark:bg-zinc-800 p-2.5 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                      <Plus size={16} strokeWidth={3} />
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Vendor Button */}
      <div className="fixed bottom-4 right-4">
        <button className="bg-orange-500 text-white rounded-full p-4 shadow-lg hover:bg-orange-600 transition-colors">
          <Store size={22} />
        </button>
      </div>
    </div>
  );
}
