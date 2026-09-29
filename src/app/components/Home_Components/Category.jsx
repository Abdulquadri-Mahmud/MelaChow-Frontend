"use client";

import axios from "axios";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import { useApi } from "../../context/ApiContext";
import { useCategories } from "@/app/hooks/useCategories";
import {
    Flame,
    UtensilsCrossed,
    ChevronRight,
    ImageIcon
} from "lucide-react";

export default function CategoryList() {
    const router = useRouter();

    const { data: categories = [], isLoading: loading } = useCategories();
    const [activeCategory, setActiveCategory] = useState(null);

    const handleCategoryClick = (category) => {
        setActiveCategory(category.name);
        // Prefer slug for URL, fallback to name
        const query = category.name;
        router.push(`/search?category=${encodeURIComponent(query)}`);
    };

    // Skeleton loader component
    if (loading) {
        return (
            <div className="mt-3 sm:mt-6">
                <div className="flex items-center justify-between mb-2.5 px-1 sm:mb-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="h-10 w-10 rounded-xl sm:h-12 sm:w-12 bg-zinc-200 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="relative -mx-2">
                    <div className="no-scrollbar flex gap-3 overflow-x-auto overscroll-x-contain px-3 pb-3 pt-1.5 sm:gap-4 sm:px-4 sm:pb-6 sm:pt-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 min-w-[64px] sm:gap-3 sm:min-w-[85px]">
                                <div className="h-16 w-16 rounded-[22px] sm:h-20 sm:w-20 sm:rounded-[28px] bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
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
        <div className="mt-1 sm:mt-2">
            <div className="flex items-center justify-between mb-2.5 px-1 sm:mb-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full" />
                        <div className="relative rounded-xl bg-orange-500 p-2 sm:rounded-2xl sm:p-2.5">
                            <Flame className="h-5 w-5 fill-white/20 text-white sm:h-6 sm:w-6" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black italic uppercase sm:text-2xl tracking-tighter text-zinc-900 dark:text-white leading-none">
                            Explore <span className="text-orange-600">Categories</span>
                        </h2>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 sm:mt-1 sm:text-xs sm:tracking-[0.15em]">
                            Find your favorite flavors
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative -mx-2">
                {/* Subtle Side Fades for scroll indication */}
                <div className="absolute bottom-0 left-0 top-0 z-10 w-6 sm:w-12 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 top-0 z-10 w-6 sm:w-12 bg-gradient-to-l from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />

                <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto overscroll-x-contain px-3 pt-1 sm:gap-4 sm:px-4 sm:pt-2">
                    {categories.map((category, idx) => (
                        <motion.button
                            key={category._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                            whileHover={{ y: -5, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(category)}
                            className={`flex flex-col items-center gap-2 min-w-[64px] sm:gap-3 sm:min-w-[85px] group snap-center`}
                        >
                            {/* Icon/Image Container with Multi-layer Glow */}
                            <div className="relative">
                                {/* Active/Hover Background Glow */}
                                <div
                                    className={`absolute inset-0 rounded-[22px] sm:rounded-[30px] blur-xl transition-all duration-500
                                        ${activeCategory === category.name
                                            ? 'bg-orange-500/30 opacity-100 scale-110'
                                            : 'bg-orange-400/25 dark:bg-orange-500/20 opacity-0 group-hover:opacity-100 group-hover:scale-105'}
                                    `}
                                />

                                {/* Main Icon Box */}
                                <div
                                    className={`relative flex h-16 w-16 items-center justify-center rounded-[22px] sm:h-20 sm:w-20 sm:rounded-[28px] transition-all duration-300 border overflow-hidden
                                        ${activeCategory === category.name
                                            ? 'bg-orange-500 border-orange-400 translate-y-[-2px]'
                                            : 'bg-white dark:bg-zinc-900 border-orange-100/80 dark:border-orange-500/20 shadow-[0_5px_14px_rgba(249,115,22,0.14)] dark:shadow-[0_5px_16px_rgba(0,0,0,0.32)] group-hover:border-orange-300 dark:group-hover:border-orange-400/60 group-hover:shadow-[0_8px_18px_rgba(249,115,22,0.24)]'}
                                    `}
                                >
                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="h-full w-full rounded-[22px] object-cover p-1 sm:rounded-[28px] sm:p-1.5"
                                        />
                                    ) : (
                                        <UtensilsCrossed
                                            size={26}
                                            className={`transition-colors duration-300
                                                ${activeCategory === category.name
                                                    ? 'text-white'
                                                    : 'text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500'}
                                            `}
                                            strokeWidth={1.5}
                                        />
                                    )}

                                    {/* Decorative Sparkle for Active */}
                                    {activeCategory === category.name && (
                                        <motion.div
                                            layoutId="activeCategoryDot"
                                            className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full z-10"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Text Label */}
                            <span
                                className={`max-w-[68px] text-center text-[10px] font-bold capitalize sm:max-w-[90px] sm:text-xs transition-all duration-300 leading-tight line-clamp-2
                                    ${activeCategory === category.name
                                        ? 'text-orange-600 font-black'
                                        : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}
                                `}
                            >
                                {category.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Modern Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent mt-2 mb-3" />
        </div>
    );
}
