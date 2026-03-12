"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Trash2, X, ArrowLeft, Search } from "lucide-react";
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

    const [templateSearch, setTemplateSearch] = useState("");

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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                <div className="lg:col-span-4 space-y-4 lg:border-r lg:border-slate-100 lg:dark:border-slate-800 lg:pr-3">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Choice Groups</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-base leading-relaxed">
                            Create groups of options for your customers. For example, "Choose your protein" or "Spice Level".
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Group Templates</h3>
                        </div>

                        {/* Search Templates */}
                        <div className="relative group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
                            <input 
                                type="text"
                                placeholder="Search templates..."
                                value={templateSearch}
                                onChange={(e) => setTemplateSearch(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            />
                        </div>

                        {/* Scrollable Templates */}
                        <div className="h-[400px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                            {Object.entries(GROUP_TITLE_PRESETS).map(([category, presets]) => {
                                const filtered = presets.filter(p => p.toLowerCase().includes(templateSearch.toLowerCase()));
                                if (filtered.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-2">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{category}</span>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {filtered.map(preset => {
                                                const isActive = groupName === preset;
                                                return (
                                                    <button
                                                        key={preset}
                                                        onClick={() => {
                                                            if (!showGroupForm) {
                                                                handleOpenGroupForm();
                                                                setGroupName(preset);
                                                            } else {
                                                                setGroupName(preset);
                                                            }
                                                        }}
                                                        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${isActive 
                                                            ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" 
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400"}`}
                                                    >
                                                        <span className={`text-xs font-black tracking-tight ${isActive ? "text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-orange-500"}`}>{preset}</span>
                                                        <Plus size={14} className={isActive ? "text-white" : "text-slate-300"} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Empty State for Search */}
                            {Object.values(GROUP_TITLE_PRESETS).flat().filter(p => p.toLowerCase().includes(templateSearch.toLowerCase())).length === 0 && (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                        <Search size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">No matching templates</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: ACTIVE GROUPS & FORM ─────────── */}
                <div className="lg:col-span-8 space-y-6">
                    {showGroupForm ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
                             <div className="bg-slate-900 dark:bg-slate-800 px-8 py-5 flex items-center justify-between">
                                <span className="text-white font-black uppercase tracking-[0.2em] text-[12px]">
                                    {groupId ? "Update Choice Group" : "Create New Choice Group"}
                                </span>
                                <button onClick={() => setShowGroupForm(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-8 lg:p-10 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Group Name</label>
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={groupName}
                                            onChange={e => { setGroupName(e.target.value); setIsCustomTitle(true); }}
                                            placeholder="e.g. Add proteins, Side dishes..."
                                            className="flex-1 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-lg placeholder:font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                        />
                                    </div>
                                     <p className="text-[11px] font-medium text-slate-400">Tip: Click a template on the left to auto-fill common group names.</p>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Mandatory Group</span>
                                            <p className="text-[11px] text-slate-500">Should customers be forced to pick an option?</p>
                                        </div>
                                        <button 
                                            onClick={() => setIsRequired(!isRequired)}
                                            className={`w-14 h-7 rounded-full p-1 transition-all ${isRequired ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isRequired ? "translate-x-7" : "translate-x-0"}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Selections</label>
                                            <input type="number" min="0" value={minSelections} onChange={e => setMinSelections(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Selections</label>
                                            <input type="number" min="1" value={maxSelections} onChange={e => setMaxSelections(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowGroupForm(false)} className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
                                    <button onClick={handleSaveGroup} className="flex-1 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all">
                                        {groupId ? "Update Group" : "Create Group"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {store.choice_groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-sm">
                                        <Plus size={40} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">No Extras Yet</p>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Add customization groups like "Proteins" or "Drinks".</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenGroupForm()}
                                        className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                    >
                                        + Start Creating Groups
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Active Groups ({store.choice_groups.length})</h3>
                                        <button onClick={() => handleOpenGroupForm()} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600">+ Add Group</button>
                                    </div>

                                    {store.choice_groups.map(group => (
                                        <div key={group.tempId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group/card">
                                            <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 p-6 flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{group.name}</h4>
                                                        {group.is_required && <span className="text-[9px] font-black uppercase bg-orange-500 text-white px-2 py-0.5 rounded-md shadow-md shadow-orange-500/10">Required</span>}
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">Customers can select {group.min_selections} to {group.max_selections} options</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleOpenGroupForm(group)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-orange-500 border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-all shadow-sm"><Edit2 size={16} /></button>
                                                    <button onClick={() => store.removeChoiceGroup(group.tempId)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-all shadow-sm"><Trash2 size={16} /></button>
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-2">
                                                {group.options.map(opt => (
                                                    <div key={opt.tempId} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group/opt transition-all">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                            {opt.image_url ? <img src={opt.image_url} alt="" className="w-full h-full object-cover" /> : <Plus size={16} className="text-slate-300" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-slate-900 dark:text-white">{opt.label}</div>
                                                            <div className="text-xs font-black text-orange-600 dark:text-orange-400">+₦{opt.price_modifier_naira.toLocaleString()}</div>
                                                        </div>
                                                        <button onClick={() => store.removeChoiceOption(group.tempId, opt.tempId)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover/opt:opacity-100 transition-all flex items-center justify-center"><X size={16} /></button>
                                                    </div>
                                                ))}

                                                {/* Inline Option Builder */}
                                                <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Option name (e.g. Extra Cheese)" 
                                                            value={optionInputs[group.tempId]?.name || ""}
                                                            onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], name: e.target.value } }))}
                                                            className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold focus:border-orange-500 outline-none"
                                                        />
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">+₦</span>
                                                            <input 
                                                                type="number" 
                                                                placeholder="Price modifier" 
                                                                value={optionInputs[group.tempId]?.price || ""}
                                                                onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], price: e.target.value } }))}
                                                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-black text-orange-600 outline-none focus:border-orange-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                            {optionInputs[group.tempId]?.image_url ? <img src={optionInputs[group.tempId].image_url} className="w-full h-full object-cover" /> : <div className="text-[9px] font-black text-slate-300">IMG</div>}
                                                        </div>
                                                        <input 
                                                            type="url" 
                                                            placeholder="Image URL (optional)" 
                                                            value={optionInputs[group.tempId]?.image_url || ""}
                                                            onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], image_url: e.target.value } }))}
                                                            className="flex-1 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:border-orange-500 outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => handleAddOption(group.tempId)}
                                                            className="h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                                                        >
                                                            Add Option
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
