"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { motion } from "framer-motion";
import { Upload, X, ImageIcon, Loader2, Sparkles, Clock, Tag } from "lucide-react";
import toast from "react-hot-toast";

const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";
const CLOUDINARY_PRESET = "GrubDash";

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    try {
        const res = await fetch(CLOUDINARY_HOST, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Cloudinary upload failed");
        const data = await res.json();
        return data.secure_url;
    } catch (err) {
        console.error("Upload error", err);
        return null;
    }
};

const ITEM_TYPE_OPTIONS = [
    { label: "🍱 Food", value: "FOOD" },
    { label: "🥤 Drink", value: "DRINK" },
    { label: "🥣 Soup", value: "SOUP" },
    { label: "🍲 Swallow", value: "SWALLOW" },
    { label: "🍗 Protein", value: "PROTEIN" },
    { label: "🍟 Side", value: "SIDE" },
    { label: "🍰 Dessert", value: "DESSERT" },
    { label: "🍽️ Other", value: "OTHER" },
];

const DIETARY_OPTIONS = [
    { label: "🌱 Vegetarian", value: "veg" },
    { label: "🥗 Vegan", value: "vegan" },
    { label: "🍔 Non-Veg", value: "non-veg" },
    { label: "✨ Halal", value: "halal" },
    { label: "✓ Kosher", value: "kosher" },
    { label: "🥣 Mixed", value: "mixed" },
];

export default function Step1BasicInfo() {
    const store = useCreateFoodStore();
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadToCloudinary(file);
        setUploading(false);

        if (url) {
            store.setField("image_url", url);
            toast.success("Image uploaded successfully");
        } else {
            toast.error("Photo couldn't upload. Please try again.");
        }
    };

    const handleAddTag = (tag) => {
        if (tag.trim() && store.tags.length < 6) {
            store.addTag(tag.trim());
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Dish Name */}
            <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400 dark:text-zinc-500 pl-1 group-focus-within:text-orange-600 transition-colors">
                    <Sparkles size={10} strokeWidth={3} />
                    Dish Identity *
                </label>
                <input
                    type="text"
                    value={store.name}
                    onChange={(e) => store.setField("name", e.target.value)}
                    placeholder="E.G. SMOKY JOLLOF RICE WITH CHICKEN"
                    className="w-full h-12 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-[13px] font-black uppercase tracking-tight text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400 dark:text-zinc-500 pl-1">
                    The Story Behind the Dish
                </label>
                <textarea
                    value={store.description}
                    onChange={(e) => store.setField("description", e.target.value)}
                    placeholder="TELL YOUR CUSTOMERS WHAT MAKES THIS DISH SPECIAL..."
                    rows={3}
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-[12px] font-medium text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual */}
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 pl-1">
                        Hero Visual *
                    </label>
                    {store.image_url ? (
                        <div className="relative w-full h-36 rounded-2xl overflow-hidden border-2 border-orange-600 shadow-xl group/img">
                            <img
                                src={store.image_url}
                                alt="Dish visual"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                            />
                            <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => store.setField("image_url", null)}
                                    className="w-10 h-10 bg-white dark:bg-zinc-900 text-rose-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                                >
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex items-center justify-center w-full h-36 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-orange-500 hover:bg-orange-500/5 transition-all group shadow-sm bg-zinc-50 dark:bg-zinc-950">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-2 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-orange-600">
                                    {uploading ? 'Processing...' : 'Upload Media'}
                                </span>
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                        </label>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Item Type */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400 dark:text-zinc-500 pl-1">
                            Classification *
                        </label>
                        <div className="relative group">
                            <select 
                                value={store.item_type}
                                onChange={(e) => store.setField("item_type", e.target.value)}
                                className="w-full h-12 px-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-700 dark:text-white appearance-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm"
                            >
                                {ITEM_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 group-focus-within:text-orange-600">
                                <X size={12} className="rotate-45" strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    {/* Dietary Info */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400 dark:text-zinc-500 pl-1">
                            Dietary Profile *
                        </label>
                        <div className="relative group">
                            <select 
                                value={store.dietary_type}
                                onChange={(e) => store.setField("dietary_type", e.target.value)}
                                className="w-full h-12 px-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-700 dark:text-white appearance-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm"
                            >
                                {DIETARY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 group-focus-within:text-orange-600">
                                <X size={12} className="rotate-45" strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Prep Time */}
                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400 dark:text-zinc-500 pl-1">
                        <Clock size={10} strokeWidth={3} />
                        PREP TIME (MINS)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="5"
                            max="120"
                            value={store.prep_time_minutes || ''}
                            onChange={(e) => store.setField('prep_time_minutes', e.target.value ? Number(e.target.value) : null)}
                            placeholder="20"
                            className="w-full h-12 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-[14px] font-black text-orange-600 tabular-nums focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none shadow-sm"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400 dark:text-zinc-500 pl-1">
                        <Tag size={10} strokeWidth={3} />
                        Search Multipliers
                    </label>
                    <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl min-h-[48px] flex flex-wrap gap-1.5 items-center">
                        {(store.tags || []).map((tag) => (
                            <motion.div
                                key={tag}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/10"
                            >
                                {tag}
                                <button type="button" onClick={() => store.removeTag(tag)} className="text-white/40 hover:text-white transition-colors">
                                    <X size={10} strokeWidth={4} />
                                </button>
                            </motion.div>
                        ))}
                        {(store.tags || []).length < 5 && (
                            <input
                                type="text"
                                placeholder="..."
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag(e.currentTarget.value.toUpperCase());
                                        e.currentTarget.value = "";
                                    }
                                }}
                                className="flex-1 min-w-[60px] bg-transparent text-[10px] font-black uppercase text-zinc-900 dark:text-white outline-none"
                            />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

