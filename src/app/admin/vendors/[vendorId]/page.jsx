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
    Globe, TriangleAlert, CircleCheck, XCircle, Info, Eye, Image as ImageIcon, TrendingUp, Box, ExternalLink,
    Mail, Phone, Building2, CreditCard, Activity, Link
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString?.() ?? n ?? "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const FOOD_TYPES = { veg: "🥦 Veg", "non-veg": "🍗 Non-Veg", vegan: "🌿 Vegan", halal: "☪ Halal", kosher: "✡ Kosher", mixed: "🍱 Mixed" };

// ─── Badge Helper ─────────────────────────────────────────────────────────────
const GlassBadge = ({ children, colorClass, size = "md" }) => {
    const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]";
    return (
        <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border backdrop-blur-sm ${sizeClasses} ${colorClass}`}>
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
    const hasExtras = hasVariants || hasPortions || hasChoiceGroups || hasDiscount || hasPromos;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border rounded-xl overflow-hidden transition-all duration-200 border-slate-200 hover:border-slate-400 group relative"
        >
            <div
                className="flex items-center gap-4 p-3 cursor-pointer hover:bg-slate-50/50"
                onClick={() => hasExtras && onViewDetails()}
            >
                {/* Slimmer Image */}
                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    {imgSrc ? (
                        <img
                            src={imgSrc}
                            alt={food.name}
                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                        />
                    ) : (
                        <Utensils size={20} className="text-slate-300 m-auto mt-4" />
                    )}
                </div>

                {/* Compact Info */}
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{food.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${food.available || food.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {food.available || food.isAvailable ? "Stock" : "Out"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">₦{fmt(food.price)}</span>
                        {food.orderCount > 0 && <span className="text-[10px] text-slate-400 font-medium">{food.orderCount} orders</span>}
                    </div>
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronDown size={16} className="text-slate-400" />
                </div>
            </div>
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-all font-bold text-xs"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="flex-1 bg-slate-900 rounded-lg px-4 py-2 flex items-center gap-3 font-bold text-[10px] uppercase tracking-wider text-slate-400 border border-slate-800">
                            <Store size={14} className="text-slate-600" />
                            <span className="cursor-pointer hover:text-white" onClick={() => router.push('/admin/vendors')}>Vendors</span>
                            <span className="text-slate-700">/</span>
                            <span className="text-white">Profile Control</span>
                        </div>
                    </div>

                    {/* Highly Refined Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-xl p-5 md:p-6"
                    >
                        <div className="flex flex-col lg:flex-row gap-6 items-start">
                            {/* Vendor Avatar */}
                            <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 shrink-0">
                                {vendor.logo ? (
                                    <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={32} className="text-slate-200" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{vendor.storeName || "Unnamed Vendor"}</h1>
                                    <div className="flex gap-1.5 ml-1">
                                        {vendor.verified ? (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <ShieldCheck size={10} /> Verified
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} /> Pending
                                            </span>
                                        )}
                                        {vendor.suspended && (
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-widest">Suspended</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-4">
                                    <MapPin size={12} /> {vendor.address?.city || vendor.requestedCity || "Unknown City"}
                                </p>

                                {/* Mini Stats Line */}
                                <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-50">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Commission</p>
                                        <p className="text-sm font-black text-slate-900">{vendor.commissionRate ? `${(vendor.commissionRate * 100).toFixed(0)}%` : "0%"}</p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Orders</p>
                                        <p className="text-sm font-black text-slate-900">{fmt(vendor.totalOrders || 0)}</p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Menu Items</p>
                                        <p className="text-sm font-black text-slate-900">{foods.length}</p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100 flex-1 hidden md:block" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Logistics:</span>
                                        {vendor.deliveryManagedBy === "admin" ? (
                                            <span className="px-2 py-1 bg-slate-900 text-white rounded text-[9px] font-bold uppercase border border-slate-800">GrubDash Managed</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase border border-slate-200 font-mono">Self Managed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Business Details */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Mail size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Contact</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Operator</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{vendor.name || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Contact Email</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{vendor.email || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Phone Number</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{vendor.phone || "—"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Location</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Street</p>
                                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{vendor.address?.street || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">City & State</p>
                                    <p className="text-xs font-bold text-slate-900">{vendor.address?.city || vendor.requestedCity}, {vendor.address?.state || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Conduit */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard size={14} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finance Matrix</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Bank Institutional</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{vendor.payoutDetails?.bankName || "Pending Setup"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Account Label</p>
                                    <p className="text-xs font-bold text-slate-900 truncate uppercase">{vendor.payoutDetails?.accountName || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-medium mb-0.5">Account ID</p>
                                    <p className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded w-fit">{vendor.payoutDetails?.accountNumber || "—"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Operational Status */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={14} className="text-slate-600" />
                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Intel Feed</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
                                    <span className="text-slate-500">Live Orders</span>
                                    <span className="font-bold">0 Active</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
                                    <span className="text-slate-500">Logistics Status</span>
                                    <span className={`font-bold ${vendor.locationStatus === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {vendor.locationStatus || 'None'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Radius</span>
                                    <span className="font-bold">{vendor.deliveryRadiusKm || 0} km</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KYC Documents Panel */}
                    {vendor.kyc && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center gap-4 mb-5">
                                <ShieldCheck className="text-slate-400" size={18} />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Archives</h3>
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ID Number</p>
                                        <p className="text-[11px] font-mono font-bold text-slate-900">{vendor.kyc.idNumber || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Business Doc", url: vendor.kyc.businessRegistrationDoc },
                                    { label: "ID Front", url: vendor.kyc.idFrontUrl },
                                    { label: "ID Back", url: vendor.kyc.idBackUrl }
                                ].map((doc, i) => (
                                    <div key={i} className="group relative border border-slate-100 rounded-lg h-32 overflow-hidden bg-slate-50 cursor-pointer">
                                        {doc.url ? (
                                            <>
                                                <img src={doc.url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-lg text-slate-900 scale-90 group-hover:scale-100 transition-all">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-100">MISSING</div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-white/90 backdrop-blur-md border-t border-slate-100 text-[8px] font-bold uppercase tracking-widest text-slate-600 text-center">
                                            {doc.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Highly Refined Menu Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                    >
                        {/* Section Header */}
                        <div className="bg-slate-900 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Box className="text-slate-500" size={18} />
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Menu Inventory</h3>
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[9px] font-bold border border-slate-700">{foods.length} Items</span>
                            </div>

                            {/* Refined Filters */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        value={foodSearch}
                                        onChange={e => setFoodSearch(e.target.value)}
                                        placeholder="Filter item..."
                                        className="h-8 w-40 pl-9 pr-3 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-lg outline-none text-[11px] font-semibold text-white transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <select
                                    value={foodFilter}
                                    onChange={e => setFoodFilter(e.target.value)}
                                    className="h-8 px-3 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-lg outline-none text-[9px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer"
                                >
                                    <option value="all">Status: All</option>
                                    <option value="available">Live Only</option>
                                    <option value="unavailable">Offline</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50/50">
                            {filteredFoods.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredFoods.map((f, i) => (
                                        <FoodCard
                                            key={f._id || i}
                                            food={f}
                                            index={i}
                                            onViewDetails={() => setSelectedFoodDetails(f)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                                        <Search size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">No matching items</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Refine your search parameters</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>

                {/* Overlays */}
                {selectedFoodDetails && (
                    <FoodDetailsModal
                        food={selectedFoodDetails}
                        onClose={() => setSelectedFoodDetails(null)}
                    />
                )}

            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
