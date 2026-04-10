"use client";

import { useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { Edit2, Plus, Trash2, X, ChevronDown, LayoutGrid, Info, Settings2, DollarSign, Camera, Loader2 } from "lucide-react";
import uploadToCloudinary from "@/app/components/user_profile/helpers/uploadToCloudinary";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const GROUP_TITLE_PRESETS = {
    "Protein & Meat": ["Choose your protein", "Choose your meat cut", "Choose your meat"],
    "Swallows & Soups": ["Choose your swallow", "Choose your soup"],
    "Rice & Pasta": ["Choose your rice type", "Choose your pasta variant"],
    "Sides": ["Choose your side", "Add a side dish"],
    "Sauce & Spice": ["Choose your sauce", "Spice level"],
    "Drinks": ["Add a drink", "Choose your drink"],
    "Extras & Toppings": ["Add toppings", "Add extras"],
};

export default function Step4AddOns() {
    const store = useCreateFoodStore();
    const [expandedGroupId, setExpandedGroupId] = useState(null);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [showOptionForm, setShowOptionForm] = useState(false);
    
    // Group Form State
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [groupName, setGroupName] = useState("");
    const [isRequired, setIsRequired] = useState(false);
    const [minSelections, setMinSelections] = useState("0");
    const [maxSelections, setMaxSelections] = useState("1");

    // Option Form State
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [editingOptionId, setEditingOptionId] = useState(null);
    const [optionLabel, setOptionLabel] = useState("");
    const [optionPrice, setOptionPrice] = useState("");
    const [optionImage, setOptionImage] = useState("");
    const [isUploadingOptionImage, setIsUploadingOptionImage] = useState(false);

    const handleOpenGroupForm = (group = null) => {
        if (typeof group === 'string') {
            setEditingGroupId(null);
            setGroupName(group);
            setIsRequired(false);
            setMinSelections("0");
            setMaxSelections("100");
        } else if (group && group.tempId) {
            setEditingGroupId(group.tempId);
            setGroupName(group.name);
            setIsRequired(group.is_required);
            setMinSelections(group.min_selections.toString());
            setMaxSelections(group.max_selections.toString());
        } else {
            setEditingGroupId(null);
            setGroupName("");
            setIsRequired(false);
            setMinSelections("0");
            setMaxSelections("100");
        }
        setShowGroupForm(true);
    };

    const handleOpenOptionForm = (groupId, option = null) => {
        setActiveGroupId(groupId);
        if (option) {
            setEditingOptionId(option.tempId);
            setOptionLabel(option.label);
            setOptionPrice(option.price_modifier_naira.toString());
            setOptionImage(option.image_url || "");
        } else {
            setEditingOptionId(null);
            setOptionLabel("");
            setOptionPrice("");
            setOptionImage("");
        }
        setShowOptionForm(true);
    };

    const handleSaveGroup = () => {
        if (!groupName.trim()) {
            toast.error("Group name required");
            return;
        }

        const min = Number(minSelections);
        const max = Number(maxSelections);

        if (min > max) {
            toast.error("Min cannot be greater than Max");
            return;
        }

        const data = {
            name: groupName.trim(),
            is_required: isRequired || min > 0,
            min_selections: min,
            max_selections: max,
        };

        if (editingGroupId) {
            store.updateChoiceGroup(editingGroupId, data);
            toast.success("Group updated");
        } else {
            store.addChoiceGroup({
                ...data,
                tempId: Date.now().toString(),
                options: [],
            });
            toast.success("Group added");
        }

        setShowGroupForm(false);
    };

    const handleOptionImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingOptionImage(true);
        try {
            const url = await uploadToCloudinary(file);
            if (url) {
                setOptionImage(url);
                toast.success("Image uploaded!");
            } else {
                toast.error("Failed to upload image.");
            }
        } catch (err) {
            toast.error("An error occurred during upload.");
            console.error(err);
        } finally {
            setIsUploadingOptionImage(false);
        }
    };

    const handleSaveOption = () => {
        if (!optionLabel.trim()) {
            toast.error("Option name required");
            return;
        }

        const data = {
            label: optionLabel.trim(),
            price_modifier_naira: Number(optionPrice) || 0,
            is_available: true,
            image_url: optionImage,
        };

        if (editingOptionId) {
            store.updateChoiceOption(activeGroupId, editingOptionId, data);
            toast.success("Option updated");
        } else {
            store.addChoiceOption(activeGroupId, {
                ...data,
                tempId: Date.now().toString(),
            });
            toast.success("Option added");
        }

        setShowOptionForm(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: PRESETS */}
                <div className="lg:col-span-4 space-y-6 border-r border-slate-100 dark:border-slate-800/50 pr-5">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-600 rounded-full inline-block"></span>
                            Choice Builder
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Select a template to quickly add customer choices.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 pl-1 transition-colors group-focus-within:text-orange-600">
                                <LayoutGrid size={10} strokeWidth={3} />
                                Choose Template
                            </label>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleOpenGroupForm(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                                className="w-full h-12 px-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 appearance-none outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner cursor-pointer"
                            >
                                <option value="">-- Categories --</option>
                                {Object.entries(GROUP_TITLE_PRESETS).map(([category, presets]) => (
                                    <optgroup key={category} label={category.toUpperCase()} className="text-[10px] font-black text-slate-400">
                                        {presets.map(item => (
                                            <option key={item} value={item} className="text-sm font-medium py-1">
                                                {item}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <div className="absolute right-4 bottom-[14px] pointer-events-none text-slate-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>

                        <div className="p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 rounded-xl">
                            <div className="flex gap-3">
                                <Info size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    Templates add logical rules (e.g. "Pick 1"). You can customize settings later.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: BUILDER */}
                <div className="lg:col-span-8 space-y-4 pt-1 lg:pt-0">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Settings2 size={10} strokeWidth={3} />
                            Active Sections ({store.choice_groups.length})
                        </h3>
                        <button 
                            onClick={() => handleOpenGroupForm()}
                            className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 px-3 py-1.5 rounded-lg border border-transparent hover:border-orange-200 dark:hover:border-orange-900/50 transition-all"
                        >
                            + Custom Section
                        </button>
                    </div>

                    <div className="space-y-4 px-1">
                      <AnimatePresence mode="popLayout">
                        {store.choice_groups.map((group) => (
                          <motion.div
                            key={group.tempId}
                            layout
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            className="rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50"
                          >
                            <div 
                                onClick={() => setExpandedGroupId(expandedGroupId === group.tempId ? null : group.tempId)}
                                className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{group.name}</span>
                                    {group.is_required && (
                                        <span className="text-[8px] font-black bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase">Mandatory</span>
                                    )}
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {group.options.length} item{group.options.length !== 1 ? 's' : ''} • Pick {group.min_selections == group.max_selections ? group.min_selections : `${group.min_selections}-${group.max_selections}`}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenGroupForm(group); }}
                                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-orange-600 hover:border-orange-300 dark:hover:border-orange-800 flex items-center justify-center transition-all shadow-sm active:scale-95"
                                    >
                                        <Settings2 size={12} strokeWidth={3} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); store.removeChoiceGroup(group.tempId); }}
                                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 flex items-center justify-center transition-all shadow-sm active:scale-95"
                                    >
                                        <Trash2 size={12} strokeWidth={3} />
                                    </button>
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedGroupId === group.tempId ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedGroupId === group.tempId && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-4 space-y-4 bg-white dark:bg-slate-900/50"
                                >
                                  {/* Active Options */}
                                  <div className="space-y-2">
                                    {group.options.length === 0 ? (
                                        <div className="py-6 px-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No choices added yet</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70 leading-relaxed">Vendors: Please create your Addons/Extras under this group</p>
                                        </div>
                                    ) : (
                                        group.options.map((opt) => (
                                            <motion.div 
                                                layout
                                                key={opt.tempId}
                                                className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 group/item hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {opt.image_url ? (
                                                        <img src={opt.image_url} alt={opt.label} className="w-9 h-9 rounded-xl object-cover border border-orange-100 dark:border-slate-700" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 flex items-center justify-center text-[11px] font-black text-orange-600">
                                                            {opt.price_modifier_naira > 0 ? "+" : "✓"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{opt.label}</div>
                                                        <div className="text-[10px] font-black text-orange-600 tabular-nums">
                                                            {opt.price_modifier_naira > 0 ? `+ ₦${opt.price_modifier_naira.toLocaleString()}` : "Included"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenOptionForm(group.tempId, opt)}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-300 hover:text-orange-600 transition-all flex items-center justify-center"
                                                    >
                                                        <Edit2 size={10} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => store.removeChoiceOption(group.tempId, opt.tempId)}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-300 hover:text-rose-600 transition-all flex items-center justify-center"
                                                    >
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                  </div>

                                  {/* Add Choice Trigger */}
                                  <button
                                    onClick={() => handleOpenOptionForm(group.tempId)}
                                    className="w-full h-12 mt-2 bg-orange-50/80 dark:bg-orange-500/10 border border-transparent rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all active:scale-[0.99]"
                                  >
                                    <Plus size={14} strokeWidth={3} />
                                    Add New Choice
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {store.choice_groups.length === 0 && (
                        <div className="py-16 bg-white dark:bg-slate-950/30 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center px-12">
                            <LayoutGrid size={32} className="text-slate-200 mb-4" strokeWidth={1} />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">No Custom Choices</h4>
                            <button onClick={() => handleOpenGroupForm()} className="h-10 px-8 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-none transition-all">
                                Create Choice Group
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: CHOICE GROUP SETTINGS */}
            <AnimatePresence>
                {showGroupForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGroupForm(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Choice Configuration</h3>
                                    <button onClick={() => setShowGroupForm(false)} className="text-slate-400 hover:text-rose-600 transition-colors">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">Section Header</label>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={e => setGroupName(e.target.value)}
                                            placeholder="e.g. Choose your protein"
                                            className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-inner transition-all"
                                        />
                                    </div>

                                    <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Required Section?</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">Force choice for customer</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsRequired(!isRequired)}
                                                className={`w-10 h-5 rounded-full p-1 transition-all ${isRequired ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-all ${isRequired ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pb-1">
                                            <div className="space-y-1.5 relative group">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-orange-600 transition-colors block pl-1">Min Picks</label>
                                                <input type="number" min="0" value={minSelections} onChange={e => setMinSelections(e.target.value)} className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black tabular-nums outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all" />
                                            </div>
                                            <div className="space-y-1.5 relative group">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-orange-600 transition-colors block pl-1">Max Picks</label>
                                                <input type="number" min="1" value={maxSelections} onChange={e => setMaxSelections(e.target.value)} className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black tabular-nums outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveGroup}
                                    className="w-full h-14 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 hover:bg-orange-700"
                                >
                                    {editingGroupId ? 'Update Settings' : 'Create Section'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: CHOICE OPTION BUILDER */}
            <AnimatePresence>
                {showOptionForm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOptionForm(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-600/10 text-orange-600 flex items-center justify-center">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-tight">Choice Details</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Set price and label</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowOptionForm(false)} className="text-slate-300 hover:text-rose-600 transition-colors">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-1.5 relative group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Item Title</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={optionLabel}
                                            onChange={e => setOptionLabel(e.target.value)}
                                            placeholder="E.G. CHEDDAR CHEESE"
                                            className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-inner transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5 relative group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Additional Cost</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600 font-black text-md">₦</span>
                                            <input
                                                type="number"
                                                value={optionPrice}
                                                onChange={e => setOptionPrice(e.target.value)}
                                                placeholder="0"
                                                className="w-full h-14 pl-12 pr-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[14px] font-black text-orange-600 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 tabular-nums shadow-inner transition-all"
                                            />
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-widest pl-4 mt-2">Leave 0 if free</p>
                                    </div>
                                    
                                    <div className="space-y-1.5 relative group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Choice Image (Optional)</label>
                                        <div className="flex items-center gap-3">
                                            {optionImage ? (
                                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-200 dark:border-slate-700">
                                                    <img src={optionImage} alt="Option" className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => setOptionImage("")}
                                                        className="absolute top-1 right-1 bg-black/50 hover:bg-rose-500 rounded-full p-0.5 text-white transition-colors"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 cursor-pointer transition-all">
                                                    {isUploadingOptionImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                                    <input type="file" accept="image/*" className="hidden" disabled={isUploadingOptionImage} onChange={handleOptionImageUpload} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveOption}
                                    className="w-full h-14 bg-orange-600 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[11px] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 hover:bg-orange-700"
                                >
                                    {editingOptionId ? 'Apply Changes' : 'Confirm Choice'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
