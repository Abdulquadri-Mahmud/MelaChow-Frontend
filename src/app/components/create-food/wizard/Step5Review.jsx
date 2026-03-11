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
                    dietary_type: store.dietary_type,   // ← was missing
                    prep_time_minutes: store.prep_time_minutes,
                    tags: store.tags,
                },
                // Pass price_naira — the hook converts to kobo internally
                portions: store.portions,
                // Pass price_modifier_naira — the hook converts to kobo internally
                choice_groups: store.choice_groups,
            });

            // Only runs if mutateAsync resolves without throwing
            store.resetForm();
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("gd_create_food_wizard");
            }
            onComplete?.();
            router.push("/vendors/my-foods");

        } catch {
            // Error is already handled and toasted inside useCreateMenuItem
            // Just unblock the submit button
            store.setField("isSubmitting", false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Review & Publish</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Check Everything before making it live for customers.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border text-left border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none transition-colors">
                {/* Header Strip */}
                <div className="bg-slate-900 dark:bg-emerald-500/10 text-white dark:text-emerald-500 p-4 font-black tracking-widest uppercase text-xs flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400 dark:text-emerald-500" strokeWidth={3} /> Review Your Food
                </div>

                {/* 1. Basic Info */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 relative group">
                    <button onClick={() => onSetStep(1)} className="absolute top-4 right-6 text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} strokeWidth={3} /> Edit</button>

                    <div className="flex gap-5 items-start">
                        <div className="w-24 h-24 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                            {store.image_url ? (
                                <img src={store.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={28} className="text-slate-300 dark:text-slate-600" />
                            )}
                        </div>
                        <div className="pr-14 flex-1">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{store.name || "Unnamed Food"}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{store.description || "No description provided."}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-700">{store.item_type}</span>
                                <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-700">{store.prep_time_minutes} mins prep</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Categories */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 relative group">
                    <button onClick={() => onSetStep(2)} className="absolute top-4 right-6 text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} strokeWidth={3} /> Edit</button>

                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Platform Category</span>
                            <span className="font-bold text-slate-900 dark:text-slate-300">{store.platform_category_label || "Not selected"}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Your Menu Section</span>
                            <span className="font-bold text-slate-900 dark:text-slate-300">{store.vendor_section_label || "Other (Default)"}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Portions */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 relative group">
                    <button onClick={() => onSetStep(3)} className="absolute top-4 right-6 text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} strokeWidth={3} /> Edit</button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-4">Sizes & Prices</span>

                    <div className="space-y-3">
                        {store.portions.map(p => (
                            <div key={p.tempId} className={`flex justify-between items-center p-4 rounded-2xl border transition-colors ${p.is_default ? "border-orange-200 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/10 shadow-sm" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900 dark:text-white">{p.label}</span>
                                    {p.is_default && <span className="text-[9px] px-2 py-0.5 bg-orange-500 text-white rounded-md font-black tracking-widest uppercase shadow-[0_2px_8px_-2px_rgba(249,115,22,0.5)]">Default</span>}
                                </div>
                                <span className="font-black text-orange-600 dark:text-orange-400 text-lg">₦{p.price_naira.toLocaleString()}</span>
                            </div>
                        ))}
                        {store.portions.length === 1 && (
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-1">Customers will see this price directly, with no size selector.</p>
                        )}
                    </div>
                </div>

                {/* 4. Add-Ons */}
                {store.choice_groups.length > 0 && (
                    <div className="p-6 md:p-8 relative group border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                        <button onClick={() => onSetStep(4)} className="absolute top-4 right-6 text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} strokeWidth={3} /> Edit</button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-4">Customer Choices (Add-Ons)</span>

                        <div className="space-y-6">
                            {store.choice_groups.map(g => (
                                <div key={g.tempId}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">{g.name}</h4>
                                        {g.is_required && <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded border border-orange-200 dark:border-orange-500/30 uppercase font-black tracking-widest">Required</span>}
                                    </div>
                                    <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                        {g.options.map(o => (
                                            <div key={o.tempId} className="flex items-center justify-between text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-2.5">
                                                    {o.image_url ? (
                                                        <img
                                                            src={o.image_url}
                                                            alt=""
                                                            className="w-7 h-7 rounded-lg object-cover border border-slate-100 dark:border-slate-800"
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                            {o.label.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span>{o.label}</span>
                                                </div>
                                                <span className={`${o.price_modifier_naira > 0 ? "text-orange-600 dark:text-orange-400 font-black" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"}`}>
                                                    {o.price_modifier_naira > 0 ? `+₦${o.price_modifier_naira.toLocaleString()}` : 'FREE'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-5 bg-emerald-50 dark:bg-emerald-500/5 text-center transition-colors">
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={16} strokeWidth={3} /> Ready for production
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-12">
                <button
                    onClick={onBack}
                    disabled={store.isSubmitting}
                    className="h-14 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all font-black uppercase tracking-widest gap-2 disabled:opacity-50 active:scale-95 text-xs"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={handlePublish}
                    disabled={store.isSubmitting}
                    className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_8px_16px_-6px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:active:scale-100"
                >
                    {store.isSubmitting ? (
                        <><Loader2 size={18} className="animate-spin" /> Publishing...</>
                    ) : (
                        "🚀 Publish Food"
                    )}
                </button>
            </div>
        </div>
    );
}
