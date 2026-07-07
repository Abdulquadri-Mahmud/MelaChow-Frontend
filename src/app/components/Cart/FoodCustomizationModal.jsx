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
    const portions = Array.isArray(food?.portions) ? food.portions : [];
    const choiceGroups = Array.isArray(food?.choiceGroups) ? food.choiceGroups : (Array.isArray(food?.choice_groups) ? food.choice_groups : []);
    const defaultPortion = portions.find(p => p.is_default) || portions[0] || null;
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

    // ── Hardware back-button support (Android + browser back gesture) ──────
    useEffect(() => {
      if (!isOpen) return; // only active while modal is open

      // Push a shallow history entry so back button has somewhere to go
      window.history.pushState({ melachowModal: 'food' }, '');

      const handlePopState = (e) => {
        // Back was pressed — close the modal instead of navigating away
        // Don't call history.back() here — the pop already happened
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // If modal is closed via the UI button (not back), clean up the
        // extra history entry to avoid a dangling back-step
        if (window.history.state?.melachowModal === 'food') {
          window.history.back();
        }
      };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            if (initialEditItem) {
                setQuantity(initialEditItem.quantity || 1);
                setPortionQuantity(initialEditItem.portion_quantity || 1);
                const portions = Array.isArray(food?.portions) ? food.portions : [];
                const foundPortion = portions.find(p => p._id === initialEditItem.portionId);
                setSelectedPortion(foundPortion || defaultPortion);
                
                const newSelections = {};
                choiceGroups.forEach((group, gIdx) => {
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
            const group = choiceGroups[gIdx];
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
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[24px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    {/* Header Image */}
                    <div className="relative h-[140px] shrink-0">
                        <motion.img
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.8 }}
                            src={food.image_url || "/placeholder.jpg"}
                            alt={food.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                           <div className="bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20 italic">
                                {initialEditItem ? "Edit Item" : "Personalize"}
                           </div>
                           <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all border border-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                           <motion.h3 
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg font-black text-white italic uppercase tracking-tight leading-none"
                            >
                                {food.name}
                            </motion.h3>
                            {food.description && (
                                <motion.p 
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-[10px] text-zinc-100/90 mt-1 line-clamp-1 italic font-medium leading-relaxed tracking-tight"
                                >
                                    {food.description}
                                </motion.p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 pt-4 space-y-4">
                        {/* Portion Selector */}
                        {food.portions?.length > 1 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1 px-1">
                                   <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                   <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 italic">
                                       Step 1: Choose Size
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
                                                        setPortionQuantity(1);
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-[18px] border-2 transition-all duration-300 cursor-pointer ${
                                                    isSelected
                                                        ? "bg-orange-50 dark:bg-orange-500/5 border-orange-500"
                                                        : "bg-zinc-50 dark:bg-zinc-800/50 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-bold uppercase tracking-tight italic ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                                            {portion.label}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-orange-500">
                                                            ₦{portion.price_naira?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
 
                                                {isSelected && (
                                                    <div 
                                                      className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-[12px] p-0.5 border border-zinc-100 dark:border-zinc-700"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <button 
                                                        onClick={() => setPortionQuantity(Math.max(1, portionQuantity - 1))}
                                                        className="w-7 h-7 flex items-center justify-center rounded-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-orange-600 transition-colors"
                                                      >
                                                        <Minus size={12} strokeWidth={3} />
                                                      </button>
                                                      <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[16px] text-center tabular-nums">
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
                                                        className="w-7 h-7 flex items-center justify-center rounded-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-orange-600 transition-colors"
                                                      >
                                                        <Plus size={12} strokeWidth={3} />
                                                      </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Choice Groups */}
                        {choiceGroups.map((group, gIdx) => (
                            <div key={group._id} className="space-y-3">
                                <div className="flex items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                       <h4 className="font-black text-zinc-900 dark:text-white text-[13px] uppercase italic tracking-tight">
                                           {group.name}
                                       </h4>
                                    </div>
                                    {group.is_required ? (
                                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">Required</span>
                                    ) : (
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">Optional</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.15em] px-4">
                                    {group.max_selections > 1
                                        ? `Limit: ${group.max_selections} items`
                                        : "Choice: select one"}
                                </p>
 
                                <div className="grid grid-cols-1 gap-2">
                                    {group.options
                                        .filter(o => o.is_available)
                                        .map(option => {
                                            const isSelected = isOptionSelected(gIdx, option.label);
                                            return (
                                                <div key={option._id}
                                                     onClick={() => toggleChoice(gIdx, group, option)}
                                                     className={`flex items-center gap-3 p-2.5 rounded-[18px] border-2 cursor-pointer transition-all duration-300 ${
                                                         isSelected
                                                             ? "border-orange-500 bg-orange-50 dark:bg-orange-500/5"
                                                             : "border-transparent bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700"
                                                     }`}>
                                                    <div className="w-10 h-10 rounded-[12px] overflow-hidden bg-white dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-700">
                                                        {option.image_url ? (
                                                            <img src={option.image_url}
                                                                 alt={option.label}
                                                                 className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-sm bg-zinc-50 dark:bg-zinc-950 opacity-40">🍽️</div>
                                                        )}
                                                    </div>
 
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-[12px] uppercase italic tracking-tight ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                                            {option.label}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-orange-500">
                                                            {option.price_modifier_naira > 0 ? `+₦${option.price_modifier_naira.toLocaleString()}` : 'FREE'}
                                                        </p>
                                                    </div>
 
                                                     {isSelected ? (
                                                         <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-[10px] p-0.5 border border-zinc-100 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                                                             <button 
                                                                 onClick={() => updateOptionQuantity(gIdx, option.label, -1, group)}
                                                                 className="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-orange-600 transition-colors"
                                                             >
                                                                 <Minus size={12} strokeWidth={3} />
                                                             </button>
                                                             <span className="text-[12px] font-black text-zinc-900 dark:text-white min-w-[16px] text-center tabular-nums">
                                                                 {Array.isArray(selections[gIdx]) 
                                                                     ? selections[gIdx].find(i => i.label === option.label)?.selectionQuantity || 1
                                                                     : selections[gIdx]?.selectionQuantity || 1}
                                                             </span>
                                                             <button 
                                                                 onClick={() => updateOptionQuantity(gIdx, option.label, 1, group)}
                                                                 className="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-orange-600 transition-colors"
                                                             >
                                                                 <Plus size={12} strokeWidth={3} />
                                                             </button>
                                                         </div>
                                                     ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950" />
                                                     )}
                                                 </div>
                                             );
                                         })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-[20px] p-1 h-[48px] shadow-inner shrink-0">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-full flex items-center justify-center rounded-[16px] bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 shadow-sm active:scale-90"
                                >
                                    <Minus size={14} strokeWidth={4} />
                                </button>
                                <span className="w-6 text-center font-black text-zinc-900 dark:text-white text-[16px] tabular-nums italic">
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
                                    className="w-9 h-full flex items-center justify-center rounded-[16px] bg-orange-500 text-white shadow-lg active:scale-95 transition-all"
                                >
                                    <Plus size={14} strokeWidth={4} />
                                </button>
                            </div>

                            <button
                                onClick={handleConfirm}
                                className="flex-1 h-[48px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[20px] font-black text-xs uppercase tracking-widest italic flex items-center justify-between px-6 transition-all active:scale-[0.98] shadow-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={16} strokeWidth={3} />
                                    <span>{initialEditItem ? "Update" : "Add to Order"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                   <div className="w-px h-4 bg-white/20 dark:bg-zinc-300" />
                                   <span className="text-orange-500 tabular-nums text-base">
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
