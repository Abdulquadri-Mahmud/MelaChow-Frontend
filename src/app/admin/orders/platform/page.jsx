"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Truck,
    Search,
    X,
    Loader2,
    Eye,
    MapPin,
    User,
    Phone,
    ShoppingBag,
    ArrowRight,
    RefreshCw,
    Inbox,
    Bike,
    AlertCircle,
    ChevronDown,
    Zap,
    Activity,
    Navigation2,
    Clock,
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
    pending:          { color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",   label: "Pending" },
    accepted:         { color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",    label: "Accepted" },
    preparing:        { color: "bg-orange-50 text-orange-700 border-orange-200",dot: "bg-orange-400",  label: "Preparing" },
    ready_for_pickup: { color: "bg-purple-50 text-purple-700 border-purple-200",dot: "bg-purple-400",  label: "Ready for Pickup" },
    rider_assigned:   { color: "bg-indigo-50 text-indigo-700 border-indigo-200",dot: "bg-indigo-400",  label: "Rider Assigned" },
    out_for_delivery: { color: "bg-cyan-50 text-cyan-700 border-cyan-200",      dot: "bg-cyan-400",    label: "Out for Delivery" },
    delivered:        { color: "bg-teal-50 text-teal-700 border-teal-200",      dot: "bg-teal-400",    label: "Delivered" },
    completed:        { color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-400",   label: "Completed" },
    cancelled:        { color: "bg-rose-50 text-rose-700 border-rose-200",      dot: "bg-rose-400",    label: "Cancelled" },
    failed:           { color: "bg-red-50 text-red-700 border-red-200",         dot: "bg-red-400",     label: "Failed" },
    refunded:         { color: "bg-slate-100 text-slate-600 border-slate-200",  dot: "bg-slate-400",   label: "Refunded" },
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: status };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

export default function PlatformDeliveriesPage() {
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [riderAssignModal, setRiderAssignModal] = useState({ show: false, orderData: null });
    const [filters, setFilters] = useState({ status: "ready_for_pickup", search: "" });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchPlatformOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getPlatformManagedOrders(filters);
            setOrders(data.data?.orders || []);
        } catch (error) {
            console.error(error);
            toast.error("Could not load platform deliveries");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchPlatformOrders();
            toast.success("Logistics synchronized", { id: "logistics-sync" });
        } catch {
            toast.error("Sync failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchPlatformOrders(); }, [fetchPlatformOrders]);

    useEffect(() => {
        const handleRiderAssignmentEvent = (e) => {
            const data = e.detail;
            if (!data) return;
            setRiderAssignModal({ show: true, orderData: { vendorOrderId: data.vendorOrderId, restaurantName: data.restaurantName, readyAt: data.readyAt, url: data.url } });
        };
        window.addEventListener("admin:open_rider_assignment", handleRiderAssignmentEvent);
        return () => window.removeEventListener("admin:open_rider_assignment", handleRiderAssignmentEvent);
    }, []);

    const actionableCount = orders.filter(o => o.status === "ready_for_pickup" && !o.riderId).length;
    const hasActiveFilter = filters.search || filters.status;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-5">

                    {/* ── PAGE HEADER ─────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                {/* Brand icon */}
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <Truck size={17} className="text-white" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                                    Logistics Hub
                                </h1>
                                {/* Live pulse indicator */}
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium">
                                    Monitoring platform-managed fleet across active operational zones
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Urgent action counter */}
                            <AnimatePresence>
                                {actionableCount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
                                            {actionableCount} Action{actionableCount > 1 ? "s" : ""} Required
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Refresh button */}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="h-9 px-3.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl flex items-center gap-2 text-xs font-bold shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-500 transition-all disabled:opacity-60"
                            >
                                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                                {isRefreshing ? "Syncing…" : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {/* ── FILTER TOOLBAR ──────────────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                        {/* Search */}
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search by Order ID, restaurant or customer…"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all placeholder:text-slate-400 font-medium"
                            />
                            {filters.search && (
                                <button onClick={() => setFilters(prev => ({ ...prev, search: "" }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Status select */}
                        <div className="relative min-w-[190px]">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 cursor-pointer appearance-none"
                            >
                                <option value="">All Orders</option>
                                <option value="ready_for_pickup">Ready for Dispatch</option>
                                <option value="accepted">Accepted (New)</option>
                                <option value="preparing">In Kitchen</option>
                                <option value="rider_assigned">Assigned to Rider</option>
                                <option value="out_for_delivery">In Transit</option>
                                <option value="delivered">Completed</option>
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Clear */}
                        {hasActiveFilter && (
                            <button
                                onClick={() => setFilters({ search: "", status: "" })}
                                className="h-9 px-3.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <X size={13} /> Clear
                            </button>
                        )}
                    </div>

                    {/* ── ORDERS GRID ─────────────────────────────────────── */}
                    <div className="min-h-[400px]">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse h-[280px]">
                                        <div className="h-0.5 bg-gradient-to-r from-orange-200 to-amber-200 rounded mb-4" />
                                        <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2 mb-6" />
                                        <div className="h-16 bg-slate-50 rounded-lg mb-4" />
                                        <div className="h-10 bg-slate-100 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {orders.map((order, idx) => {
                                        const isActionable = order.status === "ready_for_pickup" && !order.riderId;
                                        const waitMins = Math.floor((Date.now() - new Date(order.updatedAt || order.createdAt)) / 60000);
                                        const isUrgent = isActionable && waitMins >= 15;

                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.04 }}
                                                key={order._id}
                                                className={`group bg-white rounded-xl border flex flex-col relative overflow-hidden transition-all
                                                    ${isUrgent
                                                        ? "border-rose-300 shadow-md shadow-rose-100 ring-2 ring-rose-100"
                                                        : isActionable
                                                            ? "border-orange-200 shadow-sm shadow-orange-50"
                                                            : "border-slate-200 hover:border-orange-200 hover:shadow-md hover:shadow-orange-50"
                                                    }`}
                                            >
                                                {/* Brand accent / urgency top strip */}
                                                {isUrgent ? (
                                                    <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-400" />
                                                ) : isActionable ? (
                                                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                                                ) : (
                                                    <div className="h-0.5 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}

                                                {/* Urgency banner */}
                                                {isActionable && (
                                                    <div className={`flex items-center justify-between px-4 py-2 ${isUrgent ? "bg-rose-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                                <AlertCircle size={11} strokeWidth={3} className="text-white" />
                                                            </div>
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                                                                {isUrgent ? "⚠ Urgent — Rider Needed" : "Needs a rider"}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-white/80">{formatTimeAgo(order.updatedAt)}</span>
                                                    </div>
                                                )}

                                                {/* Card body */}
                                                <div className="p-4 flex-1 space-y-3.5">

                                                    {/* Vendor + status header */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-lg border border-orange-100 bg-orange-50 overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={
                                                                        order.vendorOrders?.[0]?.restaurantId?.logo ||
                                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(order.vendorOrders?.[0]?.restaurantId?.storeName || "R")}&background=fff7ed&color=f97316`
                                                                    }
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-extrabold text-orange-500 tracking-tighter leading-none mb-0.5">
                                                                    #{order.orderId}
                                                                </p>
                                                                <h2 className="font-extrabold text-slate-900 truncate text-sm leading-tight">
                                                                    {order.vendorOrders?.[0]?.restaurantId?.storeName || "External Vendor"}
                                                                </h2>
                                                            </div>
                                                        </div>
                                                        <StatusBadge status={order.status} />
                                                    </div>

                                                    {/* Customer + address */}
                                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm shrink-0 uppercase">
                                                                {order.userId?.firstname?.[0]}{order.userId?.lastname?.[0]}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-800 text-xs truncate leading-none">{order.userId?.firstname} {order.userId?.lastname}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{order.phone}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-1.5 pt-2 border-t border-slate-200/70">
                                                            <MapPin size={10} className="text-orange-400 mt-0.5 shrink-0" />
                                                            <p className="text-[10px] text-slate-600 font-medium leading-snug line-clamp-2">
                                                                {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.cityName}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Fleet logistics */}
                                                    <div>
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Fleet Logistics</p>
                                                        {order.riderId ? (
                                                            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                                                        <Bike size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 text-xs leading-none mb-0.5">{order.riderId.name}</p>
                                                                        <p className="text-[9px] text-indigo-500 font-bold">{order.riderId.phone}</p>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={`tel:${order.riderId.phone}`}
                                                                    className="w-8 h-8 bg-white border border-indigo-200 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    <Phone size={13} />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    const vendorOrderId = order.vendorOrders?.[0]?._id;
                                                                    if (!vendorOrderId) { toast.error("Vendor order not found. Refresh and try again."); return; }
                                                                    setRiderAssignModal({
                                                                        show: true,
                                                                        orderData: {
                                                                            vendorOrderId,
                                                                            restaurantName: order.vendorOrders?.[0]?.restaurantId?.storeName || "Vendor",
                                                                            readyAt: order.updatedAt,
                                                                            url: `/admin/orders/${order.orderId}`
                                                                        }
                                                                    });
                                                                }}
                                                                className={`w-full h-10 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                                                                    ${isUrgent
                                                                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200 hover:from-rose-600 hover:to-rose-700"
                                                                        : isActionable
                                                                            ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-500"
                                                                            : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50"
                                                                    }`}
                                                            >
                                                                <Bike size={14} className={isActionable ? "animate-bounce" : ""} />
                                                                {isUrgent ? "🚨 Dispatch Rider Now" : isActionable ? "Dispatch Rider" : "Assign Logistics Partner"}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Order directive narrative */}
                                                    <div className="pt-3 border-t border-slate-100">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <span className="w-1 h-1 rounded-full bg-orange-400" />
                                                            <p className="text-[8px] font-extrabold uppercase text-slate-400 tracking-[0.2em]">Directive</p>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-600 leading-snug uppercase italic line-clamp-2">
                                                            {generateOrderItemsStatement(order, { includeCustomerName: true })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Card footer */}
                                                <div className={`px-4 py-3 border-t flex items-center justify-between
                                                    ${isUrgent
                                                        ? "bg-rose-50 border-rose-100"
                                                        : isActionable
                                                            ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100"
                                                            : "bg-slate-50 border-slate-100"
                                                    }`}
                                                >
                                                    <div>
                                                        <span className="text-[8px] text-slate-400 uppercase font-extrabold tracking-widest block leading-none mb-0.5">Revenue</span>
                                                        <span className="text-base font-extrabold text-slate-900 leading-none">₦{order.total?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Wait time chip */}
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                                            isUrgent
                                                                ? "bg-rose-100 text-rose-600 border-rose-200"
                                                                : "bg-white text-slate-500 border-slate-200"
                                                        }`}>
                                                            <Clock size={8} className="inline mr-0.5 -mt-px" />
                                                            {formatTimeAgo(order.updatedAt)}
                                                        </span>
                                                        <button
                                                            onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                                                            className="px-3 h-8 bg-white text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold uppercase hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-1.5 group/btn"
                                                        >
                                                            Details <ArrowRight size={11} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ) : (
                            /* Empty state */
                            <div className="bg-white rounded-xl border border-dashed border-orange-200 py-20 px-6 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Inbox size={36} strokeWidth={1.5} className="text-orange-300" />
                                </div>
                                <div className="max-w-xs mx-auto">
                                    <h3 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">Operations Clear</h3>
                                    <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                                        No platform-managed orders require logistics intervention right now.
                                    </p>
                                    <button
                                        onClick={() => setFilters({ search: "", status: "" })}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-500 transition-all"
                                    >
                                        View All Records
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <AdminRiderAssignmentModal
                        isOpen={riderAssignModal.show}
                        onClose={() => setRiderAssignModal({ show: false, orderData: null })}
                        orderData={riderAssignModal.orderData}
                        onAssigned={() => {
                            fetchPlatformOrders();
                            setRiderAssignModal({ show: false, orderData: null });
                        }}
                    />
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function formatTimeAgo(dateString) {
    if (!dateString) return "Active";
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateString).toLocaleDateString();
}
