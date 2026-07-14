"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ChevronRight, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import toast from "react-hot-toast";

export default function ComboCustomizationModal({
    combo, vendor, isOpen, onClose, onAdd
}) {
    const [selections, setSelections] = useState({});
    const [quantity, setQuantity] = useState(1);
    const cartContext = useCart();
    const setIsModalOpen = cartContext?.setIsModalOpen;

    // Sync modal open state with CartContext if needed
    useEffect(() => {
        if (typeof setIsModalOpen === 'function') {
            setIsModalOpen(isOpen);
        }
        return () => {
            if (typeof setIsModalOpen === 'function') setIsModalOpen(false);
        };
    }, [isOpen, setIsModalOpen]);

    // Reset selections when combo changes
    useEffect(() => {
        if (isOpen && combo) {
            setSelections({});
            setQuantity(1);
        }
    }, [isOpen, combo?._id]);

    if (!isOpen || !combo) return null;

    const choiceGroups = combo.choice_groups || [];

    // Calculate total: base price + selected modifiers
    const addonsPrice = Object.values(selections).reduce((acc, sel) => {
        if (Array.isArray(sel)) {
            return acc + sel.reduce((s, o) => s + ((o.price_modifier_naira || 0) * (o.quantity || 1)), 0);
        }
        return acc + ((sel?.price_modifier_naira || 0) * (sel?.quantity || 1));
    }, 0);

    const totalUnit = (combo.price_naira || 0) + addonsPrice;
    const total = totalUnit * quantity;

    const isOptionSelected = (groupKey, label) => {
        const sel = selections[groupKey];
        if (Array.isArray(sel)) return sel.some(i => i.label === label);
        return sel?.label === label;
    };

    const toggleChoice = (groupKey, group, option) => {
        setSelections(prev => {
            const current = prev[groupKey];
            const isMulti = group.max_selections > 1;

            if (!isMulti) {
                if (current?.label === option.label) {
                    if (group.is_required) return prev; // Cannot deselect required single-select
                    const n = { ...prev };
                    delete n[groupKey];
                    return n;
                }
                return { ...prev, [groupKey]: { ...option, quantity: 1 } };
            }

            const list = Array.isArray(current) ? current : [];
            const exists = list.find(i => i.label === option.label);
            if (exists) {
                if (group.is_required && list.length === 1) {
                    toast.error(`"${group.name}" is required`);
                    return prev;
                }
                return {
                    ...prev,
                    [groupKey]: list.filter(i => i.label !== option.label)
                };
            }

            const totalInGroup = list.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
            if (totalInGroup >= group.max_selections) {
                toast.error(`Max ${group.max_selections} selections for ${group.name}`);
                return prev;
            }

            return { ...prev, [groupKey]: [...list, { ...option, quantity: 1 }] };
        });
    };

    const updateOptionQuantity = (groupKey, optionLabel, delta, group) => {
        setSelections(prev => {
            const current = prev[groupKey];
            if (!current) return prev;

            if (group.max_selections <= 1) {
                const newQty = (current.quantity || 1) + delta;
                if (newQty <= 0) {
                    if (group.is_required) return prev;
                    const n = { ...prev };
                    delete n[groupKey];
                    return n;
                }
                if (delta > 0 && newQty > group.max_selections) {
                    toast.error(`Max ${group.max_selections} selection for ${group.name}`);
                    return prev;
                }
                return { ...prev, [groupKey]: { ...current, quantity: newQty } };
            }

            const list = Array.isArray(current) ? current : [];
            const index = list.findIndex(i => i.label === optionLabel);
            if (index === -1) return prev;

            const item = list[index];
            const newQty = (item.quantity || 1) + delta;
            
            if (newQty <= 0) {
                if (group.is_required && list.length === 1) return prev;
                return {
                    ...prev,
                    [groupKey]: list.filter(i => i.label !== optionLabel)
                };
            }

            const totalInGroup = list.reduce((acc, curr, i) => acc + (i === index ? newQty : (curr.quantity || 1)), 0);
            if (delta > 0 && totalInGroup > group.max_selections) {
                toast.error(`Max ${group.max_selections} selections for ${group.name}`);
                return prev;
            }

            const newList = [...list];
            newList[index] = { ...item, quantity: newQty };
            return { ...prev, [groupKey]: newList };
        });
    };

    const handleAddToCart = () => {
        // Validation: Required groups
        for (const group of choiceGroups) {
            const groupKey = group._id.toString();
            const sel = selections[groupKey];
            let count = 0;
            if (Array.isArray(sel)) {
                count = sel.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
            } else if (sel) {
                count = (sel.quantity || 1);
            }

            if (group.is_required && count < group.min_selections) {
                toast.error(`Please select at least ${group.min_selections} for "${group.name}"`);
                return;
            }
        }

        const selected_options = [];
        Object.keys(selections).forEach(key => {
            const group = choiceGroups.find(g => g._id.toString() === key);
            const sel = selections[key];
            const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
            items.forEach(opt => {
                selected_options.push({
                    group_id:             group._id,
                    group_name:           group.name,
                    option_id:            opt._id,
                    label:                opt.label,
                    price_modifier_naira: opt.price_modifier_naira || 0,
                    quantity:             opt.quantity || 1,
                });
            });
        });

        onAdd({
            type:          "combo",
            comboId:       combo._id,
            vendorId:      vendor._id,
            storeName:     vendor.storeName,
            restaurantId:  vendor._id,
            name:          combo.name,
            image_url:     combo.image_url || "",
            price_naira:   totalUnit,
            quantity:      quantity,
            deliveryFee:   vendor.deliveryFee || 0,
            selected_options,
        });
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[92vh] border border-zinc-100 dark:border-zinc-800"
                >
                    {/* Header Image */}
                    <div className="relative h-[250px] shrink-0">
                        <img
                            src={combo.image_url || "/placeholder.jpg"}
                            alt={combo.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                           <div className="bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20">
                               Combo Customization
                           </div>
                           <button
                                onClick={onClose}
                                className="p-2 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-colors border border-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6">
                           <h3 className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">
                                {combo.name}
                            </h3>
                            {combo.description && (
                                <p className="text-xs text-white/70 mt-2 line-clamp-2 italic font-medium">
                                    {combo.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-none pb-36 px-4 pt-6 space-y-8">
                        {/* What's Included */}
                        {combo.contents?.length > 0 && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-green-500 rounded-full" />
                                    <h4 className="font-black text-zinc-900 dark:text-white text-[11px] uppercase tracking-widest">
                                        Fixed Content
                                    </h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {combo.contents.map((item, idx) => (
                                        <div key={idx} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-700 text-[11px] font-black uppercase tracking-tight italic text-zinc-600 dark:text-zinc-300">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Choice Groups */}
                        {choiceGroups.map(group => {
                            const groupKey = group._id.toString();
                            const groupSelection = selections[groupKey];
                            const isMet = group.is_required ? (
                                Array.isArray(groupSelection) 
                                ? groupSelection.reduce((a,c) => a + (c.quantity || 1), 0) >= group.min_selections
                                : groupSelection !== undefined
                            ) : true;

                            return (
                                <div key={groupKey} className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                           <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                           <h4 className="font-black text-zinc-900 dark:text-white text-sm uppercase italic tracking-tight">
                                               {group.name}
                                           </h4>
                                        </div>
                                        {group.is_required ? (
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                                                isMet ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                            }`}>
                                                {isMet ? '✓ Selection Met' : 'Required'}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-black text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                Optional
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-4">
                                        {group.max_selections > 1
                                            ? `Pick ${group.min_selections}–${group.max_selections}`
                                            : "Pick exactly one"}
                                    </p>

                                    <div className="space-y-2">
                                        {group.options.filter(o => o.is_available).map(option => {
                                            const isSelected = isOptionSelected(groupKey, option.label);
                                            return (
                                                <div 
                                                    key={option._id}
                                                    onClick={() => toggleChoice(groupKey, group, option)}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-lg shadow-orange-500/5"
                                                            : "border-zinc-50 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-100 dark:hover:border-zinc-700"
                                                    }`}
                                                >
                                                    {option.image_url && <img src={option.image_url} alt={option.label} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-100 dark:border-zinc-800" />}
                                                    <div className="flex-1 min-w-0 pl-1">
                                                        <p className="font-black text-[13px] text-zinc-900 dark:text-white truncate uppercase italic tracking-tight">
                                                            {option.label}
                                                        </p>
                                                        <p className="text-[11px] font-black text-orange-500 mt-0.5">
                                                            {option.price_modifier_naira > 0 ? `+₦${option.price_modifier_naira.toLocaleString()}` : 'Included'}
                                                        </p>
                                                    </div>

                                                    {isSelected ? (
                                                        <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                                                            <button 
                                                                onClick={() => updateOptionQuantity(groupKey, option.label, -1, group)}
                                                                className="w-[30px] h-[30px] flex items-center justify-center rounded-[10px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900 transition-colors"
                                                            >
                                                                <Minus size={14} strokeWidth={3} />
                                                            </button>
                                                            <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[14px] text-center tabular-nums">
                                                                {Array.isArray(selections[groupKey]) 
                                                                    ? selections[groupKey].find(i => i.label === option.label)?.quantity || 1
                                                                    : selections[groupKey]?.quantity || 1}
                                                            </span>
                                                            <button 
                                                                onClick={() => updateOptionQuantity(groupKey, option.label, 1, group)}
                                                                className="w-[30px] h-[30px] flex items-center justify-center rounded-[10px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900 transition-colors"
                                                            >
                                                                <Plus size={14} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-[22px] h-[22px] rounded-full border-2 border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {choiceGroups.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-50 italic">
                                <div className="text-4xl mb-4">⚡</div>
                                <p className="text-xs font-black uppercase tracking-widest">No customizations required for this bundle</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 z-50 pb-safe">
                        <div className="max-w-xl mx-auto flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-[20px] p-1.5 h-[56px] shadow-inner">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-[42px] h-full flex items-center justify-center rounded-[14px] bg-white dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all text-zinc-600 dark:text-zinc-400 shadow-sm"
                                >
                                    <Minus size={20} strokeWidth={3} />
                                </button>
                                <span className="w-8 text-center font-black text-zinc-900 dark:text-white text-[16px] tabular-nums">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-[42px] h-full flex items-center justify-center rounded-[14px] bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                className="flex-1 h-[56px] bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 rounded-[20px] font-black text-sm uppercase tracking-[0.2em] italic flex items-center justify-between px-6 transition-all active:scale-[0.98] shadow-2xl shadow-zinc-200 dark:shadow-none"
                            >
                                <span className="flex items-center gap-3">
                                    <ShoppingCart size={18} />
                                    Add Bundle
                                </span>
                                <div className="flex items-center gap-3">
                                   <div className="w-1 h-5 bg-white/20 dark:bg-zinc-300 rounded-full" />
                                   <span className="text-orange-500 tabular-nums">
                                       ₦{total.toLocaleString()}
                                   </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
