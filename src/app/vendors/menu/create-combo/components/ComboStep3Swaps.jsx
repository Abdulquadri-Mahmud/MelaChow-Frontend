"use client";

import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import {
    Plus,
    X,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
    RotateCcw, // Added RotateCcw as it's used in JSX
    Info // Added Info as it's used in JSX
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComboStep3Swaps({ onBack }) {
    const store = useCreateComboStore();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [activeCompId, setActiveCompId] = useState(store.components[0]?.tempId);
    const activeComp = store.components.find(c => c.tempId === activeCompId) || store.components[0];
    const activeGroup = store.swap_groups.find(g => g.component_tempId === activeCompId);

    // Added optionInputs state as it's used in handleAddOption and JSX
    const [optionInputs, setOptionInputs] = useState({});

    const handleToggleSwap = (comp) => {
        const existingGroup = store.swap_groups.find(g => g.component_tempId === comp.tempId);
        if (existingGroup) {
            store.removeSwapGroup(existingGroup.tempId);
        } else {
            store.addSwapGroup({
                tempId: Date.now().toString(),
                component_tempId: comp.tempId,
                label: `Swap ${comp.menu_item_name}`,
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-3 lg:p-6 pb-20">
            {/* ── SWAP EDUCATION BANNER ─────────────────────────── */}
            <div className="p-5 rounded-[1.5rem] bg-orange-50 dark:bg-orange-500/10
                            border border-orange-100 dark:border-orange-500/20
                            flex gap-4 items-start mb-10">
                <span className="text-2xl shrink-0 mt-0.5">🔄</span>
                <div className="space-y-1.5">
                    <p className="text-sm font-black text-orange-800 dark:text-orange-400
                                  tracking-tight">
                        What are swaps?
                    </p>
                    <p className="text-[13px] text-orange-700/80 dark:text-orange-400/70
                                  font-medium leading-relaxed">
                        Swaps let customers personalise your combo without you
                        rebuilding it from scratch. A combo is a fixed bundle —
                        but customers always have preferences. Someone ordering
                        your Family Meal might want Jollof instead of Fried Rice,
                        or Fish instead of Chicken.
                    </p>
                    <p className="text-[13px] text-orange-700/80 dark:text-orange-400/70
                                  font-medium leading-relaxed">
                        Define the allowed swaps here once. Customers pick at
                        checkout — your combo stays as one clean product on the menu.
                    </p>
                    <p className="text-[11px] font-black text-orange-500/70
                                  dark:text-orange-500/50 uppercase tracking-widest mt-2">
                        Optional — skip this step if your combo has no swaps
                    </p>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">
                    Swap Configuration
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    Give customers flexibility. Toggle which items can be swapped and set price modifiers.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* LEFT: COMPONENT LIST */}
                <div className="lg:col-span-4 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">
                        Select Component
                    </label>
                    <div className="space-y-3">
                        {store.components.map(comp => {
                            const isSwappable = store.swap_groups.some(g => g.component_tempId === comp.tempId);
                            const isActive = activeCompId === comp.tempId;

                            return (
                                <button
                                    key={comp.tempId}
                                    onClick={() => setActiveCompId(comp.tempId)}
                                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group ${
                                        isActive 
                                            ? "bg-white dark:bg-zinc-900 border-orange-500 shadow-lg shadow-orange-500/5 translate-x-1" 
                                            : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900"
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden shadow-inner">
                                        {comp.menu_item_image ? (
                                            <img src={comp.menu_item_image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-zinc-400 text-xs">
                                                {comp.menu_item_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold text-sm truncate tracking-tight transition-colors ${isActive ? "text-orange-600 dark:text-orange-400" : "text-zinc-900 dark:text-white"}`}>
                                            {comp.menu_item_name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {isSwappable ? (
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    Swappable
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Fixed</span>
                                            )}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <ChevronRight size={16} className="text-orange-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: CONFIGURATION WORKSPACE */}
                <div className="lg:col-span-8">
                    {activeComp ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                            {/* Workspace Header */}
                            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/30 dark:bg-zinc-950/20">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1 h-1 rounded-full bg-orange-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Swap Hub</p>
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                        {activeComp.menu_item_name}
                                    </h3>
                                </div>

                                <button
                                    onClick={() => handleToggleSwap(activeComp)}
                                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                                        activeGroup
                                            ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    }`}
                                >
                                    {activeGroup ? (
                                        <><ToggleRight size={22} className="stroke-[2.5px]" /> Enabled</>
                                    ) : (
                                        <><ToggleLeft size={22} className="stroke-[2.5px]" /> Disabled</>
                                    )}
                                </button>
                            </div>

                            {/* Configuration Body */}
                            <div className="p-8">
                                {activeGroup ? (
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-300">
                                                Customer Choice Label
                                            </label>
                                            <input
                                                type="text"
                                                value={activeGroup.label}
                                                placeholder="e.g. Choose your Protein swap"
                                                onChange={(e) => store.updateSwapGroup(activeGroup.tempId, { label: e.target.value })}
                                                className="w-full h-14 px-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 transition-all font-bold text-zinc-900 dark:text-white outline-none"
                                            />
                                            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 px-1">
                                                This is the heading customers will see in the ordering flow.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-300">
                                                Swap Options
                                            </label>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                                {activeGroup.options.length > 0 ? (
                                                    activeGroup.options.map(opt => (
                                                        <div key={opt.tempId} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl group/opt animate-in slide-in-from-top-2">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{opt.label}</p>
                                                                <p className={`text-[10px] font-black mt-0.5 ${
                                                                    opt.price_modifier_naira > 0 ? "text-orange-500" : opt.price_modifier_naira < 0 ? "text-emerald-500" : "text-zinc-400"
                                                                }`}>
                                                                    {opt.price_modifier_naira > 0 ? `+₦${opt.price_modifier_naira.toLocaleString()}` : opt.price_modifier_naira < 0 ? `-₦${Math.abs(opt.price_modifier_naira).toLocaleString()}` : 'FREE SWAP'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => store.removeSwapOption(activeGroup.tempId, opt.tempId)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                                            ><X size={14} strokeWidth={3} /></button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="md:col-span-2 p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem] text-center">
                                                        <p className="text-xs font-bold text-zinc-400">No swap options added yet.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add Form */}
                                            <div className="bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Add Alternative Option</p>
                                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                                    <div className="flex-1 w-full relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Alternative name (e.g. Beef Steak)"
                                                            value={optionInputs[activeGroup.tempId]?.name || ""}
                                                            onChange={(e) => setOptionInputs(prev => ({
                                                                ...prev,
                                                                [activeGroup.tempId]: { ...prev[activeGroup.tempId], name: e.target.value }
                                                            }))}
                                                            className="w-full h-12 px-4 text-xs font-bold text-zinc-900 bg-white dark:bg-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:border-orange-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="w-full sm:w-32 relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 pointer-events-none">₦</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={optionInputs[activeGroup.tempId]?.price || ""}
                                                            onChange={(e) => setOptionInputs(prev => ({
                                                                ...prev,
                                                                [activeGroup.tempId]: { ...prev[activeGroup.tempId], price: e.target.value }
                                                            }))}
                                                            className="w-full h-12 pl-7 pr-3 text-xs font-black text-zinc-900 bg-white dark:bg-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:border-orange-500 transition-all"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddOption(activeGroup.tempId)}
                                                        disabled={!optionInputs[activeGroup.tempId]?.name?.trim()}
                                                        className="w-full sm:w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 shadow-lg shadow-orange-500/20 active:scale-95 shrink-0"
                                                    >
                                                        <Plus size={20} strokeWidth={3} />
                                                    </button>
                                                </div>
                                                <p className="mt-3 text-[9px] font-bold text-zinc-400 flex items-center gap-2">
                                                    <Info size={10} />
                                                    Use negative modifiers (e.g. -200) if the alternative is cheaper than the original.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-300 dark:text-zinc-700 border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                            <RotateCcw size={32} />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-zinc-900 dark:text-white tracking-tight">Fixed Component</p>
                                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 max-w-[250px] mx-auto leading-relaxed">
                                                This item is currently locked. Toggle <strong>"Allow Swaps"</strong> to enable custom alternatives.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
                            <p className="text-sm font-bold text-zinc-400">Select an item on the left to configure swaps.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
