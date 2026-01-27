import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Package } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function PortionsSection({
    portions,
    setPortions,
    basePrice,
    expanded,
    toggleExpanded,
}) {
    const addPortion = () => {
        const newPortionNumber = portions.length + 1;
        const calculatedPrice = basePrice * newPortionNumber;
        setPortions([
            ...portions,
            {
                portionNumber: newPortionNumber,
                price: calculatedPrice,
                label: `${newPortionNumber} Portion${newPortionNumber > 1 ? "s" : ""}`,
            },
        ]);
    };

    const updatePortion = (index, field, value) => {
        setPortions((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    const removePortion = (index) => {
        setPortions((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <SectionHeader
                title="Portions"
                subtitle={`${portions.length} portion${portions.length !== 1 ? "s" : ""} configured`}
                icon={Package}
                section="portions"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="purple"
            />

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Allow customers to order multiple portions with scaled pricing
                            </p>
                            <button
                                type="button"
                                onClick={addPortion}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold hover:bg-purple-600 transition-colors"
                            >
                                <Plus size={16} />
                                Add Portion
                            </button>
                        </div>

                        {portions.length > 0 ? (
                            <div className="space-y-3">
                                {portions.map((portion, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-3 gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800"
                                    >
                                        <div>
                                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Portion #
                                            </label>
                                            <input
                                                type="number"
                                                value={portion.portionNumber}
                                                onChange={(e) =>
                                                    updatePortion(index, "portionNumber", e.target.value)
                                                }
                                                className="w-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                min="1"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Price (₦)
                                            </label>
                                            <input
                                                type="number"
                                                value={portion.price}
                                                onChange={(e) =>
                                                    updatePortion(index, "price", e.target.value)
                                                }
                                                className="w-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                min="0"
                                            />
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    Label
                                                </label>
                                                <input
                                                    type="text"
                                                    value={portion.label}
                                                    onChange={(e) =>
                                                        updatePortion(index, "label", e.target.value)
                                                    }
                                                    className="w-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                    placeholder="e.g., Double Portion"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePortion(index)}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Package size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No portions added yet</p>
                                <p className="text-xs mt-1">
                                    Click "Add Portion" to allow portion scaling
                                </p>
                            </div>
                        )}

                        {portions.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                                    💡 Tip: Prices should increase with portion size. Portion 2 should cost more than Portion 1.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
