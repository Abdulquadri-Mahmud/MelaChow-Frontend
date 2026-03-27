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
                        className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {isEditing ? "Edit Category" : "New Category"}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {isEditing ? "Modify existing details" : "Create a new food classification"}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Type Selection Cards */}
                            {!isEditing && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => handleTypeSelect("main")}
                                        className={`cursor-pointer relative p-4 rounded-lg border flex flex-col items-start transition-all duration-200 ${categoryType === "main"
                                            ? "border-slate-900 bg-slate-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${categoryType === "main" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                                            <Layers size={16} />
                                        </div>
                                        <h3 className={`font-semibold text-sm mb-1 ${categoryType === "main" ? "text-slate-900" : "text-slate-700"}`}>
                                            Main Category
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Top-level group. Example: <span className="font-medium">"Burgers", "Drinks"</span>.
                                        </p>
                                        {categoryType === "main" && (
                                            <div className="absolute top-4 right-4">
                                                <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => handleTypeSelect("sub")}
                                        className={`cursor-pointer relative p-4 rounded-lg border flex flex-col items-start transition-all duration-200 ${categoryType === "sub"
                                            ? "border-slate-900 bg-slate-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${categoryType === "sub" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                                            <GitMerge size={16} />
                                        </div>
                                        <h3 className={`font-semibold text-sm mb-1 ${categoryType === "sub" ? "text-slate-900" : "text-slate-700"}`}>
                                            Subcategory
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Nested item. Example: <span className="font-medium">"Cheese Burger", "Soda"</span>.
                                        </p>
                                        {categoryType === "sub" && (
                                            <div className="absolute top-4 right-4">
                                                <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
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
                                    className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg flex items-center gap-2 border border-red-100"
                                >
                                    <AlertCircle size={16} className="flex-shrink-0" />
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
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
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
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-900"
                                                    placeholder="Search for parent..."
                                                />
                                                {/* Suggestions Dropdown */}
                                                <AnimatePresence>
                                                    {showSuggestions && formData.parentName && filteredParents.length > 0 && (
                                                        <motion.ul
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute z-30 w-full bg-white border border-slate-200 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto p-1 custom-scrollbar"
                                                        >
                                                            {filteredParents.map((cat) => (
                                                                <li
                                                                    key={cat._id}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, parentName: cat.name });
                                                                        setShowSuggestions(false);
                                                                    }}
                                                                    className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-sm text-slate-700 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <span>{cat.name}</span>
                                                                    <span className="text-xs text-slate-400 group-hover:text-slate-900">Select</span>
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
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-900"
                                            placeholder="e.g. Pizza"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                            Slug <span className="text-slate-400 text-xs font-normal normal-case">(Auto-generated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                setIsSlugTouched(true);
                                                setFormData({ ...formData, slug: e.target.value });
                                            }}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-mono text-sm text-slate-600"
                                            placeholder="e.g. pizza"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-900 resize-none"
                                        placeholder="Add a brief description..."
                                    />
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Image Link
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="url"
                                            value={formData.image}
                                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-mono text-sm text-slate-600"
                                            placeholder="https://..."
                                        />
                                        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload size={16} className="text-slate-300" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                {isEditing && (
                                    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${formData.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                            <span className="text-sm font-medium text-slate-700">Active Status</span>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${formData.isActive ? "bg-slate-900" : "bg-slate-200"}`}>
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${formData.isActive ? "translate-x-4" : "translate-x-0"}`} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
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
