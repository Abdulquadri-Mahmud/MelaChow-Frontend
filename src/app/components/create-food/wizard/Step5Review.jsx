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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 lg:p-6 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* ── LEFT COLUMN: VISUAL IDENTITY ─────────── */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Final Review</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-base leading-relaxed">
                            One last look! Make sure everything is perfect before your food goes live for customers to order.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden group">
                        <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            {store.image_url ? (
                                <img src={store.image_url} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                    <ImageIcon size={48} strokeWidth={1} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">No Image Provided</span>
                                </div>
                            )}
                            <button 
                                onClick={() => onSetStep(1)}
                                className="absolute top-4 right-4 bg-white/90 backdrop-blur-md dark:bg-slate-900/90 p-3 rounded-2xl text-slate-500 hover:text-orange-500 transition-all active:scale-95"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-orange-500 text-white px-2.5 py-1 rounded-lg">
                                        {store.item_type || "Item"}
                                    </span>
                                    {store.dietary_type && (
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                                            {store.dietary_type}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{store.name || "Unnamed Delicacy"}</h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium line-clamp-3">
                                {store.description || "No description provided for this item yet."}
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                                    <p className="font-bold text-slate-900 dark:text-slate-300 truncate">{store.platform_category_label || "Uncategorized"}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span>
                                    <p className="font-bold text-slate-900 dark:text-slate-300">{store.prep_time_minutes} Minutes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: CONFIGURATION AUDIT ─────────── */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    
                    {/* Portions & Pricing */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Priced Portions</span>
                            <button onClick={() => onSetStep(3)} className="text-[10px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest">Edit</button>
                        </div>
                        <div className="p-6 space-y-3">
                            {store.portions.map(p => (
                                <div key={p.tempId} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        <span className="font-black text-slate-900 dark:text-white text-base">{p.label}</span>
                                        {p.is_default && <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Default</span>}
                                    </div>
                                    <span className="text-xl font-black text-orange-600 dark:text-orange-400">₦{p.price_naira.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Choice Groups */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Add-On Groups ({store.choice_groups.length})</span>
                            <button onClick={() => onSetStep(4)} className="text-[10px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest">Edit</button>
                        </div>
                        <div className="p-6">
                            {store.choice_groups.length === 0 ? (
                                <p className="text-sm font-medium text-slate-400 text-center py-4 italic">No add-ons configured for this item.</p>
                            ) : (
                                <div className="space-y-6">
                                    {store.choice_groups.map(group => (
                                        <div key={group.tempId} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm">{group.name}</h4>
                                                {group.is_required && <span className="text-[9px] font-black uppercase text-orange-500">Required</span>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {group.options.map(opt => (
                                                    <div key={opt.tempId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-3">
                                                            {opt.image_url ? (
                                                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                                                    <img src={opt.image_url} alt={opt.label} className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
                                                                    <ImageIcon size={14} />
                                                                </div>
                                                            )}
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-orange-600">+₦{opt.price_modifier_naira.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-emerald-50 dark:bg-emerald-500/5 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 shrink-0">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Everything looks great!</h4>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Once you publish, this item will immediately appear on your digital menu.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden publish button to be triggered by centralized footer if needed, 
                though Step5Review can stay as is if we want the big confirm button inside too.
                But the user asked for fixed bottom buttons. */}
            <button 
                id="publish-food-btn"
                onClick={handlePublish} 
                className="hidden"
            />
        </div>
    );
}
