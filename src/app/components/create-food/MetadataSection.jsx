"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Flame,
    AlertTriangle,
    Leaf,
    X,
    Info,
} from "lucide-react";
import { useState } from "react";
import SectionHeader from "./SectionHeader";

/***** CONFIGURATION *****/
const SPICY_LEVELS = [
    { value: "mild", label: "Mild", color: "emerald", emoji: "🌱" },
    { value: "medium", label: "Medium", color: "yellow", emoji: "🌶️" },
    { value: "hot", label: "Hot", color: "orange", emoji: "🔥" },
    { value: "extra-hot", label: "Extra Hot", color: "red", emoji: "💥" },
];

const ALLERGEN_OPTIONS = [
    "Gluten",
    "Dairy",
    "Nuts",
    "Eggs",
    "Soy",
    "Fish",
    "Shellfish",
];

const DIETARY_OPTIONS = [
    { value: "vegetarian", label: "Vegetarian", icon: "🥗", desc: "No meat" },
    { value: "vegan", label: "Vegan", icon: "🌱", desc: "Plant-based" },
    { value: "contains-meat", label: "Contains Meat", icon: "🍖", desc: "Meat included" },
    { value: "halal", label: "Halal", icon: "☪️", desc: "Halal certified" },
    { value: "keto", label: "Keto", icon: "🥑", desc: "Low carb" },
    { value: "low-carb", label: "Low Carb", icon: "🥦", desc: "Reduced carbs" },
];

/***** TOOLTIP COMPONENT *****/
const Tooltip = ({ text, children }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                {children}
            </button>
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg"
                    >
                        {text}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/***** MAIN COMPONENT *****/
export default function MetadataSection({
    metadata,
    setMetadata,
    expanded,
    toggleExpanded,
}) {
    const [customAllergen, setCustomAllergen] = useState("");

    // Handle spicy level selection
    // Handle spicy level selection
    const handleSpicyLevel = (level) => {
        setMetadata((prev) => ({
            ...prev,
            spicyLevel: prev.spicyLevel === level ? "" : level
        }));
    };

    // Handle allergen toggle
    const toggleAllergen = (allergen) => {
        setMetadata((prev) => ({
            ...prev,
            allergens: prev.allergens.includes(allergen)
                ? prev.allergens.filter((a) => a !== allergen)
                : [...prev.allergens, allergen],
        }));
    };

    // Add custom allergen
    const addCustomAllergen = () => {
        const trimmed = customAllergen.trim();
        if (!trimmed) return;
        if (metadata.allergens.includes(trimmed)) {
            setCustomAllergen("");
            return;
        }
        setMetadata((prev) => ({
            ...prev,
            allergens: [...prev.allergens, trimmed],
        }));
        setCustomAllergen("");
    };

    // Remove allergen
    const removeAllergen = (allergen) => {
        setMetadata((prev) => ({
            ...prev,
            allergens: prev.allergens.filter((a) => a !== allergen),
        }));
    };

    // Handle dietary info selection
    const handleDietaryInfo = (value) => {
        setMetadata((prev) => ({
            ...prev,
            dietaryInfo: prev.dietaryInfo === value ? "" : value,
        }));
    };

    // Get spicy level color classes
    const getSpicyColorClasses = (color, isActive) => {
        const colors = {
            emerald: isActive
                ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
            yellow: isActive
                ? "bg-yellow-500 text-white border-yellow-600 shadow-lg shadow-yellow-500/30"
                : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
            orange: isActive
                ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/30"
                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
            red: isActive
                ? "bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/30"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        };
        return colors[color] || colors.emerald;
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Section Header */}
            <SectionHeader
                title="Food Preferences & Warnings"
                subtitle="Help customers make informed choices"
                icon={Leaf}
                section="metadata"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="purple"
            />

            {/* Section Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-6"
                    >
                        {/* Spicy Level */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={18} className="text-orange-500" />
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Spicy Level
                                </label>
                                <Tooltip text="Helps customers know how hot this meal is">
                                    <Info size={14} />
                                </Tooltip>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {SPICY_LEVELS.map((level) => {
                                    const isActive = metadata.spicyLevel === level.value;
                                    return (
                                        <motion.button
                                            key={level.value}
                                            type="button"
                                            onClick={() => handleSpicyLevel(level.value)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${getSpicyColorClasses(
                                                level.color,
                                                isActive
                                            )}`}
                                        >
                                            <div className="text-2xl mb-1">{level.emoji}</div>
                                            {level.label}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Allergens */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle size={18} className="text-amber-500" />
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Allergens
                                </label>
                                <Tooltip text="Select ingredients that may cause allergic reactions">
                                    <Info size={14} />
                                </Tooltip>
                            </div>

                            {/* Predefined Allergens */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {ALLERGEN_OPTIONS.map((allergen) => {
                                    const isSelected = metadata.allergens.includes(allergen);
                                    return (
                                        <motion.button
                                            key={allergen}
                                            type="button"
                                            onClick={() => toggleAllergen(allergen)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${isSelected
                                                ? "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30"
                                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                                }`}
                                        >
                                            {allergen}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Selected Allergens as Chips */}
                            {metadata.allergens.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        Selected allergens:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {metadata.allergens.map((allergen) => (
                                            <motion.div
                                                key={allergen}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium border border-amber-300 dark:border-amber-700"
                                            >
                                                <AlertTriangle size={14} />
                                                {allergen}
                                                <button
                                                    type="button"
                                                    onClick={() => removeAllergen(allergen)}
                                                    className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Allergen Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customAllergen}
                                    onChange={(e) => setCustomAllergen(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addCustomAllergen();
                                        }
                                    }}
                                    placeholder="Add custom allergen..."
                                    className="flex-1 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500/30 outline-none text-gray-900 dark:text-white text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addCustomAllergen}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Dietary Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Leaf size={18} className="text-green-500" />
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Dietary Information
                                </label>
                                <Tooltip text="Used for filtering and dietary needs">
                                    <Info size={14} />
                                </Tooltip>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {DIETARY_OPTIONS.map((option) => {
                                    const isActive = metadata.dietaryInfo === option.value;
                                    return (
                                        <motion.button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleDietaryInfo(option.value)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${isActive
                                                ? "bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/30"
                                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700"
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">{option.icon}</div>
                                            <div className="font-bold text-sm mb-0.5">
                                                {option.label}
                                            </div>
                                            <div
                                                className={`text-xs ${isActive
                                                    ? "text-white/80"
                                                    : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {option.desc}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optional Note */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                        All fields are optional but strongly recommended
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                        Providing this information helps customers with dietary restrictions
                                        and preferences find the perfect meal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
