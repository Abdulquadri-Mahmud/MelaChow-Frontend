"use client";

import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { createMenuItem, addPortion, addChoiceGroup, addChoiceOption } from "@/app/lib/menuApi";
import { Edit2, ImageIcon, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function Step5Review({ onBack, onComplete, onSetStep }) {
    const store = useCreateFoodStore();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const handlePublish = async () => {
        if (!vendorId) {
            toast.error("Vendor session not found. Please log in again.");
            return;
        }

        store.setField("isSubmitting", true);
        const loadingToast = toast.loading("Creating your food...");

        try {
            // 1. Create Base Item
            const itemPayload = {
                platform_category_id: store.platform_category_id,
                vendor_section_id: store.vendor_section_id,
                name: store.name.trim(),
                description: store.description.trim() || undefined,
                image_url: store.image_url || undefined,
                item_type: store.item_type,
                prep_time_minutes: store.prep_time_minutes,
                tags: store.tags,
            };

            const itemRes = await createMenuItem(vendorId, itemPayload);
            const itemId = itemRes.data?._id || itemRes.data?.id;

            if (!itemId) throw new Error("Could not retrieve created food ID");

            // 2. Create Portions (Sequentially)
            for (const p of store.portions) {
                const portionPayload = {
                    label: p.label,
                    price: p.price_naira * 100, // Convert to kobo
                    is_default: p.is_default,
                    max_quantity: p.max_quantity || null,
                    sort_order: p.sort_order,
                };
                await addPortion(vendorId, itemId, portionPayload);
            }

            // 3 & 4. Create Choice Groups & Options
            for (const g of store.choice_groups) {
                const groupPayload = {
                    name: g.name,
                    min_selections: g.min_selections,
                    max_selections: g.max_selections,
                    is_required: g.is_required,
                    sort_order: g.sort_order,
                };

                const groupRes = await addChoiceGroup(vendorId, itemId, groupPayload);
                const groupId = groupRes.data?._id || groupRes.data?.id;

                if (!groupId) continue;

                for (const o of g.options) {
                    const optPayload = {
                        label: o.label,
                        price_modifier: o.price_modifier_naira * 100, // Convert to kobo
                        is_available: o.is_available,
                        sort_order: o.sort_order,
                    };
                    await addChoiceOption(groupId, optPayload);
                }
            }

            // Success
            toast.success("Food is live on your menu!", { id: loadingToast });
            store.resetForm();
            onComplete?.();
            router.push("/vendors/my-foods");

        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Something went wrong. Your work is saved, please try again.", { id: loadingToast });
            store.setField("isSubmitting", false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Review & Publish</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Check Everything before making it live for customers.</p>
            </div>

            <div className="bg-white border text-left border-slate-200 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200/50">
                {/* Header Strip */}
                <div className="bg-slate-900 text-white p-4 font-black tracking-widest uppercase text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Review Your Food
                </div>

                {/* 1. Basic Info */}
                <div className="p-6 border-b border-slate-100 relative group">
                    <button onClick={() => onSetStep(1)} className="absolute top-4 right-4 text-slate-300 hover:text-orange-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} /> Edit</button>

                    <div className="flex gap-4 items-start">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {store.image_url ? (
                                <img src={store.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={24} className="text-slate-300" />
                            )}
                        </div>
                        <div className="pr-12">
                            <h3 className="text-xl font-black text-slate-900">{store.name || "Unnamed Food"}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{store.description || "No description provided."}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 font-black uppercase tracking-widest rounded-full">{store.item_type}</span>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 font-black uppercase tracking-widest rounded-full">{store.prep_time_minutes} mins prep</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Categories */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative group">
                    <button onClick={() => onSetStep(2)} className="absolute top-4 right-4 text-slate-300 hover:text-orange-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} /> Edit</button>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Platform Category</span>
                            <span className="font-bold text-slate-700">{store.platform_category_label || "Not selected"}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Your Menu Section</span>
                            <span className="font-bold text-slate-700">{store.vendor_section_label || "Other (Default)"}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Portions */}
                <div className="p-6 border-b border-slate-100 relative group">
                    <button onClick={() => onSetStep(3)} className="absolute top-4 right-4 text-slate-300 hover:text-orange-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} /> Edit</button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Sizes & Prices</span>

                    <div className="space-y-2">
                        {store.portions.map(p => (
                            <div key={p.tempId} className={`flex justify-between items-center p-3 rounded-xl border ${p.is_default ? "border-orange-200 bg-orange-50/50" : "border-slate-100 bg-white"}`}>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{p.label}</span>
                                    {p.is_default && <span className="text-[9px] px-1.5 bg-orange-500 text-white rounded font-bold tracking-wider uppercase">Default</span>}
                                </div>
                                <span className="font-black text-slate-900">₦{p.price_naira.toLocaleString()}</span>
                            </div>
                        ))}
                        {store.portions.length === 1 && (
                            <p className="text-xs text-slate-400 font-medium italic pt-1">Customers will see this price directly, with no size selector.</p>
                        )}
                    </div>
                </div>

                {/* 4. Add-Ons */}
                {store.choice_groups.length > 0 && (
                    <div className="p-6 relative group border-b border-slate-100">
                        <button onClick={() => onSetStep(4)} className="absolute top-4 right-4 text-slate-300 hover:text-orange-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Edit2 size={12} /> Edit</button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Customer Choices (Add-Ons)</span>

                        <div className="space-y-4">
                            {store.choice_groups.map(g => (
                                <div key={g.tempId}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h4 className="font-black text-slate-700 text-sm">{g.name}</h4>
                                        {g.is_required && <span className="text-[8px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded uppercase font-black tracking-widest">Required</span>}
                                    </div>
                                    <div className="space-y-1 pl-4 border-l-2 border-slate-100">
                                        {g.options.map(o => (
                                            <div key={o.tempId} className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>{o.label}</span>
                                                <span>{o.price_modifier_naira > 0 ? `+₦${o.price_modifier_naira}` : 'FREE'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-4 bg-slate-50 text-center">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} /> Ready for production
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <button
                    onClick={onBack}
                    disabled={store.isSubmitting}
                    className="h-12 px-6 flex items-center py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all font-bold gap-2 disabled:opacity-50"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={handlePublish}
                    disabled={store.isSubmitting}
                    className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-colors shadow-lg active:scale-95 flex items-center gap-2 shadow-orange-500/20 disabled:opacity-50"
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
