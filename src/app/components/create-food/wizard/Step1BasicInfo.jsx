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

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Let's start with the basics</h2>
                <p className="text-slate-500">What are you cooking? Add a name, description, and an appetizing photo.</p>
            </div>

            <div className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Food Name *</label>
                    <input
                        type="text"
                        value={store.name}
                        onChange={(e) => store.setField("name", e.target.value.substring(0, 80))}
                        placeholder="e.g. Jollof Rice, Chicken Suya, Chapman"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-slate-900 text-lg"
                    />
                    <div className="text-right text-xs text-slate-400 font-medium">
                        {store.name.length}/80
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Description</label>
                    <textarea
                        value={store.description}
                        onChange={(e) => store.setField("description", e.target.value.substring(0, 300))}
                        placeholder="Tell customers what makes this special. e.g. Smoky party jollof cooked fresh daily."
                        className="w-full p-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-slate-900 min-h-[100px] resize-y"
                    />
                    <div className="text-right text-xs text-slate-400 font-medium">
                        {store.description.length}/300
                    </div>
                </div>

                {/* Photo */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Food Photo</label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden group">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                            {uploading ? (
                                <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
                            ) : store.image_url ? (
                                <img src={store.image_url} alt="Food Upload" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-400 group-hover:text-orange-500 transition-colors">
                                    <ImageIcon size={24} />
                                </div>
                            )}

                            {!store.image_url && !uploading && (
                                <>
                                    <p className="text-sm font-bold text-slate-900">Add a photo (optional)</p>
                                    <p className="text-xs text-slate-500">Tap or drag an image here. JPG, PNG, WEBP.</p>
                                </>
                            )}
                        </div>
                        {store.image_url && !uploading && (
                            <div className="absolute top-2 right-2 z-20">
                                <button
                                    onClick={(e) => { e.preventDefault(); store.setField("image_url", null) }}
                                    className="w-8 h-8 flex items-center justify-center bg-white/90 rounded-full text-slate-900 hover:text-rose-500 shadow-sm"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Type & Prep Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Food Type *</label>
                        <div className="flex flex-wrap gap-2">
                            {["Mixed", "Veg 🌿", "Non-Veg 🍗", "Vegan 🌱", "Halal ✅"].map(type => {
                                const cleanType = type.split(" ")[0];
                                const isSelected = store.item_type === cleanType;
                                return (
                                    <button
                                        key={cleanType}
                                        type="button"
                                        onClick={() => store.setField("item_type", cleanType)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${isSelected ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wide block">How long to prepare?</label>
                        <span className="text-[10px] text-slate-500 block -mt-1 mb-2">Customers see this as estimated wait time</span>
                        <div className="flex items-center h-12 bg-white border border-slate-200 rounded-xl overflow-hidden w-[160px]">
                            <button
                                type="button"
                                disabled={store.prep_time_minutes <= 5}
                                onClick={() => store.setField("prep_time_minutes", store.prep_time_minutes - 5)}
                                className="w-12 h-full flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >-</button>
                            <div className="flex-1 text-center font-bold text-slate-900 text-lg">{store.prep_time_minutes}</div>
                            <button
                                type="button"
                                disabled={store.prep_time_minutes >= 120}
                                onClick={() => store.setField("prep_time_minutes", store.prep_time_minutes + 5)}
                                className="w-12 h-full flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >+</button>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Tags</label>
                    <div className="p-2 bg-white border border-slate-200 rounded-xl focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all flex flex-wrap gap-2 items-center min-h-[48px]">
                        {store.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg select-none">
                                {tag}
                                <button type="button" onClick={() => store.removeTag(tag)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagKey}
                            placeholder={store.tags.length < 6 ? "Type label and exact enter..." : "Max 6 tags reached"}
                            disabled={store.tags.length >= 6}
                            className="flex-1 min-w-[120px] bg-transparent outline-none h-8 px-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
                <button
                    onClick={handleNext}
                    className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-95"
                >
                    Next: Category & Pricing →
                </button>
            </div>
        </div>
    );
}
