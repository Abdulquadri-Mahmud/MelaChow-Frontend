import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import SectionHeader from "./SectionHeader";

const SUGGESTED_TAGS = [
    "Popular",
    "Spicy",
    "Delicious",
    "Vegan",
    "New",
    "Combo",
    "Signature",
    "Halal",
    "Vegetarian",
    "Gluten-Free",
];

export default function TagsSection({
    tags,
    setTags,
    expanded,
    toggleExpanded,
}) {
    const [tagInput, setTagInput] = React.useState("");

    const handleAddTag = (t) => {
        const tag = (t || tagInput || "").trim();
        if (!tag) return;
        if (tags.includes(tag)) {
            setTagInput("");
            return;
        }
        setTags([...tags, tag]);
        setTagInput("");
    };

    const handleTagKey = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === "Backspace" && !tagInput) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (t) => setTags(tags.filter((x) => x !== t));

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <SectionHeader
                title="Tags"
                subtitle={`${tags.length} tag${tags.length !== 1 ? "s" : ""} added`}
                icon={Tag}
                section="tags"
                isExpanded={expanded}
                onToggle={toggleExpanded}
                accentColor="pink"
            />

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-4"
                    >
                        <div className="flex gap-2">
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKey}
                                className="flex-1 border border-gray-200 dark:border-gray-700 p-3 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                                placeholder="Type tag and press Enter or comma"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTag()}
                                className="px-6 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        {/* Suggested Tags */}
                        <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Suggested Tags:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleAddTag(tag)}
                                        disabled={tags.includes(tag)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-600 dark:text-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selected Tags */}
                        {tags.length > 0 ? (
                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Selected Tags:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((t) => (
                                        <motion.span
                                            key={t}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-full flex items-center gap-2 text-sm font-medium"
                                        >
                                            <span>{t}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeTag(t)}
                                                className="p-0.5 hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-4">
                                No tags added yet. Tags help customers find your dish.
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
