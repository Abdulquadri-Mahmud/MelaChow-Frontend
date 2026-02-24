"use client";

import axios from "axios";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import { useApi } from "../../context/ApiContext";
import {
    Flame,
    UtensilsCrossed,
    ChevronRight,
    ImageIcon
} from "lucide-react";

export default function CategoryList() {
    const router = useRouter();
    const { baseUrl } = useApi();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                if (!baseUrl) return;

                const res = await axios.get(`${baseUrl}/categories/public`, {
                    withCredentials: true,
                    maxContentLength: Infinity, // ✅ Allow unlimited response size
                    maxBodyLength: Infinity,
                    timeout: 10000, // 10 second timeout
                });

                // console.log('[CategoryList] Response:', res);

                if (res.data && res.data.success) {
                    setCategories(res.data.data || []);
                }
            } catch (error) {
                console.error("[CategoryList] Failed to fetch:", error);

                // ✅ Better error debugging
                if (error.response) {
                    console.error("Status:", error.response.status);
                    console.error("Headers:", error.response.headers);
                    console.error("Data preview:",
                        typeof error.response.data === 'string'
                            ? error.response.data.substring(0, 500)
                            : error.response.data
                    );
                } else if (error.request) {
                    console.error("No response received:", error.request);
                } else {
                    console.error("Request setup error:", error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [baseUrl]);

    const handleCategoryClick = (category) => {
        setActiveCategory(category.name);
        // Prefer slug for URL, fallback to name
        const query = category.name;
        router.push(`/search?category=${encodeURIComponent(query)}`);
    };

    // Skeleton loader component
    if (loading) {
        return (
            <div className="mt-6">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="relative -mx-2">
                    <div className="flex gap-4 scroll overflow-x-auto no-scrollbar pb-6 pt-2 px-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 min-w-[85px]">
                                <div className="w-20 h-20 rounded-[28px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!loading && categories.length === 0) {
        return null; // Hide section if no categories found
    }

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full" />
                        <div className="relative bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
                            <Flame className="text-white fill-white/20" size={24} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                            Explore <span className="text-orange-600">Categories</span>
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mt-1">
                            Find your favorite flavors
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative -mx-2">
                {/* Subtle Side Fades for scroll indication */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-100 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-100 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                <div className="flex gap-4 scroll overflow-x-auto no-scrollbar pt-2 snap-x px-4">
                    {categories.map((category, idx) => (
                        <motion.button
                            key={category._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                            whileHover={{ y: -5, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(category)}
                            className={`flex flex-col items-center gap-3 min-w-[85px] group snap-center`}
                        >
                            {/* Icon/Image Container with Multi-layer Glow */}
                            <div className="relative">
                                {/* Active/Hover Background Glow */}
                                <div
                                    className={`absolute inset-0 rounded-[30px] blur-xl transition-all duration-500
                    ${activeCategory === category.name
                                            ? 'bg-orange-500/30 opacity-100 scale-110'
                                            : 'bg-slate-200 dark:bg-slate-800 opacity-0 group-hover:opacity-100 group-hover:scale-105'}
                  `}
                                />

                                {/* Main Icon Box */}
                                <div
                                    className={`relative w-20 h-20 flex items-center justify-center rounded-[28px] transition-all duration-300 border overflow-hidden
                    ${activeCategory === category.name
                                            ? 'bg-orange-500 border-orange-400 shadow-xl shadow-orange-500/30 translate-y-[-2px]'
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 group-hover:border-orange-200 dark:group-hover:border-orange-900 group-hover:shadow-lg shadow-sm'}
                  `}
                                >
                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="w-full h-full object-cover p-1.5 rounded-[28px]"
                                        />
                                    ) : (
                                        <UtensilsCrossed
                                            size={32}
                                            className={`transition-colors duration-300
                      ${activeCategory === category.name
                                                    ? 'text-white'
                                                    : 'text-slate-300 dark:text-slate-600 group-hover:text-orange-500'}
                    `}
                                            strokeWidth={1.5}
                                        />
                                    )}

                                    {/* Decorative Sparkle for Active */}
                                    {activeCategory === category.name && (
                                        <motion.div
                                            layoutId="activeCategoryDot"
                                            className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full shadow-sm z-10"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Text Label */}
                            <span
                                className={`text-xs font-bold capitalize text-center transition-all duration-300 leading-tight max-w-[90px] line-clamp-2
                  ${activeCategory === category.name
                                        ? 'text-orange-600 font-black'
                                        : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}
                `}
                            >
                                {category.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Modern Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-4" />
        </div>
    );
}
