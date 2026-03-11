"use client";

import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import {
    createVariant,
    addVariantComponent,
    addVariantChoiceGroup,
    addVariantChoiceOption,
    toggleVariantAvailability,
} from "@/app/lib/menuApi";
import {
    Plus,
    X,
    ArrowLeft,
    Rocket,
    Loader2,
    ChevronRight,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ComboStep3Swaps({ onBack }) {
    const store = useCreateComboStore();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [optionInputs, setOptionInputs] = useState({});

    const handleToggleSwap = (comp) => {
        const existingGroup = store.swap_groups.find(g => g.component_tempId === comp.tempId);
        if (existingGroup) {
            store.removeSwapGroup(existingGroup.tempId);
        } else {
            store.addSwapGroup({
                tempId: Date.now().toString(),
                component_tempId: comp.tempId,
                label: `Swap your ${comp.menu_item_name}`,
                options: []
            });
        }
    };

    const handleAddOption = (groupTempId) => {
        const input = optionInputs[groupTempId] || { name: "", price: "" };
        if (!input.name.trim()) return;

        store.addSwapOption(groupTempId, {
            label: input.name.trim(),
            price_modifier_naira: Number(input.price) || 0,
        });

        setOptionInputs(prev => ({
            ...prev,
            [groupTempId]: { name: "", price: "" }
        }));
    };

    const handlePublish = async () => {
        if (!vendorId) {
            toast.error("Vendor session not found.");
            return;
        }

        store.setField("isSubmitting", true);
        const loadingToast = toast.loading("Publishing your combo...");

        try {
            // ── A. Create the base variant ────────────────────────
            const variantRes = await createVariant(vendorId, {
                name: store.name.trim(),
                description: store.description?.trim() || undefined,
                image_url: store.image_url || undefined,
                price: Math.round(Number(store.price_naira) * 100), // naira → kobo
                prep_time_minutes: store.prep_time_minutes || undefined,
                tags: store.tags || [],
            });

            const variantId = variantRes?.variant?._id || variantRes?.variant?.id || variantRes?._id;
            if (!variantId) {
                throw new Error("Combo was created but ID was not returned.");
            }

            // ── B. Add fixed components (one per selected item) ───
            for (let i = 0; i < store.components.length; i++) {
                const comp = store.components[i];
                await addVariantComponent(vendorId, variantId, {
                    component_type: "FIXED",
                    menu_item_id: comp.menu_item_id,
                    quantity: comp.quantity || 1,
                    label: comp.menu_item_name,
                    sort_order: i,
                });
            }

            // ── C + D. Add swap groups and their options ──────────
            if (store.swap_groups && store.swap_groups.length > 0) {
                for (let i = 0; i < store.swap_groups.length; i++) {
                    const swapGroup = store.swap_groups[i];
                    if (swapGroup.options.length === 0) continue;

                    const groupRes = await addVariantChoiceGroup(vendorId, variantId, {
                        name: swapGroup.label,
                        min_selections: 0, // usually optional for swaps
                        max_selections: 1,
                        is_required: false,
                        sort_order: i,
                    });

                    const groupId = groupRes?.group?._id || groupRes?.choiceGroup?._id || groupRes?.id;
                    if (!groupId) continue;

                    // Add options for this swap group
                    for (let j = 0; j < (swapGroup.options || []).length; j++) {
                        const opt = swapGroup.options[j];
                        await addVariantChoiceOption(groupId, {
                            label: opt.label,
                            menu_item_id: opt.menu_item_id || null,
                            price_modifier: Math.round(Number(opt.price_modifier_naira || 0) * 100),
                            is_available: true,
                            sort_order: j,
                        });
                    }
                }
            }

            // ── E. Make the combo available ───────────────────────
            await toggleVariantAvailability(vendorId, variantId, true);

            toast.success("Combo is live on your menu! 🎉", { id: loadingToast });
            store.reset();
            router.push("/vendors/my-foods");

        } catch (error) {
            console.error("Publishing error", error);
            const msg = error?.response?.data?.message || error?.message;
            toast.error(msg || "Something went wrong. Please try again.", {
                id: loadingToast,
            });
        } finally {
            store.setField("isSubmitting", false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Want customers to swap any item?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Optional. Allow customers to swap components (e.g. Chicken for Fish) for a price modifier.</p>
            </div>

            <div className="space-y-6">
                {store.components.map(comp => {
                    const swapGroup = store.swap_groups.find(g => g.component_tempId === comp.tempId);

                    return (
                        <div key={comp.tempId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all">
                            {/* Component Header */}
                            <div className="p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-black text-slate-400 text-[10px]">
                                        {comp.menu_item_image ? (
                                            <img src={comp.menu_item_image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            comp.menu_item_name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{comp.menu_item_name}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Component</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggleSwap(comp)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${swapGroup
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">Allow swaps</span>
                                    {swapGroup ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                            </div>

                            {/* Swap Options Form & List */}
                            {swapGroup && (
                                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/10 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Swap Group Label</label>
                                        <input
                                            type="text"
                                            value={swapGroup.label}
                                            onChange={(e) => store.updateSwapGroup(swapGroup.tempId, { label: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white outline-none focus:border-slate-900"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Added Options</label>
                                        <div className="space-y-2">
                                            {swapGroup.options.map(opt => (
                                                <div key={opt.tempId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group/opt">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{opt.label}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${opt.price_modifier_naira > 0
                                                            ? "bg-orange-100 text-orange-600"
                                                            : opt.price_modifier_naira < 0
                                                                ? "bg-emerald-100 text-emerald-600"
                                                                : "bg-slate-100 text-slate-500"
                                                            }`}>
                                                            {opt.price_modifier_naira > 0 ? `+₦${opt.price_modifier_naira}` : opt.price_modifier_naira < 0 ? `-₦${Math.abs(opt.price_modifier_naira)}` : 'FREE'}
                                                        </span>
                                                        <button
                                                            onClick={() => store.removeSwapOption(swapGroup.tempId, opt.tempId)}
                                                            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                        ><X size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Form to add */}
                                            <div className="flex items-center gap-2 pt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Option name eg. Beef Pattle"
                                                    value={optionInputs[swapGroup.tempId]?.name || ""}
                                                    onChange={(e) => setOptionInputs(prev => ({
                                                        ...prev,
                                                        [swapGroup.tempId]: { ...prev[swapGroup.tempId], name: e.target.value }
                                                    }))}
                                                    className="flex-1 h-10 px-3.5 text-xs font-bold text-slate-900 bg-white dark:bg-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-slate-900"
                                                />
                                                <div className="relative w-24">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">₦</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={optionInputs[swapGroup.tempId]?.price || ""}
                                                        onChange={(e) => setOptionInputs(prev => ({
                                                            ...prev,
                                                            [swapGroup.tempId]: { ...prev[swapGroup.tempId], price: e.target.value }
                                                        }))}
                                                        className="w-full h-10 pl-6 pr-2 text-xs font-black text-slate-900 bg-white dark:bg-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-slate-900"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleAddOption(swapGroup.tempId)}
                                                    disabled={!optionInputs[swapGroup.tempId]?.name?.trim()}
                                                    className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 pt-1 leading-relaxed">
                                                Use negative numbers for cheaper swaps e.g. -200
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                    disabled={store.isSubmitting}
                    onClick={onBack}
                    className="h-14 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all font-black uppercase tracking-widest gap-2 disabled:opacity-30 active:scale-95 text-xs shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    disabled={store.isSubmitting}
                    onClick={handlePublish}
                    className="h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                    {store.isSubmitting ? (
                        <><Loader2 className="animate-spin" size={18} /> Finalizing...</>
                    ) : (
                        <><Rocket size={18} /> Publish Combo</>
                    )}
                </button>
            </div>
        </div>
    );
}
