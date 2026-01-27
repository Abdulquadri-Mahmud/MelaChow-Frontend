import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, List, ChevronDown, ChevronUp, X } from "lucide-react";

export default function ChoiceGroupsSection({
    choiceGroups,
    setChoiceGroups,
    expanded,
    toggleExpanded,
}) {
    const addChoiceGroup = () => {
        setChoiceGroups([
            ...choiceGroups,
            {
                name: "",
                minSelect: 0,
                maxSelect: 1,
                options: [],
            },
        ]);
    };

    const updateChoiceGroup = (index, field, value) => {
        setChoiceGroups((prev) =>
            prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
        );
    };

    const removeChoiceGroup = (index) => {
        setChoiceGroups((prev) => prev.filter((_, i) => i !== index));
    };

    const addOption = (groupIndex) => {
        setChoiceGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex
                    ? { ...g, options: [...g.options, { name: "", price: 0 }] }
                    : g
            )
        );
    };

    const updateOption = (groupIndex, optionIndex, field, value) => {
        setChoiceGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex
                    ? {
                        ...g,
                        options: g.options.map((o, j) =>
                            j === optionIndex ? { ...o, [field]: value } : o
                        ),
                    }
                    : g
            )
        );
    };

    const removeOption = (groupIndex, optionIndex) => {
        setChoiceGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex
                    ? { ...g, options: g.options.filter((_, j) => j !== optionIndex) }
                    : g
            )
        );
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
                type="button"
                onClick={toggleExpanded}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 rounded-xl hover:from-blue-100 dark:hover:from-blue-900/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600">
                        <List size={20} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            Choice Groups (Optional)
                        </h2>
                        <p className="text-xs text-gray-500">
                            {choiceGroups.length} group{choiceGroups.length !== 1 ? "s" : ""} configured
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                )}
            </button>

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
                                Add customization options (e.g., "Choose your protein", "Add-ons")
                            </p>
                            <button
                                type="button"
                                onClick={addChoiceGroup}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={16} />
                                Add Group
                            </button>
                        </div>

                        {choiceGroups.length > 0 ? (
                            <div className="space-y-4">
                                {choiceGroups.map((group, groupIndex) => (
                                    <motion.div
                                        key={groupIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border-2 border-blue-200 dark:border-blue-800 space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid grid-cols-3 gap-3">
                                                <div className="col-span-3 sm:col-span-1">
                                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        Group Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={group.name}
                                                        onChange={(e) =>
                                                            updateChoiceGroup(groupIndex, "name", e.target.value)
                                                        }
                                                        className="w-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                        placeholder="e.g., Choose your protein"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        Min Select
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={group.minSelect}
                                                        onChange={(e) =>
                                                            updateChoiceGroup(
                                                                groupIndex,
                                                                "minSelect",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                        min="0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        Max Select
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={group.maxSelect}
                                                        onChange={(e) =>
                                                            updateChoiceGroup(
                                                                groupIndex,
                                                                "maxSelect",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                        min="1"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeChoiceGroup(groupIndex)}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors mt-5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                                                    Options
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => addOption(groupIndex)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                    Add Option
                                                </button>
                                            </div>

                                            {group.options.length > 0 ? (
                                                <div className="space-y-2">
                                                    {group.options.map((option, optionIndex) => (
                                                        <div
                                                            key={optionIndex}
                                                            className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg"
                                                        >
                                                            <input
                                                                type="text"
                                                                value={option.name}
                                                                onChange={(e) =>
                                                                    updateOption(
                                                                        groupIndex,
                                                                        optionIndex,
                                                                        "name",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="flex-1 border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                                placeholder="Option name"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={option.price}
                                                                onChange={(e) =>
                                                                    updateOption(
                                                                        groupIndex,
                                                                        optionIndex,
                                                                        "price",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-24 border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                                placeholder="Price"
                                                                min="0"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeOption(groupIndex, optionIndex)
                                                                }
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 text-center py-2">
                                                    No options added yet
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <List size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No choice groups added yet</p>
                                <p className="text-xs mt-1">
                                    Click "Add Group" to create customization options
                                </p>
                            </div>
                        )}

                        {choiceGroups.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                                    💡 Tip: Min select ≤ Max select. Set price to 0 for included options.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
