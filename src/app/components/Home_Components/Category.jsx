"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import {
    Flame,
    Coffee,
    Beer,
    UtensilsCrossed,
    Pizza,
    Sandwich,
    Fish,
    Leaf,
    IceCream,
    Soup,
    ChefHat,
    ChevronRight
} from "lucide-react";

const categoryData = [
    { name: "Rice Dishes", icon: UtensilsCrossed, color: "bg-orange-500" },
    { name: "Swallow", icon: Flame, color: "bg-amber-600" },
    { name: "Soups & Stews", icon: Soup, color: "bg-red-500" },
    { name: "Beans Dishes", icon: UtensilsCrossed, color: "bg-amber-800" },
    { name: "Yam Dishes", icon: UtensilsCrossed, color: "bg-yellow-700" },
    { name: "Plantain Dishes", icon: Flame, color: "bg-yellow-500" },
    { name: "Pasta", icon: Pizza, color: "bg-orange-400" },
    { name: "Snacks", icon: Sandwich, color: "bg-blue-500" },
    { name: "Grills & Barbecue", icon: Flame, color: "bg-rose-600" },
    { name: "Shawarma", icon: Sandwich, color: "bg-purple-500" },
    { name: "Breakfast", icon: Coffee, color: "bg-emerald-500" },
    { name: "Drinks", icon: Beer, color: "bg-cyan-500" },
    { name: "Desserts", icon: IceCream, color: "bg-pink-500" },
    { name: "Seafood", icon: Fish, color: "bg-indigo-500" },
    { name: "Vegetarian", icon: Leaf, color: "bg-green-600" },
    { name: "Salads", icon: Leaf, color: "bg-lime-500" },
    { name: "Small Chops", icon: Pizza, color: "bg-orange-600" },
    { name: "Native Delicacies", icon: ChefHat, color: "bg-stone-700" },
    { name: "Others", icon: UtensilsCrossed, color: "bg-gray-500" },
];

export default function CategoryList() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(null);

    const handleCategoryClick = (categoryName) => {
        setActiveCategory(categoryName);
        router.push(`/search?category=${encodeURIComponent(categoryName)}`);
    };

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full" />
                        <div className="relative bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
                            <Flame className="text-white fill-white/20" size={20} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">
                            Explore <span className="text-orange-600">Categories</span>
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">
                            Find your favorite flavors
                        </p>
                    </div>
                </div>

                {/* <button
                    onClick={() => router.push('/all-restaurants')}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:gap-2 transition-all group"
                >
                    View All
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button> */}
            </div>

            <div className="relative">
                {/* Subtle Side Fades for scroll indication */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

                <div className="flex gap- scroll overflow-x-auto no-scrollbar pb-2 pt-2 snap-x">
                    {categoryData.map((category, idx) => (
                        <motion.button
                            key={category.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(category.name)}
                            className={`flex flex-col items-center gap-2 min-w-[60px] group snap-start`}
                        >
                            {/* Icon Container with Multi-layer Glow */}
                            <div className="relative">
                                {/* Active/Hover Background Glow */}
                                <div
                                    className={`absolute inset-0 rounded-[24px] blur-md transition-all duration-500
                    ${activeCategory === category.name
                                            ? 'bg-orange-500/40 opacity-100 scale-110'
                                            : 'bg-zinc-200 dark:bg-zinc-800 opacity-0 group-hover:opacity-100 group-hover:scale-105'}
                  `}
                                />

                                {/* Main Icon Box */}
                                <div
                                    className={`relative w-12 h-12 flex items-center justify-center rounded-[20px] transition-all duration-300 border
                    ${activeCategory === category.name
                                            ? 'bg-orange-500 border-orange-400 shadow-xl shadow-orange-500/20'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 group-hover:border-orange-200 dark:group-hover:border-orange-900 group-hover:shadow-lg shadow-sm'}
                  `}
                                >
                                    <category.icon
                                        size={20}
                                        className={`transition-colors duration-300
                      ${activeCategory === category.name
                                                ? 'text-white'
                                                : 'text-zinc-600 dark:text-zinc-400 group-hover:text-orange-500'}
                    `}
                                        strokeWidth={2.5}
                                    />

                                    {/* Decorative Sparkle for Active */}
                                    {activeCategory === category.name && (
                                        <motion.div
                                            layoutId="activeCategoryDot"
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Text Label */}
                            <span
                                className={`text-[10px] font-black uppercase tracking-tighter text-center transition-all duration-300 leading-tight max-w-[70px]
                  ${activeCategory === category.name
                                        ? 'text-orange-600 scale-110'
                                        : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}
                `}
                            >
                                {category.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Modern Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-100 dark:via-zinc-800 to-transparent my-2" />
        </div>
    );
}
