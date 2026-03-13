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
    const { setIsModalOpen } = useCart();

    useEffect(() => {
        setIsModalOpen(isOpen);
        return () => setIsModalOpen(false);
    }, [isOpen, setIsModalOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialEditItem) {
                setQuantity(initialEditItem.quantity || 1);
                const foundPortion = food?.portions?.find(p => p._id === initialEditItem.portionId);
                setSelectedPortion(foundPortion || defaultPortion);
                
                // Map initialEditItem.selected_options back to selections state
                const newSelections = {};
                (food?.choice_groups || []).forEach((group, gIdx) => {
                    const groupOptions = initialEditItem.selected_options?.filter(
                        opt => opt.group_id === group._id
                    );
                    if (groupOptions && groupOptions.length > 0) {
                        if (group.max_selections > 1) {
                            newSelections[gIdx] = groupOptions.map(opt => ({
                                _id: opt.option_id,
                                label: opt.label,
                                price_modifier_naira: opt.price_modifier_naira
                            }));
                        } else {
                            const opt = groupOptions[0];
                            newSelections[gIdx] = {
                                _id: opt.option_id,
                                label: opt.label,
                                price_modifier_naira: opt.price_modifier_naira
                            };
                        }
                    }
                });
                setSelections(newSelections);
            } else {
                setSelectedPortion(defaultPortion);
                setSelections({});
                setQuantity(1);
            }
        }
    }, [isOpen, food, initialEditItem, defaultPortion]);

    if (!food || !isOpen) return null;

    const basePriceNaira = selectedPortion?.price_naira || 0;
    
    // Sum of selected options price_modifier_naira
    const addonsPrice = Object.values(selections).reduce((acc, sel) => {
        if (Array.isArray(sel)) {
            return acc + sel.reduce((s, o) => s + (o.price_modifier_naira || 0), 0);
        }
        return acc + (sel?.price_modifier_naira || 0);
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
                return { ...prev, [groupIndex]: option };
            }

            const list = Array.isArray(current) ? current : [];
            const exists = list.find(i => i.label === option.label);
            if (exists) {
                return {
                    ...prev,
                    [groupIndex]: list.filter(i => i.label !== option.label)
                };
            }
            if (list.length >= group.max_selections) {
                toast.error(`Max ${group.max_selections} selections`);
                return prev;
            }
            return { ...prev, [groupIndex]: [...list, option] };
        });
    };

    const handleConfirm = () => {
        if (!selectedPortion) {
            toast.error("Please select a size");
            return;
        }

        for (let i = 0; i < (food.choice_groups || []).length; i++) {
            const group = food.choice_groups[i];
            const sel = selections[i];
            let count = 0;
            if (Array.isArray(sel)) count = sel.length;
            else if (sel) count = 1;

            if (group.is_required && count < group.min_selections) {
                toast.error(
                    `Please select at least ${group.min_selections} option for "${group.name}"`
                );
                return;
            }
        }

        // Flatten selected options
        const selectedOptions = [];
        Object.keys(selections).forEach(key => {
            const gIdx = Number(key);
            const group = food.choice_groups[gIdx];
            const sel = selections[key];
            const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
            items.forEach(opt => {
                selectedOptions.push({
                    group_id:             group._id,
                    group_name:           group.name,
                    option_id:            opt._id,
                    label:                opt.label,
                    price_modifier_naira: opt.price_modifier_naira,
                });
            });
        });

        const payload = {
            foodId:       food._id,
            portionId:    selectedPortion._id,
            vendorId:     food.vendor?._id,
            storeName:    food.vendor?.storeName || "",
            name:         food.name,
            image_url:    food.image_url || "",
            portion_label: selectedPortion.label,
            price_naira:  totalUnit,
            quantity,
            selected_options: selectedOptions,
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
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900  overflow-hidden flex flex-col max-h-[100vh]"
                >
                    {/* Header Image */}
                    <div className="relative h-[250px] sm:h-56 shrink-0">
                        <img
                            src={food.image_url || "/placeholder.jpg"}
                            alt={food.name}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scroll scrollbar-none pb-32">
                        {/* Food Info */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                {food.name}
                            </h3>
                            {food.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {food.description}
                                </p>
                            )}
                        </div>

                        {/* Portion Selector */}
                        {food.portions?.length > 1 && (
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Choose Size
                                </p>
                                <div className="flex gap-2 scroll overflow-x-auto scrollbar-none">
                                    {food.portions.map(portion => (
                                        <button
                                            key={portion._id}
                                            onClick={() => setSelectedPortion(portion)}
                                            className={`shrink-0 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
                                                selectedPortion?._id === portion._id
                                                    ? "bg-orange-500 border-orange-500 text-white"
                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                            }`}
                                        >
                                            {portion.label}
                                            <span className="ml-1.5 opacity-70">
                                                ₦{portion.price_naira?.toLocaleString()}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Choice Groups */}
                        <div className="p-4 space-y-6">
                            {food.choice_groups?.map((group, gIdx) => (
                                <div key={group._id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">
                                            {group.name}
                                        </h4>
                                        {group.is_required && (
                                            <span className="text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                                                REQUIRED
                                            </span>
                                        )}
                                        {!group.is_required && (
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                                OPTIONAL
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium mb-3">
                                        {group.max_selections > 1
                                            ? `Select up to ${group.max_selections}`
                                            : "Select one"}
                                    </p>

                                    <div className="space-y-2">
                                        {group.options
                                            .filter(o => o.is_available)
                                            .map(option => {
                                                const isSelected = isOptionSelected(gIdx, option.label);
                                                return (
                                                    <div key={option._id}
                                                         onClick={() => toggleChoice(gIdx, group, option)}
                                                         className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                             isSelected
                                                                 ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                                                                 : "border-slate-200 dark:border-slate-700 hover:border-orange-200"
                                                         }`}>
                                                        {/* Option image */}
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                                            {option.image_url ? (
                                                                <img src={option.image_url}
                                                                     alt={option.label}
                                                                     className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xl">
                                                                    🍽️
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Label + price */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                                {option.label}
                                                            </p>
                                                            {option.price_modifier_naira > 0 && (
                                                                <p className="text-xs font-bold text-orange-500">
                                                                    +₦{option.price_modifier_naira.toLocaleString()}
                                                                </p>
                                                            )}
                                                            {option.price_modifier_naira === 0 && (
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                                    Free
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Check indicator */}
                                                        {isSelected && (
                                                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                                                                <Check size={12} className="text-white" strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-8 text-center font-bold text-slate-900 dark:text-white">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => {
                                        if (selectedPortion?.max_quantity && quantity >= selectedPortion.max_quantity) {
                                            toast.error(`Maximum quantity allowed is ${selectedPortion.max_quantity}`);
                                        } else {
                                            setQuantity(quantity + 1);
                                        }
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Total Price
                                </p>
                                <p className="text-xl font-black text-orange-500">
                                    ₦{total.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
                        >
                            <ShoppingCart size={18} />
                            {initialEditItem ? "Update Cart" : "Add to Cart"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
