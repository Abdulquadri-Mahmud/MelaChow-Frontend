"use client";

import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { useCreateMenuItem } from "@/app/hooks/useMenu";
import { Edit2, ImageIcon, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function Step5Review({ onBack, onComplete, onSetStep }) {
    const store = useCreateFoodStore();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    // ✅ Use the orchestration hook — handles all sequential calls + kobo conversion
    const createMutation = useCreateMenuItem(vendorId);

    const handlePublish = async () => {
        if (!vendorId) {
            toast.error("Vendor session not found. Please log in again.");
            return;
        }

        // Guard: name is required
        if (!store.name?.trim()) {
            toast.error("Please go back to Step 1 and enter a food name.");
            return;
        }

        // Guard: category is required — backend will reject null
        if (!store.platform_category_id) {
            toast.error("Please go back to Step 2 and select a food category.");
            return;
        }

        if (store.portions.length === 0) {
            toast.error("You need at least one portion with a price.");
            return;
        }

        // Diagnostic — confirm store values at publish time
        console.log("[publish] store snapshot:", {
            name: store.name,
            platform_category_id: store.platform_category_id,
            platform_category_label: store.platform_category_label,
            dietary_type: store.dietary_type,
            item_type: store.item_type,
            portions_count: store.portions.length,
            choice_groups_count: store.choice_groups.length,
        });

        store.setField("isSubmitting", true);

        try {
            await createMutation.mutateAsync({
                item: {
                    platform_category_id: store.platform_category_id,
                    vendor_section_id: store.vendor_section_id,
                    name: store.name,
                    description: store.description,
                    image_url: store.image_url,
                    item_type: store.item_type,
                    dietary_type: store.dietary_type,
                    prep_time_minutes: store.prep_time_minutes,
                    tags: store.tags,
                },
                // Pass price_naira — the hook converts to kobo internally
                portions: store.portions,
                // Pass price_modifier_naira — the hook converts to kobo internally
                choice_groups: store.choice_groups,
            });

            // Only runs if mutateAsync resolves without throwing
            onComplete?.();

        } catch {
            // Error is already handled and toasted inside useCreateMenuItem
            // Just unblock the submit button
            store.setField("isSubmitting", false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 md:p-6 pb-20 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ── LEFT COLUMN: VISUAL IDENTITY ─────────── */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Ready to go live?</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed">Double check everything looks right before you publish this dish to your menu.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                        <div className="relative aspect-video w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
                            {store.image_url ? (
                                <img src={store.image_url} alt={store.name} className="w-full h-full object-cover grayscale opacity-80" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                    <ImageIcon size={32} strokeWidth={1} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">Photo not added yet</span>
                                </div>
                            )}
                            <button 
                                onClick={() => onSetStep(1)}
                                className="absolute top-4 right-4 bg-white/90 dark:bg-slate-950/90 p-2 rounded-md text-slate-500 hover:text-orange-600 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-orange-600 text-white px-2.5 py-1 rounded-md">
                                        {store.item_type || "Item"}
                                    </span>
                                    {store.dietary_type && (
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-600 text-white px-2.5 py-1 rounded-md">
                                            {store.dietary_type}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{store.name || "Dish name missing"}</h3>
                            </div>

                            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed line-clamp-3">
                                {store.description || "No description added."}
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest truncate">{store.platform_category_label || "NOT SELECTED"}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">{store.prep_time_minutes} MINUTES</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: CONFIGURATION AUDIT ─────────── */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    
                    {/* Portions & Pricing */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sizes & Prices</span>
                            <button onClick={() => onSetStep(3)} className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest transition-colors">Edit</button>
                        </div>
                        <div className="p-3 space-y-1">
                            {store.portions.map(p => (
                                <div key={p.tempId} className="flex items-center justify-between p-4 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                                        <span className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-widest">{p.label}</span>
                                        {p.is_default && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-600/10 px-2 py-0.5 rounded-md">Default</span>}
                                    </div>
                                    <span className="text-[13px] font-black text-orange-600 tabular-nums">₦{p.price_naira.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Choice Groups */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Add-on Options ({store.choice_groups.length})</span>
                            <button onClick={() => onSetStep(4)} className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest transition-colors">Edit</button>
                        </div>
                        <div className="p-4 space-y-6">
                            {store.choice_groups.length === 0 ? (
                                <p className="text-[10px] font-bold text-slate-400 text-center py-4 uppercase tracking-[0.15em]">No supplementary interactions configured.</p>
                            ) : (
                                <div className="space-y-6">
                                    {store.choice_groups.map(group => (
                                        <div key={group.tempId} className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <h4 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">{group.name}</h4>
                                                {group.is_required && <span className="text-[8px] font-black uppercase text-orange-600">Required</span>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {group.options.map(opt => (
                                                    <div key={opt.tempId} className="flex items-center justify-between p-3 rounded-md bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                                {opt.image_url ? (
                                                                    <img src={opt.image_url} alt={opt.label} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ImageIcon size={12} className="text-slate-300 dark:text-slate-700" />
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest truncate">{opt.label}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-orange-600 tabular-nums">+₦{opt.price_modifier_naira.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 md:p-8 bg-emerald-600 dark:bg-emerald-600 rounded-md border border-emerald-600 flex items-center gap-6 shadow-xl shadow-emerald-600/10">
                        <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-md uppercase tracking-widest">Looking Good!</h4>
                            <p className="text-[10px] font-black text-emerald-50 uppercase tracking-widest mt-0.5 opacity-80">Click the button below to add this dish to your menu!</p>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                id="publish-food-btn"
                onClick={handlePublish} 
                className="hidden"
            />
        </div>
    );
}
