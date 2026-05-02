"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    Clock,
    ArrowLeft,
    Truck,
    ShoppingCart,
    Plus,
    Minus,
    Package,
} from "lucide-react";
import { BiCartAdd } from "react-icons/bi";

import { useCart } from "@/app/context/CartContext";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { getStorefrontComboDetail, getVendorStorefront } from "@/app/lib/menuApi";

import { useQuery } from "@tanstack/react-query";

// -----------------------------------------------------------------------------
// This page renders when the user taps a Combo on the restaurant storefront.
// Route: /combo-details/[comboId]?vendorId=xxx
// -----------------------------------------------------------------------------

export default function ComboDetailsPage({ initialData, comboId: propComboId, isModal, onClose }) {
    const router = useRouter();
    const params = useParams();
    const comboId = propComboId || params.comboId;

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);

    // ── Hardware back-button support (Android / browser back gesture) ──
    useEffect(() => {
        if (!isModal || !onClose) return;

        // Use a ref-style flag to prevent double-close when both
        // popstate AND the cleanup function fire in the same tick
        let closed = false;

        window.history.pushState({ melachowModal: 'combo' }, '');

        const handlePopState = () => {
            if (closed) return;
            closed = true;
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Only call history.back() if the UI button (not the back gesture)
            // triggered the unmount. If popstate already fired, the state is
            // already popped — calling back() again would navigate the page.
            if (!closed && window.history.state?.melachowModal === 'combo') {
                closed = true; // prevent the popstate handler from also firing
                window.history.back();
            }
        };
    }, [isModal, onClose]);

    // Resolve vendorId: prefer initialData (modal flow), fallback to URL param (page flow)
    const resolvedVendorId =
        initialData?.vendor?._id?.toString() ||
        initialData?.combo?.vendor_id?.toString() ||
        initialData?.combo?.vendor?._id?.toString() ||
        null;

    const [vendorId, setVendorId] = useState(resolvedVendorId);

    useEffect(() => {
        if (vendorId) return; // already resolved from initialData
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const fromUrl = searchParams.get("vendorId");
            if (fromUrl) setVendorId(fromUrl);
        }
    }, [isClient]);

    const { addComboToCart, cart } = useCart();

    // Data State
    const initialCombo = initialData?.combo || (initialData?.success ? null : initialData);
    const [combo, setCombo] = useState(initialCombo && Object.keys(initialCombo).length > 0 ? initialCombo : null);
    const [isLoading, setIsLoading] = useState(!initialCombo || Object.keys(initialCombo).length === 0);
    const [isError, setIsError] = useState(false);
    // initialData.vendor is now always set when opened as a modal from storefront/food-details.
    // initialCombo?.vendor covers the case where the combo document itself embeds vendor info.
    const [vendor, setVendor] = useState(
        initialData?.vendor ||
        initialCombo?.vendor ||
        null
    );

    console.log('[ComboDetailsPage] 🍱 initialData:', initialData);
    console.log('[ComboDetailsPage] 🍕 combo state:', combo);

    // Selections state
    const [selections, setSelections] = useState({});
    const [quantity, setQuantity] = useState(1);

    const comboNeedsDetailFetch =
        !!comboId &&
        !!vendorId &&
        (!combo || !Array.isArray(combo.choice_groups));

    const { data: comboDetailData } = useQuery({
        queryKey: ["storefront-combo-detail", vendorId, comboId],
        queryFn: () => getStorefrontComboDetail(vendorId, comboId),
        enabled: comboNeedsDetailFetch,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (!comboDetailData?.combo) return;
        setCombo(comboDetailData.combo);
        setVendor(current => comboDetailData.vendor || comboDetailData.combo.vendor || current || null);
        setIsError(false);
        setIsLoading(false);
    }, [comboDetailData]);

    // Only fetch the whole storefront if we still need vendor data and cannot
    // fetch a precise combo detail yet.
    const needsVendorFetch = !vendor && !!vendorId;

    const { data: storefrontData } = useQuery({
        queryKey: ["vendor-storefront", vendorId],
        queryFn: () => getVendorStorefront(vendorId),
        enabled: needsVendorFetch && !comboNeedsDetailFetch,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (storefrontData) {
            setVendor(storefrontData.vendor);
            if (!combo) {
                const found = storefrontData.combos?.find(c => c._id?.toString() === comboId);
                setCombo(found);
            }
        }
    }, [storefrontData, comboId, combo]);

    // Reset on combo change
    useEffect(() => {
        if (combo) {
            setSelections({});
            setQuantity(1);
        }
    }, [combo?._id]);

    // -- Pricing --------------------------------------------------------------
    const addonsPrice = Object.values(selections).reduce((acc, sel) => {
        if (Array.isArray(sel)) {
            return acc + sel.reduce((s, o) => s + ((o.price_modifier_naira || 0) * (o.quantity || 1)), 0);
        }
        return acc + ((sel?.price_modifier_naira || 0) * (sel?.quantity || 1));
    }, 0);

    // ComboItem.price is stored in KOBO in the database.
    // The storefront API may return it as price_naira (already converted)
    // or as price (raw kobo). Normalise defensively.
    const comboPriceNaira = combo?.price_naira
        ?? (combo?.price != null ? combo.price / 100 : 0);

    const totalUnit = comboPriceNaira + addonsPrice;
    const total = totalUnit * quantity;

    // -- Choice Group Logic ----------------------------------------------------
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
                    if (group.is_required) return prev;
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
                return { ...prev, [groupKey]: list.filter(i => i.label !== option.label) };
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
                return { ...prev, [groupKey]: list.filter(i => i.label !== optionLabel) };
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

    // ── Add to Cart ───────────────────────────────────────────────────────────
    const handleAddToCart = () => {
        const choiceGroups = combo?.choice_groups || [];

        for (const group of choiceGroups) {
            const groupKey = group._id.toString();
            const sel = selections[groupKey];
            let count = 0;
            if (Array.isArray(sel)) count = sel.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
            else if (sel) count = (sel.quantity || 1);

            if (group.is_required && count < group.min_selections) {
                toast.error(`Please select at least ${group.min_selections} for "${group.name}"`);
                return;
            }
        }

        const selected_options = [];
        Object.keys(selections).forEach(key => {
            const group = choiceGroups.find(g => g._id.toString() === key);
            if (!group) return;
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

        addComboToCart({
            type:          "combo",
            comboId:       combo._id,
            variantId:     combo._id, // Alias for backward compatibility
            vendorId:      vendor._id,

            storeName:     vendor.storeName,
            restaurantId:  vendor._id,
            name:          combo.name,
            image_url:     combo.image_url || "",
            price_naira:   totalUnit,
            quantity,
            deliveryFee:   vendor.deliveryFee || 0,
            selected_options,
        });

        toast.success("Bundle added to order!");
        router.push("/orders?activeTab=cart");
    };

    // Render
    if (!isClient) return <div className="min-h-screen bg-white dark:bg-zinc-950" />;

    if (isLoading) {
        // Shown only in the full-page route while data is being fetched.
        // As a modal, combo is always pre-loaded from initialData — this
        // state should not trigger. If it somehow does, render minimally
        // so the modal backdrop is still visible.
        if (isModal) {
            return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <div className="relative w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading Bundle...</p>
                </div>
            </div>
        );
    }

    if (isError || !combo) {
        const errorContent = (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-6">
                <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 max-w-sm w-full">
                    <Package size={48} className="mx-auto text-zinc-300 mb-4" />
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Bundle Unavailable</h2>
                    <p className="text-zinc-500 text-sm mb-6">We couldn't load this combo right now. Please try again.</p>
                    <button onClick={() => onClose ? onClose() : router.back()} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
                        Go Back
                    </button>
                </div>
            </div>
        );
        if (isModal) {
            return (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <div className="relative w-full max-w-2xl h-screen overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
                        {errorContent}
                    </div>
                </div>
            );
        }
        return errorContent;
    }

    const choiceGroups = combo.choice_groups || [];
    const totalItems = cart.length;

    const mainContent = (
        <div className={`min-h-screen ${isModal ? 'bg-zinc-50 dark:bg-zinc-950 overflow-hidden' : 'bg-zinc-50 dark:bg-zinc-950'}`}>
            {/* Sticky Header */}
            <header className="flex items-center justify-between px-4 py-4 bg-white bg-opacity-80 dark:bg-zinc-900 dark:bg-opacity-80 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (onClose) onClose();
                            else router.back();
                        }}
                        className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:text-zinc-400 transition-all active:scale-90"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div
                        className="cursor-pointer"
                        onClick={() => vendor?._id && router.push(`/restaurants/${vendor._id}`)}
                    >
                        <h1 className="text-[10px] font-semibold text-orange-600 uppercase tracking-[0.2em]">Restaurant</h1>
                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 italic uppercase tracking-tighter hover:underline">
                            {vendor?.storeName || "Bundle Details"}
                        </h2>
                        <p className={`text-[10px] font-bold ${vendor?.openingHours && getVendorOpenAndCloseStatus(vendor.openingHours).startsWith("Open now") ? "text-emerald-500" : "text-rose-500"}`}>
                            {vendor?.openingHours ? getVendorOpenAndCloseStatus(vendor.openingHours) : "Opening hours unavailable"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/orders?activeTab=cart" onClick={() => isModal && onClose && onClose()}>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative bg-zinc-900 dark:bg-zinc-100 p-2.5 rounded-2xl">
                            <BiCartAdd className="text-white dark:text-zinc-900" size={24} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 ring-4 ring-white dark:ring-zinc-900 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                                    {totalItems}
                                </span>
                            )}
                        </motion.div>
                    </Link>
                </div>
            </header>

            {/* Page Body */}
            <div className="bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                <div className="max-w-4xl mx-auto pb-32">
                    <div className="space-y-6">

                        {/* Hero Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-1 pt-2">
                            <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                                {/* Image */}
                                <div className="relative w-full bg-zinc-100 dark:bg-zinc-800 p-2">
                                    <div className="w-full h-[250px] md:h-[300px] rounded-[32px] overflow-hidden relative">
                                        <img
                                            src={combo.image_url || "/placeholder.jpg"}
                                            alt={combo.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Deal badge */}
                                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                            Bundle Deal
                                        </div>

                                        {/* Dietary badge */}
                                        {combo.dietary_type && combo.dietary_type !== "mixed" && (
                                            <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-800 dark:text-zinc-200 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                {combo.dietary_type}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="md:p-5 p-2 pb-4">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight uppercase mb-2">
                                        {combo.name}
                                    </h3>
                                    {combo.description && (
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed italic font-medium">
                                            "{combo.description}"
                                        </p>
                                    )}

                                    {/* Tags */}
                                    {combo.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {combo.tags.map(tag => (
                                                <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-500/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <div className="flex items-center gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100/80 dark:border-zinc-700/80">
                                            <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-orange-500 shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Est. Time</p>
                                                <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                                                    {combo.prep_time_minutes ? `${combo.prep_time_minutes} min` : "25 min"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100/80 dark:border-zinc-700/80">
                                            <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-orange-500 shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800">
                                                <Truck size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Delivery</p>
                                                <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                                                    {vendor?.deliveryFee ? `₦${vendor.deliveryFee.toLocaleString()}` : "Free"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* What's Included */}
                        {combo.contents?.length > 0 && (
                            <div className="px-1">
                                <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                                        <h3 className="text-lg font-black italic text-zinc-900 dark:text-white uppercase tracking-tight">
                                            What's Included
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {combo.contents.map((item, idx) => (
                                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-700 text-[11px] font-black uppercase tracking-tight italic text-zinc-600 dark:text-zinc-300">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Choice Groups */}
                        {choiceGroups.length > 0 && (
                            <div className="px-1 space-y-4">
                                {choiceGroups.map(group => {
                                    const groupKey = group._id.toString();
                                    const groupSelection = selections[groupKey];
                                    const isMet = group.is_required ? (
                                        Array.isArray(groupSelection)
                                            ? groupSelection.reduce((a, c) => a + (c.quantity || 1), 0) >= group.min_selections
                                            : groupSelection !== undefined
                                    ) : true;

                                    return (
                                        <div key={groupKey} className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                                    <h4 className="text-[15px] font-black italic text-zinc-900 dark:text-white uppercase tracking-tight">
                                                        {group.name}
                                                    </h4>
                                                </div>
                                                {group.is_required ? (
                                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${isMet ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
                                                        {isMet ? "Yes" : "Required"}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                        Optional
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-4">
                                                {group.max_selections > 1 ? `Pick ${group.min_selections}–${group.max_selections}` : "Pick exactly one"}
                                            </p>

                                            <div className="space-y-3">
                                                {group.options?.filter(o => o.is_available).map(option => {
                                                    const isSelected = isOptionSelected(groupKey, option.label);
                                                    return (
                                                        <div
                                                            key={option._id}
                                                            onClick={() => toggleChoice(groupKey, group, option)}
                                                            className={`flex items-center gap-4 p-3 rounded-[20px] border-2 cursor-pointer transition-all ${
                                                                isSelected
                                                                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-lg shadow-orange-500/5"
                                                                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-200 dark:hover:border-orange-500/30"
                                                            }`}
                                                        >
                                                            {/* Selection Indicator Circle */}
                                                            <div className="w-8 h-8 rounded-full bg-orange-600/10 text-orange-600 flex items-center justify-center shrink-0">
                                                                <Plus size={12} strokeWidth={4} />
                                                            </div>

                                                            {/* Label & price */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-[13px] text-zinc-900 dark:text-white truncate tracking-tight uppercase italic">
                                                                    {option.label}
                                                                </p>
                                                                {option.price_modifier_naira > 0 ? (
                                                                    <p className="text-[11px] font-black text-orange-500">
                                                                        +N{option.price_modifier_naira.toLocaleString()}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                                                                        Included
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Quantity stepper or radio dot */}
                                                            {isSelected ? (
                                                                <div
                                                                    className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={() => updateOptionQuantity(groupKey, option.label, -1, group)}
                                                                        className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900"
                                                                    >
                                                                        <Minus size={14} strokeWidth={3} />
                                                                    </button>
                                                                    <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[12px] text-center tabular-nums">
                                                                        {Array.isArray(selections[groupKey])
                                                                            ? selections[groupKey].find(i => i.label === option.label)?.quantity || 1
                                                                            : selections[groupKey]?.quantity || 1}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => updateOptionQuantity(groupKey, option.label, 1, group)}
                                                                        className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900"
                                                                    >
                                                                        <Plus size={14} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="w-[22px] h-[22px] rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty state for no choice groups */}
                        {choiceGroups.length === 0 && (
                            <div className="px-1">
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-50 italic bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                                    <div className="text-4xl mb-4">⚡</div>
                                    <p className="text-xs font-black uppercase tracking-widest">No customizations required</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Fixed Bottom Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-2 bg-white bg-opacity-95 dark:bg-zinc-950 dark:bg-opacity-90 backdrop-blur-xl border-t border-zinc-100 border-opacity-50 dark:border-zinc-800 dark:border-opacity-80 pb-safe z-40 ${isModal ? 'rounded-b-[40px]' : ''}`}>
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-2">
                    {/* Quantity control */}
                    <div className="flex items-center gap-1 bg-zinc-100 bg-opacity-80 dark:bg-zinc-900 dark:bg-opacity-80 rounded-[21px] p-1 h-[48px] border border-zinc-200 border-opacity-50 dark:border-zinc-800 dark:border-opacity-50 shadow-inner shrink-0">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-[30px] h-[30px] flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-orange-500 dark:hover:bg-opacity-10 transition-all text-zinc-600 dark:text-zinc-400 shadow-sm border border-zinc-100 dark:border-zinc-700"
                        >
                            <Minus size={18} strokeWidth={3} />
                        </button>
                        <div className="w-8 flex flex-col items-center">
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter leading-none mb-0.5">Qty</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums leading-none">{quantity}</span>
                        </div>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-[30px] h-[30px] flex items-center justify-center rounded-2xl bg-orange-500 text-white active:scale-95 transition-all"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Add to Order button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!combo.is_available}
                        className="flex-1 h-[48px] bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white dark:text-zinc-900 rounded-[20px] font-black text-[12px] uppercase tracking-[0.05em] italic flex items-center justify-between px-4 transition-all active:scale-[0.98] dark:shadow-none group border border-zinc-800/50 dark:border-zinc-200/50 shadow-lg"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 rounded-xl bg-orange-500 text-white group-hover:rotate-12 transition-transform shrink-0">
                                <ShoppingCart size={18} />
                            </div>
                            <span className={`truncate ${combo.is_available ? "text-white dark:text-zinc-900 group-hover:text-orange-500" : "text-zinc-400"}`}>
                                {combo.is_available ? "Add to Order" : "Unavailable"}
                            </span>
                        </div>

                        {combo.is_available && (
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                <div className="w-[1.5px] h-5 bg-white/20 dark:bg-zinc-950/20 rounded-full" />
                                <span className="text-orange-500 tabular-nums font-black text-base">
                                    ₦{total.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-end justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-2xl h-screen overflow-y-auto no-scrollbar"
                >
                    {mainContent}
                </motion.div>
            </div>
        );
    }

    return mainContent;
}
