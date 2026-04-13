"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    DollarSign,
    Store,
    Truck,
    AlertCircle,
    Info,
    Calendar,
    ChevronRight,
    MessageSquare,
    ShoppingBag,
    Wallet,
    Star,
    Hash,
    Map,
    Activity,
    TrendingUp,
    Bike,
    ExternalLink,
    MoreHorizontal,
    Navigation,
    ShieldCheck,
    Navigation2,
    Zap,
    Package,
    BadgePercent,
    ReceiptText,
    Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import AdminRiderAssignmentModal from '@/app/components/admin/AdminRiderAssignmentModal';
import { generateOrderItemsStatement } from "@/app/lib/utils";

// ─── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
    pending:          { color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400",   ring: "ring-amber-200",   label: "Pending Activation" },
    accepted:         { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-400",    ring: "ring-blue-200",    label: "Accepted by Store" },
    preparing:        { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-400",  ring: "ring-orange-200",  label: "Kitchen Preparing" },
    ready_for_pickup: { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400",  ring: "ring-purple-200",  label: "Ready for Pickup" },
    rider_assigned:   { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-400",  ring: "ring-indigo-200",  label: "Driver Dispatched" },
    out_for_delivery: { color: "text-cyan-600",   bg: "bg-cyan-50",   border: "border-cyan-200",   dot: "bg-cyan-400",    ring: "ring-cyan-200",    label: "En Route" },
    delivered:        { color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-200",dot: "bg-emerald-400", ring: "ring-emerald-200", label: "Delivered" },
    completed:        { color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400",   ring: "ring-green-200",   label: "Order Fulfilled" },
    cancelled:        { color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-200",   dot: "bg-rose-400",    ring: "ring-rose-200",    label: "Cancelled" },
    failed:           { color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400",     ring: "ring-red-200",     label: "Delivery Failed" },
    refunded:         { color: "text-slate-500",  bg: "bg-slate-100", border: "border-slate-200",  dot: "bg-slate-400",   ring: "ring-slate-200",   label: "Refunded" },
};

// ─── Content Card ──────────────────────────────────────────────────────────────
const ContentCard = ({ title, children, icon: Icon, action, accent = false, className = "" }) => (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden ${accent ? "border-orange-200" : "border-slate-200"} ${className}`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${accent ? "border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/50" : "border-slate-100 bg-slate-50/60"}`}>
            <div className="flex items-center gap-2">
                {Icon && (
                    <span className={`w-5 h-5 rounded flex items-center justify-center ${accent ? "bg-orange-100" : "bg-white border border-slate-200"}`}>
                        <Icon size={12} className={accent ? "text-orange-500" : "text-slate-500"} />
                    </span>
                )}
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
            </div>
            {action && action}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

// ─── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, iconClass = "text-slate-400" }) => (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
        <span className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center shrink-0">
            <Icon size={13} className={iconClass} />
        </span>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{value || "—"}</p>
        </div>
    </div>
);

// ─── Finance Pill ──────────────────────────────────────────────────────────────
const FinancePill = ({ label, value, accent }) => (
    <div className={`p-3 rounded-xl border ${accent.border} ${accent.bg}`}>
        <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${accent.label}`}>{label}</p>
        <p className={`text-lg font-extrabold leading-none ${accent.value}`}>₦{value?.toLocaleString?.() ?? 0}</p>
    </div>
);

export default function OrderDetailsPage() {
    const { orderId } = useParams();
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        show: false, title: "", message: "", type: "confirm",
        statusToOverride: "", inputValue: "", isLoading: false
    });

    const [riderAssignModal, setRiderAssignModal] = useState({ show: false, orderData: null });

    const fetchOrderDetails = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSingleOrder(orderId);
            setOrder(data.data?.order);
        } catch (err) {
            setError(err.message || "Failed to load order");
            toast.error("Error fetching order details");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

    useEffect(() => {
        const handleRiderAssignmentEvent = (e) => {
            const data = e.detail;
            if (!data) return;
            setRiderAssignModal({ show: true, orderData: { vendorOrderId: data.vendorOrderId, restaurantName: data.restaurantName, readyAt: data.readyAt, url: data.url } });
        };
        window.addEventListener('admin:open_rider_assignment', handleRiderAssignmentEvent);
        return () => window.removeEventListener('admin:open_rider_assignment', handleRiderAssignmentEvent);
    }, []);

    const handleOverrideStatus = () => {
        setConfirmModal({
            show: true,
            title: "Override Order Status",
            message: "This will manually update the system state for this order.",
            type: "prompt",
            statusToOverride: order.orderStatus,
            inputValue: "",
            onConfirm: async (reason) => {
                if (!reason?.trim()) { toast.error("Please provide a reason"); return; }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.adminOverrideOrderStatus(order._id, confirmModal.statusToOverride, reason);
                    toast.success("Order status overridden");
                    fetchOrderDetails();
                    setConfirmModal(prev => ({ ...prev, show: false }));
                } catch (err) {
                    toast.error(err.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <AdminProtectedRoute>
                <AdminDashboardLayout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-5">
                            <Loader2 className="animate-spin text-orange-500" size={28} />
                        </div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-400 animate-pulse">Syncing Order Intelligence...</p>
                    </div>
                </AdminDashboardLayout>
            </AdminProtectedRoute>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error || !order) {
        return (
            <AdminProtectedRoute>
                <AdminDashboardLayout>
                    <div className="max-w-md mx-auto py-20 px-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={36} className="text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-3 uppercase tracking-tighter">Order Sync Failed</h2>
                        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">The requested order could not be loaded. It may be unavailable or removed.</p>
                        <button onClick={() => router.push("/admin/orders")} className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-200 hover:shadow-orange-300 transition-all">
                            <ArrowLeft size={16} /> Return to Registry
                        </button>
                    </div>
                </AdminDashboardLayout>
            </AdminProtectedRoute>
        );
    }

    // ── Financials ────────────────────────────────────────────────────────────
    const currentStatus = statusConfig[order.orderStatus || order.status] || { color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", dot: "bg-slate-400", label: order.orderStatus };
    const subtotal = order.financialSummary?.subtotal || order.subtotal || 0;
    const deliveryFee = order.financialSummary?.totalDeliveryFee || order.deliveryFee || 0;
    const isPlatformManaged = order.deliveryType === "platform_managed";
    const riderShare = isPlatformManaged ? Math.min(600, deliveryFee) : 0;
    const saleCommission = order.financialSummary?.totalCommission || 0;
    const deliveryCommission = isPlatformManaged ? Math.max(0, deliveryFee - riderShare) : 0;
    const totalPlatformRevenue = saleCommission + deliveryCommission;
    const vendorDeliveryEarnings = isPlatformManaged ? 0 : deliveryFee;
    const vendorOrderFoodEarnings = order.financialSummary?.totalVendorEarnings || (subtotal - saleCommission);
    const vendorEarnings = vendorOrderFoodEarnings + vendorDeliveryEarnings;

    const changedByLabel = (who) => {
        if (!who) return "Automated System";
        const w = who.toLowerCase();
        if (w.includes("vendor")) return "Restaurant Admin";
        if (w.includes("rider")) return "Fulfillment Courier";
        if (w.includes("admin")) return "System Administrator";
        return who;
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1500px] mx-auto pb-16 space-y-6">

                    {/* ── PAGE HEADER ─────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={() => router.push("/admin/orders")}
                                className="mt-0.5 w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-colors shadow-sm shrink-0"
                            >
                                <ArrowLeft size={16} />
                            </button>

                            <div>
                                {/* Badges row */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {/* Order ID */}
                                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-extrabold tracking-wider flex items-center gap-1.5">
                                        <Hash size={10} />
                                        {order.orderId}
                                    </span>
                                    {/* Status */}
                                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${currentStatus.border} ${currentStatus.bg} ${currentStatus.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot} animate-pulse`} />
                                        {currentStatus.label}
                                    </span>
                                    {/* Delivery type */}
                                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${isPlatformManaged ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                                        <Truck size={11} />
                                        {isPlatformManaged ? "Platform Managed" : "Vendor Managed"}
                                    </span>
                                </div>

                                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                                    Order Case File
                                    <span className="text-slate-300 font-normal">|</span>
                                    <span className="text-slate-500 font-medium text-sm">
                                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                    <p className="text-xs text-slate-500 font-medium">Full transaction breakdown and logistics intelligence</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleOverrideStatus}
                            className="h-10 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wide hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm flex items-center gap-2 shrink-0"
                        >
                            <ShieldCheck size={15} /> Override Status
                        </button>
                    </div>

                    {/* ── NARRATIVE BANNER ────────────────────────────────── */}
                    <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
                        {/* Brand gradient top bar */}
                        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

                        {/* Decorative blob */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/5 rounded-full" />
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-400/5 rounded-full" />
                        </div>

                        <div className="relative z-10 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-orange-500">Intelligent Order Narrative</p>
                            </div>
                            <h2 className="text-lg md:text-xl font-extrabold text-white leading-relaxed italic tracking-tight mb-4">
                                {generateOrderItemsStatement(order, { includeCustomerName: true })}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Processed</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Ready</span>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${currentStatus.bg} ${currentStatus.color} border ${currentStatus.border}`}>
                                    {currentStatus.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── 3-COLUMN GRID ───────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">

                        {/* ═══ COLUMN 1: Order basket + Customer ══════════════ */}
                        <div className="space-y-5">

                            {/* Order Basket */}
                            <ContentCard title="Order Basket" icon={ShoppingBag} accent>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-orange-200 hover:shadow-sm transition-all"
                                        >
                                            <div className="flex gap-3">
                                                <div className="relative w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={item.image_url || item.foodId?.image || order.items[0]?.restaurantId?.logo}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-0 right-0 bg-slate-900 text-white px-1 py-0.5 text-[9px] font-bold rounded-bl-md">
                                                        ×{item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name || item.foodId?.name}</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.portion_label && (
                                                            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase">
                                                                {item.portion_label}{item.portion_quantity > 1 ? ` ×${item.portion_quantity}` : ""}
                                                            </span>
                                                        )}
                                                        {item.item_type && (
                                                            <span className="text-[9px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded bg-white uppercase">
                                                                {item.item_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.selected_options?.length > 0 && (
                                                        <div className="mt-2 space-y-0.5">
                                                            {item.selected_options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center justify-between text-[10px]">
                                                                    <span className="text-slate-500 flex items-center gap-1 capitalize">
                                                                        <span className="w-1 h-1 rounded-full bg-orange-300 inline-block" />
                                                                        {opt.label}{opt.quantity > 1 ? ` ×${opt.quantity}` : ""}
                                                                    </span>
                                                                    {opt.price_modifier_naira > 0 && <span className="text-slate-400 font-medium">+₦{opt.price_modifier_naira}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.note && (
                                                        <div className="mt-2 pl-3 border-l-2 border-orange-300">
                                                            <p className="text-[10px] font-medium text-slate-500 italic">"{item.note}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-extrabold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">₦{item.price?.toLocaleString()} ea</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </ContentCard>

                            {/* Customer Info */}
                            <ContentCard title="Customer Information" icon={User}>
                                {/* Avatar + name */}
                                <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-slate-50 to-orange-50/30 rounded-xl border border-slate-100">
                                    <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-200 shrink-0">
                                        {order.userId?.firstname?.[0]}{order.userId?.lastname?.[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-extrabold text-slate-900">{order.userId?.firstname} {order.userId?.lastname}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Platform Buyer</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <InfoRow icon={Mail} label="Email" value={order.userId?.email} iconClass="text-orange-400" />
                                    <InfoRow icon={Phone} label="Phone" value={order.userId?.phone || order.phone} iconClass="text-orange-400" />
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="bg-gradient-to-br from-slate-50 to-orange-50/20 border border-slate-200 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <MapPin size={12} className="text-orange-500" />
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Destination</p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">{order.deliveryAddress?.addressLine}</p>
                                        <p className="text-xs text-slate-500">{order.deliveryAddress?.city}, {order.deliveryAddress?.state}</p>
                                    </div>
                                </div>
                            </ContentCard>
                        </div>

                        {/* ═══ COLUMN 2: Rider + Order Log ════════════════════ */}
                        <div className="space-y-5">

                            {/* Rider */}
                            <ContentCard
                                title="Fulfillment Rider"
                                icon={Bike}
                                action={
                                    order.deliveryType === "platform_managed" && !order.riderId && (
                                        <button
                                            onClick={() => setRiderAssignModal({
                                                show: true,
                                                orderData: {
                                                    vendorOrderId: order.vendorOrders?.[0]?._id || order._id,
                                                    restaurantName: order.items?.[0]?.restaurantId?.storeName || "Restaurant",
                                                    readyAt: order.updatedAt,
                                                    url: `/admin/orders/${order.orderId}`
                                                }
                                            })}
                                            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[10px] font-bold uppercase rounded-lg hover:from-orange-600 hover:to-amber-500 transition-all shadow-sm shadow-orange-200 flex items-center gap-1.5"
                                        >
                                            <Bike size={11} /> Assign
                                        </button>
                                    )
                                }
                            >
                                {order.deliveryType === "vendor_managed" ? (
                                    <div className="py-6 text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-dashed border-emerald-200">
                                        <div className="w-11 h-11 bg-white border border-emerald-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <ShieldCheck size={20} className="text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-bold text-emerald-700 mb-1">Vendor Managed Logistics</p>
                                        <p className="text-[11px] font-medium text-emerald-600/80 max-w-[200px] mx-auto leading-snug">
                                            The vendor handles delivery internally. No platform driver is needed.
                                        </p>
                                    </div>
                                ) : order.riderId ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-200 shrink-0 uppercase">
                                                {order.riderId?.name?.[0] || "R"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{order.riderId?.name || "MelaChow Courier"}</h4>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide">
                                                    <span className="flex items-center gap-1">
                                                        <Activity size={10} className="text-emerald-500" />
                                                        {(order.riderId?.status || "Active")}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Navigation2 size={10} className="text-blue-400" />
                                                        {order.riderId?.vehicleType || "Motorbike"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button className="h-9 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50 transition-all">
                                                <Phone size={13} /> Contact
                                            </button>
                                            <button className="h-9 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-amber-500 transition-all">
                                                <Map size={13} /> Live Map
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <Bike size={20} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 mb-1">Awaiting Dispatch</p>
                                        <p className="text-[11px] text-slate-400">No rider has been assigned yet</p>
                                    </div>
                                )}
                            </ContentCard>

                            {/* Order Log / Timeline */}
                            <ContentCard title="Order Logs" icon={Activity}>
                                {(order.statusLog || []).length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-xs text-slate-400 font-medium">No log entries available</p>
                                    </div>
                                ) : (
                                    <div className="relative space-y-4">
                                        {/* Vertical connector */}
                                        <div className="absolute left-[9px] top-3 bottom-3 w-px bg-gradient-to-b from-orange-300 via-slate-200 to-slate-100" />

                                        {(order.statusLog || []).map((log, idx) => {
                                            const cfg = statusConfig[log.status] || { dot: "bg-slate-300", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: log.status };
                                            return (
                                                <div key={idx} className="relative pl-7">
                                                    <span className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm z-10 ${cfg.dot}`} />
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <p className={`text-xs font-extrabold ${cfg.color}`}>{cfg.label}</p>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        </div>
                                                        {log.reason && (
                                                            <div className={`mt-1 mb-1 p-2 rounded-lg border text-[11px] text-slate-600 font-medium italic ${cfg.bg} ${cfg.border}`}>
                                                                "{log.reason}"
                                                            </div>
                                                        )}
                                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                                                            By: {changedByLabel(log.changedBy)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ContentCard>
                        </div>

                        {/* ═══ COLUMN 3: Financial Settlement ═════════════════ */}
                        <div className="space-y-5">
                            <ContentCard title="Financial Settlement" icon={ReceiptText} accent>

                                {/* Line items */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className="text-sm text-slate-500 font-medium">Subtotal</span>
                                        <span className="text-sm font-bold text-slate-900">₦{subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className="text-sm text-slate-500 font-medium">Delivery Fee</span>
                                        <span className="text-sm font-bold text-slate-900">₦{(order.financialSummary?.totalDeliveryFee || order.deliveryFee || 0)?.toLocaleString()}</span>
                                    </div>
                                    {order.appliedDiscount && (
                                        <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                            <span className="text-sm font-semibold text-emerald-600">Platform Promo</span>
                                            <span className="text-sm font-bold text-emerald-700">−₦{(order.appliedDiscount.amount_saved || 0)?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Gross total */}
                                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 mb-5 overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-orange-400 mb-0.5">Gross Total</p>
                                            <p className="text-[10px] font-bold text-slate-500 capitalize">{order.paymentStatus} · Paystack</p>
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-white">₦{order.total?.toLocaleString()}</h2>
                                    </div>
                                    {order.paymentStatus === "paid" && (
                                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full" />
                                    )}
                                </div>

                                {/* Platform revenue */}
                                <div className="mb-3 p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                                                <TrendingUp size={12} className="text-orange-500" />
                                            </span>
                                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Platform Revenue</p>
                                        </div>
                                        <h4 className="text-xl font-extrabold text-slate-900">₦{totalPlatformRevenue?.toLocaleString()}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-orange-400" /> Sale: ₦{saleCommission.toLocaleString()}
                                        </span>
                                        {deliveryCommission > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-amber-400" /> Logistics: ₦{deliveryCommission.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Vendor + Rider payouts */}
                                <div className="grid grid-cols-2 gap-3">
                                    <FinancePill
                                        label="Vendor Payout"
                                        value={vendorEarnings}
                                        accent={{ border: "border-slate-200", bg: "bg-slate-50", label: "text-slate-500", value: "text-slate-900" }}
                                    />
                                    <FinancePill
                                        label="Rider Share"
                                        value={riderShare}
                                        accent={{ border: "border-indigo-200", bg: "bg-indigo-50", label: "text-indigo-500", value: "text-indigo-800" }}
                                    />
                                </div>
                            </ContentCard>
                        </div>
                    </div>
                </div>

                {/* ── OVERRIDE MODAL ───────────────────────────────────────── */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, show: false }))}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }}
                                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                            >
                                <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-11 h-11 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center shrink-0">
                                            <ShieldCheck size={20} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900">{confirmModal.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{confirmModal.message}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <div>
                                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">New Status</label>
                                            <div className="relative">
                                                <select
                                                    value={confirmModal.statusToOverride}
                                                    onChange={(e) => setConfirmModal(prev => ({ ...prev, statusToOverride: e.target.value }))}
                                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none"
                                                >
                                                    {Object.entries(statusConfig).map(([key, cfg]) => (
                                                        <option key={key} value={key}>{cfg.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Reason</label>
                                            <textarea
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                placeholder="Reason for manual override..."
                                                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-bold hover:from-orange-600 hover:to-amber-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-200 transition-all"
                                        >
                                            {confirmModal.isLoading && <Loader2 size={15} className="animate-spin" />}
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <AdminRiderAssignmentModal
                        isOpen={riderAssignModal.show}
                        onClose={() => setRiderAssignModal({ show: false, orderData: null })}
                        orderData={riderAssignModal.orderData}
                        onAssigned={() => { fetchOrderDetails(); setRiderAssignModal({ show: false, orderData: null }); }}
                    />
                </AnimatePresence>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

// ─── Local Percent SVG (avoids lucide naming conflict) ────────────────────────
const Percent = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="19" x2="5" y1="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
);
