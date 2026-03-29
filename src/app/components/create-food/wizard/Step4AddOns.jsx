"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Trash2, X, Search, Settings2, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 md:p-6 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4">
                
                {/* ── LEFT SIDE: TEMPLATES ─────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Options & Add-ons</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed">Add sections like 'Choose your protein' or 'Add extra toppings' to let customers customize their order.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Suggested Options</h3>
                        </div>

                        {/* Search Templates */}
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search for options (e.g. Meat, Drinks)..."
                                value={templateSearch}
                                onChange={(e) => setTemplateSearch(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            />
                        </div>

                        {/* Scrollable Templates */}
                        <div className="lg:h-[500px] overflow-y-auto pr-2 space-y-6 no-scrollbar">
                            {Object.entries(GROUP_TITLE_PRESETS).map(([category, presets]) => {
                                const filtered = presets.filter(p => p.toLowerCase().includes(templateSearch.toLowerCase()));
                                if (filtered.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{category}</span>
                                        <div className="grid md:grid-cols-1 gap-1">
                                            {filtered.map(preset => {
                                                const isActive = groupName === preset && showGroupForm;
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
                                                        className={`group flex items-center justify-between p-3 rounded-md border transition-all text-left ${isActive 
                                                            ? "bg-orange-600 border-transparent text-white" 
                                                            : "bg-orange-300/20 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-600/30"}`}
                                                    >
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-orange-600"}`}>{preset}</span>
                                                        <Plus size={12} className={isActive ? "text-white" : "text-slate-300"} strokeWidth={3} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: ACTIVE GROUPS ─────────── */}
                <div className="lg:col-span-8 space-y-6 pb-20">
                    <div className="space-y-4">
                        {store.choice_groups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-6">
                                <div className="w-16 h-16 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                                    <Plus size={32} strokeWidth={1} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No options added yet</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add groups like 'Choice of Protein' to give your customers more ways to order.</p>
                                </div>
                                <button
                                    onClick={() => handleOpenGroupForm()}
                                    className="h-10 px-8 bg-orange-600 text-white font-black uppercase tracking-widest text-[10px] rounded-md transition-all active:scale-95"
                                >
                                    Add Your First Options Group
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Current Options Groups ({store.choice_groups.length})</h3>
                                    <button onClick={() => handleOpenGroupForm()} className="text-[11px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors bg-orange-600/10 px-4 py-2 rounded-md border border-orange-600/10">+ Add New Group</button>
                                </div>

                                {store.choice_groups.map(group => (
                                    <div key={group.tempId} className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-0.5">
                                                    <h4 className="font-black text-[12px] text-slate-900 dark:text-white uppercase tracking-widest">{group.name}</h4>
                                                    {group.is_required && <span className="bg-orange-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Required</span>}
                                                </div>
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest underline decoration-orange-500/30 offset-2 decoration-2">Configuration: {group.min_selections}–{group.max_selections} Selection(s) allowed</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenGroupForm(group)} className="w-8 h-8 rounded-md bg-white dark:bg-slate-950 text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all"><Edit2 size={12} /></button>
                                                <button onClick={() => store.removeChoiceGroup(group.tempId)} className="w-8 h-8 rounded-md bg-white dark:bg-slate-950 text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-1">
                                            {group.options.map(opt => (
                                                <div key={opt.tempId} className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/50 group/opt transition-all border border-transparent hover:border-slate-100">
                                                    <div className="w-10 h-10 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                                        {opt.image_url ? <img src={opt.image_url} alt="" className="w-full h-full object-cover" /> : <div className="text-[8px] font-black text-slate-300 italic">PHOTO</div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black text-[10px] text-slate-900 dark:text-white uppercase tracking-widest truncate">{opt.label}</div>
                                                        <div className="text-[9px] font-black text-orange-600 tabular-nums">+₦{opt.price_modifier_naira.toLocaleString()}</div>
                                                    </div>
                                                    <button onClick={() => store.removeChoiceOption(group.tempId, opt.tempId)} className="w-6 h-6 rounded-md text-slate-200 hover:text-red-600 lg:opacity-0 group-hover/opt:opacity-100 transition-all flex items-center justify-center"><X size={12} /></button>
                                                </div>
                                            ))}

                                            {/* Inline Option Builder */}
                                            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-md border border-slate-100 dark:border-slate-800 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">NAME</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Choice name (e.g. Extra Cheese)" 
                                                            value={optionInputs[group.tempId]?.name || ""}
                                                            onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], name: e.target.value } }))}
                                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest focus:border-orange-600 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">EXTRA PRICE</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">+₦</span>
                                                            <input 
                                                                type="number" 
                                                                placeholder="0.00" 
                                                                value={optionInputs[group.tempId]?.price || ""}
                                                                onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], price: e.target.value } }))}
                                                                className="w-full h-10 pl-8 pr-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-black text-orange-600 outline-none focus:border-orange-600 tabular-nums"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">IMAGE URL (OPTIONAL)</label>
                                                        <input 
                                                            type="url" 
                                                            placeholder="https://..." 
                                                            value={optionInputs[group.tempId]?.image_url || ""}
                                                            onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], image_url: e.target.value } }))}
                                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-black uppercase tracking-widest focus:border-orange-600 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => handleAddOption(group.tempId)}
                                                        className="h-10 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md font-black uppercase tracking-widest text-[9px] active:scale-[0.98] transition-all border border-transparent dark:border-white/10"
                                                    >
                                                        Add to Group
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── MODAL OVERLAY: CREATE/EDIT GROUP ─────────── */}
                <AnimatePresence>
                    {showGroupForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowGroupForm(false)}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800"
                            >
                                {/* Header */}
                                <div className="bg-slate-900 dark:bg-slate-950 px-8 py-6 flex items-center justify-between border-b border-white/5 relative overflow-hidden">
                                     {/* Background decoration */}
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                     
                                     <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                            <Settings2 size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-[0.2em] text-[11px] leading-none mb-1">
                                                {groupId ? "Edit Section" : "New Selection Group"}
                                            </h3>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Setup rules & visibility</p>
                                        </div>
                                     </div>

                                    <button 
                                        onClick={() => setShowGroupForm(false)} 
                                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all relative z-10"
                                    >
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section Header</label>
                                            <div className="flex items-center gap-1.5 text-orange-500">
                                                <HelpCircle size={10} />
                                                <span className="text-[8px] font-black uppercase tracking-widest italic cursor-help">Recommended</span>
                                            </div>
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={groupName}
                                            onChange={e => { setGroupName(e.target.value); setIsCustomTitle(true); }}
                                            placeholder="e.g. Choose your protein, Extra toppings..."
                                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-[12px] uppercase italic tracking-tight focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Make this required</span>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Force choice before checkout</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsRequired(!isRequired)}
                                                className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ${isRequired ? "bg-orange-600" : "bg-slate-200 dark:bg-slate-800"}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${isRequired ? "translate-x-6" : "translate-x-0"}`} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-white/5">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MIN CHOICES</label>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    value={minSelections} 
                                                    onChange={e => setMinSelections(e.target.value)} 
                                                    className="w-full h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-black text-[12px] text-slate-900 dark:text-white tabular-nums outline-none focus:border-orange-500" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MAX CHOICES</label>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    value={maxSelections} 
                                                    onChange={e => setMaxSelections(e.target.value)} 
                                                    className="w-full h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-black text-[12px] text-slate-900 dark:text-white tabular-nums outline-none focus:border-orange-500" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <button 
                                            onClick={handleSaveGroup} 
                                            className="order-1 sm:order-2 flex-[2] h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] active:scale-[0.98] transition-all italic"
                                        >
                                            {groupId ? "Update Section" : "Enable Options Group"}
                                        </button>
                                        <button 
                                            onClick={() => setShowGroupForm(false)} 
                                            className="order-2 sm:order-1 flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
