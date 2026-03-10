"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Star, Trash2, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const TEMPLATES = ["1 Portion", "Small", "Medium", "Large", "Per Piece"];

export default function Step3Portions({ onBack, onNext }) {
    const store = useCreateFoodStore();
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [tempId, setTempId] = useState(null); // null if creating
    const [label, setLabel] = useState("");
    const [priceNaira, setPriceNaira] = useState("");
    const [maxQty, setMaxQty] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const handleOpenForm = (existingPortion = null) => {
        if (existingPortion) {
            setTempId(existingPortion.tempId);
            setLabel(existingPortion.label);
            setPriceNaira(existingPortion.price_naira.toString());
            setMaxQty(existingPortion.max_quantity?.toString() || "");
            setIsDefault(existingPortion.is_default);
        } else {
            setTempId(null);
            setLabel("");
            setPriceNaira("");
            setMaxQty("");
            setIsDefault(store.portions.length === 0); // first is default
        }
        setShowForm(true);
    };

    const handleSave = () => {
        if (!label.trim()) {
            toast.error("Portion must have a name (e.g. Small)");
            return;
        }

        const priceNum = Number(priceNaira.replace(/,/g, ""));
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Price must be a valid number greater than 0");
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

        if (isDefault) {
            store.setDefaultPortion(draft.tempId);
        }

        setShowForm(false);
    };

    const handleDelete = (id) => {
        if (store.portions.length === 1) {
            toast.error("You must have at least one portion");
            return;
        }
        store.removePortion(id);
    };

    const handleNext = () => {
        if (store.portions.length === 0) {
            toast.error("You need at least one price/portion to publish your food");
            // Highlight add button
            return;
        }
        onNext();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">How much does this cost?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">You can set one price, or offer different sizes (like Small, Medium, Large) at different prices.</p>
            </div>

            {/* Quick Template Strip */}
            {!showForm && store.portions.length < 5 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 shrink-0">Quick Add:</span>
                    {TEMPLATES.map(t => (
                        <button
                            key={t}
                            onClick={() => {
                                setLabel(t);
                                setPriceNaira("");
                                setMaxQty("");
                                setIsDefault(store.portions.length === 0);
                                setTempId(null);
                                setShowForm(true);
                            }}
                            className="shrink-0 px-3 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm"
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {/* Existing Portions List */}
            {store.portions.length > 0 && !showForm && (
                <div className="space-y-3">
                    {store.portions.map((p) => (
                        <div key={p.tempId} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${p.is_default ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-md shadow-orange-500/5" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"}`}>
                            <div className="flex items-center gap-4">
                                {p.is_default ? (
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-sm" title="Default Size">
                                        <Star size={18} fill="currentColor" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <span className="text-xs font-black">{p.label.charAt(0)}</span>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{p.label}</h4>
                                    <div className="flex gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span className="text-orange-600 dark:text-orange-500 text-sm tracking-wide">₦{p.price_naira.toLocaleString()}</span>
                                        {p.max_quantity && <span>Max: {p.max_quantity}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenForm(p)} className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent dark:hover:border-slate-600">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(p.tempId)} className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent dark:hover:border-rose-500/20">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => handleOpenForm()}
                        className="w-full h-14 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 transition-all text-sm"
                    >
                        <Plus size={18} /> Add another size / option
                    </button>
                </div>
            )}

            {/* Empty state & Form trigger */}
            {store.portions.length === 0 && !showForm && (
                <div className="p-10 border border-dashed border-orange-300 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/5 rounded-[2rem] text-center flex flex-col items-center shadow-sm">
                    <div className="w-20 h-20 bg-white dark:bg-slate-900 border border-orange-100 dark:border-orange-500/20 rounded-2xl shadow-sm text-orange-500 flex items-center justify-center mb-6">
                        <Plus size={36} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Add your first portion</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm">Every food needs at least one price setup. You can add one size or many.</p>
                    <button
                        onClick={() => handleOpenForm()}
                        className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] hover:shadow-xl active:scale-95"
                    >
                        Add First Portion
                    </button>
                </div>
            )}

            {/* Inline Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />

                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tempId ? "Edit Portion" : "Add Portion"}</h3>
                        <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"><X size={18} /></button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-300 tracking-widest">Portion Label <span className="text-rose-500">*</span></label>
                            <input
                                autoFocus
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="e.g. Small, 1 Portion, Per Cup"
                                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-bold text-slate-900 dark:text-white text-lg placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-300 tracking-widest">Price (₦) <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black text-lg">₦</span>
                                    <input
                                        type="number"
                                        value={priceNaira}
                                        onChange={e => setPriceNaira(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-black text-slate-900 dark:text-white text-xl outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-300 tracking-widest">Max Order Qty</label>
                                <input
                                    type="number"
                                    value={maxQty}
                                    onChange={e => setMaxQty(e.target.value)}
                                    placeholder="No limit"
                                    className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-bold text-slate-900 dark:text-white text-base outline-none placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all group">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${isDefault ? "bg-orange-500 border-orange-500 shadow-sm" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-orange-400"}`}>
                                {isDefault && <CheckCircle2 size={16} className="text-white" strokeWidth={3} />}
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Make this the default choice</div>
                                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Customers will see this option pre-selected when buying.</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={e => setIsDefault(e.target.checked)}
                                className="hidden"
                            />
                        </label>

                        <div className="pt-4 flex gap-4">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-[1] h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
                            >Cancel</button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] hover:shadow-xl dark:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
                            >Save Portion</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-12">
                <button
                    onClick={onBack}
                    className="h-14 px-6 flex items-center py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all font-black uppercase tracking-widest gap-2 active:scale-95 text-xs"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={onNext}
                        className="h-14 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-2xl transition-colors active:scale-95 text-xs"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleNext}
                        className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Next Step <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
