'use client';

import { useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, Settings2, Trash2, Edit2, LayoutGrid, Rocket, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { createComboItem, updateComboItem } from '@/app/lib/menuApi';

const GROUP_TITLE_PRESETS = {
  'Protein & Meat': ['Choose your protein', 'Choose your meat cut', 'Choose your meat'],
  'Swallows & Soups': ['Choose your swallow', 'Choose your soup'],
  'Rice & Pasta': ['Choose your rice type', 'Choose your pasta variant'],
  'Sides': ['Choose your side', 'Add a side dish'],
  'Sauce & Spice': ['Choose your sauce', 'Spice level'],
  'Drinks': ['Add a drink', 'Choose your drink'],
  'Extras & Toppings': ['Add toppings', 'Add extras'],
};

export default function Step4AddOns() {
  const store = useCreateComboStore();
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  
  // Group Form State
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState('0');
  const [maxSelections, setMaxSelections] = useState('1');

  // Option Inputs State
  const [optionInputs, setOptionInputs] = useState({});

  const handleOpenGroupForm = (group = null) => {
    if (typeof group === 'string') {
        // Quick add from presets
        setEditingGroupId(null);
        setGroupName(group);
        setIsRequired(false);
        setMinSelections('0');
        setMaxSelections('100');
    } else if (group && group.tempId) {
        setEditingGroupId(group.tempId);
        setGroupName(group.name);
        setIsRequired(group.is_required);
        setMinSelections(group.min_selections.toString());
        setMaxSelections(group.max_selections.toString());
    } else {
        setEditingGroupId(null);
        setGroupName('');
        setIsRequired(false);
        setMinSelections('0');
        setMaxSelections('100');
    }
    setShowGroupForm(true);
  };

  const handleSaveGroup = () => {
    if (!groupName.trim()) {
        toast.error('Group name required');
        return;
    }

    const min = Number(minSelections);
    const max = Number(maxSelections);

    if (min > max) {
        toast.error('Min cannot be greater than Max');
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
        toast.success('Group settings updated');
    } else {
        store.addChoiceGroup({
            ...data,
            tempId: Date.now().toString(),
            options: [],
        });
        toast.success('Choice group added');
    }

    setShowGroupForm(false);
  };

  const handleAddOption = (groupId) => {
    const input = optionInputs[groupId] || { name: '', price: '' };
    if (!input.name.trim()) return;

    store.addChoiceOption(groupId, {
      tempId: Date.now().toString(),
      label: input.name.trim(),
      price_modifier_naira: Number(input.price) || 0,
      is_available: true,
    });

    setOptionInputs(prev => ({
        ...prev,
        [groupId]: { name: '', price: '' }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: PRESETS */}
        <div className="lg:col-span-4 space-y-5 border-r border-slate-100 dark:border-slate-800/50 pr-5">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Add Step or Section</h3>
                <p className="text-[11px] font-medium text-slate-500 mt-1">Select a preset to quickly build your combo structure.</p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Choose Template</label>
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                handleOpenGroupForm(e.target.value);
                                e.target.value = ""; // Reset to placeholder
                            }
                        }}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 ring-offset-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer appearance-none"
                    >
                        <option value="">-- Choose a standard preset --</option>
                        {Object.entries(GROUP_TITLE_PRESETS).map(([category, presets]) => (
                            <optgroup key={category} label={category} className="text-xs font-bold text-slate-400 py-2">
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

                <div className="p-4 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl">
                    <div className="flex gap-3">
                        <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                            Presets automatically include logical rules (e.g. "Select 1"). You can customize prices and quantities after adding.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: BUILDER */}
        <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sections ({store.choice_groups.length})</h3>
                <button 
                    onClick={() => handleOpenGroupForm()}
                    className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 underline underline-offset-4"
                >
                    + Custom Section
                </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {store.choice_groups.map((group) => (
                  <motion.div
                    key={group.tempId}
                    layout
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    className="rounded-xl overflow-hidden bg-orange-50/50 dark:bg-orange-400/5 backdrop-blur-xl border border-orange-200/50 dark:border-orange-500/10 shadow-sm"
                  >
                    {/* Group Header - Clickable for convenience */}
                    <div 
                        onClick={() => setExpandedGroupId(expandedGroupId === group.tempId ? null : group.tempId)}
                        className="flex items-center justify-between px-4 py-3 border-b border-orange-200/30 dark:border-orange-500/10 cursor-pointer hover:bg-orange-100/30 dark:hover:bg-orange-500/5 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{group.name}</span>
                            {group.is_required && (
                                <span className="text-[7px] font-black bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Mandatory</span>
                            )}
                        </div>
                        <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            {group.options.length} item{group.options.length !== 1 ? 's' : ''} • Pick {group.min_selections == group.max_selections ? group.min_selections : `${group.min_selections}-${group.max_selections}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest hidden sm:inline-block pr-2 border-r border-orange-200/50">
                            {expandedGroupId === group.tempId ? 'CLOSE' : 'MANAGE'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); store.removeChoiceGroup(group.tempId); }}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                            >
                                <Trash2 size={12} />
                            </button>
                            <button
                                className={`w-7 h-7 rounded-lg text-orange-600 flex items-center justify-center transition-all ${expandedGroupId === group.tempId ? 'rotate-180' : ''}`}
                            >
                                <ChevronDown size={14} strokeWidth={3} />
                            </button>
                        </div>
                      </div>
                    </div>

                    {/* Group Details (Expandable) */}
                    <AnimatePresence>
                      {expandedGroupId === group.tempId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 space-y-5"
                        >
                          {/* Active Options */}
                          <div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Created Items ({group.options.length})</h4>
                            {group.options.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-orange-200 dark:border-orange-500/20 rounded-xl bg-orange-500/5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No options created yet</p>
                                </div>
                            ) : group.options.length > 1 ? (
                                <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-none snap-x mask-fade-right">
                                    {group.options.map((opt) => (
                                    <motion.div 
                                        layout
                                        key={opt.tempId}
                                        className="flex-none w-44 snap-start group/item"
                                    >
                                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-orange-200 dark:border-orange-500/10 shadow-sm bg-white dark:bg-slate-900 group-hover/item:border-orange-400 transition-all">
                                            {opt.image_url ? (
                                                <img src={opt.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover/item:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-orange-50 dark:bg-slate-950">
                                                    <span className="text-[9px] font-black text-orange-200 uppercase tracking-widest">Graphic</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); store.removeChoiceOption(group.tempId, opt.tempId); }}
                                                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-rose-600 text-white shadow-xl flex items-center justify-center opacity-0 group-hover/item:opacity-100 active:scale-90 transition-all z-10"
                                            >
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                                <div className="text-[10px] font-black uppercase truncate italic">{opt.label}</div>
                                                <div className="text-[10px] font-bold text-orange-400 tabular-nums">
                                                    {opt.price_modifier_naira > 0 ? `+ ₦${opt.price_modifier_naira.toLocaleString()}` : "FREE"}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {group.options.map((opt) => (
                                        <motion.div 
                                            layout
                                            key={opt.tempId}
                                            className="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-orange-200/50 dark:border-orange-500/10 group/item hover:border-orange-400 transition-all"
                                        >
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-orange-200/30 shrink-0">
                                                {opt.image_url ? (
                                                    <img src={opt.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-orange-50 dark:bg-slate-950 flex items-center justify-center">
                                                        <span className="text-[8px] font-black text-orange-200 uppercase">IMG</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{opt.label}</div>
                                                <div className="text-[10px] font-bold text-orange-600 tabular-nums">
                                                    {opt.price_modifier_naira > 0 ? `+ ₦${opt.price_modifier_naira.toLocaleString()}` : "Included"}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => store.removeChoiceOption(group.tempId, opt.tempId)}
                                                className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                          </div>

                          {/* Inline Add Option Form */}
                          <div className="pt-5 border-t border-orange-200/30 dark:border-orange-500/10">
                            <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-3 pl-1 italic flex items-center gap-2">
                                <Plus size={10} strokeWidth={4} />
                                Add New Item To This Section
                            </h4>
                                <div className="flex gap-2">
                                    <div className="flex-[2] space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Item Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="EX. Jollof Rice" 
                                            value={optionInputs[group.tempId]?.name || ""}
                                            onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], name: e.target.value } }))}
                                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase outline-none focus:border-orange-500 shadow-sm"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Price (₦)</label>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            value={optionInputs[group.tempId]?.price || ""}
                                            onChange={e => setOptionInputs(prev => ({ ...prev, [group.tempId]: { ...prev[group.tempId], price: e.target.value } }))}
                                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-orange-600 outline-none focus:border-orange-500 tabular-nums shadow-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => handleAddOption(group.tempId)}
                                            disabled={!optionInputs[group.tempId]?.name?.trim()}
                                            className="h-10 px-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-30 whitespace-nowrap shadow-lg"
                                        >
                                            Add Item
                                        </button>
                                    </div>
                                </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {store.choice_groups.length === 0 && (
                <div className="py-12 bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center px-6">
                    <LayoutGrid size={24} className="text-slate-300 mb-2 truncate" strokeWidth={1} />
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Static Bundle</h4>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Add sections to allow item swaps or extras</p>
                </div>
            )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────  */}
      {/* MODAL: CHOICE GROUP SETTINGS */}
      {/* ─────────────────────────────────────────────────────────────────────  */}
      <AnimatePresence>
        {showGroupForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowGroupForm(false)}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800"
                >
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settings</h4>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Section Config</h3>
                            </div>
                            <button 
                                onClick={() => setShowGroupForm(false)}
                                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Section Title</label>
                                <div className="relative">
                                    <select
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[12px] font-black uppercase tracking-wide text-slate-900 dark:text-white outline-none focus:border-orange-500 appearance-none cursor-pointer"
                                    >
                                        <option value="">-- SELECT HEADER NAME --</option>
                                        {Object.entries(GROUP_TITLE_PRESETS).map(([category, presets]) => (
                                            <optgroup key={category} label={category.toUpperCase()} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {presets.map(item => (
                                                    <option key={item} value={item} className="text-xs">
                                                        {item.toUpperCase()}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                        <option value="Custom Section">CUSTOM SECTION</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Required Section?</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Mandatory for checkout</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsRequired(!isRequired)}
                                        className={`w-10 h-5 rounded-full p-1 transition-all ${isRequired ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-all ${isRequired ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-1">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Min Picks</label>
                                        <input type="number" min="0" value={minSelections} onChange={e => setMinSelections(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black tabular-nums outline-none focus:border-orange-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Max Picks</label>
                                        <input type="number" min="1" value={maxSelections} onChange={e => setMaxSelections(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black tabular-nums outline-none focus:border-orange-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveGroup}
                            className="w-full h-12 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all"
                        >
                            {editingGroupId ? 'Update Section' : 'Add Section'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SummaryItem({ label, value, isBadge }) {
    return (
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">{label}:</span>
            {isBadge ? (
                <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded italic">{value}</span>
            ) : (
                <span className="text-white truncate max-w-[120px] text-right">{value}</span>
            )}
        </div>
    );
}
