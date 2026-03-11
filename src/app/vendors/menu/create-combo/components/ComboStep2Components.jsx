"use client";

import { useState, useEffect, useMemo } from "react";
import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { getVendorMenuItems, getMenuItemDetail } from "@/app/lib/menuApi";
import {
    Search,
    Plus,
    Minus,
    X,
    ArrowLeft,
    Loader2,
    UtensilsCrossed,
    Info
} from "lucide-react";
import toast from "react-hot-toast";

export default function ComboStep2Components({ onNext, onBack }) {
    const store = useCreateComboStore();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedItemId, setExpandedItemId] = useState(null);

    const [detailCache, setDetailCache] = useState({});
    const [activeSectionFilter, setActiveSectionFilter] = useState("all");
    const [pickerPage, setPickerPage] = useState(1);
    const PICKER_PAGE_SIZE = 10;

    useEffect(() => {
        if (!vendorId) return;
        const fetchItems = async () => {
            try {
                const data = await getVendorMenuItems(vendorId);
                // console.log(data);

                setItems(data?.items || data || []);
            } catch (err) {
                console.error("Failed to fetch items", err);
                toast.error("Could not load your menu items");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [vendorId]);

    // Build unique section list from loaded items
    const sections = useMemo(() => {
        const map = new Map();
        items.forEach(item => {
            if (item.section) {
                map.set(item.section._id, item.section.name);
            }
        });
        return [
            { _id: "all", name: "All Items" },
            ...Array.from(map.entries()).map(([_id, name]) => ({ _id, name })),
            ...(items.some(i => !i.section) ? [{ _id: "other", name: "Other" }] : []),
        ];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            const matchesSection =
                activeSectionFilter === "all"
                || (activeSectionFilter === "other" && !item.section)
                || item.section?._id === activeSectionFilter;

            return matchesSearch && matchesSection;
        });
    }, [items, searchTerm, activeSectionFilter]);

    // Reset page when search or section filter changes
    useEffect(() => {
        setPickerPage(1);
    }, [searchTerm, activeSectionFilter]);

    const paginatedItems = useMemo(() => {
        const start = (pickerPage - 1) * PICKER_PAGE_SIZE;
        return filteredItems.slice(start, start + PICKER_PAGE_SIZE);
    }, [filteredItems, pickerPage]);

    const totalPickerPages = Math.ceil(filteredItems.length / PICKER_PAGE_SIZE);

    const handleExpandItem = async (itemId) => {
        // Toggle collapse
        if (expandedItemId === itemId) {
            setExpandedItemId(null);
            return;
        }

        setExpandedItemId(itemId);

        // Already cached — skip fetch
        // But if previous attempt errored, clear it and retry
        if (detailCache[itemId] && detailCache[itemId] !== "error") return;
        if (detailCache[itemId] === "error") {
            setDetailCache(prev => ({ ...prev, [itemId]: undefined }));
        }

        // Mark as loading
        setDetailCache(prev => ({ ...prev, [itemId]: "loading" }));

        try {
            const res = await getMenuItemDetail(vendorId, itemId);
            // The response shape is { success, item }
            // res.item contains populated choice_groups
            setDetailCache(prev => ({
                ...prev,
                [itemId]: res.item || null,
            }));
        } catch {
            setDetailCache(prev => ({ ...prev, [itemId]: "error" }));
        }
    };

    const handleAddItem = (item) => {
        const existing = store.components.find(
            c => c.menu_item_id === item._id
        );

        if (existing) {
            store.updateComponent(existing.tempId, {
                quantity: Math.min(10, existing.quantity + 1),
            });
            toast.success(`${item.name} ×${existing.quantity + 1}`);
            setExpandedItemId(null);
            return;
        }

        store.addComponent({
            menu_item_id: item._id,
            menu_item_name: item.name,
            menu_item_image: item.image_url || null,
            menu_item_section: item.section?.name || null,
            unit_price_naira:
                item.portions?.default_price_naira
                ?? item.portions?.min_price_naira
                ?? 0,
            choice_group_count: item.choice_groups?.count || 0,
        });

        setExpandedItemId(null);
    };

    const handleNext = () => {
        if (store.components.length < 2) {
            toast.error("A combo needs at least 2 items");
            return;
        }
        onNext();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                {/* Step heading */}
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Build Your Bundle
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Select at least 2 items from your menu that will be
                        sold together as one combo deal.
                    </p>
                </div>

                {/* Concept explainer — collapses after vendor adds first item */}
                {store.components.length === 0 && (
                    <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-4 flex gap-4">
                        <div className="text-2xl shrink-0">🍱</div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">
                                How combos work
                            </p>
                            <p className="text-sm text-orange-800 dark:text-orange-300 font-medium leading-relaxed">
                                A combo bundles multiple menu items into one
                                purchasable deal — e.g. <strong>Jollof Rice +
                                    Chicken + Drink</strong> sold together for ₦2,500
                                instead of ₦3,200 separately. Customers order it
                                as a single item.
                            </p>
                        </div>
                    </div>
                )}

                {/* Live progress hint once items are being added */}
                {store.components.length > 0 && store.components.length < 2 && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <span className="text-amber-500 text-lg">⚠️</span>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Add at least one more item to complete this combo.
                        </p>
                    </div>
                )}

                {store.components.length >= 2 && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <span className="text-emerald-500 text-lg">✓</span>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Good — {store.components.length} items selected.
                            You can add more or continue to the next step.
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Left: Picker */}
                <div className="space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find an item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-bold text-slate-900 dark:text-white outline-none"
                        />
                    </div>

                    {/* Section tabs — only render if more than one section exists */}
                    {sections.length > 2 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {sections.map(section => (
                                <button
                                    key={section._id}
                                    onClick={() => setActiveSectionFilter(section._id)}
                                    className={`shrink-0 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSectionFilter === section._id
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="text-xs font-black uppercase tracking-widest">Loading menu...</p>
                                </div>
                            ) : paginatedItems.length > 0 ? (
                                <div className="flex flex-col h-full relative">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                                        {paginatedItems.map(item => {
                                            const isAdded = store.components.some(c => c.menu_item_id === item._id);
                                            const isExpanded = expandedItemId === item._id;
                                            const detail = detailCache[item._id];
                                            const hasChoices = item.choice_groups?.count > 0;

                                            return (
                                                <div
                                                    key={item._id}
                                                    className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    {/* ── ITEM ROW ── */}
                                                    <div
                                                        onClick={() => !isAdded && handleExpandItem(item._id)}
                                                        className={`p-4 flex items-center gap-3 transition-colors ${isAdded
                                                            ? "bg-orange-50/50 dark:bg-orange-500/5 cursor-default"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                                            }`}
                                                    >
                                                        {/* Name + metadata */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-bold text-sm truncate ${isAdded
                                                                ? "text-orange-500 dark:text-orange-400"
                                                                : "text-slate-900 dark:text-white"
                                                                }`}>
                                                                {item.name}
                                                            </h4>

                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">

                                                                {/* Choice groups count */}
                                                                {hasChoices ? (
                                                                    <span className="text-[10px] font-black text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                                        {item.choice_groups.count} choice {item.choice_groups.count === 1 ? "group" : "groups"}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                                        No choices
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right indicator */}
                                                        {isAdded ? (
                                                            <span className="shrink-0 text-[10px] font-black text-orange-500 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400 px-3 py-1.5 rounded-xl uppercase tracking-wide">
                                                                ✓ Added
                                                            </span>
                                                        ) : (
                                                            <div className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-45" : ""
                                                                }`}>
                                                                <Plus size={14} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ── EXPANDED PANEL ── */}
                                                    {isExpanded && !isAdded && (
                                                        <div className="mx-4 mb-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden">

                                                            {/* Choice groups */}
                                                            <div className="p-4 space-y-4">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                    Customer choices included in this combo:
                                                                </p>

                                                                {detail === "loading" && (
                                                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold py-2">
                                                                        <Loader2 size={13} className="animate-spin" />
                                                                        Loading choices...
                                                                    </div>
                                                                )}

                                                                {detail === "error" && (
                                                                    <p className="text-xs text-rose-500 font-bold">
                                                                        Failed to load choice details.
                                                                    </p>
                                                                )}

                                                                {detail && detail !== "loading" && detail !== "error" && (
                                                                    <>
                                                                        {detail.choice_groups?.length > 0 ? (
                                                                            <div className="space-y-3">
                                                                                {detail.choice_groups.map(group => (
                                                                                    <div key={group._id} className="space-y-1.5">
                                                                                        {/* Group header */}
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                                                                {group.name}
                                                                                            </span>
                                                                                            {group.is_required && (
                                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                                                                                                    Required
                                                                                                </span>
                                                                                            )}
                                                                                            <span className="text-[9px] text-slate-400 font-bold ml-auto">
                                                                                                Pick {group.min_selections}
                                                                                                {group.max_selections > group.min_selections
                                                                                                    ? `–${group.max_selections}`
                                                                                                    : ""}
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Options */}
                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {group.options?.map(opt => (
                                                                                                <span
                                                                                                    key={opt._id}
                                                                                                    className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg"
                                                                                                >
                                                                                                    {opt.label}
                                                                                                    {opt.price_modifier > 0 && (
                                                                                                        <span className="text-orange-500 ml-1">
                                                                                                            +₦{(opt.price_modifier / 100).toLocaleString()}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400 font-medium italic">
                                                                                No choices configured — customer orders this item as-is.
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Add button */}
                                                            <div className="p-4 pt-0">
                                                                <button
                                                                    onClick={() => handleAddItem(item)}
                                                                    disabled={detail === "loading"}
                                                                    className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                                                                >
                                                                    Add to Combo
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {totalPickerPages > 1 && (
                                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
                                            <button
                                                onClick={() => setPickerPage(p => Math.max(1, p - 1))}
                                                disabled={pickerPage === 1}
                                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                                            >
                                                ← Prev
                                            </button>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {pickerPage} / {totalPickerPages}
                                                <span className="ml-2 text-slate-300 dark:text-slate-600">
                                                    ({filteredItems.length} items)
                                                </span>
                                            </span>
                                            <button
                                                onClick={() => setPickerPage(p => Math.min(totalPickerPages, p + 1))}
                                                disabled={pickerPage === totalPickerPages}
                                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                        <UtensilsCrossed size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No items found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Selected components */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            Included Items
                            <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px]">{store.components.length}</span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        {store.components.map(comp => (
                            <div key={comp.tempId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 group/card shadow-sm">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0">
                                    {comp.menu_item_image ? (
                                        <img src={comp.menu_item_image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-xs">
                                            {comp.menu_item_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                                        {comp.menu_item_name}
                                    </h4>
                                    {comp.choice_group_count > 0 && (
                                        <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 mt-0.5">
                                            {comp.choice_group_count} choice {comp.choice_group_count === 1 ? "group" : "groups"}
                                        </p>
                                    )}
                                    {/* Section badge — helps vendor identify items at a glance */}
                                    {comp.menu_item_section && (
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 mt-0.5">
                                            {comp.menu_item_section}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={() => store.updateComponent(comp.tempId, { quantity: Math.max(1, comp.quantity - 1) })}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            ><Minus size={12} /></button>
                                            <span className="w-6 text-center font-black text-xs text-slate-900 dark:text-white">{comp.quantity}</span>
                                            <button
                                                onClick={() => store.updateComponent(comp.tempId, { quantity: Math.min(10, comp.quantity + 1) })}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            ><Plus size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => store.removeComponent(comp.tempId)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover/card:opacity-100"
                                ><X size={16} /></button>
                            </div>
                        ))}

                        {store.components.length === 0 && (
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                                    🍽️
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                                        No items added yet
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                                        Tap an item on the left to see its choices,
                                        then tap <strong>"Add to Combo"</strong> to include it.
                                    </p>
                                </div>
                                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                    Minimum 2 items required
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={onBack}
                    className="h-14 px-8 border border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="flex flex-col items-end gap-1">
                    {store.components.length < 2 && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Add {2 - store.components.length} more item{store.components.length === 1 ? "" : "s"} to continue
                        </p>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={store.components.length < 2}
                        className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-40"
                    >
                        Next: Add Swaps
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
