"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";
const CLOUDINARY_PRESET = "MelaChow";

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

export default function Step1BasicInfo({ onNext }) {
    const store = useCreateFoodStore();
    const [tagInput, setTagInput] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleNext = () => {
        if (!store.name.trim() || store.name.length < 2) {
            toast.error("Please enter a food name (min 2 characters)");
            return;
        }
        if (!store.item_type) {
            toast.error("Please select a food type");
            return;
        }
        onNext();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadToCloudinary(file);
        setUploading(false);

        if (url) {
            store.setField("image_url", url);
        } else {
            toast.error("Photo couldn't upload. Your food is saved without it â€” you can add a photo later.");
        }
    };

    const handleTagKey = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            store.addTag(tagInput);
            setTagInput("");
        }
    };

    const PREDEFINED_TAGS = ["Spicy", "Delicious", "Vegan", "Sweet", "Bestseller", "New", "Healthy", "Gluten-Free"];

    const ITEM_TYPE_OPTIONS = [
        { label: "Food", value: "FOOD", emoji: "🍱" },
        { label: "Drink", value: "DRINK", emoji: "🥤" },
        { label: "Soup", value: "SOUP", emoji: "🥣" },
        { label: "Swallow", value: "SWALLOW", emoji: "🍲" },
        { label: "Protein", value: "PROTEIN", emoji: "🍗" },
        { label: "Side", value: "SIDE", emoji: "🍟" },
        { label: "Dessert", value: "DESSERT", emoji: "🍰" },
        { label: "Other", value: "OTHER", emoji: "🍽️" },
    ];

    const DIETARY_TYPE_OPTIONS = [
        { label: "Mixed", value: "mixed", emoji: "🍱", hint: "No restrictions" },
        { label: "Halal", value: "halal", emoji: "☪️", hint: "Halal certified" },
        { label: "Non-Veg", value: "non-veg", emoji: "🥩", hint: "Contains meat" },
        { label: "Veg", value: "veg", emoji: "🥦", hint: "Vegetarian" },
        { label: "Vegan", value: "vegan", emoji: "🌱", hint: "No animal products" },
        { label: "Kosher", value: "kosher", emoji: "✡️", hint: "Kosher certified" },
    ];

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 md:p-6 pb-20">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Basic Information</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed">Start by giving your dish a name, a good photo, and a short description.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                {/* LEFT COLUMN: IDENTITY */}
                <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">Dish Name <span className="text-orange-600">*</span></label>
                            <span className={`text-[9px] uppercase font-black tracking-wider ${store.name.length >= 2 ? "text-orange-600" : "text-slate-400"}`}>{store.name.length}/80</span>
                        </div>
                        <input
                            type="text"
                            value={store.name}
                            onChange={(e) => store.setField("name", e.target.value.substring(0, 80))}
                            placeholder="e.g. Smoky Jollof Rice with Chicken"
                            className="w-full h-12 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-600 dark:focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest placeholder:font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">Description</label>
                            <span className={`text-[9px] uppercase font-black tracking-wider ${store.description.length >= 10 ? "text-orange-600" : "text-slate-400"}`}>{store.description.length}/300</span>
                        </div>
                        <textarea
                            value={store.description}
                            onChange={(e) => store.setField("description", e.target.value.substring(0, 300))}
                            placeholder="Tell your customers what makes this dish special..."
                            className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-600 dark:focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all font-bold text-slate-900 dark:text-white text-[11px] min-h-[140px] resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none uppercase tracking-wider leading-relaxed"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Add Search Tags</label>
                        <div className="p-2 gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus-within:border-orange-600 transition-all flex flex-wrap items-center min-h-[50px]">
                            {store.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-2.5 h-7 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200 dark:border-slate-700">
                                    {tag}
                                    <button type="button" onClick={() => store.removeTag(tag)} className="text-slate-400 hover:text-orange-600 transition-colors"><X size={10} /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKey}
                                placeholder={store.tags.length < 6 ? "e.g. Spicy, Vegan..." : "Limit reached"}
                                disabled={store.tags.length >= 6}
                                className="flex-1 min-w-[120px] bg-transparent outline-none h-7 px-2 text-[10px] text-slate-900 dark:text-white font-black uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:opacity-30"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: MEDIA & META */}
                <div className="space-y-6">
                    {/* Photo */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block mb-1">Upload Photo</label>
                        <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors overflow-hidden group h-[200px]">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-orange-600" size={24} />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">Uploading Photo...</p>
                                    </div>
                                ) : store.image_url ? (
                                    <img src={store.image_url} alt="Food Upload" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-orange-600 group-hover:border-orange-600/30 transition-all duration-300">
                                        <ImageIcon size={20} />
                                    </div>
                                )}

                                {!store.image_url && !uploading && (
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Add a Photo</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">JPG or PNG (max 5MB)</p>
                                    </div>
                                )}
                            </div>
                            {store.image_url && !uploading && (
                                <div className="absolute top-3 right-3 z-20">
                                    <button
                                        onClick={(e) => { e.preventDefault(); store.setField("image_url", null) }}
                                        className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 rounded-md text-slate-600 hover:text-orange-600 border border-slate-200 dark:border-slate-800 shadow-sm"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Item Category */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">What kind of dish is this? <span className="text-orange-600">*</span></label>
                            <div className="flex flex-wrap gap-1.5">
                                {ITEM_TYPE_OPTIONS.map(option => {
                                    const isSelected = store.item_type === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => store.setField("item_type", option.value)}
                                            className={`h-8 px-3 rounded-md text-[9px] uppercase tracking-widest font-black border transition-all flex items-center gap-2 ${isSelected
                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                                                    : "bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dietary Type */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Dietary Info (Optional)</label>
                            <div className="flex flex-wrap gap-1.5">
                                {DIETARY_TYPE_OPTIONS.map(option => {
                                    const isSelected = store.dietary_type === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => store.setField("dietary_type", option.value)}
                                            title={option.hint}
                                            className={`h-8 px-3 rounded-md text-[9px] uppercase tracking-widest font-black border transition-all flex items-center gap-2 ${isSelected
                                                    ? "bg-orange-600 text-white border-transparent shadow-none"
                                                    : "bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Prep Time */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest block">Preparation Time (Minutes)</label>
                        <div className="flex items-center h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md w-full p-1 max-w-[200px]">
                            <button
                                type="button"
                                disabled={store.prep_time_minutes <= 5}
                                onClick={() => store.setField("prep_time_minutes", Math.max(5, (store.prep_time_minutes || 20) - 5))}
                                className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900 rounded-md disabled:opacity-20 transition-all font-black"
                            >-</button>
                            <div className="flex-1 flex flex-col items-center justify-center leading-none">
                                <span className="font-black text-slate-900 dark:text-white text-sm">{store.prep_time_minutes || 20}</span>
                            </div>
                            <button
                                type="button"
                                disabled={store.prep_time_minutes >= 120}
                                onClick={() => store.setField("prep_time_minutes", Math.min(120, (store.prep_time_minutes || 20) + 5))}
                                className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900 rounded-md disabled:opacity-20 transition-all font-black"
                            >+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

