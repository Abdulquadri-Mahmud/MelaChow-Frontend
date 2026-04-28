import { motion, AnimatePresence } from "framer-motion";
import { Package, Calendar, Clock } from "lucide-react";
import SectionHeader from "./SectionHeader";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function InventorySection({
    formData,
    setFormData,
    expanded,
    toggleExpanded,
}) {
    const updateSchedule = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            availabilitySchedule: { ...prev.availabilitySchedule, [field]: value },
        }));
    };

    const toggleDay = (day) => {
        const currentDays = formData.availabilitySchedule.days || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter((d) => d !== day)
            : [...currentDays, day];
        updateSchedule("days", newDays);
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <SectionHeader
                title="Inventory & Schedule"
                subtitle="Manage stock levels and availability hours"
                icon={Package}
                section="inventory"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="indigo"
            />

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-8"
                    >
                        {/* Global Stock */}
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Global Stock Level <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative mt-2">
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, stock: e.target.value }))
                                    }
                                    className="w-full border-2 border-gray-100 dark:border-gray-700 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:border-indigo-500 outline-none transition-colors"
                                    placeholder="Enter stock quantity (e.g., 100)"
                                    min="1"
                                    required
                                />
                                <Package
                                    size={18}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Set the maximum number of orders allowed for this item. Must be at least 1.
                            </p>
                        </div>

                        {/* Availability Schedule */}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-500" />
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Availability Schedule
                                    </h3>
                                </div>
                                <label className="flex items-center cursor-pointer relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.availabilitySchedule.enabled}
                                        onChange={(e) => updateSchedule("enabled", e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            <AnimatePresence>
                                {formData.availabilitySchedule.enabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-5"
                                    >
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                                                Active Days
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {DAYS.map((day) => {
                                                    const isActive =
                                                        formData.availabilitySchedule.days?.includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => toggleDay(day)}
                                                            className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${isActive
                                                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white dark:ring-gray-800 scale-105"
                                                                : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                                                                }`}
                                                        >
                                                            {day.slice(0, 1)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                                    Start Time
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        value={formData.availabilitySchedule.startTime}
                                                        onChange={(e) =>
                                                            updateSchedule("startTime", e.target.value)
                                                        }
                                                        className="w-full border border-indigo-200 dark:border-indigo-700 p-2.5 rounded-lg bg-white dark:bg-gray-800 text-sm focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                                    End Time
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        value={formData.availabilitySchedule.endTime}
                                                        onChange={(e) =>
                                                            updateSchedule("endTime", e.target.value)
                                                        }
                                                        className="w-full border border-indigo-200 dark:border-indigo-700 p-2.5 rounded-lg bg-white dark:bg-gray-800 text-sm focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
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
