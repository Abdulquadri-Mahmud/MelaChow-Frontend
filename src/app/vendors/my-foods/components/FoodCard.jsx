"use client";

import {
    Edit2, Archive, ArchiveRestore, ToggleLeft,
    ToggleRight, ChevronRight, Clock, Tag, Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    const dietary = DIETARY_BADGE[item.dietary_type];

    const priceDisplay = item.portions.count === 0
        ? "No price set"
        : item.portions.min_price_naira === item.portions.max_price_naira
            ? `₦${item.portions.min_price_naira?.toLocaleString()}`
            : `₦${item.portions.min_price_naira?.toLocaleString()} – ₦${item.portions.max_price_naira?.toLocaleString()}`;

    return (
        <div className={`group relative bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-none hover:-translate-y-0.5 ${item.is_archived
            ? "border-slate-100 dark:border-slate-800 opacity-60"
            : "border-slate-100 dark:border-slate-800"
            }`}>

            {/* Image */}
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

                {/* Status badges top-left */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {item.is_archived && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-900/80 text-white backdrop-blur-sm">
                            Archived
                        </span>
                    )}
                    {!item.is_archived && !item.is_available && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-amber-500/90 text-white backdrop-blur-sm">
                            Hidden
                        </span>
                    )}
                    {!item.is_archived && !item.is_in_stock && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-rose-500/90 text-white backdrop-blur-sm">
                            Sold Out
                        </span>
                    )}
                </div>

                {/* Dietary badge top-right */}
                {dietary && (
                    <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-sm ${dietary.color}`}>
                        {dietary.label}
                    </span>
                )}

                {/* Hover action overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                        onClick={() => onEdit(item._id)}
                        className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"
                        title="Edit food"
                    >
                        <Edit2 size={15} />
                    </button>
                    <button
                        onClick={() => onToggleAvailability(item._id)}
                        className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all"
                        title={item.is_available ? "Hide from menu" : "Show on menu"}
                    >
                        {item.is_available
                            ? <ToggleRight size={15} />
                            : <ToggleLeft size={15} />
                        }
                    </button>
                    <button
                        onClick={() => onArchive(item._id)}
                        className={`w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center transition-all ${item.combos?.length > 0 && !item.is_archived
                            ? "opacity-50 cursor-not-allowed hover:bg-white"
                            : "hover:bg-slate-700 hover:text-white"
                            }`}
                        title={
                            item.combos?.length > 0 && !item.is_archived
                                ? `Remove from combos first: ${item.combos.map(c => c.name).join(", ")}`
                                : item.is_archived ? "Restore" : "Archive"
                        }
                    >
                        {item.is_archived
                            ? <ArchiveRestore size={15} />
                            : <Archive size={15} />
                        }
                    </button>
                    {/* Delete — only shown if item is NOT in active combos */}
                    {(!item.combos || item.combos.length === 0) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item._id, item.name);
                            }}
                            className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                            title="Permanently delete this item"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">

                {/* Name + location */}
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-tight line-clamp-1">
                        {item.name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                        {item.category && (
                            <p className="text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest bg-orange-50 dark:bg-orange-500/10 w-fit px-1.5 py-0.5 rounded">
                                {item.section
                                    ? `${item.section.name} · ${item.category.name}`
                                    : item.category.name
                                }
                            </p>
                        )}
                        {item.description && (
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-normal">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Price + prep time */}
                <div className="flex items-center justify-between">
                    <span className={`font-black text-base tracking-tight ${item.portions.count === 0
                        ? "text-slate-300 dark:text-slate-600 text-sm"
                        : "text-slate-900 dark:text-white"
                        }`}>
                        {priceDisplay}
                    </span>
                    {item.prep_time_minutes && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                            <Clock size={11} className="text-orange-500" />
                            {item.prep_time_minutes}m
                        </span>
                    )}
                </div>

                {/* Metadata chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm px-2.5 py-1.5 rounded-xl">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        {item.portions.count} {item.portions.count === 1 ? "Size" : "Sizes"}
                    </span>
                    {item.choice_groups.count > 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm px-2.5 py-1.5 rounded-xl">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            {item.choice_groups.count} {item.choice_groups.count === 1 ? "Add-on" : "Add-ons"}
                        </span>
                    )}
                    {item.tags?.length > 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm px-2.5 py-1.5 rounded-xl">
                            <Tag size={10} className="text-slate-400" />
                            {item.tags.length}
                        </span>
                    )}
                    {item.combos?.length > 0 && (
                        <span
                            title={item.combos.map(c => c.name).join(", ")}
                            className="flex items-center gap-1 text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 px-2.5 py-1 rounded-lg cursor-default"
                        >
                            🍱 {item.combos.length === 1
                                ? `In "${item.combos[0].name}"`
                                : `In ${item.combos.length} combos`
                            }
                        </span>
                    )}
                </div>

                {/* Bottom actions row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => router.push(`/vendors/my-foods/${item._id}`)}
                        className="text-xs font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => onEdit(item._id)}
                        className="flex items-center gap-1.5 text-xs font-black text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-widest group/edit"
                    >
                        Edit
                        <ChevronRight
                            size={13}
                            className="group-hover/edit:translate-x-0.5 transition-transform"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
