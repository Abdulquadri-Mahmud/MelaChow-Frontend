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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── LEFT SIDE: PICKER ─────────── */}
                <div className="lg:col-span-7 space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">
                            Build Your Bundle
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            Select at least 2 items from your menu that will be sold together as one combo deal.
                        </p>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find an item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/10 transition-all font-bold text-zinc-900 dark:text-white outline-none"
                        />
                    </div>

                    {/* Section tabs */}
                    {sections.length > 2 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {sections.map(section => (
                                <button
                                    key={section._id}
                                    onClick={() => setActiveSectionFilter(section._id)}
                                    className={`shrink-0 h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSectionFilter === section._id
                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/20 dark:shadow-white/10"
                                        : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                        }`}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-4 text-zinc-400">
                                    <Loader2 className="animate-spin text-orange-500" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Loading menu...</p>
                                </div>
                            ) : paginatedItems.length > 0 ? (
                                <div className="flex flex-col h-full relative">
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50 flex-1">
                                        {paginatedItems.map(item => {
                                            const isAdded = store.components.some(c => c.menu_item_id === item._id);
                                            const isExpanded = expandedItemId === item._id;
                                            const detail = detailCache[item._id];
                                            const hasChoices = item.choice_groups?.count > 0;

                                            return (
                                                <div
                                                    key={item._id}
                                                    className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                                                >
                                                    {/* ── ITEM ROW ── */}
                                                    <div
                                                        onClick={() => !isAdded && handleExpandItem(item._id)}
                                                        className={`p-5 flex items-center gap-4 transition-all ${isAdded
                                                            ? "bg-orange-50/30 dark:bg-orange-500/5 cursor-default"
                                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer active:scale-[0.99]"
                                                            }`}
                                                    >
                                                        {/* Avatar/Icon */}
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${isAdded ? "bg-orange-100/50 border-orange-200 text-orange-500" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400"}`}>
                                                            {item.image_url ? (
                                                                <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                                            ) : (
                                                                <UtensilsCrossed size={18} />
                                                            )}
                                                        </div>

                                                        {/* Name + metadata */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-bold text-sm truncate tracking-tight ${isAdded
                                                                ? "text-orange-600 dark:text-orange-400"
                                                                : "text-zinc-900 dark:text-white"
                                                                }`}>
                                                                {item.name}
                                                            </h4>

                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                {hasChoices ? (
                                                                    <span className="text-[9px] font-black text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider border border-violet-100/50 dark:border-violet-500/20">
                                                                        {item.choice_groups.count} choice groups
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-zinc-100 dark:border-zinc-700">
                                                                        Standard Item
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right indicator */}
                                                        {isAdded ? (
                                                            <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                                            </div>
                                                        ) : (
                                                            <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 transition-all ${isExpanded ? "rotate-45 bg-orange-500 text-white" : "group-hover:bg-orange-50"}`}>
                                                                <Plus size={16} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ── EXPANDED PANEL ── */}
                                                    {isExpanded && !isAdded && (
                                                        <div className="mx-5 mb-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 overflow-hidden animate-in zoom-in-95 duration-200">

                                                            {/* Choice groups */}
                                                            <div className="p-5 space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                                        Configuration Options
                                                                    </p>
                                                                </div>

                                                                {detail === "loading" && (
                                                                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold py-2">
                                                                        <Loader2 size={14} className="animate-spin text-orange-500" />
                                                                        Analyzing item structure...
                                                                    </div>
                                                                )}

                                                                {detail === "error" && (
                                                                    <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-500/20">
                                                                        <Info size={14} />
                                                                        <p className="text-xs font-bold">Failed to load choice details.</p>
                                                                    </div>
                                                                )}

                                                                {detail && detail !== "loading" && detail !== "error" && (
                                                                    <>
                                                                        {detail.choice_groups?.length > 0 ? (
                                                                            <div className="space-y-4">
                                                                                {detail.choice_groups.map(group => (
                                                                                    <div key={group._id} className="space-y-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                                                                                                {group.name}
                                                                                            </span>
                                                                                            {group.is_required && (
                                                                                                <span className="text-[8px] font-black uppercase tracking-widest text-white bg-rose-500 px-1.5 py-0.5 rounded shadow-sm shadow-rose-500/10">
                                                                                                    Mandatory
                                                                                                </span>
                                                                                            )}
                                                                                            <span className="text-[9px] text-zinc-400 font-bold ml-auto bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-2 py-0.5 rounded-md">
                                                                                                Pick {group.min_selections}
                                                                                                {group.max_selections > group.min_selections
                                                                                                    ? `–${group.max_selections}`
                                                                                                    : ""}
                                                                                            </span>
                                                                                        </div>

                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {group.options?.map(opt => (
                                                                                                <span
                                                                                                    key={opt._id}
                                                                                                    className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl shadow-sm"
                                                                                                >
                                                                                                    {opt.label}
                                                                                                    {opt.price_modifier > 0 && (
                                                                                                        <span className="text-orange-500 ml-1.5 font-black">
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
                                                                            <div className="p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-center">
                                                                                <p className="text-xs text-zinc-400 font-bold italic">
                                                                                    Standard item — no customizable choices.
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Add button */}
                                                            <div className="p-5 pt-0">
                                                                <button
                                                                    onClick={() => handleAddItem(item)}
                                                                    disabled={detail === "loading"}
                                                                    className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-zinc-900/10 dark:shadow-white/5 disabled:opacity-40 transition-all active:scale-[0.98]"
                                                                >
                                                                    Add to Combo Deal
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {totalPickerPages > 1 && (
                                        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0">
                                            <button
                                                onClick={() => setPickerPage(p => Math.max(1, p - 1))}
                                                disabled={pickerPage === 1}
                                                className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 border border-zinc-100 dark:border-zinc-800 rounded-lg transition-all"
                                            >
                                                ← Prev
                                            </button>
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                                Page {pickerPage} / {totalPickerPages}
                                            </span>
                                            <button
                                                onClick={() => setPickerPage(p => Math.min(totalPickerPages, p + 1))}
                                                disabled={pickerPage === totalPickerPages}
                                                className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 border border-zinc-100 dark:border-zinc-800 rounded-lg transition-all"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-300 dark:text-zinc-700 border-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-all duration-300">
                                        <Search size={32} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">No items found</p>
                                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-1">Try a different search term or section.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT SIDE: COMPOSITION ─────────── */}
                <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-0">
                    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-6 lg:p-8 space-y-6 sticky top-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                Combo Composition
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-orange-500/20">{store.components.length}</span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            These items form the core of your bundle.
                        </p>

                        <div className="space-y-4">
                            {store.components.map(comp => (
                                <div key={comp.tempId} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 flex items-center gap-5 group/card shadow-sm hover:shadow-md transition-all animate-in slide-in-from-right-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 shrink-0 shadow-inner">
                                        {comp.menu_item_image ? (
                                            <img src={comp.menu_item_image} alt="" className="w-full h-full object-cover transition-transform group-hover/card:scale-110 duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-zinc-400 text-sm">
                                                {comp.menu_item_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-zinc-900 dark:text-white truncate text-base tracking-tight mb-1">
                                            {comp.menu_item_name}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            {comp.choice_group_count > 0 && (
                                                <p className="text-[9px] font-black text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-100 dark:border-violet-500/20 uppercase tracking-widest">
                                                    {comp.choice_group_count} choices
                                                </p>
                                            )}
                                            {comp.menu_item_section && (
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                                    {comp.menu_item_section}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                                                <button
                                                    onClick={() => store.updateComponent(comp.tempId, { quantity: Math.max(1, comp.quantity - 1) })}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-zinc-400 hover:text-orange-500 dark:hover:text-orange-500 border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90"
                                                ><Minus size={14} /></button>
                                                <span className="w-8 text-center font-black text-xs text-zinc-900 dark:text-white tracking-tighter">{comp.quantity}</span>
                                                <button
                                                    onClick={() => store.updateComponent(comp.tempId, { quantity: Math.min(10, comp.quantity + 1) })}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-zinc-400 hover:text-orange-500 dark:hover:text-orange-500 border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90"
                                                ><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => store.removeComponent(comp.tempId)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500 transition-all active:scale-90"
                                    ><X size={18} /></button>
                                </div>
                            ))}

                            {store.components.length === 0 && (
                                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                                    <div className="w-20 h-20 bg-white dark:bg-zinc-800 border-2 border-zinc-50 dark:border-zinc-700 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none animate-bounce duration-slow">
                                        🍱
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
                                            No items added yet
                                        </p>
                                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                                            Tap an item on the left to include it in this bundle deal.
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                         <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-700">
                                            Min 2 Items Required
                                         </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Added spacing at the bottom to clear fixed footer */}
            <div className="h-10 invisible" />
        </div>
    );
}
