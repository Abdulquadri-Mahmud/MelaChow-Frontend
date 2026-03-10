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
                <h2 className="text-2xl font-black text-slate-900 mb-2">Do customers get to choose extras?</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">This is optional. For example: "Choose your protein", "Add a drink", "Extra toppings".</p>
            </div>

            {/* Existing Groups */}
            <div className="space-y-6">
                {store.choice_groups.map(group => (
                    <div key={group.tempId} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        {/* Group Header */}
                        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-black text-slate-900">{group.name}</h3>
                                    {group.is_required && <span className="text-[9px] px-2 py-0.5 bg-orange-100 text-orange-600 rounded uppercase font-black tracking-widest">Required</span>}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                    Select min {group.min_selections}, max {group.max_selections}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenGroupForm(group)} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg shadow-sm border border-slate-100 border-b-2"><Edit2 size={14} /></button>
                                <button onClick={() => store.removeChoiceGroup(group.tempId)} className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg shadow-sm border border-slate-100 border-b-2"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="p-2 space-y-2">
                            {group.options.map(opt => (
                                <div key={opt.tempId} className="flex items-center justify-between p-2 pl-3 hover:bg-slate-50 rounded-xl group/opt transition-colors">
                                    <div className="flex items-center gap-3">
                                        <GripVertical size={14} className="text-slate-300 cursor-grab opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                                        <div className={`w-3 h-3 rounded-full border-2 ${opt.is_available ? "border-emerald-500 bg-emerald-500/20" : "border-slate-300 bg-slate-100"}`} />
                                        <span className="font-bold text-slate-900 text-sm">{opt.label}</span>
                                        {opt.price_modifier_naira > 0 ? (
                                            <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 rounded-full">+₦{opt.price_modifier_naira}</span>
                                        ) : (
                                            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">FREE</span>
                                        )}
                                    </div>
                                    <button onClick={() => store.removeChoiceOption(group.tempId, opt.tempId)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Option Inline */}
                            <div className="flex items-center gap-2 p-2 mt-2 bg-slate-50 rounded-xl border border-slate-100">
                                <input
                                    type="text"
                                    placeholder="Option Name"
                                    value={optionInputs[group.tempId]?.name || ""}
                                    onChange={e => setOptionInputs({ ...optionInputs, [group.tempId]: { ...optionInputs[group.tempId], name: e.target.value } })}
                                    className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200 outline-none focus:border-orange-500"
                                    onKeyDown={e => e.key === 'Enter' && handleAddOption(group.tempId)}
                                />
                                <div className="relative w-28 shrink-0">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">+₦</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={optionInputs[group.tempId]?.price || ""}
                                        onChange={e => setOptionInputs({ ...optionInputs, [group.tempId]: { ...optionInputs[group.tempId], price: e.target.value } })}
                                        className="w-full h-9 pl-7 pr-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-orange-500 font-black text-orange-600"
                                        onKeyDown={e => e.key === 'Enter' && handleAddOption(group.tempId)}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAddOption(group.tempId)}
                                    disabled={!optionInputs[group.tempId]?.name?.trim()}
                                    className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 text-xs font-bold transition-all shrink-0"
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
                        className="w-full h-14 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-colors"
                    >
                        <Plus size={18} /> Add an Add-On Group
                    </button>
                )}
            </div>

            {/* Group Form */}
            {showGroupForm && (
                <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-900" />

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900">{groupId ? "Edit Group" : "New Add-on Group"}</h3>
                        <button onClick={() => setShowGroupForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={18} /></button>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Group Title *</label>
                            <input
                                autoFocus
                                type="text"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                placeholder="e.g. Choose your protein, Add Extras"
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-900"
                            />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">Required Choice?</div>
                                    <div className="text-[10px] text-slate-500">Must they pick something before ordering?</div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isRequired ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isRequired ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="hidden" />
                            </label>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 tracking-wide">MINIMUM REQUIRED</label>
                                    <input type="number" min="0" value={minSelections} onChange={e => setMinSelections(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 font-bold text-slate-900 outline-none focus:border-slate-900" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 tracking-wide">MAXIMUM ALLOWED</label>
                                    <input type="number" min="1" value={maxSelections} onChange={e => setMaxSelections(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 font-bold text-slate-900 outline-none focus:border-slate-900" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button onClick={() => setShowGroupForm(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleSaveGroup} className="flex-[2] h-12 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg active:scale-95 transition-all">Save Group</button>
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
                <button
                    onClick={handleNext}
                    className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-95 shadow-orange-500/20"
                >
                    Review & Publish →
                </button>
            </div>
        </div>
    );
}
