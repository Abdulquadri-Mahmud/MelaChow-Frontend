import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Percent, Calendar } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function PricingSection({
    formData,
    setFormData,
    expanded,
    toggleExpanded,
}) {
    const updateDiscount = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            discount: { ...prev.discount, [field]: value },
        }));
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <SectionHeader
                title="Pricing & Discounts"
                subtitle="Manage packaging fees and promotional offers"
                icon={DollarSign}
                section="pricing_advanced"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="green"
            />

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-6"
                    >
                        {/* Packaging Fee */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Packaging Fee (₦)
                                </label>
                                <input
                                    type="number"
                                    value={formData.packagingFee}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            packagingFee: e.target.value,
                                        }))
                                    }
                                    className="w-full border-2 border-gray-100 dark:border-gray-700 p-3 rounded-xl mt-2 bg-gray-50 dark:bg-gray-900/50 focus:border-green-500 outline-none transition-colors"
                                    placeholder="e.g. 100"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Added once per item in the cart.
                                </p>
                            </div>
                        </div>

                        {/* Discounts */}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Percent size={18} className="text-green-500" />
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Promotional Discount
                                    </h3>
                                </div>
                                <label className="flex items-center cursor-pointer relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.discount.enabled}
                                        onChange={(e) => updateDiscount("enabled", e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            <AnimatePresence>
                                {formData.discount.enabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="grid md:grid-cols-3 gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800"
                                    >
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Discount Type
                                            </label>
                                            <select
                                                value={formData.discount.type}
                                                onChange={(e) => updateDiscount("type", e.target.value)}
                                                className="w-full border border-green-200 dark:border-green-700 p-2.5 rounded-lg mt-1 bg-white dark:bg-gray-800 text-sm focus:border-green-500 outline-none"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="flat">Flat Amount (₦)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Value
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={formData.discount.value}
                                                    onChange={(e) => updateDiscount("value", e.target.value)}
                                                    className="w-full border border-green-200 dark:border-green-700 p-2.5 rounded-lg mt-1 bg-white dark:bg-gray-800 text-sm focus:border-green-500 outline-none pl-8"
                                                    placeholder={
                                                        formData.discount.type === "percentage" ? "10" : "500"
                                                    }
                                                    min="0"
                                                />
                                                <span className="absolute left-3 top-[1.1rem] text-gray-400 text-xs font-bold">
                                                    {formData.discount.type === "percentage" ? "%" : "₦"}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Expires At
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={formData.discount.expiresAt}
                                                    onChange={(e) =>
                                                        updateDiscount("expiresAt", e.target.value)
                                                    }
                                                    className="w-full border border-green-200 dark:border-green-700 p-2.5 rounded-lg mt-1 bg-white dark:bg-gray-800 text-sm focus:border-green-500 outline-none bg-none"
                                                />
                                            </div>
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
