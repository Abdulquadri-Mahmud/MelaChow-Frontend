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
        <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ── PAGE HEADER ─────────────────────────────────────── */}
            <div className="pb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Set your price
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1.5 leading-relaxed">
                    One price, or different sizes at different prices — your choice.
                </p>
            </div>

            {/* ── FORM ─────────────────────────────────────────────── */}
            {showForm && (
                <div className="mb-6 rounded-[1.75rem] overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300/30 dark:shadow-none">

                    {/* Form header stripe */}
                    <div className="bg-slate-900 dark:bg-slate-800 px-6 py-4 flex items-center justify-between">
                        <span className="text-white font-black uppercase tracking-[0.15em] text-[11px]">
                            {tempId ? "Edit Portion" : "New Portion"}
                        </span>
                        <button
                            onClick={() => setShowForm(false)}
                            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">

                        {/* Portion name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                                Portion Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="e.g. Small, Full Plate, 1 Wrap"
                                className="w-full h-13 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-400/10 transition-all"
                            />
                        </div>

                        {/* Price — hero field, gets the most visual weight */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                                Price <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                {/* Currency prefix — visually dominant */}
                                <div className="absolute left-0 h-full flex items-center pl-4 pr-3 border-r border-slate-200 dark:border-slate-700 pointer-events-none select-none">
                                    <span className="text-2xl font-black text-slate-300 dark:text-slate-600">₦</span>
                                </div>
                                <input
                                    type="number"
                                    value={priceNaira}
                                    onChange={e => setPriceNaira(e.target.value)}
                                    placeholder="0"
                                    className="w-full h-16 pl-16 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-3xl tracking-tight placeholder:text-slate-200 dark:placeholder:text-slate-700 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-400/10 transition-all"
                                />
                                {priceNaira && Number(priceNaira) > 0 && (
                                    <div className="absolute right-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pointer-events-none">
                                        ₦{fmt(priceNaira)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Max quantity — secondary, collapsed visually */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                                Max order qty <span className="text-slate-300 dark:text-slate-600 font-medium normal-case tracking-normal">(optional)</span>
                            </label>
                            <input
                                type="number"
                                value={maxQty}
                                onChange={e => setMaxQty(e.target.value)}
                                placeholder="No limit"
                                className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-400/10 transition-all"
                            />
                        </div>

                        {/* Default toggle — feels like a physical switch */}
                        <button
                            type="button"
                            onClick={() => setIsDefault(!isDefault)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isDefault
                                    ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/25"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                }`}
                        >
                            <div className="text-left">
                                <div className={`text-xs font-black uppercase tracking-widest ${isDefault ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
                                    Set as default
                                </div>
                                <div className={`text-[11px] font-medium mt-0.5 ${isDefault ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                                    Customers see this pre-selected
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full flex items-center transition-all px-1 ${isDefault ? "bg-white/25 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
                                }`}>
                                <div className={`w-4 h-4 rounded-full ${isDefault ? "bg-white" : "bg-white dark:bg-slate-400"} shadow-sm transition-all`} />
                            </div>
                        </button>

                        {/* Form actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 h-13 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] h-13 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                Save Portion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PORTIONS LIST ─────────────────────────────────────── */}
            {!showForm && store.portions.length > 0 && (
                <div className="space-y-2 mb-4">
                    {store.portions.map((p, index) => (
                        <div
                            key={p.tempId}
                            className={`group relative flex items-center gap-4 p-4 rounded-[1.25rem] border transition-all ${p.is_default
                                    ? "border-orange-200 dark:border-orange-500/30 bg-gradient-to-r from-orange-50 to-amber-50/50 dark:from-orange-500/10 dark:to-amber-500/5"
                                    : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                                }`}
                        >
                            {/* Left — portion index / default badge */}
                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${p.is_default
                                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                }`}>
                                {p.is_default ? "★" : index + 1}
                            </div>

                            {/* Center — label + price */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className={`font-black text-base tracking-tight ${p.is_default ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                                        }`}>
                                        {p.label}
                                    </span>
                                    {p.is_default && (
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-orange-600 dark:text-orange-400 font-black text-lg tracking-tight">
                                        ₦{fmt(p.price_naira)}
                                    </span>
                                    {p.max_quantity && (
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            · max {p.max_quantity}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right — actions, visible on hover */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => handleOpenForm(p)}
                                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.tempId)}
                                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── EMPTY STATE ───────────────────────────────────────── */}
            {!showForm && store.portions.length === 0 && (
                <div className="mb-6 p-8 rounded-[1.75rem] bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 text-center mb-6">
                        Pick a size to start — or add a custom one below
                    </p>
                    {/* Presets as the primary CTA for empty state */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => handlePreset(p)}
                                className="group flex flex-col items-start p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-md hover:shadow-orange-500/5 transition-all active:scale-95 text-left"
                            >
                                <span className="font-black text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    {p.label}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                    {p.hint}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ADD MORE / CUSTOM ─────────────────────────────────── */}
            {!showForm && (
                <div className="space-y-3 mb-8">
                    {/* Preset strip — visible after first portion is added */}
                    {store.portions.length > 0 && store.portions.length < 5 && (
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                            <span className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-300 dark:text-slate-600 shrink-0">
                                Add:
                            </span>
                            {PRESETS.filter(p =>
                                !store.portions.some(existing =>
                                    existing.label.toLowerCase() === p.label.toLowerCase()
                                )
                            ).map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => handlePreset(p)}
                                    className="shrink-0 h-8 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={11} />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Custom add button */}
                    <button
                        onClick={() => handleOpenForm()}
                        className={`w-full flex items-center justify-between px-5 rounded-2xl border transition-all active:scale-[0.99] group ${store.portions.length === 0
                                ? "h-14 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-500/40"
                                : "h-12 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                    >
                        <span className="flex items-center gap-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-all">
                                <Plus size={13} />
                            </div>
                            {store.portions.length === 0 ? "Add custom portion" : "Add another size"}
                        </span>
                        <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                    </button>
                </div>
            )}

            {/* ── ACTIONS ───────────────────────────────────────────── */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="h-14 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all font-black uppercase tracking-widest gap-2 active:scale-95 text-xs"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex gap-3">
                    {store.portions.length === 0 && (
                        <button
                            onClick={onNext}
                            className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            Skip
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/25"
                    >
                        {store.portions.length > 0
                            ? `Continue (${store.portions.length} ${store.portions.length === 1 ? "portion" : "portions"})`
                            : "Next Step"
                        }
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}