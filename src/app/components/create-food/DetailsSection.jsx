import { motion, AnimatePresence } from "framer-motion";
import { Info, Clock, MessageSquare, Activity, ChevronDown, ChevronUp } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { useState } from "react";

const FOOD_TYPES = [
    { value: "veg", label: "Vegetarian 🟢" },
    { value: "non-veg", label: "Non-Vegetarian 🔴" },
    { value: "vegan", label: "Vegan 🌱" },
    { value: "halal", label: "Halal ☪️" },
    { value: "mixed", label: "Mixed 🥘" },
];

export default function DetailsSection({
    formData,
    setFormData,
    expanded,
    toggleExpanded,
}) {
    const [nutritionExpanded, setNutritionExpanded] = useState(false);

    const updateNutrition = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            nutrition: { ...prev.nutrition, [field]: value },
        }));
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <SectionHeader
                title="Item Details & Operations"
                subtitle="Preparation time, nutrition, and instructions"
                icon={Info}
                section="details"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="cyan"
            />

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-6"
                    >
                        {/* Food Type */}
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Food Type
                            </label>
                            <div className="relative mt-2">
                                <select
                                    value={formData.foodType}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, foodType: e.target.value }))
                                    }
                                    className="w-full border-2 border-gray-100 dark:border-gray-700 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:border-cyan-500 outline-none appearance-none transition-colors"
                                >
                                    <option value="">Select Type</option>
                                    {FOOD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Customer Instructions Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-cyan-500" />
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Allow Customer Instructions
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Let customers modify their order with notes
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.allowNotes}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            allowNotes: e.target.checked,
                                        }))
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>

                        {/* Nutrition Info (Collapsible) */}
                        <div className="border rounded-2xl border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setNutritionExpanded(!nutritionExpanded)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
                                    <Activity size={18} className="text-pink-500" />
                                    Nutrition Info
                                    <span className="text-xs font-normal text-gray-400 ml-2">
                                        (Optional)
                                    </span>
                                </div>
                                {nutritionExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            <AnimatePresence>
                                {nutritionExpanded && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        className="bg-white dark:bg-gray-900"
                                    >
                                        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { label: "Calories", key: "calories", unit: "kcal" },
                                                { label: "Protein", key: "protein", unit: "g" },
                                                { label: "Carbs", key: "carbs", unit: "g" },
                                                { label: "Fat", key: "fat", unit: "g" },
                                                { label: "Fiber", key: "fiber", unit: "g" },
                                                { label: "Sugar", key: "sugar", unit: "g" },
                                            ].map((item) => (
                                                <div key={item.key}>
                                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                                        {item.label}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={formData.nutrition[item.key] || ""}
                                                            onChange={(e) => updateNutrition(item.key, e.target.value)}
                                                            className="w-full border border-gray-200 dark:border-gray-700 p-2 pr-8 rounded-lg text-sm outline-none focus:border-pink-500 transition-colors"
                                                            placeholder="0"
                                                            min="0"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                                                            {item.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
