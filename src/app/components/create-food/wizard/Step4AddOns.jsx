"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Trash2, X, ArrowLeft, GripVertical, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Step4AddOns({ onBack, onNext }) {
    const store = useCreateFoodStore();
    const [showGroupForm, setShowGroupForm] = useState(false);

    // Group Form State
    const [groupId, setGroupId] = useState(null);
    const [groupName, setGroupName] = useState("");
    const [isRequired, setIsRequired] = useState(false);
    const [minSelections, setMinSelections] = useState("0");
    const [maxSelections, setMaxSelections] = useState("1");

    // Inline Option State (one per group)
    const [optionInputs, setOptionInputs] = useState({});

    const handleOpenGroupForm = (existing = null) => {
        if (existing) {
            setGroupId(existing.tempId);
            setGroupName(existing.name);
            setIsRequired(existing.is_required);
            setMinSelections(existing.min_selections.toString());
            setMaxSelections(existing.max_selections.toString());
        } else {
            setGroupId(null);
            setGroupName("");
            setIsRequired(false);
            setMinSelections("0");
            setMaxSelections("1");
        }
        setShowGroupForm(true);
    };

    const handleSaveGroup = () => {
        if (!groupName.trim()) {
            toast.error("Group name is required");
            return;
        }

        const min = Number(minSelections);
        const max = Number(maxSelections);

        if (min > max) {
            toast.error("Minimum selections cannot be greater than maximum");
            return;
        }

        const draft = {
            tempId: groupId || Date.now().toString(),
            name: groupName.trim(),
            min_selections: min,
            max_selections: max,
            is_required: isRequired || min > 0,
            sort_order: store.choice_groups.length,
            options: groupId ? store.choice_groups.find(g => g.tempId === groupId).options : [],
        };

        if (groupId) {
            store.updateChoiceGroup(groupId, draft);
        } else {
            store.addChoiceGroup(draft);
        }

        setShowGroupForm(false);
    };

    const handleAddOption = (gId) => {
        const input = optionInputs[gId] || { name: "", price: "" };
        if (!input.name.trim()) return;

        store.addChoiceOption(gId, {
            tempId: Date.now().toString(),
            label: input.name.trim(),
            price_modifier_naira: Number(input.price) || 0,
            is_available: true,
            sort_order: 0,
        });

        // Clear input for this group
        setOptionInputs(prev => ({ ...prev, [gId]: { name: "", price: "" } }));
    };

    const handleNext = () => {
        // Validation before Review
        for (const g of store.choice_groups) {
            if (g.options.length === 0) {
                toast.error(`Group "${g.name}" has no options. Add options or delete the group.`);
                return;
            }
        }
        onNext();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Do customers get to choose extras?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">This is optional. For example: "Choose your protein", "Add a drink", "Extra toppings".</p>
            </div>

            {/* Existing Groups */}
            <div className="space-y-6">
                {store.choice_groups.map(group => (
                    <div key={group.tempId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
                        {/* Group Header */}
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{group.name}</h3>
                                    {group.is_required && <span className="text-[9px] px-2.5 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg uppercase font-black tracking-widest leading-none">Required</span>}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Select min {group.min_selections}, max {group.max_selections}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenGroupForm(group)} className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-b-2 dark:border-b-slate-900 transition-all"><Edit2 size={14} /></button>
                                <button onClick={() => store.removeChoiceGroup(group.tempId)} className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-b-2 dark:border-b-slate-900 transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="p-3 space-y-2">
                            {group.options.map(opt => (
                                <div key={opt.tempId} className="flex items-center justify-between p-3 pl-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl group/opt transition-colors">
                                    <div className="flex items-center gap-3">
                                        <GripVertical size={16} className="text-slate-300 dark:text-slate-600 cursor-grab opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                                        <div className={`w-4 h-4 rounded-full border-2 ${opt.is_available ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500/20 dark:bg-emerald-500/10" : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"}`} />
                                        <span className="font-bold text-slate-900 dark:text-white text-[15px]">{opt.label}</span>
                                        {opt.price_modifier_naira > 0 ? (
                                            <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 rounded-full tracking-wide">+₦{opt.price_modifier_naira}</span>
                                        ) : (
                                            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">FREE</span>
                                        )}
                                    </div>
                                    <button onClick={() => store.removeChoiceOption(group.tempId, opt.tempId)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover/opt:opacity-100 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Option Inline */}
                            <div className="flex items-center gap-2 p-3 mt-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <input
                                    type="text"
                                    placeholder="Option Name"
                                    value={optionInputs[group.tempId]?.name || ""}
                                    onChange={e => setOptionInputs({ ...optionInputs, [group.tempId]: { ...optionInputs[group.tempId], name: e.target.value } })}
                                    className="flex-1 h-11 px-4 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 dark:focus:border-orange-500 placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    onKeyDown={e => e.key === 'Enter' && handleAddOption(group.tempId)}
                                />
                                <div className="relative w-32 shrink-0">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-500 font-black">+₦</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={optionInputs[group.tempId]?.price || ""}
                                        onChange={e => setOptionInputs({ ...optionInputs, [group.tempId]: { ...optionInputs[group.tempId], price: e.target.value } })}
                                        className="w-full h-11 pl-9 pr-3 text-sm font-black text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        onKeyDown={e => e.key === 'Enter' && handleAddOption(group.tempId)}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAddOption(group.tempId)}
                                    disabled={!optionInputs[group.tempId]?.name?.trim()}
                                    className="h-11 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl disabled:opacity-50 font-black uppercase tracking-widest text-[10px] transition-all shrink-0 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:hover:bg-slate-900 dark:disabled:hover:bg-white"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!showGroupForm && (
                    <button
                        onClick={() => handleOpenGroupForm()}
                        className="w-full h-14 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-white transition-all text-sm"
                    >
                        <Plus size={18} /> Add an Add-On Group
                    </button>
                )}
            </div>

            {/* Group Form */}
            {showGroupForm && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900 dark:bg-slate-400" />

                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{groupId ? "Edit Group" : "New Add-on Group"}</h3>
                        <button onClick={() => setShowGroupForm(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"><X size={18} /></button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-300 tracking-widest">Group Title <span className="text-rose-500">*</span></label>
                            <input
                                autoFocus
                                type="text"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                placeholder="e.g. Choose your protein, Add Extras"
                                className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-bold text-slate-900 dark:text-white text-lg placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                            />
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Required Choice?</div>
                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Must they pick something before ordering?</div>
                                </div>
                                <div className={`w-14 h-7 rounded-full p-1 transition-colors border ${isRequired ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isRequired ? 'translate-x-7' : 'translate-x-0'}`} />
                                </div>
                                <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="hidden" />
                            </label>

                            <div className="grid grid-cols-2 gap-6 pt-5 border-t border-slate-200/80 dark:border-slate-700/80">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Minimum Required</label>
                                    <input type="number" min="0" value={minSelections} onChange={e => setMinSelections(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-slate-400" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Maximum Allowed</label>
                                    <input type="number" min="1" value={maxSelections} onChange={e => setMaxSelections(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button onClick={() => setShowGroupForm(false)} className="flex-[1] h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">Cancel</button>
                            <button onClick={handleSaveGroup} className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] hover:shadow-xl dark:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.2)] active:scale-95 transition-all">Save Group</button>
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
                <button
                    onClick={handleNext}
                    className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_8px_16px_-6px_rgba(16,185,129,0.3)]"
                >
                    Review & Publish <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
            </div>
        </div>
    );
}
