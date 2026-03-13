"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

export default function ComboCustomizationModal({
    combo, vendor, isOpen, onClose, onAdd
}) {
    const [selectedSwaps, setSelectedSwaps] = useState({});
    const { setIsModalOpen } = useCart();

    // Hide bottom nav when modal is open
    useEffect(() => {
        setIsModalOpen(isOpen);
        return () => setIsModalOpen(false);
    }, [isOpen, setIsModalOpen]);

    useEffect(() => {
        if (combo) setSelectedSwaps({});
    }, [combo?._id]);

    if (!isOpen || !combo) return null;

    const swapModifierTotal = Object.values(selectedSwaps)
        .reduce((sum, s) => sum + (s.price_modifier_naira || 0), 0);
    const totalPrice = (combo.price_naira || 0) + swapModifierTotal;
    const allRequiredMet = combo.swap_groups
        ?.filter(g => g.is_required)
        .every(g => selectedSwaps[g._id.toString()])
        ?? true;

    const handleAddToCart = () => {
        if (!allRequiredMet) return;

        onAdd({
            type:        "combo",
            variantId:   combo._id,
            vendorId:    vendor._id,
            storeName:   vendor.storeName,
            name:        combo.name,
            image_url:   combo.image_url,
            price_naira: totalPrice,
            quantity:    1,
            selected_swaps: Object.entries(selectedSwaps).map(
                ([group_id, swap]) => ({
                    group_id,
                    group_name: combo.swap_groups.find(
                        g => g._id.toString() === group_id
                    )?.name || "",
                    option_id:             swap.option_id,
                    label:                 swap.label,
                    price_modifier_naira:  swap.price_modifier_naira,
                })
            ),
        });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Card */}
            <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

                {/* Combo Image */}
                <div className="relative h-56 w-full shrink-0">
                    <img
                        src={combo.image_url || "/placeholder.jpg"}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <span className="absolute top-4 left-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full z-10 shadow-lg">
                        Deal
                    </span>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-none">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                            {combo.name}
                        </h2>
                        <p className="text-lg font-black text-orange-500 italic">
                            ₦{combo.price_naira?.toLocaleString()}
                        </p>
                    </div>

                    {combo.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {combo.description}
                        </p>
                    )}

                    {/* What's Included Section */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            What's Included
                        </p>
                        <div className="flex flex-col gap-2">
                            {combo.components?.map(c => (
                                <div key={c._id}
                                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-2.5">
                                    {c.image_url && (
                                        <img src={c.image_url} alt={c.name}
                                            className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-200" />
                                    )}
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1">
                                        {c.name}
                                    </span>
                                    {c.quantity > 1 && (
                                        <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            ×{c.quantity}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Swap Groups Section */}
                    {combo.swap_groups?.length > 0 ? (
                        <div className="space-y-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Customise Your Combo
                            </p>
                            {combo.swap_groups.map(group => (
                                <div key={group._id} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                                            {group.name}
                                        </span>
                                        {group.is_required && (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                                                Required
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.options?.map(opt => {
                                            const isSelected =
                                                selectedSwaps[group._id.toString()]
                                                    ?.option_id === opt._id.toString();
                                            return (
                                                <button
                                                    key={opt._id}
                                                    onClick={() =>
                                                        setSelectedSwaps(prev => ({
                                                            ...prev,
                                                            [group._id.toString()]: {
                                                                option_id: opt._id.toString(),
                                                                label: opt.label,
                                                                price_modifier_naira:
                                                                    opt.price_modifier_naira,
                                                            },
                                                        }))
                                                    }
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                        isSelected
                                                            ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300"
                                                    }`}
                                                >
                                                    {opt.label}
                                                    {opt.price_modifier_naira > 0 && (
                                                        <span className={`ml-1.5 text-[10px] ${
                                                            isSelected ? "text-orange-100" : "text-orange-500"
                                                        }`}>
                                                            +₦{opt.price_modifier_naira.toLocaleString()}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* No Swaps Fallback */
                        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl px-4 py-3">
                            <span className="text-orange-500 text-lg">🍽️</span>
                            <p className="text-xs font-bold text-orange-700 dark:text-orange-400">
                                This combo comes exactly as described — no customisation needed.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ₦{totalPrice.toLocaleString()}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={!allRequiredMet}
                        className={`flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                            allRequiredMet
                                ? "bg-orange-500 text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600 active:scale-95"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        }`}
                    >
                        {allRequiredMet ? "Add to Order" : "Select Required Options"}
                    </button>
                </div>
            </div>
        </div>
    );
}
