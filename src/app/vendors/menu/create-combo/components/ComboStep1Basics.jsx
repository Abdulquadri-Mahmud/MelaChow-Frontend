"use client";

import { useState } from "react";
import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
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

export default function ComboStep1Basics({ onNext }) {
    const store = useCreateComboStore();
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadToCloudinary(file);
        setUploading(false);

        if (url) {
            store.setField("image_url", url);
        } else {
            toast.error("Photo couldn't upload. Moving on...");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-3 lg:p-6">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                    Combo Identity
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Let's build your bundle's identity. Give it a name and a competitive price.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* LEFT COLUMN: IDENTITY & PRICING */}
                <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">Combo Name <span className="text-rose-500">*</span></label>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${store.name.length >= 2 ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>{store.name.length}/80</span>
                        </div>
                        <input
                            type="text"
                            value={store.name}
                            onChange={(e) => store.setField("name", e.target.value.substring(0, 80))}
                            placeholder="e.g. Student Meal Box, Family Weekend Deal"
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
                            placeholder="Tell customers what's inside. e.g. 1 Jollof Rice + 1 Chicken + 35cl Coke."
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-medium text-slate-900 dark:text-white text-base min-h-[160px] resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                    </div>

                    {/* Price */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Bundle Price <span className="text-rose-500">*</span></label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 tracking-tighter transition-colors group-focus-within:text-orange-500">₦</div>
                            <input
                                type="number"
                                value={store.price_naira}
                                onChange={(e) => store.setField("price_naira", e.target.value)}
                                placeholder="0.00"
                                className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-black text-slate-900 dark:text-white text-xl outline-none"
                            />
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-500/5 rounded-xl border border-orange-100 dark:border-orange-500/10">
                            <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 leading-relaxed flex gap-2">
                                <span className="shrink-0 text-base">💡</span>
                                Merchants who price combos 10-15% lower than individual items see significantly higher order volumes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: MEDIA */}
                <div className="space-y-6">
                    {/* Photo */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block mb-1">Combo Photo</label>
                        <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors overflow-hidden group h-[300px]">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-10">
                                {uploading ? (
                                    <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
                                ) : store.image_url ? (
                                    <img src={store.image_url} alt="Combo" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-2 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <ImageIcon size={28} />
                                    </div>
                                )}

                                {!store.image_url && !uploading && (
                                    <>
                                        <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">Primary Combo Visual <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">(optional)</span></p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tap or drag a high-res JPG/PNG here.</p>
                                    </>
                                )}
                            </div>
                            {store.image_url && !uploading && (
                                <div className="absolute top-4 right-4 z-20">
                                    <button
                                        onClick={(e) => { e.preventDefault(); store.setField("image_url", null) }}
                                        className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-slate-200 dark:border-slate-800 shadow-lg"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

