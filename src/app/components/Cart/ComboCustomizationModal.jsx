"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, ChevronRight, Info, Plus } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

export default function ComboCustomizationModal({
    combo, vendor, isOpen, onClose, onAdd
}) {
    const [selectedSwaps, setSelectedSwaps] = useState({});
    const [componentChoices, setComponentChoices] = useState({});
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
        if (combo) {
            setSelectedSwaps({});
            setComponentChoices({});
        }
    }, [combo?._id]);

    if (!isOpen || !combo) return null;

    const swapModifierTotal = Object.values(selectedSwaps)
        .reduce((sum, s) => sum + (s.price_modifier_naira || 0), 0);

    const choiceModifierTotal = Object.values(componentChoices)
        .reduce((sum, c) => sum + (c.price_modifier_naira || 0), 0);

    const totalPrice = (combo.price_naira || 0)
        + swapModifierTotal
        + choiceModifierTotal;

    const allRequiredSwapsMet = combo.swapGroups
        ?.filter(g => g.is_required)
        .every(g => selectedSwaps[g._id.toString()])
        ?? true;

    const allRequiredChoicesMet = combo.components
        ?.flatMap(c =>
            (c.choiceGroups || [])
                .filter(g => g.is_required)
                .map(g => `${c._id}__${g._id}`)
        )
        .every(key => componentChoices[key])
        ?? true;

    const canAddToCart = allRequiredSwapsMet && allRequiredChoicesMet;

    const handleAddToCart = () => {
        if (!canAddToCart) return;

        const component_choices = Object.entries(componentChoices).map(
            ([key, choice]) => {
                const [component_id, group_id] = key.split("__");
                const component = combo.components.find(
                    c => c._id.toString() === component_id
                );
                const group = component?.choiceGroups?.find(
                    g => g._id.toString() === group_id
                );
                return {
                    componentId: component_id,    // ← camelCase
                    item_name:   component?.name || "",
                    groupId:     group_id,        // ← camelCase
                    group_name:  group?.name     || "",
                    optionId:    choice.option_id, // ← camelCase
                    label:       choice.label,
                    price_modifier_naira: choice.price_modifier_naira,
                };
            }
        );

        const selected_swaps = Object.entries(selectedSwaps).map(
            ([group_id, swap]) => ({
                group_id,
                group_name: combo.swapGroups?.find(
                    g => g._id.toString() === group_id
                )?.name || "",
                option_id:             swap.option_id,
                label:                 swap.label,
                price_modifier_naira:  swap.price_modifier_naira,
            })
        );

        onAdd({
            type:              "combo",
            variantId:         combo._id,
            vendorId:          vendor._id,
            storeName:         vendor.storeName,
            name:              combo.name,
            image_url:         combo.image_url,
            price_naira:       totalPrice,
            quantity:          1,
            deliveryFee:       vendor.deliveryFee || 0,
            selected_swaps,
            component_choices,
        });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Ultra-smooth Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

            {/* Premium Card Container */}
            <div className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-slate-900 scroll overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] max-h-[100vh] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                
                {/* Immersive Header */}
                <div className="relative h-64 w-full shrink-0 group">
                    <img
                        src={combo.image_url || "/placeholder.jpg"}
                        alt={combo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-black/30" />
                    
                    {/* Navigation Actions */}
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                        <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/30">
                            Exclusive Deal
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 active:scale-90"
                    >
                        <X size={22} strokeWidth={2.5} />
                    </button>
                    
                    {/* Visual Anchor for Content */}
                    <div className="absolute -bottom-1 left-0 right-0 h-8 bg-white dark:bg-slate-900 rounded-t-[2rem]" />
                </div>

                {/* Body Content */}
                <div className="px-6 sm:px-10 pb-6 space-y-10 overflow-y-auto flex-1 scrollbar-none custom-scrollbar">
                    
                    {/* Hero Title & Info */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white leading-[1.1] tracking-tight">
                                {combo.name}
                            </h2>
                            <div className="bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-2xl border border-orange-100 dark:border-orange-500/20 shrink-0">
                                <p className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
                                    ₦{totalPrice.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {combo.description && (
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[90%]">
                                {combo.description}
                            </p>
                        )}
                    </div>

                    {/* Section: What's Included (Visual Guide) */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Included Components
                            </p>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {combo.components?.map(c => (
                                <div key={c._id}
                                    className="group flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-3xl p-3 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-[1.25rem] overflow-hidden bg-white dark:bg-slate-900 shrink-0 shadow-sm">
                                        <img src={c.image_url || "/placeholder.jpg"} alt={c.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                                            {c.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Standard Item
                                            </span>
                                            {c.quantity > 1 && (
                                                <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg">
                                                    ×{c.quantity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <CheckCircle2 size={18} className="text-slate-200 dark:text-slate-700 group-hover:text-green-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Component Level Customisation */}
                    {combo.components?.some(c => c.choiceGroups?.length > 0) && (
                        <div className="space-y-8">
                             <div className="flex items-center gap-3">
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                    Personalise Selection
                                </p>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                            </div>

                            {combo.components
                                .filter(c => c.choiceGroups?.length > 0)
                                .map(component => (
                                    <div key={component._id} className="space-y-6">
                                        {/* Component Brand Header */}
                                        <div className="flex items-center gap-4 bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-3xl border border-orange-100/50 dark:border-orange-500/10">
                                            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shrink-0">
                                                <img src={component.image_url || "/placeholder.jpg"}
                                                    alt={component.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-black uppercase tracking-[0.1em] text-orange-600 dark:text-orange-400 block -mb-0.5">Customise</span>
                                                <span className="text-base font-black text-slate-900 dark:text-white">
                                                    {component.name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Nested Choice Groups with Image Support */}
                                        <div className="space-y-6 pl-4 sm:pl-8 border-l-2 border-slate-100 dark:border-slate-800/50">
                                            {component.choiceGroups.map(group => {
                                                const choiceKey = `${component._id}__${group._id}`;
                                                const selected = componentChoices[choiceKey];

                                                return (
                                                    <div key={group._id} className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                                                                    {group.name}
                                                                </span>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    {group.is_required ? "Selection Required" : "Optional Addition"}
                                                                </p>
                                                            </div>
                                                            {group.is_required && (
                                                                <span className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg shadow-rose-500/20">
                                                                    Required
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* High-End Option Grids With Images */}
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {group.options?.map(opt => {
                                                                const isSelected = selected?.option_id === opt._id.toString();
                                                                return (
                                                                    <button
                                                                        key={opt._id}
                                                                        onClick={() =>
                                                                            setComponentChoices(prev => {
                                                                                if (isSelected) {
                                                                                    const next = { ...prev };
                                                                                    delete next[choiceKey];
                                                                                    return next;
                                                                                }
                                                                                return {
                                                                                    ...prev,
                                                                                    [choiceKey]: {
                                                                                        option_id: opt._id.toString(),
                                                                                        label: opt.label,
                                                                                        price_modifier_naira: opt.price_modifier_naira,
                                                                                    }
                                                                                };
                                                                            })
                                                                        }
                                                                        className={`group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 relative text-left ${
                                                                            isSelected
                                                                                ? "bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20 translate-x-1"
                                                                                : "bg-white dark:bg-slate-800/30 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-500/5"
                                                                        }`}
                                                                    >
                                                                        {/* Option Image Support */}
                                                                        {opt.image_url ? (
                                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                                                                                <img src={opt.image_url} alt={opt.label} className="w-full h-full object-cover" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                                                <Plus size={18} />
                                                                            </div>
                                                                        )}
                                                                        
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-black truncate">{opt.label}</p>
                                                                            {opt.price_modifier_naira > 0 && (
                                                                                <p className={`text-[10px] font-black mt-0.5 ${isSelected ? 'text-orange-100' : 'text-orange-500'}`}>
                                                                                    +₦{opt.price_modifier_naira.toLocaleString()}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {isSelected && (
                                                                            <CheckCircle2 size={24} strokeWidth={2.5} className="text-white drop-shadow-md" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {/* Section: Combo Level Swaps */}
                    {combo.swapGroups?.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                    Meal Variations
                                </p>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                            </div>

                            {combo.swapGroups.map(group => (
                                <div key={group._id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                            {group.name}
                                        </span>
                                        {group.is_required && (
                                            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                                                Flexible
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {group.options?.map(opt => {
                                            const isSelected = selectedSwaps[group._id.toString()]?.option_id === opt._id.toString();
                                            return (
                                                <button
                                                    key={opt._id}
                                                    onClick={() =>
                                                        setSelectedSwaps(prev => {
                                                            if (isSelected) {
                                                                const next = { ...prev };
                                                                delete next[group._id.toString()];
                                                                return next;
                                                            }
                                                            return {
                                                                ...prev,
                                                                [group._id.toString()]: {
                                                                    option_id: opt._id.toString(),
                                                                    label: opt.label,
                                                                    price_modifier_naira: opt.price_modifier_naira,
                                                                }
                                                            };
                                                        })
                                                    }
                                                    className={`relative flex items-center justify-between px-5 py-4 rounded-[2rem] border transition-all duration-300 ${
                                                        isSelected
                                                            ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-xl ring-4 ring-orange-500/20"
                                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-500"
                                                    }`}
                                                >
                                                    <span className="text-sm font-black pr-2">{opt.label}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {opt.price_modifier_naira > 0 && (
                                                            <span className={`text-[10px] font-black ${isSelected ? 'opacity-80' : 'text-orange-500'}`}>
                                                                +₦{opt.price_modifier_naira.toLocaleString()}
                                                            </span>
                                                        )}
                                                        {isSelected ? (
                                                            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                                                <X size={12} strokeWidth={4} />
                                                            </div>
                                                        ) : (
                                                            <ChevronRight size={16} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Minimal No-Customisation Anchor */}
                    {combo.swapGroups?.length === 0 &&
                     combo.components?.every(c => !c.choiceGroups?.length) && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/5 rounded-[2.5rem] flex items-center justify-center text-4xl animate-bounce">
                                🍱
                            </div>
                            <div className="max-w-[240px]">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Perfect as is!</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">
                                    This combo is expertly curated. No further customisation required.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Glassmorphic Sticky Footer */}
                <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800/50 p-6 sm:px-10 flex items-center gap-6 shrink-0 shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Total Bill</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter">
                                ₦{totalPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAddToCart}
                        disabled={!canAddToCart}
                        className={`flex-1 h-16 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden group ${
                            canAddToCart
                                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-95 active:translate-y-0"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50"
                        }`}
                    >
                        {/* Shimmer Effect */}
                        {canAddToCart && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        )}
                        
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {!allRequiredChoicesMet
                                ? "Complete Selections"
                                : !allRequiredSwapsMet
                                    ? "Add Meal Option"
                                    : "Add to Order"
                            }
                            {canAddToCart && <ChevronRight size={18} strokeWidth={3} />}
                        </span>
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </div>
    );
}
