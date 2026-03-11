"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Trash2, X, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const GROUP_TITLE_PRESETS = {
    "Protein & Meat": [
        "Choose your protein",
        "Choose your meat cut",
        "Choose your fish type",
        "Choose your suya cut",
    ],
    "Swallows & Soups": [
        "Choose your swallow",
        "Choose your soup",
        "Soup or stew?",
    ],
    "Rice & Pasta": [
        "Choose your rice type",
        "Choose your pasta type",
    ],
    "Sides": [
        "Choose your side",
        "Add a side dish",
        "Plantain or chips?",
    ],
    "Sauce & Spice": [
        "Choose your sauce",
        "Spice level",
        "How spicy?",
    ],
    "Drinks": [
        "Add a drink",
        "Choose your drink",
    ],
    "Bread, Wraps & Shawarma": [
        "Choose your bread type",
        "Choose your wrap filling",
        "Add wrap extras",
    ],
    "Extras & Toppings": [
        "Add toppings",
        "Add proteins",
        "Add extras",
        "Add-ons",
    ],
    "Packaging & Requests": [
        "Packaging preference",
        "Any special requests?",
    ],
};

export default function Step4AddOns({ onBack, onNext, onDeleteGroup, onDeleteOption }) {
    const store = useCreateFoodStore();
    const [showGroupForm, setShowGroupForm] = useState(false);

    // Group Form State
    const [groupId, setGroupId] = useState(null);
    const [groupName, setGroupName] = useState("");
    const [isRequired, setIsRequired] = useState(false);
    const [minSelections, setMinSelections] = useState("0");
    const [maxSelections, setMaxSelections] = useState("100");
    const [isCustomTitle, setIsCustomTitle] = useState(false);

    // Inline Option State (one per group)
    const [optionInputs, setOptionInputs] = useState({});

    const handleOpenGroupForm = (existing = null) => {
        if (existing) {
            setGroupId(existing.tempId);
            setGroupName(existing.name);
            setIsRequired(existing.is_required);
            setMinSelections(existing.min_selections.toString());
            setMaxSelections(existing.max_selections.toString());
            // If the name matches a preset, use select mode; otherwise text mode
            const allPresets = Object.values(GROUP_TITLE_PRESETS).flat();
            const isPreset = allPresets.includes(existing.name);
            setIsCustomTitle(!isPreset);
        } else {
            setGroupId(null);
            setGroupName("");
            setIsRequired(false);
            setMinSelections("0");
            setMaxSelections("100");
            setIsCustomTitle(false);
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
        const input = optionInputs[gId] || { name: "", price: "", image_url: "" };
        if (!input.name.trim()) return;

        store.addChoiceOption(gId, {
            tempId: Date.now().toString(),
            label: input.name.trim(),
            price_modifier_naira: Number(input.price) || 0,
            image_url: input.image_url?.trim() || null,
            is_available: true,
            sort_order: 0,
        });

        setOptionInputs(prev => ({
            ...prev,
            [gId]: { name: "", price: "", image_url: "", showImageField: false }
        }));
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
                                <button
                                    onClick={() => {
                                        if (onDeleteGroup) {
                                            // Edit mode — API delete with confirmation toast
                                            onDeleteGroup(group.tempId, group.name);
                                        } else {
                                            // Create mode — local store only
                                            store.removeChoiceGroup(group.tempId);
                                        }
                                    }}
                                    className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-b-2 dark:border-b-slate-900 transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="p-3 space-y-1">
                            {group.options.map(opt => (
                                <div
                                    key={opt.tempId}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl group/opt transition-colors"
                                >
                                    {/* Image thumbnail — shown only if image_url exists */}
                                    {opt.image_url ? (
                                        <img
                                            src={opt.image_url}
                                            alt={opt.label}
                                            className="w-9 h-9 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-black text-slate-400 dark:text-slate-500">
                                                {opt.label.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Label + price */}
                                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                                            {opt.label}
                                        </span>
                                        {opt.price_modifier_naira > 0 ? (
                                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                                                +₦{opt.price_modifier_naira.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                Free
                                            </span>
                                        )}
                                    </div>

                                    {/* Delete — hover only */}
                                    <button
                                        onClick={() => {
                                            if (onDeleteOption) {
                                                // Edit mode — API delete (no confirmation, low stakes)
                                                onDeleteOption(group.tempId, opt.tempId, opt.label);
                                            } else {
                                                // Create mode — local store only
                                                store.removeChoiceOption(group.tempId, opt.tempId);
                                            }
                                        }}
                                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover/opt:opacity-100 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Option Inline */}
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">

                                {/* Row 1: Name + Price + Add button */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Option name"
                                        value={optionInputs[group.tempId]?.name || ""}
                                        onChange={e => setOptionInputs(prev => ({
                                            ...prev,
                                            [group.tempId]: { ...prev[group.tempId], name: e.target.value }
                                        }))}
                                        onKeyDown={e => e.key === 'Enter' && handleAddOption(group.tempId)}
                                        className="flex-1 h-10 px-3.5 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 dark:focus:border-orange-500 placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />

                                    <div className="relative w-28 shrink-0">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-500 font-black pointer-events-none">
                                            +₦
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={optionInputs[group.tempId]?.price || ""}
                                            onChange={e => setOptionInputs(prev => ({
                                                ...prev,
                                                [group.tempId]: { ...prev[group.tempId], price: e.target.value }
                                            }))}
                                            onKeyDown={e => e.key === 'Enter' && handleAddOption(group.tempId)}
                                            className="w-full h-10 pl-8 pr-3 text-sm font-black text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleAddOption(group.tempId)}
                                        disabled={!optionInputs[group.tempId]?.name?.trim()}
                                        className="h-10 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl disabled:opacity-40 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-700 dark:hover:bg-slate-200 active:scale-95 shrink-0"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Row 2: Image URL toggle — always visible, dimmed until name exists */}
                                <div className={`transition-opacity ${optionInputs[group.tempId]?.name?.trim()
                                    ? "opacity-100"
                                    : "opacity-35 pointer-events-none"
                                    }`}>
                                    {optionInputs[group.tempId]?.showImageField ? (
                                        <div className="flex items-center gap-2">
                                            {/* Live preview thumbnail */}
                                            <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                                                {optionInputs[group.tempId]?.image_url ? (
                                                    <img
                                                        src={optionInputs[group.tempId].image_url}
                                                        alt="preview"
                                                        className="w-full h-full object-cover"
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">IMG</span>
                                                )}
                                            </div>

                                            <input
                                                type="url"
                                                placeholder="Paste image URL (optional)"
                                                value={optionInputs[group.tempId]?.image_url || ""}
                                                onChange={e => setOptionInputs(prev => ({
                                                    ...prev,
                                                    [group.tempId]: { ...prev[group.tempId], image_url: e.target.value }
                                                }))}
                                                className="flex-1 h-9 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 dark:focus:border-orange-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                            />

                                            <button
                                                onClick={() => setOptionInputs(prev => ({
                                                    ...prev,
                                                    [group.tempId]: { ...prev[group.tempId], showImageField: false, image_url: "" }
                                                }))}
                                                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors px-1 shrink-0"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setOptionInputs(prev => ({
                                                ...prev,
                                                [group.tempId]: { ...prev[group.tempId], showImageField: true }
                                            }))}
                                            className="text-[10px] font-black uppercase tracking-widest text-white dark:text-slate-500 hover:text-orange-100 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 px-2 py-2.5 rounded mt-4 bg-orange-500"
                                        >
                                            <Plus size={11} /> Add image to this option
                                        </button>
                                    )}
                                </div>
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
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-300 tracking-widest">
                                Group Title <span className="text-rose-500">*</span>
                            </label>

                            {!isCustomTitle ? (
                                /* SELECT MODE — default */
                                <div className="relative">
                                    <select
                                        autoFocus
                                        value={groupName}
                                        onChange={e => {
                                            if (e.target.value === "Custom...") {
                                                setIsCustomTitle(true);
                                                setGroupName("");
                                            } else {
                                                setGroupName(e.target.value);
                                            }
                                        }}
                                        className="w-full h-14 px-4 pr-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-bold text-slate-900 dark:text-white text-base outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Pick a group type...</option>

                                        {Object.entries(GROUP_TITLE_PRESETS).map(([groupLabel, presets]) => (
                                            <optgroup key={groupLabel} label={groupLabel}>
                                                {presets.map(preset => (
                                                    <option key={preset} value={preset}>{preset}</option>
                                                ))}
                                            </optgroup>
                                        ))}

                                        {/* Custom is always last, outside all optgroups */}
                                        <option value="Custom...">Custom...</option>
                                    </select>
                                    {/* Custom chevron */}
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                /* TEXT MODE — only when "Custom..." is picked */
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                        placeholder="Describe the choice e.g. Choose your garnish"
                                        className="flex-1 h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-bold text-slate-900 dark:text-white text-base placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setIsCustomTitle(false); setGroupName(""); }}
                                        className="h-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-all whitespace-nowrap shrink-0"
                                    >
                                        ← Pick from list
                                    </button>
                                </div>
                            )}

                            {/* Confirmation line when a preset is selected */}
                            {!isCustomTitle && groupName && groupName !== "Custom..." && (
                                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pl-1">
                                    ✓ Customers will see: "{groupName}"
                                </p>
                            )}
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
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                                        Maximum Allowed
                                        <span className="ml-1 normal-case tracking-normal font-medium text-slate-400 dark:text-slate-500">
                                            (100 = unlimited)
                                        </span>
                                    </label>
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
