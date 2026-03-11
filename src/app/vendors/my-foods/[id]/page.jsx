"use client";

// TODO: Replace summary portions with full portions list
// once GET /v1/menu/:vendorId/items/:itemId/portions exists

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { getMenuItemDetail } from "@/app/lib/menuApi";
import {
    ArrowLeft, Edit2, Archive, ArchiveRestore,
    Clock, Tag, Layers, UtensilsCrossed, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

// Reuse same maps from FoodCard
const ITEM_TYPE_EMOJI = {
    FOOD: "🍽️", DRINK: "🥤", SOUP: "🥘", SWALLOW: "🫓",
    PROTEIN: "🍗", SIDE: "🍟", DESSERT: "🍰", OTHER: "🍴",
};

const DIETARY_BADGE = {
    halal: { label: "Halal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    veg: { label: "Veg", color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
    vegan: { label: "Vegan", color: "text-green-700 bg-green-50 dark:bg-green-500/10" },
    kosher: { label: "Kosher", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    "non-veg": { label: "Non-Veg", color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10" },
    mixed: null,
};

export default function FoodDetailPage() {
    const { id: itemId } = useParams();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!vendorId || !itemId) return;
        const load = async () => {
            try {
                const res = await getMenuItemDetail(vendorId, itemId);
                setItem(res?.item || null);
            } catch {
                setError(true);
                toast.error("Could not load food details");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [vendorId, itemId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest">
                        Loading details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-bold text-slate-500">
                    Could not load this food.
                </p>
                <button
                    onClick={() => router.push("/vendors/my-foods")}
                    className="text-xs font-black text-orange-500 uppercase tracking-widest"
                >
                    ← Back to My Foods
                </button>
            </div>
        );
    }

    const dietary = DIETARY_BADGE[item.dietary_type];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">

                {/* ── HEADER ── */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <button
                        onClick={() => router.push("/vendors/my-foods")}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={14} /> My Foods
                    </button>
                    <button
                        onClick={() =>
                            router.push(`/vendors/my-foods/${itemId}/edit`)
                        }
                        className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Edit2 size={14} /> Edit Food
                    </button>
                </div>

                {/* ── HERO CARD ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    {/* Image */}
                    <div className="relative h-64 bg-slate-100 dark:bg-slate-800">
                        {item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-7xl">
                                {ITEM_TYPE_EMOJI[item.item_type] || "🍽️"}
                            </div>
                        )}
                        {/* Status overlays */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {item.is_archived && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-900/80 text-white backdrop-blur-sm">
                                    Archived
                                </span>
                            )}
                            {!item.is_archived && !item.is_available && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-amber-500/90 text-white backdrop-blur-sm">
                                    Hidden from menu
                                </span>
                            )}
                            {!item.is_archived && !item.is_in_stock && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-rose-500/90 text-white backdrop-blur-sm">
                                    Sold Out
                                </span>
                            )}
                        </div>
                        {dietary && (
                            <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-sm ${dietary.color}`}>
                                {dietary.label}
                            </span>
                        )}
                    </div>

                    {/* Name + meta */}
                    <div className="p-6 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {item.name}
                            </h1>
                            <span className="text-2xl shrink-0">
                                {ITEM_TYPE_EMOJI[item.item_type] || "🍽️"}
                            </span>
                        </div>

                        {item.description && (
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                {item.description}
                            </p>
                        )}

                        {/* Chips row */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {item.category && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-lg">
                                    {item.category?.name || item.platform_category_id?.name}
                                </span>
                            )}
                            {item.section && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                    {item.section?.name || item.vendor_section_id?.name}
                                </span>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                {item.item_type}
                            </span>
                            {item.prep_time_minutes && (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                    <Clock size={10} />
                                    {item.prep_time_minutes}m prep
                                </span>
                            )}
                            {item.tags?.map(tag => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1 text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg"
                                >
                                    <Tag size={9} /> {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── PORTIONS SECTION ── */}
                <Section title="Sizes & Pricing" icon={<Layers size={16} />}>
                    {/* item.portions from getMenuItemDetail may be a summary only */}
                    {/* If full portion array is available: render each portion */}
                    {/* If only summary: render the price range */}

                    {Array.isArray(item.portions) && item.portions.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {item.portions.map((portion, i) => (
                                <div
                                    key={portion._id || i}
                                    className="flex items-center justify-between py-3 px-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                                            {portion.label}
                                        </span>
                                        {portion.is_default && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md">
                                                Default
                                            </span>
                                        )}
                                        {!portion.is_in_stock && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                                                Sold Out
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-black text-slate-900 dark:text-white text-sm">
                                        ₦{(portion.price / 100).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : item.portions?.count > 0 ? (
                        // Summary only — full portion list requires backend endpoint
                        <div className="px-4 py-4 space-y-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.portions.count} {item.portions.count === 1 ? "size" : "sizes"} configured
                            </p>
                            {item.portions.min_price_naira !== null && (
                                <p className="text-sm font-medium text-slate-500">
                                    Price range: ₦{item.portions.min_price_naira?.toLocaleString()}
                                    {item.portions.min_price_naira !== item.portions.max_price_naira &&
                                        ` – ₦${item.portions.max_price_naira?.toLocaleString()}`
                                    }
                                </p>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium italic">
                                Full portion breakdown available in edit view.
                            </p>
                        </div>
                    ) : (
                        <EmptySection message="No sizes or prices configured yet." />
                    )}
                </Section>

                {/* ── CHOICE GROUPS + OPTIONS ── */}
                <Section title="Add-ons & Choices" icon={<UtensilsCrossed size={16} />}>
                    {item.choice_groups?.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {item.choice_groups.map(group => (
                                <div key={group._id} className="p-4 space-y-3">
                                    {/* Group header */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                            {group.name}
                                        </span>
                                        {group.is_required && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                                                Required
                                            </span>
                                        )}
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md ml-auto">
                                            Pick {group.min_selections}
                                            {group.max_selections > group.min_selections
                                                ? `–${group.max_selections}`
                                                : ""
                                            }
                                        </span>
                                    </div>

                                    {/* Options */}
                                    <div className="flex flex-wrap gap-2">
                                        {group.options?.map(opt => (
                                            <div
                                                key={opt._id}
                                                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2"
                                            >
                                                {opt.image_url && (
                                                    <img
                                                        src={opt.image_url}
                                                        alt={opt.label}
                                                        className="w-6 h-6 rounded-md object-cover"
                                                    />
                                                )}
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {opt.label}
                                                </span>
                                                {opt.price_modifier > 0 && (
                                                    <span className="text-[10px] font-black text-orange-500">
                                                        +₦{(opt.price_modifier / 100).toLocaleString()}
                                                    </span>
                                                )}
                                                {!opt.is_available && (
                                                    <span className="text-[9px] font-black text-rose-400">
                                                        Unavailable
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {(!group.options || group.options.length === 0) && (
                                            <p className="text-xs text-slate-400 italic">
                                                No options added yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptySection message="No add-ons or choices configured." />
                    )}
                </Section>

                {/* ── COMBO MEMBERSHIPS ── */}
                {item.combos?.length > 0 && (
                    <Section title="Part of These Combos" icon={<span>🍱</span>}>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {item.combos.map(combo => (
                                <div
                                    key={combo._id}
                                    className="flex items-center justify-between px-4 py-3"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                                            {combo.name}
                                        </p>
                                        {combo.price && (
                                            <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                ₦{(combo.price / 100).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg">
                                        Combo
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

            </div>
        </div>
    );
}

// ── REUSABLE SECTION WRAPPER ──
function Section({ title, icon, children }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{icon}</span>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

// ── EMPTY SECTION STATE ──
function EmptySection({ message }) {
    return (
        <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-400 italic">{message}</p>
        </div>
    );
}
