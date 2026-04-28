"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Plus, Trash2, X, Check, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";

const PRESETS = [
    // ── Size-based ──────────────────────────────────────────
    { label: "Small",       hint: "Starter size",    emoji: "🥣" },
    { label: "Medium",      hint: "Standard",        emoji: "🍽️" },
    { label: "Large",       hint: "Full meal",       emoji: "🍱" },
    { label: "Full Wrap",   hint: "Bundle",          emoji: "🌯" },
    // ── Portion / Piece / Order ──────────────────────────────
    { label: "Half Portion", hint: "Half serving",  emoji: "✂️" },
    { label: "Full Portion", hint: "Full serving",  emoji: "🥘" },
    { label: "1 Piece",     hint: "Single unit",    emoji: "1️⃣" },
    { label: "2 Pieces",    hint: "Double unit",    emoji: "2️⃣" },
    { label: "3 Pieces",    hint: "Triple unit",    emoji: "3️⃣" },
    { label: "Family Size", hint: "Serves 4+",      emoji: "👨‍👩‍👧‍👦" },
    { label: "Party Order", hint: "Bulk order",     emoji: "🎉" },
    { label: "Single",      hint: "One order",      emoji: "🛍️" },
];

export default function Step3Portions({ onDeletePortion }) {
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
        const priceNum = Number(priceNaira.toString().replace(/,/g, ""));
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
            toast.success("Price updated");
        } else {
            store.addPortion(draft);
            toast.success("Price added");
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
            await onDeletePortion(id);
        } else {
            store.removePortion(id);
        }
    };

    const fmt = (n) => Number(n).toLocaleString("en-NG");

    // Only show presets that haven't been added yet
    const unusedPresets = PRESETS.filter(
        (p) => !store.portions.some((portion) => portion.label.toLowerCase() === p.label.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Portions & Pricing</h3>
                    <p className="text-[11px] font-medium text-zinc-500 mt-1 uppercase tracking-widest leading-none">
                        Define sizes and their respective prices.
                    </p>
                </div>
                {store.portions.length > 0 && (
                    <button
                        onClick={() => handleOpenForm()}
                        className="h-9 px-4 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5"
                    >
                        <Plus size={12} strokeWidth={3} />
                        New Size
                    </button>
                )}
            </div>

            {/* ── Suggestion Pills (gradient style) ── */}
            {unusedPresets.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 pl-1">
                        Quick Add
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {unusedPresets.map((p) => (
                            <motion.button
                                key={p.label}
                                type="button"
                                onClick={() => handlePreset(p)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className="relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-900/30 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 text-zinc-300 hover:border-orange-500/50 hover:text-white transition-all shadow-sm group"
                            >
                                {/* subtle right-side orange glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative">{p.emoji}</span>
                                <span className="relative">+ {p.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Portion List ── */}
            <div className="space-y-2">
                {store.portions.length === 0 ? (
                    <div className="py-16 bg-zinc-50/50 dark:bg-zinc-950/30 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center px-12">
                        <LayoutGrid size={32} className="text-zinc-200 dark:text-zinc-700 mb-4" strokeWidth={1} />
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">
                            No Prices Defined
                        </h4>
                        <button
                            onClick={() => handleOpenForm()}
                            className="h-10 px-8 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Set Initial Price
                        </button>
                    </div>
                ) : (
                    store.portions.map((p) => (
                        <div
                            key={p.tempId}
                            className={`group flex items-center justify-between p-4 border rounded-2xl transition-all hover:shadow-sm ${
                                p.is_default
                                    ? 'bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border-orange-500/50 shadow-lg shadow-orange-500/10'
                                    : 'bg-white dark:bg-zinc-950/50 border-zinc-100 dark:border-zinc-800'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                    p.is_default
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400'
                                }`}>
                                    {p.is_default ? <Check size={18} strokeWidth={3} /> : "₦"}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${
                                            p.is_default ? 'text-white' : 'text-zinc-900 dark:text-white'
                                        }`}>
                                            {p.label}
                                        </span>
                                        {p.is_default && (
                                            <span className="px-1.5 py-0.5 bg-orange-600 text-white text-[8px] font-black uppercase rounded shadow-sm">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-lg font-black tabular-nums ${
                                        p.is_default ? 'text-orange-400' : 'text-orange-600 dark:text-orange-500'
                                    }`}>
                                        ₦{fmt(p.price_naira)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenForm(p)}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                                >
                                    <Edit2 size={12} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.tempId)}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-rose-600 transition-all shadow-sm"
                                >
                                    <Trash2 size={12} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Contextual Tip ── */}
            <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-950/30 p-3 rounded-xl flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20 text-xs font-bold">
                    !
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-0.5">
                        Pricing Tip
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed italic opacity-80">
                        The "Primary" price is what customers see first. Use it for your most popular portion size.
                    </p>
                </div>
            </div>

            {/* ── MODAL: Portion Configuration ── */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                        />

                        {/* Modal card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 12 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
                        >
                            {/* Gradient header strip */}
                            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 px-5 py-4 flex items-center justify-between border-b border-white/5 relative overflow-hidden">
                                {/* Ambient glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/15 blur-[60px] -mr-8 -mt-8 pointer-events-none" />
                                <div className="relative">
                                    {/* Brand accent bar */}
                                    <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                                        Setup Price
                                    </h3>
                                    <p className="text-[9px] font-bold text-orange-400/80 uppercase tracking-widest mt-1">
                                        Configure size & cost
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="relative w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Form body */}
                            <div className="p-4 space-y-3">
                                {/* Size/Label */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                                        Size / Label
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        placeholder="E.G. REGULAR PACK"
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>

                                {/* Price */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                                        Price (₦)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-orange-600 text-sm">
                                            ₦
                                        </span>
                                        <input
                                            type="number"
                                            value={priceNaira}
                                            onChange={(e) => setPriceNaira(e.target.value)}
                                            placeholder="0"
                                            className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[14px] font-black text-orange-600 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 tabular-nums transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Set as Primary */}
                                <button
                                    onClick={() => setIsDefault(!isDefault)}
                                    className={`w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-[9px] font-black uppercase tracking-widest ${
                                        isDefault
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        isDefault ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300 dark:border-zinc-600'
                                    }`}>
                                        {isDefault && <Check size={9} strokeWidth={4} />}
                                    </div>
                                    Set as Primary Price
                                </button>

                                {/* Confirm button */}
                                <button
                                    onClick={handleSave}
                                    className="w-full h-11 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-950 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] active:scale-[0.98] transition-all shadow-lg shadow-zinc-950/20 border border-orange-900/20 dark:border-zinc-200"
                                >
                                    {tempId ? 'Apply Changes' : 'Confirm & Add'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
