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
    { label: "Portion", hint: "e.g. ₦1,000–₦2,500" },
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 md:p-6 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                
                {/* ── LEFT COLUMN: PRICING STRATEGY ─────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Prices & Sizes</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed">Add the different sizes or portions you offer and set a price for each.</p>
                    </div>

                    {!showForm && (
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Quick Suggestions</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                                {PRESETS.map(p => {
                                    const exists = store.portions.some(existing => existing.label.toLowerCase() === p.label.toLowerCase());
                                    return (
                                        <button
                                            key={p.label}
                                            onClick={() => handlePreset(p)}
                                            disabled={exists}
                                            className={`group flex flex-col justify-center p-3 rounded-md border transition-all active:scale-95 text-left h-12 ${exists 
                                                ? "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-20 grayscale cursor-not-allowed" 
                                                : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-orange-600 focus:border-orange-600"}`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className={`font-black text-[10px] uppercase tracking-widest ${exists ? "text-slate-400" : "text-slate-900 dark:text-white group-hover:text-orange-600"}`}>{p.label}</span>
                                                {!exists && <Plus size={10} className="text-slate-300 group-hover:text-orange-600 transition-colors" strokeWidth={4} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!showForm && store.portions.length > 0 && (
                        <div className="p-4 bg-orange-600 text-white rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <Check size={14} strokeWidth={4} />
                                <span className="font-black text-[10px] uppercase tracking-widest">Prices Added</span>
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed opacity-90">
                                You've added {store.portions.length} price(s). Make sure the main one is selected.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN: PORTIONS & FORM ─────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {/* FORM UI */}
                    {showForm ? (
                        <div className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-none animate-in zoom-in-95 duration-300">
                            <div className="bg-slate-900 dark:bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                                <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">
                                    {tempId ? "Save Changes" : "Add a New Size/Price"}
                                </span>
                                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Size or Portion Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={label}
                                            onChange={e => setLabel(e.target.value)}
                                            placeholder="e.g. Regular, Large, Full Pack..."
                                            className="w-full h-12 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Price (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300">₦</span>
                                            <input
                                                type="number"
                                                value={priceNaira}
                                                onChange={e => setPriceNaira(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-12 pl-10 pr-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm tabular-nums focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    {/* Max Qty */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Order Limit (Optional)</label>
                                        <input
                                            type="number"
                                            value={maxQty}
                                            onChange={e => setMaxQty(e.target.value)}
                                            placeholder="How many can one customer order?"
                                            className="w-full h-12 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all"
                                        />
                                    </div>

                                    {/* Default Switch */}
                                    <div className="md:pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsDefault(!isDefault)}
                                            className={`w-full h-12 flex items-center justify-between px-4 rounded-md border transition-all ${isDefault ? "bg-orange-600 border-transparent" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800"}`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDefault ? "text-white" : "text-slate-400"}`}>Is this the main size?</span>
                                            <div className={`w-8 h-4 rounded-md flex items-center px-1 transition-all ${isDefault ? "bg-white/30 justify-end" : "bg-slate-100 dark:bg-slate-900 justify-start"}`}>
                                                <div className={`w-2.5 h-2.5 rounded-sm ${isDefault ? "bg-white" : "bg-slate-300 dark:bg-slate-700"}`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <button onClick={handleSave} className="order-1 sm:order-2 flex-1 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md font-black uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all">
                                        {tempId ? "Save Size" : "Add Size"}
                                    </button>
                                    <button onClick={() => setShowForm(false)} className="order-2 sm:order-1 px-8 h-12 rounded-md font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 transition-all">Discard</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* LIST UI */
                        <div className="space-y-4">
                            {store.portions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-6">
                                    <div className="w-16 h-16 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                                        <Plus size={32} strokeWidth={1} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No prices added yet</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">You need to add at least one price to continue.</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenForm()}
                                        className="h-10 px-8 bg-orange-600 text-white font-black uppercase tracking-widest text-[10px] rounded-md transition-all active:scale-95 shadow-none"
                                    >
                                        Add Your First Price
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Added Sizes ({store.portions.length})</h3>
                                        <button onClick={() => handleOpenForm()} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors bg-orange-600/10 px-3 py-1 rounded-md border border-orange-600/10">+ Add Size</button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {store.portions.map((p, idx) => (
                                            <div key={p.tempId} className={`group flex items-center gap-4 p-4 rounded-md border transition-all ${p.is_default ? "bg-white dark:bg-slate-950 border-orange-600" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800"}`}>
                                                <div className={`shrink-0 w-10 h-10 rounded-md flex items-center justify-center font-black text-xs ${p.is_default ? "bg-orange-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"}`}>
                                                    {p.is_default ? "★" : idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5 truncate">
                                                        <span className="font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-widest truncate">{p.label}</span>
                                                        {p.is_default && <span className="bg-orange-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Main</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">₦{fmt(p.price_naira)}</span>
                                                        {p.max_quantity && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l border-slate-100 dark:border-slate-800">LIMIT: {p.max_quantity}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => handleOpenForm(p)} className="w-8 h-8 rounded-md bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all"><Edit2 size={12} /></button>
                                                    <button onClick={() => handleDelete(p.tempId)} className="w-8 h-8 rounded-md bg-white dark:bg-slate-900 text-slate-400 hover:text-red-600 border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all"><Trash2 size={12} /></button>
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
