import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, List, X, ChevronDown, ImageIcon } from "lucide-react";
import SectionHeader from "./SectionHeader";

const CHOICE_GROUP_PRESETS = [
    "Protein",
    "Soup / Stew",
    "Sauce",
    "Toppings",
    "Extras",
    "Sides",
    "Drink Size",
    "Spice Level",
    "Rice Type",
    "Swallow Type",
    "Bread Type",
    "Cheese Type",
    "Meat Type",
    "Fish Type",
    "Vegetable",
    "Combo Items",
];

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
                    ? { ...g, options: [...g.options, { name: "", price: 0, stock: "", image: "" }] }
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
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <SectionHeader
                title="Choice Groups"
                subtitle={`${choiceGroups.length} group${choiceGroups.length !== 1 ? "s" : ""} configured`}
                icon={List}
                section="choiceGroups"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="blue"
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
                                                <div className="col-span-3 sm:col-span-1 space-y-1">
                                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        Group Type <span className="text-rose-500">*</span>
                                                    </label>

                                                    {/* Dropdown */}
                                                    <div className="relative">
                                                        <select
                                                            value={
                                                                group.isCustom
                                                                    ? "CUSTOM_TRIGGER"
                                                                    : (CHOICE_GROUP_PRESETS.includes(group.name) ? group.name : (group.name ? "CUSTOM_TRIGGER" : ""))
                                                            }
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === "CUSTOM_TRIGGER") {
                                                                    setChoiceGroups(prev => prev.map((g, i) =>
                                                                        i === groupIndex ? { ...g, isCustom: true, name: "" } : g
                                                                    ));
                                                                } else {
                                                                    setChoiceGroups(prev => prev.map((g, i) =>
                                                                        i === groupIndex ? { ...g, isCustom: false, name: val } : g
                                                                    ));
                                                                }
                                                            }}
                                                            className="w-full appearance-none border border-gray-200 dark:border-gray-700 p-2 pr-8 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                                        >
                                                            <option value="" disabled>Select Type</option>
                                                            {CHOICE_GROUP_PRESETS.map((preset) => (
                                                                <option key={preset} value={preset}>
                                                                    {preset}
                                                                </option>
                                                            ))}
                                                            <option value="CUSTOM_TRIGGER">Custom (create your own)</option>
                                                        </select>

                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                            <ChevronDown size={14} />
                                                        </div>
                                                    </div>

                                                    {/* Custom Input */}
                                                    {(group.isCustom || (group.name && !CHOICE_GROUP_PRESETS.includes(group.name))) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={group.name}
                                                                onChange={(e) => updateChoiceGroup(groupIndex, "name", e.target.value)}
                                                                className="w-full border border-blue-200 dark:border-blue-800 p-2 rounded-lg mt-2 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                                                                placeholder="Enter custom group name"
                                                                autoFocus={!group.name}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* User Friendly Constraints */}
                                                <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                    {/* Required Toggle */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                                                            Is this required?
                                                        </label>
                                                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateChoiceGroup(groupIndex, "minSelect", 0)}
                                                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${group.minSelect === 0
                                                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                                                    }`}
                                                            >
                                                                Optional
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateChoiceGroup(groupIndex, "minSelect", 1)}
                                                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${group.minSelect > 0
                                                                    ? "bg-rose-500 text-white shadow-sm"
                                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                                                    }`}
                                                            >
                                                                Required
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Selection Mode */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                                                            Selection Type
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <div className="flex flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateChoiceGroup(groupIndex, "maxSelect", 1)}
                                                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${group.maxSelect === 1
                                                                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                                                        }`}
                                                                >
                                                                    Single
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateChoiceGroup(groupIndex, "maxSelect", 5)}
                                                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${group.maxSelect > 1
                                                                        ? "bg-blue-500 text-white shadow-sm"
                                                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                                                                        }`}
                                                                >
                                                                    Multiple
                                                                </button>
                                                            </div>

                                                            {group.maxSelect > 1 && (
                                                                <div className="w-20">
                                                                    <input
                                                                        type="number"
                                                                        value={group.maxSelect}
                                                                        onChange={(e) => updateChoiceGroup(groupIndex, "maxSelect", e.target.value)}
                                                                        className="w-full h-full border border-gray-200 dark:border-gray-700 p-2 rounded-lg text-center font-bold bg-white dark:bg-gray-800 text-sm focus:border-blue-500 outline-none"
                                                                        min="2"
                                                                        title="Max Selection Limit"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
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
                                                <div className="space-y-4">
                                                    {group.options.map((option, optionIndex) => (
                                                        <div
                                                            key={optionIndex}
                                                            className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-sm"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {/* Image Preview / Input */}
                                                                <div className="space-y-2">
                                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center relative group/img">
                                                                        {option.image ? (
                                                                            <img src={option.image} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <ImageIcon size={16} className="text-gray-400" />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div className="col-span-2 md:col-span-2">
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Option Name</label>
                                                                        <input
                                                                            type="text"
                                                                            value={option.name}
                                                                            onChange={(e) =>
                                                                                updateOption(groupIndex, optionIndex, "name", e.target.value)
                                                                            }
                                                                            className="w-full border-b border-gray-200 dark:border-gray-700 p-1 bg-transparent text-sm font-medium focus:border-blue-500 outline-none transition-colors"
                                                                            placeholder="e.g., Extra Cheese"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Price (₦)</label>
                                                                        <input
                                                                            type="number"
                                                                            value={option.price}
                                                                            onChange={(e) =>
                                                                                updateOption(groupIndex, optionIndex, "price", e.target.value)
                                                                            }
                                                                            className="w-full border-b border-gray-200 dark:border-gray-700 p-1 bg-transparent text-sm focus:border-blue-500 outline-none transition-colors"
                                                                            min="0"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Stock</label>
                                                                        <input
                                                                            type="number"
                                                                            value={option.stock}
                                                                            onChange={(e) =>
                                                                                updateOption(groupIndex, optionIndex, "stock", e.target.value)
                                                                            }
                                                                            className="w-full border-b border-gray-200 dark:border-gray-700 p-1 bg-transparent text-sm focus:border-blue-500 outline-none transition-colors"
                                                                            placeholder="∞"
                                                                            min="0"
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-2 md:col-span-4">
                                                                        <input
                                                                            type="text"
                                                                            value={option.image}
                                                                            onChange={(e) =>
                                                                                updateOption(groupIndex, optionIndex, "image", e.target.value)
                                                                            }
                                                                            className="w-full text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded px-2 py-1 border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-200 outline-none transition-all"
                                                                            placeholder="Paste image URL here (optional)"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOption(groupIndex, optionIndex)}
                                                                    className="p-2 -mr-1 text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
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
