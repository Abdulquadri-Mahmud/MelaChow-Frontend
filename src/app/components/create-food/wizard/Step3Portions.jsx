"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Star, Trash2, X, ArrowLeft } from "lucide-react";
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
                <h2 className="text-2xl font-black text-slate-900 mb-2">How much does this cost?</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">You can set one price, or offer different sizes (like Small, Medium, Large) at different prices.</p>
            </div>

            {/* Quick Template Strip */}
            {!showForm && store.portions.length < 5 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 shrink-0">Quick Add:</span>
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
                            className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-sm"
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
                        <div key={p.tempId} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${p.is_default ? "border-orange-500 bg-orange-50/30 shadow-md shadow-orange-500/5" : "border-slate-200 bg-white shadow-sm"}`}>
                            <div className="flex items-center gap-4">
                                {p.is_default && (
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500" title="Default Size">
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg">{p.label}</h4>
                                    <div className="flex gap-3 text-xs font-bold text-slate-500 mt-0.5">
                                        <span className="text-orange-600">₦{p.price_naira.toLocaleString()}</span>
                                        {p.max_quantity && <span>Max: {p.max_quantity}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenForm(p)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(p.tempId)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => handleOpenForm()}
                        className="w-full h-14 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                        <Plus size={18} /> Add another size / option
                    </button>
                </div>
            )}

            {/* Empty state & Form trigger */}
            {store.portions.length === 0 && !showForm && (
                <div className="p-8 border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-3xl text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm text-orange-500 flex items-center justify-center mb-4">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">Add your first portion</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm">Every food needs at least one price. Add one now.</p>
                    <button
                        onClick={() => handleOpenForm()}
                        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Add Portion
                    </button>
                </div>
            )}

            {/* Inline Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900">{tempId ? "Edit Portion" : "Add Portion"}</h3>
                        <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={18} /></button>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Portion Label *</label>
                            <input
                                autoFocus
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="e.g. Small, 1 Portion, Per Cup"
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Price (₦) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        value={priceNaira}
                                        onChange={e => setPriceNaira(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-black text-slate-900 text-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Max Order Qty</label>
                                <input
                                    type="number"
                                    value={maxQty}
                                    onChange={e => setMaxQty(e.target.value)}
                                    placeholder="No limit"
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-100 transition-colors group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isDefault ? "bg-orange-500 border-orange-500" : "bg-white border-slate-300 group-hover:border-orange-300"}`}>
                                {isDefault && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">Make this the default choice</div>
                                <div className="text-[10px] text-slate-500">Customers will see this option pre-selected when buying.</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={e => setIsDefault(e.target.checked)}
                                className="hidden"
                            />
                        </label>

                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >Cancel</button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] h-12 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                            >Save Portion</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-8 border-t border-slate-100 flex items-center justify-between mt-12">
                <button
                    onClick={onBack}
                    className="h-12 px-6 flex items-center py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all font-bold gap-2 focus:scale-95 text-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={onNext}
                        className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors shadow-sm active:scale-95 text-sm"
                    >
                        Skip Add-Ons
                    </button>
                    <button
                        onClick={handleNext}
                        className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-95 shadow-orange-500/20"
                    >
                        Next: Add-Ons →
                    </button>
                </div>
            </div>
        </div>
    );
}

// Just adding a fake import reference so we don't break the build before modifying Step3Portions. 
import { CheckCircle2 } from "lucide-react";
