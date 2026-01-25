"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, AlertCircle, Loader2, Layers, GitMerge } from "lucide-react";

export default function CategoryModal({ isOpen, onClose, onSubmit, category = null, allCategories = [] }) {
    const isEditing = !!category;

    const [categoryType, setCategoryType] = useState("main"); // "main" | "sub"
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        parentName: "",
        image: "",
        isActive: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSlugTouched, setIsSlugTouched] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Initialize form
    useEffect(() => {
        if (isOpen) {
            if (category) {
                // If editing, determine type based on parent presence
                const hasParent = category.parent && Object.keys(category.parent).length > 0;
                setCategoryType(hasParent ? "sub" : "main");

                setFormData({
                    name: category.name || "",
                    slug: category.slug || "",
                    description: category.description || "",
                    parentName: category.parent?.name || "",
                    image: category.image || "",
                    isActive: category.isActive ?? true
                });
                setIsSlugTouched(!!category.slug);
            } else {
                // Reset for create mode
                // Default to "main" but let user choose
                setCategoryType("main");
                setFormData({
                    name: "",
                    slug: "",
                    description: "",
                    parentName: "",
                    image: "",
                    isActive: true
                });
                setIsSlugTouched(false);
            }
            setError("");
        }
    }, [category, isOpen]);

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setFormData(prev => ({
            ...prev,
            name: newName,
            slug: !isSlugTouched ? generateSlug(newName) : prev.slug
        }));
    };

    const handleTypeSelect = (type) => {
        setCategoryType(type);
        if (type === "main") {
            setFormData(prev => ({ ...prev, parentName: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim()) {
            setError("Category name is required");
            return;
        }

        if (categoryType === "sub" && !formData.parentName.trim()) {
            setError("Parent category is required for subcategories");
            return;
        }

        if (formData.slug) {
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
            if (!slugRegex.test(formData.slug)) {
                setError("Slug must be lowercase letters, numbers, and hyphens only");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug || undefined,
                description: formData.description,
                image: formData.image,
                parentName: categoryType === "sub" ? formData.parentName : null,
                isActive: formData.isActive
            };

            await onSubmit(payload);
            onClose();
        } catch (err) {
            console.error(err);
            let msg = err.message || "Failed to save category";
            if (msg.toLowerCase().includes("parent category not found")) {
                setError("Parent category not found. Please select from the list.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter parents for autocomplete
    const filteredParents = allCategories.filter(c =>
        // Must match search, must NOT be itself, and preferably should be a main category usually (depending on depth rules)
        (!isEditing || c._id !== category._id) &&
        c.name.toLowerCase().includes(formData.parentName.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {isEditing ? "Edit Category" : "New Category"}
                                </h2>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    {isEditing ? "Modify existing details" : "Create a new food classification"}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Type Selection Cards */}
                            {!isEditing && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => handleTypeSelect("main")}
                                        className={`cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200 ${categoryType === "main"
                                            ? "border-orange-500 bg-orange-50/50"
                                            : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${categoryType === "main" ? "bg-orange-100 text-orange-600" : "bg-white text-gray-400"}`}>
                                            <Layers size={20} />
                                        </div>
                                        <h3 className={`font-bold text-sm mb-1 ${categoryType === "main" ? "text-orange-900" : "text-gray-700"}`}>
                                            Main Category
                                        </h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Top-level group. Example: <span className="font-medium">"Burgers", "Drinks"</span>.
                                        </p>
                                        {categoryType === "main" && (
                                            <div className="absolute top-4 right-4 text-orange-500">
                                                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => handleTypeSelect("sub")}
                                        className={`cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200 ${categoryType === "sub"
                                            ? "border-orange-500 bg-orange-50/50"
                                            : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${categoryType === "sub" ? "bg-orange-100 text-orange-600" : "bg-white text-gray-400"}`}>
                                            <GitMerge size={20} />
                                        </div>
                                        <h3 className={`font-bold text-sm mb-1 ${categoryType === "sub" ? "text-orange-900" : "text-gray-700"}`}>
                                            Subcategory
                                        </h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Nested item. Example: <span className="font-medium">"Cheese Burger", "Soda"</span>.
                                        </p>
                                        {categoryType === "sub" && (
                                            <div className="absolute top-4 right-4 text-orange-500">
                                                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Error Alert */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-3 border border-red-100"
                                >
                                    <AlertCircle size={18} className="flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="space-y-6">
                                {/* Parent Category Input (Conditional) */}
                                <AnimatePresence>
                                    {categoryType === "sub" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-visible"
                                        >
                                            <div className="relative">
                                                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                                    Parent Category
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.parentName}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, parentName: e.target.value });
                                                        setShowSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 bg-white outline-none transition-all font-bold text-gray-800"
                                                    placeholder="Search for parent..."
                                                />
                                                {/* Suggestions Dropdown */}
                                                <AnimatePresence>
                                                    {showSuggestions && formData.parentName && filteredParents.length > 0 && (
                                                        <motion.ul
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute z-30 w-full bg-white border border-gray-100 rounded-2xl mt-2 shadow-xl max-h-56 overflow-y-auto p-1 custom-scrollbar"
                                                        >
                                                            {filteredParents.map((cat) => (
                                                                <li
                                                                    key={cat._id}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, parentName: cat.name });
                                                                        setShowSuggestions(false);
                                                                    }}
                                                                    className="px-4 py-3 hover:bg-orange-50 rounded-xl cursor-pointer text-sm font-bold text-gray-700 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <span>{cat.name}</span>
                                                                    <span className="text-xs text-gray-400 group-hover:text-orange-500">Select</span>
                                                                </li>
                                                            ))}
                                                        </motion.ul>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Name & Slug */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-gray-800 placeholder:font-medium"
                                            placeholder="e.g. Pizza"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                            Slug <span className="text-gray-300 font-medium normal-case tracking-normal">(Auto-generated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                setIsSlugTouched(true);
                                                setFormData({ ...formData, slug: e.target.value });
                                            }}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all font-mono text-sm text-gray-600"
                                            placeholder="e.g. pizza"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-gray-700 resize-none"
                                        placeholder="Add a brief description..."
                                    />
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                        Image Link
                                    </label>
                                    <div className="flex gap-4">
                                        <input
                                            type="url"
                                            value={formData.image}
                                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            className="flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-gray-700 font-mono text-xs"
                                            placeholder="https://..."
                                        />
                                        <div className="w-[58px] h-[58px] bg-gray-100 border border-gray-200 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                {isEditing && (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${formData.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                                            <span className="text-sm font-bold text-gray-700">Active Status</span>
                                        </div>
                                        <div className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${formData.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${formData.isActive ? "translate-x-5" : "translate-x-0"}`} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                    {isEditing ? "Save Changes" : "Create Category"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
