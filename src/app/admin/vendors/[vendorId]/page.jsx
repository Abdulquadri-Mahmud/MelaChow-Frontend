"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import adminApi from "@/app/lib/adminApi";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    ArrowLeft, Store, User, MapPin, Loader2, AlertCircle,
    ShieldCheck, Truck, Utensils, CheckCircle2, Clock,
    Banknote, ChevronDown, ChevronUp, Search, Star,
    Package, Tag, Percent, Zap, Calendar, Users, X,
    Globe, TriangleAlert, CircleCheck, XCircle, Info, Eye, Image as ImageIcon, TrendingUp, Box, ExternalLink
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString?.() ?? n ?? "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const FOOD_TYPES = { veg: "🥦 Veg", "non-veg": "🍗 Non-Veg", vegan: "🌿 Vegan", halal: "☪ Halal", kosher: "✡ Kosher", mixed: "🍱 Mixed" };

// ─── Badge Helper ─────────────────────────────────────────────────────────────
const GlassBadge = ({ children, colorClass, size = "md" }) => {
    const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]";
    return (
        <span className={`inline-flex items-center gap-1 font-black uppercase tracking-widest rounded-lg border backdrop-blur-sm ${sizeClasses} ${colorClass}`}>
            {children}
        </span>
    );
};

// ─── Food Card ────────────────────────────────────────────────────────────────
function FoodCard({ food, index, onViewDetails }) {
    const imgSrc = food.images?.[0]?.url || (typeof food.images?.[0] === "string" ? food.images[0] : null) || food.image || null;

    const hasVariants = food.variants?.length > 0;
    const hasPortions = food.portions?.length > 0;
    const hasChoiceGroups = food.choiceGroups?.length > 0;
    const hasDiscount = food.discount?.active;
    const hasPromos = food.activePromotions?.length > 0;
    const hasSchedule = food.availabilitySchedule?.enabled;
    const hasExtras = hasVariants || hasPortions || hasChoiceGroups || hasDiscount || hasPromos || hasSchedule;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={`bg-white border rounded-[32px] overflow-hidden transition-all duration-300 border-gray-100 hover:border-orange-200`}
        >
            {/* Card Header (Clickable snippet) */}
            <div
                className={`flex flex-col md:flex-row gap-4 p-4 md:p-5 cursor-pointer hover:bg-gray-50/50`}
                onClick={() => hasExtras && onViewDetails()}
            >
                {/* Main Food Image */}
                <div className="w-full md:w-32 h-40 md:h-32 bg-gray-100 rounded-[24px] overflow-hidden flex items-center justify-center text-gray-300 shrink-0 relative group">
                    {imgSrc ? (
                        <img
                            src={imgSrc}
                            alt={food.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={e => { e.target.style.display = "none"; }}
                        />
                    ) : (
                        <Utensils size={36} className="opacity-50" />
                    )}
                    {/* Floating Status Badge inside Image */}
                    <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${food.available || food.isAvailable ? "bg-emerald-500/80 text-white border-emerald-400" : "bg-gray-900/80 text-white border-gray-700"}`}>
                            {food.available || food.isAvailable ? "Available" : "Stock Out"}
                        </span>
                    </div>
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div>
                            <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">{food.name}</h3>
                            {food.description && <p className="text-sm text-gray-500 line-clamp-2 md:line-clamp-1 max-w-xl">{food.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                            <span className="block text-2xl font-black text-orange-500">₦{fmt(food.price)}</span>
                            {hasVariants && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Price</span>}
                        </div>
                    </div>

                    {/* Primary Pills */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {food.foodType && (
                            <GlassBadge colorClass="bg-blue-50/80 border-blue-100 text-blue-700">
                                {FOOD_TYPES[food.foodType] || food.foodType}
                            </GlassBadge>
                        )}
                        {food.prepTime && (
                            <GlassBadge colorClass="bg-amber-50/80 border-amber-100 text-amber-700">
                                <Clock size={12} /> {food.prepTime} Min
                            </GlassBadge>
                        )}
                        {food.rating != null && (
                            <GlassBadge colorClass="bg-yellow-50 border-yellow-200 text-yellow-700">
                                <Star size={12} className="fill-yellow-500 text-yellow-500" /> {food.rating?.toFixed(1)} ({food.ratingCount || 0})
                            </GlassBadge>
                        )}
                        {food.orderCount > 0 && (
                            <GlassBadge colorClass="bg-indigo-50 border-indigo-100 text-indigo-700">
                                <TrendingUp size={12} /> Ordered {food.orderCount}×
                            </GlassBadge>
                        )}
                        {food.stock != null && (
                            <GlassBadge colorClass="bg-gray-50 border-gray-200 text-gray-600">
                                <Package size={12} /> Stock: {food.stock === Infinity || food.stock === "Infinity" ? "∞" : food.stock}
                            </GlassBadge>
                        )}
                        {food.packagingFee > 0 && (
                            <GlassBadge colorClass="bg-slate-50 border-slate-200 text-slate-600">
                                <Box size={12} /> Pack: ₦{food.packagingFee}
                            </GlassBadge>
                        )}
                    </div>

                    {/* Discount & Promo Inline Highlight */}
                    {(hasDiscount || hasPromos) && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                            {hasDiscount && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-[10px] font-black uppercase text-white">
                                    <Tag size={12} />
                                    {food.discount.type === "PERCENTAGE" ? `${food.discount.percentage}% OFF` : `₦${food.discount.flatAmount} OFF`}
                                </div>
                            )}
                            {hasPromos && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl text-[10px] font-black uppercase text-white">
                                    <Zap size={12} /> Promos Active
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Expand Chevron Icon (Desktop) */}
                {hasExtras && (
                    <div className="hidden md:flex flex-col items-center justify-center pl-4 border-l border-gray-100 shrink-0 hover:text-orange-500 transition-colors group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500`}>
                            <ChevronDown size={20} className="group-hover:-rotate-90 transition-transform duration-300" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-2 group-hover:text-orange-500 transition-colors">
                            Details
                        </span>
                    </div>
                )}
            </div>

            {/* Expand toggle (Mobile) */}
            {hasExtras && (
                <button
                    onClick={() => onViewDetails()}
                    className="md:hidden w-full flex items-center justify-center gap-1.5 py-3 border-t border-gray-50 bg-gray-50/50 text-[10px] font-black text-gray-500 uppercase tracking-widest active:bg-gray-100"
                >
                    <ChevronDown size={14} /> View Details & Variants
                </button>
            )}
        </motion.div>
    );
}

// ─── Food Details Modal ───────────────────────────────────────────────────────
function FoodDetailsModal({ food, onClose }) {
    if (!food) return null;

    const hasVariants = food.variants?.length > 0;
    const hasPortions = food.portions?.length > 0;
    const hasChoiceGroups = food.choiceGroups?.length > 0;
    const hasPromos = food.activePromotions?.length > 0;
    const hasSchedule = food.availabilitySchedule?.enabled;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gray-50 rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-white px-6 py-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-10 shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{food.name} <span className="text-orange-500">Details</span></h2>
                            <p className="text-sm font-medium text-gray-400 mt-1">Deep dive into item configurations</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-5 md:p-8 space-y-6 overflow-y-auto overflow-x-hidden no-scrollbar">
                        {/* Options Master Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Left Column: Variants & Portions */}
                            <div className="space-y-6">
                                {/* Variants Display */}
                                {hasVariants && (
                                    <div className="bg-white rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Tag size={16} /></div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Item Variants</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {food.variants.map((v, i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-[14px] flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                                                        {v.image ? (
                                                            <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon size={18} className="opacity-40" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-900 truncate">{v.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                                                            Stock: {v.stock === Infinity || v.stock === "Infinity" ? "∞" : v.stock ?? "—"}
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-orange-600 shrink-0">
                                                        ₦{fmt(v.price)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Portions */}
                                {hasPortions && (
                                    <div className="bg-white rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><Package size={16} /></div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Meal Portions</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {food.portions.map((p, i) => (
                                                <div key={i} className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 flex flex-col justify-between hover:bg-amber-50 transition-colors">
                                                    <div className="mb-2">
                                                        <h5 className="font-black text-amber-950 text-base">{p.portions} Portions</h5>
                                                        <p className="text-xs font-bold text-amber-700/60">{p.label}</p>
                                                    </div>
                                                    <div className="text-lg font-black text-amber-600">₦{fmt(p.price)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Add-ons & Choice Groups */}
                            <div className="space-y-6">
                                {hasChoiceGroups && (
                                    <div className="bg-white rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center"><Utensils size={16} /></div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Customizations</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {food.choiceGroups.map((group, gi) => (
                                                <div key={gi} className="border border-purple-100 rounded-2xl overflow-hidden">
                                                    <div className="bg-purple-50/50 p-3 border-b border-purple-100 flex items-center justify-between">
                                                        <p className="font-black text-purple-900 text-sm truncate">{group.name}</p>
                                                        <span className="shrink-0 px-2 py-1 bg-white rounded-lg text-[9px] font-black uppercase text-purple-600 whitespace-nowrap border border-purple-100">
                                                            Pick {group.min}–{group.max}
                                                        </span>
                                                    </div>
                                                    <div className="divide-y divide-gray-50 bg-white">
                                                        {group.options?.map((opt, oi) => (
                                                            <div key={oi} className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-300"></div>
                                                                    <span className="font-semibold text-gray-700 text-xs">{opt.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                                                        {opt.stock === Infinity || opt.stock === "Infinity" ? "∞ instock" : `${opt.stock} left`}
                                                                    </span>
                                                                    <span className="font-black text-purple-600 text-xs">
                                                                        {opt.price > 0 ? `+₦${fmt(opt.price)}` : 'FREE'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Full Width Footer Items: Promos & Schedule */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200 border-dashed">

                            {/* Promotions */}
                            {hasPromos && (
                                <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">
                                        <Zap size={12} className="text-orange-400" /> Active Configurations
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {food.activePromotions.map((promo, pi) => (
                                            <div key={pi} className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-5 overflow-hidden text-white shadow-sm">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                                                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-2 border-b border-white/20 pb-3">
                                                    <span className="font-black text-xl tracking-wide">{promo.code}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${promo.isActive ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30' : 'bg-white/10 text-white/60'}`}>
                                                            {promo.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                        <span className="px-2 py-1 bg-black/20 rounded-md text-[9px] font-black uppercase text-white/80 border border-white/10">
                                                            By {promo.fundedBy}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    <p className="text-sm font-medium text-white/90 mb-3 leading-snug">{promo.description || 'Promotional offer applied to this item.'}</p>

                                                    <div className="flex flex-wrap gap-2 gap-y-2">
                                                        <div className="bg-black/20 rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm border border-white/10 flex items-center gap-1">
                                                            <Tag size={10} className="text-indigo-200" />
                                                            {promo.type === "PERCENTAGE" ? `${promo.value}% OFF` : `₦${promo.value} OFF`}
                                                        </div>
                                                        <div className="bg-black/20 rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm border border-white/10">
                                                            Used: {promo.usageCount} / {promo.usageLimit ?? "∞"}
                                                        </div>
                                                        {promo.minOrderAmount > 0 && (
                                                            <div className="bg-black/20 rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm border border-white/10">
                                                                Min: ₦{fmt(promo.minOrderAmount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Schedule */}
                            {hasSchedule && (
                                <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">
                                        <Calendar size={12} className="text-blue-400" /> Availability Matrix
                                    </h4>
                                    <div className="bg-white rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                const active = food.availabilitySchedule.days?.includes(day);
                                                return (
                                                    <div key={day} className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-colors overflow-hidden ${active ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}>
                                                        {day}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 p-3 rounded-2xl">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Clock size={14} /></div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Time Window</p>
                                                <p className="text-sm font-black text-blue-950">
                                                    {(food.availabilitySchedule.startTime || food.availabilitySchedule.endTime)
                                                        ? `${food.availabilitySchedule.startTime || 'Open'} — ${food.availabilitySchedule.endTime || 'Close'}`
                                                        : 'All Day Availability'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorDetailPage() {
    const { vendorId } = useParams();
    const router = useRouter();

    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [foodSearch, setFoodSearch] = useState("");
    const [foodFilter, setFoodFilter] = useState("all");
    const [selectedFoodDetails, setSelectedFoodDetails] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await adminApi.getVendorById(vendorId);
                setVendor(data.vendor || data);
            } catch (err) {
                toast.error("Failed to load vendor: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        if (vendorId) load();
    }, [vendorId]);

    console.log(vendor);

    if (loading) return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-20 h-20 bg-orange-50 rounded-[28px] flex items-center justify-center">
                        <Loader2 size={36} className="text-orange-500 animate-spin" />
                    </div>
                    <p className="font-black text-[11px] uppercase tracking-widest text-gray-400">Loading Vendor Intel...</p>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );

    if (!vendor) return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-sm mx-auto">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                        <TriangleAlert size={40} className="text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Vendor Not Found</h2>
                        <p className="font-medium text-gray-500 text-sm">The vendor you are looking for does not exist or has been permanently removed.</p>
                    </div>
                    <button onClick={() => router.back()} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors active:scale-95">
                        ← Go Back to Queue
                    </button>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );

    const foods = vendor.foods || [];
    const filteredFoods = foods.filter(f => {
        const available = f.available || f.isAvailable;
        if (foodFilter === "available" && !available) return false;
        if (foodFilter === "unavailable" && available) return false;
        if (foodSearch) return f.name?.toLowerCase().includes(foodSearch.toLowerCase());
        return true;
    });

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-6xl mx-auto space-y-6 pb-12">

                    {/* Navigation Bar */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-[18px] text-gray-400 hover:text-gray-900 hover:border-gray-300 hover transition-all active:scale-95 shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1 bg-white border border-gray-200 rounded-[18px] px-5 py-3.5 flex items-center gap-2 font-black text-xs uppercase tracking-widest text-gray-400">
                            <Store size={14} className="text-gray-300" />
                            <span className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => router.push('/admin/vendors/pending')}>Vendors</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-900 truncate">Details</span>
                        </div>
                    </div>

                    {/* Premium Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-white border border-gray-200 rounded-[40px] p-6 md:p-8"
                    >
                        {/* Abstract Background Elements */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 pointer-events-none" />
                        <div className="absolute top-0 right-0 p-6 flex gap-2">
                            {vendor.verified
                                ? <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 font-black text-[10px] uppercase tracking-widest rounded-xl border border-blue-100 backdrop-blur-sm"><ShieldCheck size={14} /> Verified Partner</span>
                                : <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 font-black text-[10px] uppercase tracking-widest rounded-xl border border-amber-100 backdrop-blur-sm"><Clock size={14} /> Pending Approval</span>
                            }
                            {vendor.suspended && <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 font-black text-[10px] uppercase tracking-widest rounded-xl border border-red-100 backdrop-blur-sm"><TriangleAlert size={14} /> Suspended</span>}
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                            {/* Vendor Avatar */}
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 rounded-[32px] overflow-hidden flex items-center justify-center text-gray-300 border-4 border-white shrink-0">
                                {vendor.logo
                                    ? <img src={vendor.logo} alt="" className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                                    : <Store size={48} className="opacity-20" />
                                }
                            </div>

                            {/* Vendor Title */}
                            <div className="flex-1 min-w-0 pr-10">
                                <p className="text-[12px] font-black text-orange-500 uppercase tracking-widest mb-2 inline-flex items-center gap-1.5">
                                    <Globe size={14} /> Business Identity
                                </p>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 truncate">{vendor.storeName || "Unnamed Vendor"}</h1>
                                <p className="text-lg font-medium text-gray-500 flex items-center gap-2">
                                    <MapPin size={16} /> {vendor.address?.city || vendor.requestedCity || "No city registered"}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Banner inside Hero */}
                        <div className="relative z-10 mt-10 p-5 bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-[28px] overflow-x-auto select-none no-scrollbar">
                            <div className="flex w-max min-w-full gap-x-12 gap-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Agreed Commission</p>
                                    <p className="text-2xl font-black text-gray-900">{vendor.commissionRate ? `${(vendor.commissionRate * 100).toFixed(0)}%` : "0%"}</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Menu Size</p>
                                    <p className="text-2xl font-black text-gray-900">{foods.length}</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Orders</p>
                                    <p className="text-2xl font-black text-gray-900">{vendor.totalOrders || 0}</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Riders</p>
                                    <p className="text-2xl font-black text-gray-900">{vendor.riders?.length || 0}</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Delivery Scope</p>
                                    <p className="text-2xl font-black text-gray-900">{vendor.deliveryRadiusKm ? `${vendor.deliveryRadiusKm}km` : "—"}</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Logistics Guard</p>
                                    <div className="mt-1">
                                        {vendor.deliveryManagedBy === "admin"
                                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-black uppercase"><Zap size={12} /> GrubDash</span>
                                            : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase"><Store size={12} /> Vendor Self</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Vendor Information Grid (4-pillar layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Operator Identity */}
                        <div className="bg-white border border-gray-200 rounded-[28px] p-6 transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                <User className="text-blue-500" size={20} />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-6">Operator Identity</h3>

                            <div className="space-y-5">
                                <div className="flex flex-col border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Full Legal Name</span>
                                    <span className="font-bold text-gray-900 text-sm">{vendor.name || "—"}</span>
                                </div>
                                <div className="flex flex-col border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Primary Email</span>
                                    <span className="font-bold text-gray-900 text-sm">{vendor.email || "—"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Contact Number</span>
                                    <span className="font-bold text-gray-900 text-sm">{vendor.phone || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Intelligence */}
                        <div className="bg-white border border-gray-200 rounded-[28px] p-6 transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                                <MapPin className="text-emerald-500" size={20} />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-6 relative z-10 flex items-center gap-3">
                                Location Intelligence
                                {vendor.locationStatus === "approved"
                                    ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px]">OK</span>
                                    : vendor.locationStatus === "pending_review"
                                        ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] flex gap-1 items-center"><TriangleAlert size={10} /> REVIEW</span>
                                        : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px]">NONE</span>
                                }
                            </h3>

                            <div className="space-y-5 relative z-10">
                                <div className="flex flex-col border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Street Address</span>
                                    <span className="font-bold text-gray-900 text-sm">{vendor.address?.street || "No street registered"}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">City</span>
                                        <span className="font-bold text-gray-900 text-sm">{vendor.address?.city || vendor.requestedCity || "—"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">State</span>
                                        <span className="font-bold text-gray-900 text-sm">{vendor.address?.state || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logistics Matrix */}
                        <div className="bg-white border border-gray-200 rounded-[28px] p-6 transition-shadow">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                                <Truck className="text-purple-500" size={20} />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-6">Logistics Configuration</h3>

                            <div className="space-y-5">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Accepts Delivery</span>
                                    {vendor.acceptsDelivery
                                        ? <CircleCheck size={18} className="text-emerald-500" />
                                        : <XCircle size={18} className="text-gray-300" />}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Flat Rate Fee</span>
                                    <span className="font-bold text-gray-900 text-sm px-3 py-1 bg-gray-50 rounded-lg">{vendor.flatRateDeliveryFee ? `₦${fmt(vendor.flatRateDeliveryFee)}` : "None"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Conduit */}
                        <div className="bg-white border border-gray-200 rounded-[28px] p-6 transition-shadow">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                                <Banknote className="text-green-500" size={20} />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-6 flex items-center justify-between">
                                Financial Conduit
                                {vendor.payoutDetails?.payoutEnabled && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px]">ACTIVE</span>}
                            </h3>

                            <div className="space-y-5">
                                <div className="flex flex-col border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Bank Institution</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center"><Banknote size={10} className="text-gray-400" /></div>
                                        <span className="font-bold text-gray-900 text-sm">{vendor.payoutDetails?.bankName || "No Bank Configured"}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Account Name</span>
                                        <span className="font-bold text-gray-900 text-sm truncate">{vendor.payoutDetails?.accountName || "—"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Account Number</span>
                                        <span className="font-max font-mono text-gray-900 text-sm tracking-widest bg-gray-50 px-2 py-0.5 rounded-lg w-fit border border-gray-100">
                                            {vendor.payoutDetails?.accountNumber || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* KYC Documents Panel (Full Width Card) */}
                    {vendor.kyc && (
                        <div className="bg-white border border-gray-200 rounded-[28px] p-6 shadow-sm">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="text-slate-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg">KYC Identity Documents</h3>
                                    <p className="text-gray-500 font-medium text-sm">Official identity & business verification artifacts</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID Type</p>
                                    <p className="font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-xl">{vendor.kyc.idType || "—"}</p>
                                </div>
                                <div className="text-right pl-4 border-l border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID Number</p>
                                    <p className="font-mono font-black text-slate-700 tracking-wider flex items-center gap-2">
                                        {vendor.kyc.idNumber || "—"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Registration Doc */}
                                <div className="border border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden group bg-gray-50/50 hover:border-slate-300 transition-all cursor-pointer">
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">Business Registration</span>
                                        <a href={vendor.kyc.businessRegistrationDoc} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <div className="w-full h-48 mt-10 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                                        {vendor.kyc.businessRegistrationDoc ? (
                                            <img src={vendor.kyc.businessRegistrationDoc} alt="Biz Doc" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <span className="text-gray-400 font-bold text-sm">Not Provided</span>
                                        )}
                                    </div>
                                </div>

                                {/* ID Front */}
                                <div className="border border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden group bg-gray-50/50 hover:border-slate-300 transition-all cursor-pointer">
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">Gov ID Front</span>
                                        <a href={vendor.kyc.idFrontUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <div className="w-full h-48 mt-10 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                                        {vendor.kyc.idFrontUrl ? (
                                            <img src={vendor.kyc.idFrontUrl} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <span className="text-gray-400 font-bold text-sm">Not Provided</span>
                                        )}
                                    </div>
                                </div>

                                {/* ID Back */}
                                <div className="border border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden group bg-gray-50/50 hover:border-slate-300 transition-all cursor-pointer">
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">Gov ID Back</span>
                                        <a href={vendor.kyc.idBackUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <div className="w-full h-48 mt-10 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                                        {vendor.kyc.idBackUrl ? (
                                            <img src={vendor.kyc.idBackUrl} alt="ID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <span className="text-gray-400 font-bold text-sm">Not Provided</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Highly Interactive Menu Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-50 border border-gray-200 rounded-[32px] overflow-hidden"
                    >
                        {/* Section Header */}
                        <div className="bg-white border-b border-gray-100 px-5 md:px-8 py-5 md:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            <div className="flex items-start md:items-center gap-4">
                                <div className="w-14 h-14 bg-orange-100 rounded-[20px] flex items-center justify-center shrink-0">
                                    <Utensils className="text-orange-500" size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="font-black text-gray-900 text-2xl tracking-tight">Menu Inventory</h2>
                                        <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-[10px] font-black">{foods.length}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Comprehensive list of all items published by this vendor</p>
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50/50 p-2 rounded-3xl border border-gray-100">
                                <div className="relative w-full sm:w-auto">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={foodSearch}
                                        onChange={e => setFoodSearch(e.target.value)}
                                        placeholder="Search menu..."
                                        className="h-12 w-full sm:w-64 pl-12 pr-4 bg-white border border-gray-200 focus:border-orange-500 rounded-[20px] outline-none text-sm font-semibold transition-all"
                                    />
                                </div>
                                <select
                                    value={foodFilter}
                                    onChange={e => setFoodFilter(e.target.value)}
                                    className="h-12 w-full sm:w-auto px-5 bg-white border border-gray-200 focus:border-orange-500 rounded-[20px] outline-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-gray-700"
                                >
                                    <option value="all">All Items</option>
                                    <option value="available">In Stock</option>
                                    <option value="unavailable">Out of Stock</option>
                                </select>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="p-5 md:p-8 min-h-[400px]">
                            {filteredFoods.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-white border border-gray-100 rounded-[32px] flex items-center justify-center mb-6 rotate-3">
                                        <Utensils size={36} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 mb-2">No items found</h3>
                                    <p className="font-medium text-gray-500">{foods.length === 0 ? "This vendor has not published any menu items yet." : "Adjust your search filters to find what you're looking for."}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {filteredFoods.map((food, i) => (
                                        <FoodCard key={food._id} food={food} index={i} onViewDetails={() => setSelectedFoodDetails(food)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Optional Modals Context */}
                {selectedFoodDetails && (
                    <FoodDetailsModal food={selectedFoodDetails} onClose={() => setSelectedFoodDetails(null)} />
                )}
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
