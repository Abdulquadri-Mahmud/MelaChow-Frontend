"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
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
            toast.error("Photo couldn't upload. Your food is saved without it — you can add a photo later.");
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
        { label: "Food", value: "FOOD", emoji: "🍽️" },
        { label: "Drink", value: "DRINK", emoji: "🥤" },
        { label: "Soup", value: "SOUP", emoji: "🥘" },
        { label: "Swallow", value: "SWALLOW", emoji: "🫓" },
        { label: "Protein", value: "PROTEIN", emoji: "🍗" },
        { label: "Side", value: "SIDE", emoji: "🍟" },
        { label: "Dessert", value: "DESSERT", emoji: "🍰" },
        { label: "Other", value: "OTHER", emoji: "🍴" },
    ];

    const DIETARY_TYPE_OPTIONS = [
        { label: "Mixed", value: "mixed", emoji: "🍽️", hint: "No restrictions" },
        { label: "Halal", value: "halal", emoji: "☪️", hint: "Halal certified" },
        { label: "Non-Veg", value: "non-veg", emoji: "🥩", hint: "Contains meat" },
        { label: "Veg", value: "veg", emoji: "🥦", hint: "Vegetarian" },
        { label: "Vegan", value: "vegan", emoji: "🌱", hint: "No animal products" },
        { label: "Kosher", value: "kosher", emoji: "✡️", hint: "Kosher certified" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-3 lg:p-6">
            <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Let's start with the basics</h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-base">What are you cooking? Add a name, description, and an appetizing photo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* LEFT COLUMN: IDENTITY */}
                <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">Food Name <span className="text-rose-500">*</span></label>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${store.name.length >= 2 ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>{store.name.length}/80</span>
                        </div>
                        <input
                            type="text"
                            value={store.name}
                            onChange={(e) => store.setField("name", e.target.value.substring(0, 80))}
                            placeholder="e.g. Jollof Rice, Chicken Suya"
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-bold text-slate-900 dark:text-white text-lg placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">Description</label>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${store.description.length >= 10 ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>{store.description.length}/300</span>
                        </div>
                        <textarea
                            value={store.description}
                            onChange={(e) => store.setField("description", e.target.value.substring(0, 300))}
                            placeholder="Tell customers what makes this special. e.g. Smoky party jollof cooked fresh daily."
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-medium text-slate-900 dark:text-white text-base min-h-[160px] resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Search Tags</label>
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus-within:border-orange-500 dark:focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 dark:focus-within:ring-orange-500/10 transition-all flex flex-wrap gap-2 items-center min-h-[60px]">
                            {store.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-3 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg select-none">
                                    {tag}
                                    <button type="button" onClick={() => store.removeTag(tag)} className="text-slate-400 hover:text-rose-500 ml-1 transition-colors"><X size={14} /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKey}
                                placeholder={store.tags.length < 6 ? "Type a tag and press Enter..." : "Max 6 tags reached"}
                                disabled={store.tags.length >= 6}
                                className="flex-1 min-w-[150px] bg-transparent outline-none h-8 px-2 text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                            />
                        </div>
                        {store.tags.length < 6 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1.5 mr-1 pt-2">Suggestions:</span>
                                {PREDEFINED_TAGS.filter(t => !store.tags.includes(t.toLowerCase())).map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => store.addTag(tag)}
                                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: MEDIA & META */}
                <div className="space-y-6">
                    {/* Photo */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block mb-1">Food Photo</label>
                        <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors overflow-hidden group h-[220px]">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-10">
                                {uploading ? (
                                    <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
                                ) : store.image_url ? (
                                    <img src={store.image_url} alt="Food Upload" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-2 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300">
                                        <ImageIcon size={28} />
                                    </div>
                                )}

                                {!store.image_url && !uploading && (
                                    <>
                                        <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">Add a photo <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">(optional)</span></p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tap or drag an image here. JPG, PNG, WEBP.</p>
                                    </>
                                )}
                            </div>
                            {store.image_url && !uploading && (
                                <div className="absolute top-3 right-3 z-20">
                                    <button
                                        onClick={(e) => { e.preventDefault(); store.setField("image_url", null) }}
                                        className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-slate-200 dark:border-slate-800"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Item Category */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Item Category <span className="text-rose-500">*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {ITEM_TYPE_OPTIONS.map(option => {
                                    const isSelected = store.item_type === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => store.setField("item_type", option.value)}
                                            className={`h-9 px-3 rounded-xl text-[10px] uppercase tracking-widest font-black border transition-all flex items-center gap-1.5 ${isSelected
                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                                                }`}
                                        >
                                            <span>{option.emoji}</span>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dietary Type */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Dietary Type</label>
                            <div className="flex flex-wrap gap-2">
                                {DIETARY_TYPE_OPTIONS.map(option => {
                                    const isSelected = store.dietary_type === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => store.setField("dietary_type", option.value)}
                                            title={option.hint}
                                            className={`h-9 px-3 rounded-xl text-[10px] uppercase tracking-widest font-black border transition-all flex items-center gap-1.5 ${isSelected
                                                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/40"
                                                }`}
                                        >
                                            <span>{option.emoji}</span>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Prep Time */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Preparation Time</label>
                        <div className="flex items-center h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full p-1 shadow-sm transition-colors max-w-[240px]">
                            <button
                                type="button"
                                disabled={store.prep_time_minutes <= 5}
                                onClick={() => store.setField("prep_time_minutes", Math.max(5, (store.prep_time_minutes || 20) - 5))}
                                className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl disabled:opacity-30 transition-colors font-bold text-xl"
                            >-</button>
                            <div className="flex-1 flex flex-col items-center justify-center leading-none">
                                <span className="font-black text-slate-900 dark:text-white text-lg">{store.prep_time_minutes || 20}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MINS</span>
                            </div>
                            <button
                                type="button"
                                disabled={store.prep_time_minutes >= 120}
                                onClick={() => store.setField("prep_time_minutes", Math.min(120, (store.prep_time_minutes || 20) + 5))}
                                className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl disabled:opacity-30 transition-colors font-bold text-xl"
                            >+</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
