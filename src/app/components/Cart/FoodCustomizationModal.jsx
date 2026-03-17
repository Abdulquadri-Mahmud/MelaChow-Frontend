"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Check, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/app/context/CartContext";

export default function FoodCustomizationModal({ 
    food, 
    isOpen, 
    onClose, 
    onAdd, 
    onUpdate, 
    initialEditItem 
}) {
    const defaultPortion = food?.portions?.find(p => p.is_default)
                           || food?.portions?.[0];
    const [selectedPortion, setSelectedPortion] = useState(defaultPortion);
    const [selections, setSelections] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [portionQuantity, setPortionQuantity] = useState(1);
    const cartContext = useCart();
    const setIsModalOpen = cartContext?.setIsModalOpen;

    useEffect(() => {
        if (typeof setIsModalOpen === 'function') {
            setIsModalOpen(isOpen);
        }
        return () => {
            if (typeof setIsModalOpen === 'function') {
                setIsModalOpen(false);
            }
        };
    }, [isOpen, setIsModalOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialEditItem) {
                setQuantity(initialEditItem.quantity || 1);
                setPortionQuantity(initialEditItem.portion_quantity || 1);
                const foundPortion = food?.portions?.find(p => p._id === initialEditItem.portionId);
                setSelectedPortion(foundPortion || defaultPortion);
                
                const newSelections = {};
                (food?.choiceGroups || []).forEach((group, gIdx) => {
                    const groupOptions = initialEditItem.selected_options?.filter(
                        opt => opt.group_id === group._id
                    );
                    if (groupOptions && groupOptions.length > 0) {
                        if (group.max_selections > 1) {
                            newSelections[gIdx] = groupOptions.map(opt => ({
                                _id: opt.option_id,
                                label: opt.label,
                                price_modifier_naira: opt.price_modifier_naira,
                                selectionQuantity: opt.quantity || 1
                            }));
                        } else {
                            const opt = groupOptions[0];
                            newSelections[gIdx] = {
                                _id: opt.option_id,
                                label: opt.label,
                                price_modifier_naira: opt.price_modifier_naira,
                                selectionQuantity: opt.quantity || 1
                            };
                        }
                    }
                });
                setSelections(newSelections);
            } else {
                setSelectedPortion(defaultPortion);
                setSelections({});
                setQuantity(1);
                setPortionQuantity(1);
            }
        }
    }, [isOpen, food, initialEditItem, defaultPortion]);

    if (!food || !isOpen) return null;

    const basePriceNaira = (selectedPortion?.price_naira || 0) * portionQuantity;
    
    const addonsPrice = Object.values(selections).reduce((acc, sel) => {
        if (Array.isArray(sel)) {
            return acc + sel.reduce((s, o) => s + ((o.price_modifier_naira || 0) * (o.selectionQuantity || 1)), 0);
        }
        return acc + ((sel?.price_modifier_naira || 0) * (sel?.selectionQuantity || 1));
    }, 0);

    const totalUnit = basePriceNaira + addonsPrice;
    const total = totalUnit * quantity;

    const isOptionSelected = (groupIndex, label) => {
        const sel = selections[groupIndex];
        if (Array.isArray(sel)) return sel.some(i => i.label === label);
        return sel?.label === label;
    };

    const toggleChoice = (groupIndex, group, option) => {
        setSelections(prev => {
            const current = prev[groupIndex];
            const isMulti = group.max_selections > 1;

            if (!isMulti) {
                if (current?.label === option.label) {
                    const n = { ...prev };
                    delete n[groupIndex];
                    return n;
                }
                return { ...prev, [groupIndex]: { ...option, selectionQuantity: 1 } };
            }

            const list = Array.isArray(current) ? current : [];
            const exists = list.find(i => i.label === option.label);
            if (exists) {
                return {
                    ...prev,
                    [groupIndex]: list.filter(i => i.label !== option.label)
                };
            }

            const totalInGroup = list.reduce((acc, curr) => acc + (curr.selectionQuantity || 1), 0);
            if (totalInGroup >= group.max_selections) {
                toast.error(`Max ${group.max_selections} selections for ${group.name}`);
                return prev;
            }

            return { ...prev, [groupIndex]: [...list, { ...option, selectionQuantity: 1 }] };
        });
    };

    const updateOptionQuantity = (groupIndex, optionLabel, delta, group) => {
        setSelections(prev => {
            const current = prev[groupIndex];
            if (!current) return prev;

            if (group.max_selections <= 1) {
                const newQty = (current.selectionQuantity || 1) + delta;
                if (newQty <= 0) {
                    const n = { ...prev };
                    delete n[groupIndex];
                    return n;
                }
                if (delta > 0 && newQty > group.max_selections) {
                    toast.error(`Max ${group.max_selections} selection for ${group.name}`);
                    return prev;
                }
                return { ...prev, [groupIndex]: { ...current, selectionQuantity: newQty } };
            }

            const list = Array.isArray(current) ? current : [];
            const index = list.findIndex(i => i.label === optionLabel);
            if (index === -1) return prev;

            const item = list[index];
            const newQty = (item.selectionQuantity || 1) + delta;
            
            if (newQty <= 0) {
                return {
                    ...prev,
                    [groupIndex]: list.filter(i => i.label !== optionLabel)
                };
            }

            const totalInGroup = list.reduce((acc, curr, i) => acc + (i === index ? newQty : (curr.selectionQuantity || 1)), 0);
            if (delta > 0 && totalInGroup > group.max_selections) {
                toast.error(`Max ${group.max_selections} selections for ${group.name}`);
                return prev;
            }

            const newList = [...list];
            newList[index] = { ...item, selectionQuantity: newQty };
            return { ...prev, [groupIndex]: newList };
        });
    };

    const handleConfirm = () => {
        if (!selectedPortion) {
            toast.error("Please select a size");
            return;
        }

        for (let i = 0; i < (food.choiceGroups || []).length; i++) {
            const group = food.choiceGroups[i];
            const sel = selections[i];
            let count = 0;
            if (Array.isArray(sel)) {
                count = sel.reduce((acc, curr) => acc + (curr.selectionQuantity || 1), 0);
            }
            else if (sel) {
                count = (sel.selectionQuantity || 1);
            }

            if (group.is_required && count < group.min_selections) {
                toast.error(
                    `Please select at least ${group.min_selections} option for "${group.name}"`
                );
                return;
            }
        }

        const selectedOptions = [];
        Object.keys(selections).forEach(key => {
            const gIdx = Number(key);
            const group = food.choiceGroups[gIdx];
            const sel = selections[key];
            const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
            items.forEach(opt => {
                selectedOptions.push({
                    group_id:             group._id,
                    group_name:           group.name,
                    option_id:            opt._id,
                    label:                opt.label,
                    price_modifier_naira: opt.price_modifier_naira,
                    quantity:             opt.selectionQuantity || 1
                });
            });
        });

        const payload = {
            type:         "item",
            foodId:       food._id,
            portionId:    selectedPortion._id,
            portion_quantity: portionQuantity,
            vendorId:     food.vendor?._id,
            storeName:    food.vendor?.storeName || "",
            name:         food.name,
            image_url:    food.image_url || "",
            portion_label: selectedPortion.label,
            price_naira:  totalUnit,
            quantity,
            selected_options: selectedOptions.map(opt => ({
                group_id:             opt.group_id,
                option_id:            opt.option_id,
                label:                opt.label,
                price_modifier_naira: opt.price_modifier_naira || 0,
                quantity:             opt.quantity,
            })),
            deliveryFee:  food.vendor?.deliveryFee || food.deliveryFee || 0,
            dietary_type: food.dietary_type,
            item_type:    food.item_type,
        };

        if (initialEditItem && onUpdate) {
            onUpdate(food._id, initialEditItem.portionId, payload);
        } else {
            onAdd(payload);
        }
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
                            src={food.image_url || "/placeholder.jpg"}
                            alt={food.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                           <div className="bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20">
                              Customizing
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
                                {food.name}
                            </h3>
                            {food.description && (
                                <p className="text-xs text-white/70 mt-2 line-clamp-2 italic font-medium">
                                    {food.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-none pb-36 px-4 pt-6 space-y-6">
                        {/* Portion Selector */}
                        {food.portions?.length > 1 && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                   <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                   <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                                       Select Size
                                   </p>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {food.portions.map(portion => {
                                        const isSelected = selectedPortion?._id === portion._id;
                                        return (
                                            <div
                                                key={portion._id}
                                                onClick={() => {
                                                    if (!isSelected) {
                                                        setSelectedPortion(portion);
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3.5 rounded-[24px] border-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-orange-50/50 dark:bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(255,102,0,0.1)] dark:shadow-[0_0_30px_rgba(255,102,0,0.15)]"
                                                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-200 dark:hover:border-orange-500/30"
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                        {portion.label}
                                                    </span>
                                                    <span className="text-[10px] font-black text-orange-500 mt-0.5">
                                                        ₦{portion.price_naira?.toLocaleString()}
                                                    </span>
                                                </div>

                                                {isSelected && (
                                                    <div 
                                                      className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <button 
                                                        onClick={() => setPortionQuantity(Math.max(1, portionQuantity - 1))}
                                                        className="w-[30px] h-[30px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900 transition-colors shadow-sm"
                                                      >
                                                        <Minus size={12} strokeWidth={3} />
                                                      </button>
                                                      <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[14px] text-center tabular-nums">
                                                        {portionQuantity}
                                                      </span>
                                                      <button 
                                                        onClick={() => {
                                                          if (portion.max_quantity && portionQuantity >= portion.max_quantity) {
                                                            toast.error(`Max ${portion.max_quantity} reached`);
                                                          } else {
                                                            setPortionQuantity(portionQuantity + 1);
                                                          }
                                                        }}
                                                        className="w-[30px] h-[30px] flex items-center justify-center rounded-[10px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900 transition-colors shadow-sm"
                                                      >
                                                        <Plus size={12} strokeWidth={3} />
                                                      </button>
                                                    </div>
                                                )}

                                                {!isSelected && (
                                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 shadow-inner" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Choice Groups */}
                        {food.choiceGroups?.map((group, gIdx) => (
                            <div key={group._id} className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                       <h4 className="font-black text-zinc-900 dark:text-white text-sm uppercase italic tracking-tight">
                                           {group.name}
                                       </h4>
                                    </div>
                                    {group.is_required ? (
                                        <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            Required
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-black text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            Optional
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-4">
                                    {group.max_selections > 1
                                        ? `Pick up to ${group.max_selections}`
                                        : "Pick exactly one"}
                                </p>

                                <div className="space-y-3">
                                    {group.options
                                        .filter(o => o.is_available)
                                        .map(option => {
                                            const isSelected = isOptionSelected(gIdx, option.label);
                                            return (
                                                <div key={option._id}
                                                     onClick={() => toggleChoice(gIdx, group, option)}
                                                     className={`flex items-center gap-4 p-3 rounded-[24px] border-2 cursor-pointer transition-all ${
                                                         isSelected
                                                             ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-lg shadow-orange-500/5 scal-[1.01]"
                                                             : "border-zinc-50 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700"
                                                     }`}>
                                                    <div className="w-14 h-14 rounded-[18px] overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-inner">
                                                        {option.image_url ? (
                                                            <img src={option.image_url}
                                                                 alt={option.label}
                                                                 className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">🍽️</div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-[13px] text-zinc-900 dark:text-white truncate uppercase italic">
                                                            {option.label}
                                                        </p>
                                                        {option.price_modifier_naira > 0 ? (
                                                            <p className="text-[11px] font-black text-orange-500 mt-0.5">
                                                                +₦{option.price_modifier_naira.toLocaleString()}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Free</p>
                                                        )}
                                                    </div>

                                                     {isSelected ? (
                                                         <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                                                             <button 
                                                                 onClick={() => updateOptionQuantity(gIdx, option.label, -1, group)}
                                                                 className="w-[30px] h-[30px] flex items-center justify-center rounded-[10px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900 transition-colors"
                                                             >
                                                                 <Minus size={14} strokeWidth={3} />
                                                             </button>
                                                             <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[14px] text-center tabular-nums">
                                                                 {Array.isArray(selections[gIdx]) 
                                                                     ? selections[gIdx].find(i => i.label === option.label)?.selectionQuantity || 1
                                                                     : selections[gIdx]?.selectionQuantity || 1}
                                                             </span>
                                                             <button 
                                                                 onClick={() => updateOptionQuantity(gIdx, option.label, 1, group)}
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
                        ))}
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
                                    onClick={() => {
                                        if (selectedPortion?.max_quantity && quantity >= selectedPortion.max_quantity) {
                                            toast.error(`Maximum allowed is ${selectedPortion.max_quantity}`);
                                        } else {
                                            setQuantity(quantity + 1);
                                        }
                                    }}
                                    className="w-[42px] h-full flex items-center justify-center rounded-[14px] bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <button
                                onClick={handleConfirm}
                                className="flex-1 h-[56px] bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 rounded-[20px] font-black text-sm uppercase tracking-[0.2em] italic flex items-center justify-between px-6 transition-all active:scale-[0.98] shadow-2xl shadow-zinc-200 dark:shadow-none"
                            >
                                <span className="flex items-center gap-3">
                                    <ShoppingCart size={18} />
                                    {initialEditItem ? "Update" : "Confirm"}
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
