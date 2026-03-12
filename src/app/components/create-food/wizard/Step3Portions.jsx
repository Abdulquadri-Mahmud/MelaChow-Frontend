"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Trash2, X, ArrowLeft, Check, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

// Portion size presets — label + suggested price anchor in naira
const PRESETS = [
    { label: "Small", hint: "e.g. ₦500–₦1,500" },
    { label: "Medium", hint: "e.g. ₦1,500–₦3,000" },
    { label: "Large", hint: "e.g. ₦3,000–₦5,000" },
    { label: "1 Portion", hint: "e.g. ₦1,000–₦2,500" },
    { label: "Per Piece", hint: "e.g. ₦200–₦500" },
    { label: "Full Wrap", hint: "e.g. ₦2,000–₦4,000" },
];

export default function Step3Portions({ onBack, onNext, onDeletePortion }) {
    const store = useCreateFoodStore();
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [tempId, setTempId] = useState(null);
    const [label, setLabel] = useState("");
    const [priceNaira, setPriceNaira] = useState("");
    const [maxQty, setMaxQty] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const handleOpenForm = (existing = null) => {
        if (existing) {
            setTempId(existing.tempId);
            setLabel(existing.label);
            setPriceNaira(existing.price_naira.toString());
            setMaxQty(existing.max_quantity?.toString() || "");
            setIsDefault(existing.is_default);
        } else {
            setTempId(null);
            setLabel("");
            setPriceNaira("");
            setMaxQty("");
            setIsDefault(store.portions.length === 0);
        }
        setShowForm(true);
    };

    const handlePreset = (preset) => {
        setTempId(null);
        setLabel(preset.label);
        setPriceNaira("");
        setMaxQty("");
        setIsDefault(store.portions.length === 0);
        setShowForm(true);
    };

    const handleSave = () => {
        if (!label.trim()) {
            toast.error("Give this portion a name");
            return;
        }
        const priceNum = Number(priceNaira.replace(/,/g, ""));
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Enter a valid price greater than ₦0");
            return;
        }

        const draft = {
            tempId: tempId || Date.now().toString(),
            label: label.trim(),
            price_naira: priceNum,
            max_quantity: maxQty ? Number(maxQty) : null,
            is_default: isDefault,
            sort_order: store.portions.length,
        };

        if (tempId) {
            store.updatePortion(tempId, draft);
        } else {
            store.addPortion(draft);
        }

        if (isDefault) store.setDefaultPortion(draft.tempId);
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        if (store.portions.length === 1) {
            toast.error("You need at least one portion");
            return;
        }
        if (onDeletePortion) {
            // Edit mode — fire real API delete first, then remove from store
            await onDeletePortion(id);
        } else {
            // Create mode — only stored locally, not persisted yet
            store.removePortion(id);
        }
    };

    const handleNext = () => {
        if (store.portions.length === 0) {
            toast.error("Add at least one price before continuing");
            return;
        }
        onNext();
    };

    // Format price display with commas
    const fmt = (n) => Number(n).toLocaleString("en-NG");

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* ── LEFT COLUMN: PRICING STRATEGY ─────────── */}
                <div className="lg:col-span-4 space-y-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Set your price</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-base leading-relaxed">
                            Define how much customers will pay. You can add multiple sizes (e.g. Small, Large) with different prices.
                        </p>
                    </div>

                    {!showForm && (
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Quick Presets</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {PRESETS.map(p => {
                                    const exists = store.portions.some(existing => existing.label.toLowerCase() === p.label.toLowerCase());
                                    return (
                                        <button
                                            key={p.label}
                                            onClick={() => handlePreset(p)}
                                            disabled={exists}
                                            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 text-left ${exists 
                                                ? "bg-slate-50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800 opacity-50 grayscale cursor-not-allowed" 
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5"}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`font-black text-sm tracking-tight ${exists ? "text-slate-400" : "text-slate-900 dark:text-white group-hover:text-orange-500"}`}>{p.label}</span>
                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{p.hint}</span>
                                            </div>
                                            {!exists && <Plus size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!showForm && store.portions.length > 0 && (
                        <div className="p-5 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 rounded-3xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                    <Check size={16} strokeWidth={3} />
                                </div>
                                <span className="font-black text-slate-900 dark:text-white text-sm">Pricing Active</span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                You have {store.portions.length} active pricing {store.portions.length === 1 ? "option" : "options"}. Make sure to set a default for the best customer experience.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN: PORTIONS & FORM ─────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {/* FORM UI */}
                    {showForm ? (
                        <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-in zoom-in-95 duration-500">
                            <div className="bg-slate-900 dark:bg-slate-800 px-8 py-5 flex items-center justify-between">
                                <span className="text-white font-black uppercase tracking-[0.2em] text-[12px]">
                                    {tempId ? "Update Pricing Details" : "Create New Price Point"}
                                </span>
                                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-8 lg:p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Name */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Portion Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={label}
                                            onChange={e => setLabel(e.target.value)}
                                            placeholder="Small, Medium, Large..."
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-lg placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Price (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₦</span>
                                            <input
                                                type="number"
                                                value={priceNaira}
                                                onChange={e => setPriceNaira(e.target.value)}
                                                placeholder="0"
                                                className="w-full h-14 pl-12 pr-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-black text-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    {/* Max Qty */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Max Order Per Customer (Optional)</label>
                                        <input
                                            type="number"
                                            value={maxQty}
                                            onChange={e => setMaxQty(e.target.value)}
                                            placeholder="No limit"
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-lg placeholder:font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>

                                    {/* Default Switch */}
                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsDefault(!isDefault)}
                                            className={`w-full h-14 flex items-center justify-between px-6 rounded-2xl border transition-all ${isDefault ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}
                                        >
                                            <span className={`text-xs font-black uppercase tracking-widest ${isDefault ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>Default Selection</span>
                                            <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-all ${isDefault ? "bg-white/30 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"}`}>
                                                <div className={`w-3 h-3 rounded-full ${isDefault ? "bg-white" : "bg-white dark:bg-slate-500"} shadow-sm`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button onClick={() => setShowForm(false)} className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
                                    <button onClick={handleSave} className="flex-1 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all">
                                        {tempId ? "Update Price Point" : "Add Price Point"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* LIST UI */
                        <div className="space-y-4">
                            {store.portions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-16 bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-sm">
                                        <Plus size={40} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">Price List Empty</p>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Add at least one price to continue.</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenForm()}
                                        className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                    >
                                        + Add Your First Price
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Active Portions ({store.portions.length})</h3>
                                        <button onClick={() => handleOpenForm()} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600">+ Add Another</button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {store.portions.map((p, idx) => (
                                            <div key={p.tempId} className={`group flex items-center gap-6 p-6 rounded-[2rem] border transition-all ${p.is_default ? "bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20 ring-1 ring-orange-500/10" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${p.is_default ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                                                    {p.is_default ? "★" : idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{p.label}</span>
                                                        {p.is_default && <span className="bg-orange-500/10 text-orange-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-orange-500/10">Default</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl font-black text-slate-900 dark:text-white">₦{fmt(p.price_naira)}</span>
                                                        {p.max_quantity && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 dark:border-slate-800 pl-3">Limit {p.max_quantity}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleOpenForm(p)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 flex items-center justify-center transition-all"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(p.tempId)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}