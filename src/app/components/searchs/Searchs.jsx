"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame, MapPin, Search, SlidersHorizontal, Store, Truck } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import HomeFoodListSkeleton from "../skeletons/HomeFoodListSkeleton";
import Link from "next/link";
import NoFoodsFound from "../food/NoFoodsFound";

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
    <div className="pb-10 bg-gray-50">
      <div className="sticky top-0 z-50 p-2 bg-white border-b shadow-sm shadow-gray-100">
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex bg-gray-50 items-center gap-2 p-2 rounded-lg"
        >
          <Search className="text-gray-500" />
          <input
            type="text"
            placeholder="Search for food..."
            className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400"
            value={query || ""} // always a string
            onChange={(e) => {
              setQuery(e.target.value || ""); // never undefined
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />

          <button
            type="submit"
            className="p-2 bg-orange-500 rounded-lg text-white hover:bg-orange-600 transition-colors"
          >
            <SlidersHorizontal size={18} />
          </button>

          {/* Dropdown */}
          {showDropdown && (autocomplete.length > 0 || trending.length > 0) && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 w-full bg-white border mt-1 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {/* Autocomplete */}
              {autocomplete.map((item, idx) => (
                <div
                  key={`auto-${idx}`}
                  onClick={() => handleDropdownSelect(item.name, "autocomplete")}
                  className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-gray-700 text-sm"
                >
                  {item.name} 
                  <span className="text-gray-400 text-xs">
                    {item.vendorName ? ` • ${item.vendorName}` : ""}
                  </span>
                </div>
              ))}

              {/* Trending */}
              {/* {trending.length > 0 && (
                <div className="pt-1 border-t border-gray-200">
                  {trending.map((trend) => (
                    <div
                      key={`trend-${trend._id}`}
                      onClick={() => handleDropdownSelect(trend.term, "trending")}
                      className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-orange-600 text-sm"
                    >
                      {trend.term}
                    </div>
                  ))}
                </div>
              )} */}

              {/* Categories */}
              <div className=" border-t border-gray-200 flex flex-wrap gap-1 pt-3">
                {categories.map((cat) => (
                  <div
                    key={`cat-${cat}`}
                    onClick={() => handleDropdownSelect(cat, "category")}
                    className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs cursor-pointer hover:bg-orange-100"
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </form>

        {/* Categories below search */}
        <div className="flex scroll overflow-x-auto no-scrollbar gap-2 px-3 pb-3 mt-2">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileTap={{ scale: 0.9 }}
              layout
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap border transition-all duration-300
                ${
                  activeCategory === category
                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:bg-orange-50"
                }
              `}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: activeCategory === category ? 1 : 0.9 }}
            >
              <Flame
                size={16}
                className={
                  activeCategory === category ? "text-white" : "text-orange-500"
                }
              />
              <span className="text-sm font-medium">{category}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="md:p-4 p-2">
        {loading ? (
          <HomeFoodListSkeleton />
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : foods.length === 0 ? (
          <div className="text-center text-gray-500 py-5">
            <NoFoodsFound />
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              layout
              className="grid grid-cols-2 md:gap-4 gap-1 mt-2 sm:grid-cols-3 md:grid-cols-4 pb-8"
            >
              {foods.map((food) => (
                <Link key={food.slug} href={`/food-details/${food._id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="bg-white md:p-3 p-2 rounded-xl shadow-sm shadow-gray-100 cursor-pointer"
                  >
                    <div className="relative rounded-md overflow-hidden">
                      <img
                        src={
                          Array.isArray(food?.images)
                            ? food.images[0]?.url
                            : food?.image || "/placeholder.jpg"
                        }
                        alt={food?.name}
                        className="w-full h-36 object-cover rounded-md"
                      />
                    </div>

                    <div>
                      <h3 className="md:text-md text-sm font-semibold text-gray-800 truncate">
                        {food.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <p className="flex items-center gap-1 text-sm font-medium text-gray-600 truncate">
                          <Store className="text-[#FF6600] w-4" />
                          {food?.vendor?.storeName || "Unknown Vendor"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Truck size={12} className="text-orange-500" />
                          {food?.vendor?.address
                            ? ` ${food.vendor.address.city}`
                            : "Address not available"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={13} className="text-orange-500" />
                          {food?.estimatedDeliveryTime - 5 || "0"} - {food?.estimatedDeliveryTime || "0"} mins
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
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
