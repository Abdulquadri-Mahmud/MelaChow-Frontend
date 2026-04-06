"use client";

import {
    Edit2, Archive, ArchiveRestore, ToggleLeft,
    ToggleRight, ChevronRight, Clock, Tag, Trash2
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
    mixed: null,
};

export default function FoodCard({ item, onToggleAvailability, onArchive, onEdit, onDelete }) {
    const dietary = DIETARY_BADGE[item.dietary_type];

    const priceDisplay = item.portions.count === 0
        ? "No price set"
        : item.portions.min_price_naira === item.portions.max_price_naira
            ? `₦${item.portions.min_price_naira?.toLocaleString()}`
            : `₦${item.portions.min_price_naira?.toLocaleString()} – ₦${item.portions.max_price_naira?.toLocaleString()}`;

    return (
        <div className={`group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden transition-all hover:border-orange-500/30 ${item.is_archived
            ? "opacity-60"
            : ""
            }`}>

            {/* Image */}
            <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

                {/* Status badges top-left */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {item.is_archived && (
                        <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-sm">
                            Archived
                        </span>
                    )}
                    {!item.is_archived && !item.is_available && (
                        <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/90 text-white backdrop-blur-sm">
                            Hidden
                        </span>
                    )}
                </div>

                {/* Dietary badge top-right */}
                {dietary && (
                    <span className={`absolute top-2 right-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded backdrop-blur-sm ${dietary.color}`}>
                        {dietary.label}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-3 space-y-2.5">
                
                {/* Name + location */}
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight leading-tight line-clamp-1">
                        {item.name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                        {item.category && (
                            <p className="text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-500/10 w-fit px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-500/20 uppercase tracking-widest">
                                {item.section
                                    ? `${item.section.name} · ${item.category.name}`
                                    : item.category.name
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Price + Metadata */}
                <div className="flex items-center justify-between">
                    <span className={`font-black text-sm tracking-tight ${item.portions.count === 0
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-slate-900 dark:text-white"
                        }`}>
                        {priceDisplay}
                    </span>
                    {item.prep_time_minutes && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                             {item.prep_time_minutes}m
                        </span>
                    )}
                </div>

                {/* ACTION BAR — Persistent (No longer on hover) */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onEdit(item._id)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all active:scale-90"
                            title="Edit Details"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={() => onToggleAvailability(item._id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${item.is_available 
                                ? 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                            title={item.is_available ? "Hide content" : "Show content"}
                        >
                            {item.is_available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                            onClick={() => onArchive(item._id)}
                            disabled={item.combos?.length > 0 && !item.is_archived}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${item.is_archived
                                ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 disabled:opacity-30'}`}
                            title={item.is_archived ? "Restore" : "Archive Item"}
                        >
                            {item.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                        </button>
                        {(!item.combos || item.combos.length === 0) && (
                            <button
                                onClick={() => onDelete(item._id, item.name)}
                                className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                title="Delete Forever"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => onEdit(item._id)}
                        className="h-8 px-4 rounded-lg bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-1 shadow-sm shadow-orange-500/20"
                    >
                        Manage <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
