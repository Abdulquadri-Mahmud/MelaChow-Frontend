"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Check, Leaf, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function FoodCustomizationModal({ food, isOpen, onClose, onAdd, onUpdate, initialVariant, initialPortion, initialEditItem }) {
    const [selections, setSelections] = useState({});
    const [quantity, setQuantity] = useState(1);

    // If initialVariant or initialPortion changes, reset state
    useEffect(() => {
        if (isOpen) {
            if (initialEditItem) {
                // Populate from edit item
                setQuantity(initialEditItem.quantity || 1);

                const newSelections = {};
                const choices = initialEditItem.metadata?.choices || [];

                // Create a frequency map of choices to handle repeated items
                const choiceCounts = choices.reduce((acc, c) => {
                    const name = (typeof c === 'string' ? c : c.name || "").trim();
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});

                let matchedCount = 0;

                (food.choiceGroups || []).forEach((group, gIdx) => {
                    const groupOptions = group.options || [];
                    const matchedOptions = [];

                    // Find all options from this group that are present in the initialEditItem's choices
                    // And aggregate quantities
                    groupOptions.forEach(opt => {
                        const optName = (opt.name || "").trim();
                        const count = choiceCounts[optName];
                        if (count) {
                            matchedOptions.push({ ...opt, qty: count });
                            matchedCount += count;
                        }
                    });

                    if (matchedOptions.length > 0) {
                        if (group.maxSelect === 1) {
                            // Radio behavior
                            newSelections[gIdx] = matchedOptions[0];
                        } else {
                            // Checkbox behavior
                            newSelections[gIdx] = matchedOptions;
                        }
                    }
                });

                if (matchedCount < choices.length) {
                    toast.error("Some options from your cart are no longer available in the menu.");
                }

                setSelections(newSelections);

            } else {
                setSelections({});
                setQuantity(1);
            }
        }
    }, [isOpen, initialVariant, initialPortion, initialEditItem, food]);

    if (!food || !isOpen) return null;

    const activeItem = initialVariant || initialPortion || food;
    const isVariant = !!initialVariant;
    const isPortion = !!initialPortion && !isVariant;

    // Base Price
    const basePrice = Number(activeItem.price) || 0;

    // Helper: Get current selected item from group (returns object or undefined)
    const getSelectedItem = (groupIndex, optionName) => {
        const selection = selections[groupIndex];
        if (Array.isArray(selection)) {
            return selection.find(i => i.name === optionName);
        }
        return selection?.name === optionName ? selection : undefined;
    };

    const isOptionSelected = (groupIndex, optionName) => {
        return !!getSelectedItem(groupIndex, optionName);
    };

    // Toggle Choice (Select / Deselect)
    const toggleChoice = (groupIndex, group, option) => {
        setSelections((prev) => {
            const current = prev[groupIndex];
            const isMulti = group.maxSelect > 1;

            if (!isMulti) {
                // Radio behavior: Toggle off if same, else set new
                if (current?.name === option.name) {
                    const newSel = { ...prev };
                    delete newSel[groupIndex];
                    return newSel;
                }
                return { ...prev, [groupIndex]: { ...option, qty: 1 } };
            }

            // Checkbox behavior
            const list = Array.isArray(current) ? current : [];
            const exists = list.find((i) => i.name === option.name);

            if (exists) {
                // Remove if exists
                return { ...prev, [groupIndex]: list.filter((i) => i.name !== option.name) };
            }

            // Add new if limit not reached
            // Calculate current total quantity
            const totalQty = list.reduce((sum, i) => sum + i.qty, 0);
            if (totalQty < group.maxSelect) {
                return { ...prev, [groupIndex]: [...list, { ...option, qty: 1 }] };
            } else {
                toast.error(`You can only select up to ${group.maxSelect} options.`);
            }
            return prev;
        });
    };

    // Update Option Quantity (+ / -)
    const updateOptionQty = (groupIndex, groupOption, delta) => {
        const group = food.choiceGroups[groupIndex];
        setSelections((prev) => {
            const current = prev[groupIndex];
            const isMulti = group.maxSelect > 1;

            if (!isMulti) {
                // Radio: Just update qty of the single item (unlikely to need >1 for radio but supported)
                if (current && current.name === groupOption.name) {
                    const newQty = current.qty + delta;
                    if (newQty <= 0) {
                        const newSel = { ...prev };
                        delete newSel[groupIndex]; // Remove if 0
                        return newSel;
                    }
                    return { ...prev, [groupIndex]: { ...current, qty: newQty } };
                }
                return prev;
            }

            // Checkbox: find item in list
            const list = Array.isArray(current) ? current : [];
            const itemIndex = list.findIndex(i => i.name === groupOption.name);

            if (itemIndex === -1) {
                // Not selected, try to add if delta > 0
                if (delta > 0) return toggleChoice(groupIndex, group, groupOption);
                return prev;
            }

            const item = list[itemIndex];
            const newQty = item.qty + delta;

            // Check TOTAL limit if adding
            if (delta > 0) {
                const totalQty = list.reduce((sum, i) => sum + i.qty, 0);
                if (totalQty >= group.maxSelect) {
                    toast.error(`You can only select up to ${group.maxSelect} options.`);
                    return prev;
                }
            }

            if (newQty <= 0) {
                // Remove
                return { ...prev, [groupIndex]: list.filter((_, idx) => idx !== itemIndex) };
            }

            // Update qty
            const newList = [...list];
            newList[itemIndex] = { ...item, qty: newQty };
            return { ...prev, [groupIndex]: newList };
        });
    };

    // Helper to get subtotal for a specific group
    const getGroupSubtotal = (groupIndex) => {
        const selection = selections[groupIndex];
        if (!selection) return 0;

        if (Array.isArray(selection)) {
            return selection.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.qty), 0);
        } else {
            return (Number(selection.price) || 0) * (selection.qty || 1);
        }
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

            const selection = selections[i];
            let selectedCount = 0;
            if (Array.isArray(selection)) {
                selectedCount = selection.reduce((acc, item) => acc + item.qty, 0);
            } else if (selection) {
                selectedCount = selection.qty || 1;
            }

            if (group.minSelect > 0 && selectedCount < group.minSelect) {
                toast.error(`Please select at least ${group.minSelect} option(s) for ${group.name}`);
                return;
            }
        }

        // Construct Name
        let variantName = food.name;
        if (isVariant) variantName += ` (${activeItem.name})`;
        if (isPortion) variantName += ` (${activeItem.label})`;

        // Flatten selections
        const allSelectedChoices = [];

        Object.keys(selections).forEach(key => {
            const gIdx = Number(key);
            const sel = selections[key];
            const groupName = food.choiceGroups?.[gIdx]?.name || "Extras";

            const processItem = (item) => {
                const n = item.qty || 1;
                for (let q = 0; q < n; q++) {
                    allSelectedChoices.push({
                        group: groupName,
                        name: item.name,
                        price: Number(item.price),
                        stock: item.stock
                    });
                }
            };

            if (Array.isArray(sel)) {
                sel.forEach(processItem);
            } else if (sel) {
                processItem(sel);
            }
        });

        // Group choices for variant name suffix
        const choiceCounts = allSelectedChoices.reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
            return acc;
        }, {});

        Object.entries(choiceCounts).forEach(([name, count]) => {
            variantName += count > 1 ? ` + ${count}x ${name}` : ` + ${name}`;
        });

        // Image
        let displayImage = activeItem.image || (activeItem.images?.[0]) || (food.images?.[0]) || "";
        const imageUrl = typeof displayImage === 'string' ? displayImage : displayImage?.url || "";

        const payload = {
            foodId: food._id,
            restaurantId: food.vendor?._id || food.vendor,
            storeName: food.vendor?.storeName || "",
            name: food.name,
            variantId: initialEditItem?.variantId || activeItem?._id,
            variant: {
                name: variantName,
                price: finalUnitPrice,
                image: imageUrl,
                stock: activeItem.stock
            },
            price: finalUnitPrice,
            quantity: quantity,
            stock: food.stock,
            selectedChoices: allSelectedChoices,
            metadata: {
                portion: isPortion ? activeItem.label : (isVariant ? activeItem.name : "Standard"),
                choices: allSelectedChoices,
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

        if (initialEditItem && onUpdate) {
            onUpdate(payload);
        } else {
            onAdd(payload);
        }
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
                        className="relative w-full max-w-lg bg-zinc-50 dark:bg-[#0B1121] rounded-tl-[2rem] rounded-tr-[2rem] overflow-hidden flex flex-col max-h-[100vh]"
                    >
                        {/* Header Image */}
                        <div className="relative h-[220px] w-full shrink-0">
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

                        {/* Sticky Quantity Controls */}
                        <div className="sticky top-0 z-30 bg-white dark:bg-[#0B1121] border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Order Quantity
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {quantity} {quantity === 1 ? 'item' : 'items'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1.5 border border-zinc-200 dark:border-zinc-800">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all"
                                    >
                                        <Minus size={16} strokeWidth={2.5} />
                                    </button>

                                    <span className="text-xl font-black tabular-nums text-gray-900 dark:text-white min-w-[2rem] text-center">
                                        {quantity}
                                    </span>

                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-500/20"
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Options */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-hide bg-zinc-50 dark:bg-[#0B1121]">
                            {/* Choice Groups */}
                            {food.choiceGroups?.map((group, gIdx) => {
                                const hasImages = group.options.some(o => o.image);
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
                                                                REQ {group.minSelect}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full tracking-wider">
                                                            MAX {group.maxSelect}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium block mt-0.5">
                                                        {group.maxSelect > 1 ? "Select up to " + group.maxSelect : "Select one"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={hasImages ? "space-y-3" : "space-y-2"}>
                                            {group.options.map((option, oIdx) => {
                                                const selectedItem = getSelectedItem(gIdx, option.name);
                                                const isSelected = !!selectedItem;
                                                const itemQty = selectedItem?.qty || 0;

                                                const isOutOfStock = !option.stock || Number(option.stock) <= 0;

                                                return (
                                                    <div
                                                        key={oIdx}
                                                        className={`relative rounded-xl border transition-all ${isSelected
                                                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-500/20"
                                                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-200"
                                                            } ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
                                                    >
                                                        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center p-3">
                                                            <div className="w-14 h-14 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                                                                {option.image ? (
                                                                    <img src={option.image} alt={option.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <span className="text-2xl">🍽️</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col justify-center min-w-0">
                                                                <span className={`text-sm font-semibold leading-tight truncate ${isSelected
                                                                    ? "text-gray-900 dark:text-white"
                                                                    : "text-gray-700 dark:text-gray-300"
                                                                    }`}>
                                                                    {option.name}
                                                                </span>
                                                                {Number(option.price) > 0 && (
                                                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-500 mt-0.5">
                                                                        +₦{Number(option.price).toLocaleString()}
                                                                    </span>
                                                                )}
                                                                {isOutOfStock && (
                                                                    <span className="text-[9px] font-black text-red-500 uppercase mt-1">Sold Out</span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center shrink-0">
                                                                {isOutOfStock ? (
                                                                    <div className="w-20 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase">Out</span>
                                                                    </div>
                                                                ) : isSelected ? (
                                                                    // Quantity Controls when selected
                                                                    <div className="flex items-center bg-white dark:bg-zinc-800 rounded-lg border border-orange-200 dark:border-orange-900 shadow-sm overflow-hidden h-9">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateOptionQty(gIdx, option, -1);
                                                                            }}
                                                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <Minus size={12} strokeWidth={3} />
                                                                        </button>
                                                                        <span className="w-6 text-center text-xs font-bold text-orange-600 dark:text-orange-400">{itemQty}</span>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateOptionQty(gIdx, option, 1);
                                                                            }}
                                                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-green-500 transition-colors"
                                                                        >
                                                                            <Plus size={12} strokeWidth={3} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleChoice(gIdx, group, option);
                                                                        }}
                                                                        className="w-20 h-9 rounded-lg flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm transition-all font-semibold text-xs"
                                                                    >
                                                                        <Plus size={14} strokeWidth={2.5} />
                                                                        Select
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

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
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0B1121] z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                            {packingFee > 0 && (
                                <div className="mb-4 flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                                    <span className="flex items-center gap-2">
                                        <ShoppingBag size={16} />
                                        Packaging Fee
                                    </span>
                                    <span className="font-bold text-gray-900 dark:text-white">₦{packingFee.toLocaleString()}</span>
                                </div>
                            )}

                            <button
                                onClick={handleConfirm}
                                className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-between px-6 shadow-xl transition-all bg-[#FF6600] text-white hover:bg-[#ff7b24] active:scale-[0.98] shadow-orange-500/20"
                            >
                                <span>{initialEditItem ? "Update Order" : "Add to Order"}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm opacity-80 font-medium">Total</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-lg text-lg">
                                        ₦{totalPrice.toLocaleString()}
                                    </span>
                                </div>
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
