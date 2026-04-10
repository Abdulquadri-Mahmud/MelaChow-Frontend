"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Plus, Trash2, X, Check, Info, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";

const PRESETS = [
    { label: "Small", hint: "Side size" },
    { label: "Medium", hint: "Standard" },
    { label: "Large", hint: "Full meal" },
    { label: "Full Wrap", hint: "Bundle" },
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Portions & Pricing</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-widest leading-none">Define sizes and their respective prices.</p>
                </div>
                {store.portions.length > 0 && (
                     <button onClick={() => handleOpenForm()} className="h-9 px-4 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-orange-500/20 transition-all">
                        + New Size
                     </button>
                )}
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                    <button
                        key={p.label}
                        onClick={() => handlePreset(p)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-600 hover:border-orange-500/50 transition-all active:scale-95"
                    >
                        + {p.label}
                    </button>
                ))}
            </div>

            {/* Portion List */}
            <div className="space-y-2">
                {store.portions.length === 0 ? (
                    <div className="py-20 bg-slate-50/50 dark:bg-slate-950/30 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center px-12">
                        <LayoutGrid size={32} className="text-slate-200 mb-4" strokeWidth={1} />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">No Prices Defined</h4>
                        <button onClick={() => handleOpenForm()} className="h-10 px-8 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-none transition-all">
                            Set Initial Price
                        </button>
                    </div>
                ) : (
                    store.portions.map((p) => (
                        <div key={p.tempId} className={`group flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 border ${p.is_default ? 'border-orange-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl transition-all hover:shadow-sm`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${p.is_default ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                                    {p.is_default ? <Check size={18} strokeWidth={3} /> : "₦"}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{p.label}</span>
                                        {p.is_default && <span className="px-1.5 py-0.5 bg-orange-600 text-white text-[8px] font-black uppercase rounded shadow-sm">Primary</span>}
                                    </div>
                                    <span className="text-lg font-black text-orange-600 dark:text-orange-500 tabular-nums">₦{fmt(p.price_naira)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenForm(p)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                                    <Edit2 size={12} strokeWidth={3} />
                                </button>
                                <button onClick={() => handleDelete(p.tempId)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all shadow-sm">
                                    <Trash2 size={12} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Contextual Tip */}
            <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-950/30 p-4 rounded-xl flex gap-3">
                 <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                    <span className="font-bold text-white">!</span>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Pricing Tip</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic opacity-80">
                        The "Primary" price is what customers see first. Use it for your most popular portion size.
                    </p>
                 </div>
            </div>

            {/* MODAL: PORTION CONFIGURATION */}
            <AnimatePresence>
                {showForm && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Setup Price</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure size and respective cost</p>
                                    </div>
                                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-600 transition-colors">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5 pl-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Size/Label</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={label}
                                            onChange={e => setLabel(e.target.value)}
                                            placeholder="E.G. REGULAR PACK"
                                            className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-[12px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-orange-500 shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-1.5 pl-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Price (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-orange-600">₦</span>
                                            <input
                                                type="number"
                                                value={priceNaira}
                                                onChange={e => setPriceNaira(e.target.value)}
                                                placeholder="0"
                                                className="w-full h-14 pl-12 pr-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-[16px] font-black text-orange-600 outline-none focus:border-orange-500 tabular-nums shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button 
                                            onClick={() => setIsDefault(!isDefault)}
                                            className={`w-full h-12 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                                                isDefault 
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDefault ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 dark:border-slate-800'}`}>
                                                {isDefault && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Set as Primary Price</span>
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    className="w-full h-14 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] active:scale-[0.98] transition-all shadow-xl shadow-slate-950/20"
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
