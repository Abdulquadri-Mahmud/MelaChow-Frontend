"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Check, Leaf, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function FoodCustomizationModal({ food, isOpen, onClose, onAdd, initialVariant, initialPortion }) {
    const [selections, setSelections] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [groupQuantities, setGroupQuantities] = useState({}); // New state for group quantities

    // If initialVariant or initialPortion changes, reset state
    useEffect(() => {
        if (isOpen) {
            setSelections({});
            setQuantity(1);
            setGroupQuantities({});
        }
    }, [isOpen, initialVariant, initialPortion]);

    if (!food || !isOpen) return null;

    // Determine Active Item (Variant > Portion > Base)
    const activeItem = initialVariant || initialPortion || food;
    const isVariant = !!initialVariant;
    const isPortion = !!initialPortion && !isVariant;

    // Base Price
    const basePrice = Number(activeItem.price) || 0;

    // Option Quantity Handlers (Multi-Select)
    const getOptionQty = (groupIndex, optionName) => {
        const list = selections[groupIndex];
        if (!Array.isArray(list)) return 0;
        return list.filter((i) => i.name === optionName).length;
    };

    const handleOptionIncrement = (e, groupIndex, group, option) => {
        e.stopPropagation(); // Prevent card click
        setSelections((prev) => {
            const currentList = Array.isArray(prev[groupIndex]) ? prev[groupIndex] : [];

            // Check Max Select constraint
            if (group.maxSelect && currentList.length >= group.maxSelect) {
                toast.error(`You can only select up to ${group.maxSelect} items`);
                return prev;
            }

            return { ...prev, [groupIndex]: [...currentList, option] };
        });
    };

    const handleOptionDecrement = (e, groupIndex, group, option) => {
        e.stopPropagation(); // Prevent card click
        setSelections((prev) => {
            const currentList = Array.isArray(prev[groupIndex]) ? prev[groupIndex] : [];
            const idx = currentList.findIndex((i) => i.name === option.name);

            if (idx === -1) return prev; // Not found

            const newList = [...currentList];
            newList.splice(idx, 1);

            // If empty, remove key
            if (newList.length === 0) {
                const newSel = { ...prev };
                delete newSel[groupIndex];
                return newSel;
            }

            return { ...prev, [groupIndex]: newList };
        });
    };

    // Toggle Choice
    const toggleChoice = (groupIndex, group, option) => {
        setSelections((prev) => {
            const current = prev[groupIndex];
            const isMulti = group.maxSelect > 1;

            if (!isMulti) {
                // Radio behavior
                if (current?.name === option.name) {
                    const newSel = { ...prev };
                    delete newSel[groupIndex];
                    return newSel;
                }
                return { ...prev, [groupIndex]: option };
            }

            // Checkbox behavior
            const list = Array.isArray(current) ? current : [];
            const exists = list.find((i) => i.name === option.name);

            if (exists) {
                return { ...prev, [groupIndex]: list.filter((i) => i.name !== option.name) };
            }
            if (list.length < group.maxSelect) {
                return { ...prev, [groupIndex]: [...list, option] };
            }
            return prev;
        });
    };

    // Update Group Quantity
    const updateGroupQty = (groupIndex, delta) => {
        setGroupQuantities((prev) => {
            const currentQty = prev[groupIndex] || 1;
            const newQty = Math.max(1, currentQty + delta);
            return { ...prev, [groupIndex]: newQty };
        });
    };

    // Calculations: Helper to get subtotal for a specific group
    const getGroupSubtotal = (groupIndex) => {
        const selection = selections[groupIndex];
        if (!selection) return 0;

        const qty = groupQuantities[groupIndex] || 1;
        let selectedOptionsTotal = 0;

        if (Array.isArray(selection)) {
            selectedOptionsTotal = selection.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        } else {
            selectedOptionsTotal = (Number(selection.price) || 0);
        }

        return selectedOptionsTotal * qty;
    };

    // Total Addons Price = Sum of all group subtotals
    const addonsPrice = (food.choiceGroups || []).reduce((acc, _, index) => {
        return acc + getGroupSubtotal(index);
    }, 0);

    const packingFee = Number(food.packagingFee) || 0;

    // Final Unit Price = Base + All Addons + Packing
    const finalUnitPrice = basePrice + addonsPrice + packingFee;

    // Total Price = Unit Price * Master Quantity
    const totalPrice = finalUnitPrice * quantity;

    // Validation & Add
    const handleConfirm = () => {
        // Required Checks
        const choiceGroups = food.choiceGroups || [];
        for (let i = 0; i < choiceGroups.length; i++) {
            const group = choiceGroups[i];
            if (group.minSelect > 0) {
                const selection = selections[i];
                const selectedCount = Array.isArray(selection) ? selection.length : (selection ? 1 : 0);
                if (selectedCount < group.minSelect) {
                    toast.error(`Please select at least ${group.minSelect} option(s) for ${group.name}`);
                    return;
                }
            }
        }

        // Construct Name
        let variantName = food.name;
        if (isVariant) variantName += ` (${activeItem.name})`;
        if (isPortion) variantName += ` (${activeItem.label})`;

        // Flatten selections based on group quantities
        const allSelectedChoices = [];

        Object.keys(selections).forEach(key => {
            const gIdx = Number(key);
            const sel = selections[key];
            const qty = groupQuantities[gIdx] || 1;

            // Repeat selections 'qty' times for the payload list
            for (let q = 0; q < qty; q++) {
                if (Array.isArray(sel)) {
                    sel.forEach(s => {
                        variantName += ` + ${s.name}`;
                        allSelectedChoices.push(s.name);
                    });
                } else if (sel) {
                    variantName += ` + ${sel.name}`;
                    allSelectedChoices.push(sel.name);
                }
            }
        });

        // Image
        let displayImage = activeItem.image || (activeItem.images?.[0]) || (food.images?.[0]) || "";
        const imageUrl = typeof displayImage === 'string' ? displayImage : displayImage?.url || "";

        const payload = {
            foodId: food._id,
            restaurantId: food.vendor?._id || food.vendor,
            storeName: food.vendor?.storeName || "",
            name: food.name,

            variant: {
                name: variantName,
                price: finalUnitPrice,
                image: imageUrl
            },

            price: finalUnitPrice,
            quantity: quantity,

            metadata: {
                portion: isPortion ? activeItem.label : (isVariant ? activeItem.name : "Standard"),
                choices: allSelectedChoices, // flatten and repeated
                spiceLevel: food.metadata?.spiceLevel,
                chefSpecial: food.metadata?.chefSpecial,
            },

            deliveryFee: food.deliveryFee || 0,
            vendorDeliveryFees: [{
                restaurantId: food.vendor?._id || food.vendor,
                deliveryFee: food.deliveryFee || 0
            }],
            estimatedDeliveryTime: {
                min: (food.estimatedDeliveryTime - 5) || 0,
                max: food.estimatedDeliveryTime || 0
            },
            deliveryType: food.vendor?.acceptsDelivery ? "Instant Delivery" : "Pickup",
        };

        onAdd(payload);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ translateY: "100%", opacity: 0 }}
                        animate={{ translateY: "0%", opacity: 1 }}
                        exit={{ translateY: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-zinc-50 dark:bg-[#0B1121] rounded-tl-[2rem] rounded-tr-[2rem] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header Image */}
                        <div className="relative h-[250px] w-full shrink-0">
                            <img
                                src={
                                    activeItem.image ||
                                    (Array.isArray(activeItem.images) ? activeItem.images[0]?.url : null) ||
                                    food.images?.[0]?.url ||
                                    "/placeholder.jpg"
                                }
                                alt={activeItem.name || food.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-xl font-bold text-white max-w-[80%] leading-tight">
                                    {activeItem.name || activeItem.label || food.name}
                                </h3>
                                <p className="text-white/90 text-sm font-medium mt-1">
                                    Base Price: ₦{basePrice.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable Options */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-hide bg-zinc-50 dark:bg-[#0B1121]">
                            {/* Choice Groups */}
                            {food.choiceGroups?.map((group, gIdx) => {
                                const hasImages = group.options.some(o => o.image);
                                const hasSelections = selections[gIdx];
                                const currentGroupQty = groupQuantities[gIdx] || 1;
                                const groupSubtotal = getGroupSubtotal(gIdx);

                                return (
                                    <div key={gIdx} className="bg-white dark:bg-zinc-900 rounded-2xl p-2 border border-zinc-100 dark:border-zinc-800">
                                        {/* Group Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                            <div className="flex items-center gap-3">
                                                {group.image && (
                                                    <img src={group.image} alt={group.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-wider">
                                                            {group.name}
                                                        </h4>
                                                        {group.minSelect > 0 && (
                                                            <span className="text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full tracking-wider">
                                                                REQ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium block mt-0.5">
                                                        {""}
                                                    </span>
                                                </div>
                                            </div>


                                        </div>

                                        <div className={hasImages ? "space-y-3" : "space-y-2"}>
                                            {group.options.map((option, oIdx) => {
                                                const isMulti = group.maxSelect > 1;
                                                const isSelected = isMulti
                                                    ? (selections[gIdx] || []).some(i => i.name === option.name)
                                                    : (selections[gIdx]?.name === option.name);

                                                const optionQty = isMulti ? getOptionQty(gIdx, option.name) : (isSelected ? 1 : 0);

                                                // Stock Validation
                                                const isOutOfStock = option.stock !== null && option.stock !== undefined && Number(option.stock) <= 0;

                                                return (
                                                    <div
                                                        key={oIdx}
                                                        onClick={(e) => {
                                                            if (isOutOfStock) return;
                                                            if (isMulti) {
                                                                if (optionQty === 0) handleOptionIncrement(e, gIdx, group, option);
                                                            } else {
                                                                toggleChoice(gIdx, group, option);
                                                            }
                                                        }}
                                                        className={`relative rounded-xl border transition-all ${hasImages
                                                            ? "flex items-center justify-between p-2 gap-3"
                                                            : "flex items-center justify-between p-3"
                                                            } ${isSelected
                                                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-500/20"
                                                                : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-orange-200"
                                                            } ${isOutOfStock ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"}`}
                                                    >
                                                        {hasImages && (
                                                            <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-lg overflow-hidden relative">
                                                                {option.image ? (
                                                                    <img src={option.image} alt={option.name} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                        <span>No Image</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={hasImages ? "p-3" : "flex items-center gap-3 w-full"}>
                                                            {!hasImages && !isMulti && (
                                                                <div className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 dark:border-gray-600 bg-white"
                                                                    }`}>
                                                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                                                </div>
                                                            )}

                                                            <div className="flex-1 flex justify-between items-stretch gap-2">
                                                                <div className="flex flex-col justify-center">
                                                                    <span className={`text-sm font-medium leading-tight ${isSelected ? "text-gray-900 dark:text-white font-bold" : "text-gray-600 dark:text-gray-400"}`}>
                                                                        {option.name}
                                                                    </span>
                                                                    {Number(option.price) > 0 && (
                                                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-500 mt-1">
                                                                            +₦{Number(option.price).toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {isOutOfStock ? (
                                                                        <span className="text-[9px] font-black text-red-500 uppercase self-center">SOLD OUT</span>
                                                                    ) : (
                                                                        <>
                                                                            {isMulti && (
                                                                                isSelected ? (
                                                                                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg p-1 shadow-sm border border-zinc-200 dark:border-zinc-700 h-full" onClick={e => e.stopPropagation()}>
                                                                                        <button
                                                                                            onClick={(e) => handleOptionDecrement(e, gIdx, group, option)}
                                                                                            className="w-6 h-full flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-white transition-colors"
                                                                                        >
                                                                                            <Minus size={12} strokeWidth={3} />
                                                                                        </button>
                                                                                        <span className="text-xs font-bold w-4 text-center tabular-nums">{optionQty}</span>
                                                                                        <button
                                                                                            onClick={(e) => handleOptionIncrement(e, gIdx, group, option)}
                                                                                            className="w-6 h-full flex items-center justify-center rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 transition-colors"
                                                                                        >
                                                                                            <Plus size={12} strokeWidth={3} />
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button className="w-10 h-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center transition-colors shadow-sm">
                                                                                        <Plus size={18} />
                                                                                    </button>
                                                                                )
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Group Subtotal Footer */}
                                        {groupSubtotal > 0 && (
                                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-500">Group Subtotal</span>
                                                <span className="text-sm font-bold text-orange-600">
                                                    ₦{groupSubtotal.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(!food.choiceGroups || food.choiceGroups.length === 0) && (
                                <div className="text-center py-10 text-gray-400 text-sm italic">
                                    No extra customizations available for this item.
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0B1121] z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                            {/* Master Quantity */}
                            <div className="flex items-center justify-center gap-6 mb-5">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                                >
                                    <Minus size={20} />
                                </button>
                                <div className="text-center">
                                    <span className="block text-2xl font-black tabular-nums text-gray-900 dark:text-white leading-none">
                                        {quantity}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Quantity</span>
                                </div>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                {packingFee > 0 && (
                                    <div className="flex justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <ShoppingBag size={14} /> Packaging Fee
                                        </span>
                                        <span>₦{packingFee.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleConfirm}
                                className="w-full py-4 bg-[#FF6600] text-white rounded-2xl font-black text-lg hover:bg-[#ff7b24] active:scale-[0.98] transition-all flex items-center justify-between px-6 shadow-xl shadow-orange-500/20"
                            >
                                <span>Add to Order</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm opacity-80 font-medium">Total</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-lg text-lg">₦{totalPrice.toLocaleString()}</span>
                                </div>
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
