"use client";

import {
    Edit2, Archive, ArchiveRestore, ToggleLeft,
    ToggleRight, ChevronRight, Clock, Tag
} from "lucide-react";

const ITEM_TYPE_EMOJI = {
    FOOD: "🍽️", DRINK: "🥤", SOUP: "🥘", SWALLOW: "🫓",
    PROTEIN: "🍗", SIDE: "🍟", DESSERT: "🍰", OTHER: "🍴",
};

const DIETARY_BADGE = {
    halal: { label: "Halal", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
    veg: { label: "Veg", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10" },
    vegan: { label: "Vegan", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/10" },
    kosher: { label: "Kosher", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
    "non-veg": { label: "Non-Veg", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10" },
    mixed: null, // show nothing for mixed — it's the default
};

export default function FoodCard({ item, onToggleAvailability, onArchive, onEdit }) {
    const dietary = DIETARY_BADGE[item.dietary_type];

    // Safety checks for portions data
    const portionsCount = item.portions?.count || 0;
    const minPrice = item.portions?.min_price_naira || 0;
    const maxPrice = item.portions?.max_price_naira || 0;

    const priceDisplay = portionsCount === 0
        ? "No price set"
        : minPrice === maxPrice
            ? `₦${minPrice.toLocaleString()}`
            : `₦${minPrice.toLocaleString()} – ₦${maxPrice.toLocaleString()}`;

    return (
        <div className={`group relative bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-none hover:-translate-y-0.5 ${item.is_archived
            ? "border-slate-100 dark:border-slate-800 opacity-60"
            : "border-slate-100 dark:border-slate-800"
            }`}>

            {/* ── IMAGE ───────────────────────────────────── */}
            <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                        {ITEM_TYPE_EMOJI[item.item_type] || "🍽️"}
                    </div>
                )}

                {/* Status badges — top left */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {item.is_archived && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-900/80 text-white backdrop-blur-sm shadow-sm">
                            Archived
                        </span>
                    )}
                    {!item.is_archived && !item.is_available && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
                            Hidden
                        </span>
                    )}
                    {!item.is_archived && !item.is_in_stock && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-rose-500/90 text-white backdrop-blur-sm shadow-sm">
                            Sold Out
                        </span>
                    )}
                </div>

                {/* Dietary badge — top right */}
                {dietary && (
                    <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm border border-black/5 dark:border-white/5 ${dietary.color}`}>
                        {dietary.label}
                    </span>
                )}

                {/* Quick action overlay — appears on hover */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                        onClick={() => onEdit(item._id)}
                        className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-90"
                        title="Edit food"
                    >
                        <Edit2 size={15} />
                    </button>
                    <button
                        onClick={() => onToggleAvailability(item._id)}
                        className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-90"
                        title={item.is_available ? "Hide from menu" : "Show on menu"}
                    >
                        {item.is_available
                            ? <ToggleRight size={15} />
                            : <ToggleLeft size={15} />
                        }
                    </button>
                    <button
                        onClick={() => onArchive(item._id)}
                        className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all shadow-xl active:scale-90"
                        title={item.is_archived ? "Unarchive" : "Archive"}
                    >
                        {item.is_archived
                            ? <ArchiveRestore size={15} />
                            : <Archive size={15} />
                        }
                    </button>
                </div>
            </div>

            {/* ── BODY ────────────────────────────────────── */}
            <div className="p-4 space-y-3">

                {/* Name + category */}
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-tight line-clamp-1">
                        {item.name}
                    </h3>
                    {item.category && (
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.section
                                ? `${item.section.name} · ${item.category.name}`
                                : item.category.name
                            }
                        </p>
                    )}
                </div>

                {/* Price range */}
                <div className="flex items-center justify-between">
                    <span className={`font-black text-base tracking-tight ${portionsCount === 0
                        ? "text-slate-300 dark:text-slate-600 text-sm"
                        : "text-orange-600 dark:text-orange-400"
                        }`}>
                        {priceDisplay}
                    </span>
                    {item.prep_time_minutes && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            <Clock size={11} />
                            {item.prep_time_minutes}m
                        </span>
                    )}
                </div>

                {/* Metadata chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {portionsCount} {portionsCount === 1 ? "portion" : "portions"}
                    </span>
                    {item.choice_groups?.count > 0 && (
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {item.choice_groups.count} {item.choice_groups.count === 1 ? "add-on" : "add-ons"}
                        </span>
                    )}
                    {item.tags?.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            <Tag size={10} />
                            {item.tags.length}
                        </span>
                    )}
                </div>

                {/* Edit link */}
                <button
                    onClick={() => onEdit(item._id)}
                    className="w-full flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-black text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors group/edit"
                >
                    <span>Edit & manage</span>
                    <ChevronRight
                        size={14}
                        className="group-hover/edit:translate-x-0.5 transition-transform"
                    />
                </button>
            </div>
        </div>
    );
}
