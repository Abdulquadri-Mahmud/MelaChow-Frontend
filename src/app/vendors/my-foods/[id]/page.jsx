"use client";

// TODO: Replace summary portions with full portions list
// once GET /v1/menu/:vendorId/items/:itemId/portions exists

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { getMenuItemDetail } from "@/app/lib/menuApi";
import {
    ArrowLeft, Edit2, Archive, ArchiveRestore,
    Clock, Tag, Layers, UtensilsCrossed, Loader2,
    RefreshCw, ChevronRight, Info, CheckCircle2,
    Share2, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Reuse same maps from FoodCard
const ITEM_TYPE_EMOJI = {
    FOOD: "🍽️", DRINK: "🥤", SOUP: "🥘", SWALLOW: "🫓",
    PROTEIN: "🍗", SIDE: "🍟", DESSERT: "🍰", OTHER: "🍴",
};

const DIETARY_BADGE = {
    halal: { label: "Halal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
    veg: { label: "Veg", color: "text-green-600 bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20" },
    vegan: { label: "Vegan", color: "text-green-700 bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20" },
    kosher: { label: "Kosher", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20" },
    "non-veg": { label: "Non-Veg", color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20" },
    mixed: null,
};

export default function FoodDetailPage() {
    const { id: itemId } = useParams();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        if (!vendorId || !itemId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await getMenuItemDetail(vendorId, itemId);
            console.log(res.item)
            setItem(res?.item || null);
            setError(false);
            if (isRefresh) toast.success("Details updated");
        } catch (err) {
            console.error(err);
            setError(true);
            toast.error("Could not load food details");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [vendorId, itemId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full" />
                        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">
                            Preparing Details
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Fetching from your kitchen...
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 px-4 text-center">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-2">
                    <Info size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Item Not Found
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        We couldn't locate this menu item. It may have been deleted or moved.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/vendors/my-foods")}
                    className="h-12 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                >
                    Back to My Foods
                </button>
            </div>
        );
    }

    const dietary = DIETARY_BADGE[item.dietary_type];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* ── STICKY TOP HEADER ── */}
            <div className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/vendors/my-foods")}
                        className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowLeft size={14} />
                        </div>
                        <span className="hidden sm:inline">My Foods</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                            title="Refresh details"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin text-orange-500" : ""} />
                        </button>
                        <button
                            onClick={() => router.push(`/vendors/my-foods/${itemId}/edit`)}
                            className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            <Edit2 size={12} /> Edit Food
                        </button>
                    </div>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto space-y-6 pt-6"
            >
                {/* ── HERO CARD ── */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none"
                >
                    {/* Image / Cover */}
                    <div className="relative h-80 sm:h-96 group">
                        {item.image_url ? (
                            <>
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-9xl bg-slate-50 dark:bg-slate-800/50">
                                {ITEM_TYPE_EMOJI[item.item_type] || "🍽️"}
                            </div>
                        )}

                        {/* Tags / Badges Overlays */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <AnimatePresence mode="popLayout">
                                {item.is_archived && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl bg-slate-950 text-white shadow-xl backdrop-blur-md"
                                    >
                                        Archived
                                    </motion.span>
                                )}
                                {!item.is_archived && !item.is_available && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/20"
                                    >
                                        Hidden from Menu
                                    </motion.span>
                                )}
                                {!item.is_archived && !item.is_in_stock && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl bg-rose-500 text-white shadow-xl shadow-rose-500/20"
                                    >
                                        Sold Out
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {dietary && (
                            <div className={`absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl border backdrop-blur-md shadow-xl ${dietary.color}`}>
                                {dietary.label}
                            </div>
                        )}

                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">
                                        {item.item_type} Product
                                    </span>
                                    <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                                        {item.name}
                                    </h1>
                                </div>
                                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-2xl">
                                    {ITEM_TYPE_EMOJI[item.item_type] || "🍽️"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {item.description && (
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Story / Description</p>
                                <p className="text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        )}

                        {/* Attribute Row */}
                        <div className="flex flex-wrap gap-3">
                            {item.category && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                                    <Tag size={12} className="text-orange-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                                        {item.category?.name || item.platform_category_id?.name}
                                    </span>
                                </div>
                            )}
                            {item.section && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                    <Layers size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {item.section?.name || item.vendor_section_id?.name}
                                    </span>
                                </div>
                            )}
                            {item.prep_time_minutes && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                    <Clock size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {item.prep_time_minutes}m Preparation
                                    </span>
                                </div>
                            )}
                            {item.tags?.map(tag => (
                                <div
                                    key={tag}
                                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                >
                                    #{tag}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── INFO GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sizes Section */}
                    <motion.div variants={itemVariants}>
                        <Section
                            title="Sizes & Pricing"
                            icon={<Layers size={18} />}
                            subtitle={`${Array.isArray(item.portions) ? item.portions.length : item.portions?.count || 0} configurations`}
                        >
                            {Array.isArray(item.portions) && item.portions.length > 0 ? (
                                <div className="space-y-4 p-6">
                                    {item.portions.map((portion, i) => (
                                        <div
                                            key={portion._id || i}
                                            className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-all hover:border-orange-200 dark:hover:border-orange-500/20"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-sm text-slate-800 dark:text-white">
                                                        {portion.label}
                                                    </span>
                                                    {portion.is_default && (
                                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-[8px] font-black text-white uppercase tracking-widest">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!portion.is_in_stock && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                                                            Out of stock
                                                        </span>
                                                    )}
                                                    {portion.is_available === false && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                                                            Unavailable
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-lg text-slate-900 dark:text-white">
                                                    ₦{(portion.price / 100).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : item.portions?.count > 0 ? (
                                <div className="p-8 space-y-4 text-center">
                                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-black text-slate-900 dark:text-white">
                                            {item.portions.count} Price Variations
                                        </p>
                                        <p className="text-sm font-bold text-orange-500">
                                            ₦{item.portions.min_price_naira?.toLocaleString()} – ₦{item.portions.max_price_naira?.toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                                        Full size breakdown is available<br />in the edit screen.
                                    </p>
                                </div>
                            ) : (
                                <EmptySection message="No pricing configured yet." />
                            )}
                        </Section>
                    </motion.div>

                    {/* Add-ons Section */}
                    <motion.div variants={itemVariants}>
                        <Section
                            title="Add-ons & Options"
                            icon={<UtensilsCrossed size={18} />}
                            subtitle={`${item.choice_groups?.length || 0} groups active`}
                        >
                            {item.choice_groups?.length > 0 ? (
                                <div className="p-6 space-y-6">
                                    {item.choice_groups.map(group => (
                                        <div key={group._id} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-widest">
                                                        {group.name}
                                                    </h3>
                                                    {group.is_required && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20" title="Required" />
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    Pick {group.min_selections}-{group.max_selections}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {group.options?.map(opt => (
                                                    <div
                                                        key={opt._id}
                                                        className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                                                    >
                                                        {opt.image_url && (
                                                            <img
                                                                src={opt.image_url}
                                                                alt={opt.label}
                                                                className="w-7 h-7 rounded-lg object-cover"
                                                            />
                                                        )}
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                                                                {opt.label}
                                                            </p>
                                                            <p className="text-[9px] font-black text-orange-500">
                                                                {opt.price_modifier > 0 ? `+₦${(opt.price_modifier / 100).toLocaleString()}` : 'FREE'}
                                                                {!opt.is_available && <span className="ml-2 text-rose-400 opacity-60">SO</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptySection message="No customization options available." />
                            )}
                        </Section>
                    </motion.div>
                </div>

                {/* ── COMBO MEMBERSHIPS ── */}
                {item.combos?.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Section
                            title="Combo Memberships"
                            icon={<span className="text-lg">🍱</span>}
                            subtitle="Included in these bundles"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                                {item.combos.map(combo => (
                                    <div
                                        key={combo._id}
                                        className="flex items-center justify-between p-4 bg-violet-50/30 dark:bg-violet-500/5 rounded-2xl border border-violet-100 dark:border-violet-500/10 transition-all hover:scale-[1.02]"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-black text-sm text-slate-900 dark:text-white">
                                                {combo.name}
                                            </p>
                                            {(combo.price_naira || combo.price) && (
                                                <p className="text-xs font-bold text-violet-500 mt-0.5">
                                                    ₦{(combo.price_naira ?? combo.price / 100).toLocaleString()}
                                                </p>
                                            )}
                                            <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">
                                                Bundle Deal
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-violet-300" />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </motion.div>
                )}

                {/* ── FOOTER STATS / INFO ── */}
                <motion.div variants={itemVariants} className="pt-8 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>Product ID: {itemId}</span>
                        {item.updatedAt && (
                            <span>Last Kitchen Update: {new Date(item.updatedAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* ── BOTTOM MOBILE ACTION ── */}
            <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
                <button
                    onClick={() => router.push(`/vendors/my-foods/${itemId}/edit`)}
                    className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Edit2 size={18} />
                    <span className="text-sm font-black uppercase tracking-widest">Edit Menu Item</span>
                </button>
            </div>
        </div>
    );
}

// ── REUSABLE SECTION WRAPPER ──
function Section({ title, subtitle, icon, children }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-500 h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
                        {icon}
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

// ── EMPTY SECTION STATE ──
function EmptySection({ message }) {
    return (
        <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                <Info size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{message}</p>
        </div>
    );
}
