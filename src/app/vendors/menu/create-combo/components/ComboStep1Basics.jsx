"use client";

import { useState } from "react";
import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
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

export default function ComboStep1Basics({ onNext }) {
    const store = useCreateComboStore();
    const [uploading, setUploading] = useState(false);

    const handleNext = () => {
        if (!store.name.trim() || store.name.length < 2) {
            toast.error("Please enter a combo name (min 2 characters)");
            return;
        }
        if (!store.price_naira || Number(store.price_naira) <= 0) {
            toast.error("Please enter a valid combo price");
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
            toast.error("Photo couldn't upload. Moving on...");
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Combo Details</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Bundle your best-selling items into a single deal. Give it a name and a catchy photo.</p>
            </div>

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
                        className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-bold text-slate-900 dark:text-white text-lg placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
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
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-medium text-slate-900 dark:text-white text-base min-h-[120px] resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                    />
                </div>

                {/* Photo */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block mb-1">Combo Photo</label>
                    <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-900 transition-colors overflow-hidden group h-[200px]">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
                            {uploading ? (
                                <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
                            ) : store.image_url ? (
                                <img src={store.image_url} alt="Combo" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center mb-2 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-all duration-300">
                                    <ImageIcon size={24} />
                                </div>
                            )}

                            {!store.image_url && !uploading && (
                                <>
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Add a photo <span className="text-slate-400 font-medium">(optional)</span></p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tap to upload</p>
                                </>
                            )}
                        </div>
                        {store.image_url && !uploading && (
                            <div className="absolute top-3 right-3 z-20">
                                <button
                                    onClick={(e) => { e.preventDefault(); store.setField("image_url", null) }}
                                    className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-rose-500 transition-all border border-slate-200 dark:border-slate-800"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest block">Combo Price <span className="text-rose-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 tracking-tighter">₦</span>
                        <input
                            type="number"
                            value={store.price_naira}
                            onChange={(e) => store.setField("price_naira", e.target.value)}
                            placeholder="0.00"
                            className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-black text-slate-900 dark:text-white text-xl outline-none"
                        />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed px-1">
                        Set a price that's lower than buying items separately — customers can see the saving.
                    </p>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                    onClick={handleNext}
                    className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    Next Step <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
            </div>
        </div>
    );
}
