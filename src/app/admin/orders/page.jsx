"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingBag,
    Search,
    X,
    Loader2,
    Eye,
    MoreVertical,
    DollarSign,
    Percent,
    Truck,
    Store,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    Shield,
    RotateCcw,
    Hash,
    User,
    Bike,
    ChevronDown,
    MapPin,
    ArrowUpRight,
    Flame,
    TrendingUp,
    Package,
    Zap,
    Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import AdminRiderAssignmentModal from '@/app/components/admin/AdminRiderAssignmentModal';
import { generateOrderItemsStatement } from "@/app/lib/utils";

// ─── Brand palette ────────────────────────────────────────────────────────────
// Primary: #f48525  /  Dark: #2d1a0c
// These mirror the Tailwind orange-500 / amber used throughout the admin shell.

const statusConfig = {
    pending:          { color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",   label: "Pending" },
    accepted:         { color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",    label: "Accepted" },
    preparing:        { color: "bg-orange-50 text-orange-700 border-orange-200",dot: "bg-orange-400",  label: "Preparing" },
    ready_for_pickup: { color: "bg-purple-50 text-purple-700 border-purple-200",dot: "bg-purple-400",  label: "Ready" },
    rider_assigned:   { color: "bg-indigo-50 text-indigo-700 border-indigo-200",dot: "bg-indigo-400",  label: "Rider Assigned" },
    out_for_delivery: { color: "bg-cyan-50 text-cyan-700 border-cyan-200",      dot: "bg-cyan-400",    label: "Out for Delivery" },
    delivered:        { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", label: "Delivered" },
    completed:        { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", label: "Completed" },
    cancelled:        { color: "bg-rose-50 text-rose-700 border-rose-200",      dot: "bg-rose-400",    label: "Cancelled" },
    failed:           { color: "bg-rose-50 text-rose-700 border-rose-200",      dot: "bg-rose-400",    label: "Failed" },
    refunded:         { color: "bg-slate-100 text-slate-600 border-slate-200",  dot: "bg-slate-400",   label: "Refunded" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent, loading, suffix }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white border border-slate-200 rounded-xl p-4 overflow-hidden group hover:border-orange-200 transition-colors"
    >
        {/* Warm brand glow strip */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent.bar}`} />
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
                {loading ? (
                    <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                    <p className="text-xl font-extrabold text-slate-900 leading-none">
                        {value}
                        {suffix && <span className="text-sm font-bold text-slate-400 ml-1">{suffix}</span>}
                    </p>
                )}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
                <Icon size={18} className={accent.icon} strokeWidth={2.5} />
            </div>
        </div>
    </motion.div>
);

// ─── Order Status Badge ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: status };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

export default function AdminOrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState({
        status: "",
        paymentStatus: "",
        deliveryType: "",
        startDate: "",
        endDate: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    });

    const [actionMenu, setActionMenu] = useState({ show: false, order: null });
    const [riderAssignModal, setRiderAssignModal] = useState({ show: false, orderData: null });
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "confirm",
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
        inputValue: "",
        placeholder: "",
        isLoading: false,
        statusToOverride: ""
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const data = await adminApi.getOrderStats(filters);
            setStats(data.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load order stats");
        } finally {
            setStatsLoading(false);
        }
    }, [filters]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const baseParams = {
                search: debouncedSearch,
                page: pagination.page,
                limit: pagination.limit,
                status: filters.status,
                paymentStatus: filters.paymentStatus,
                startDate: filters.startDate,
                endDate: filters.endDate
            };
            let response;
            if (filters.deliveryType === "platform_managed") {
                response = await adminApi.getPlatformManagedOrders(baseParams);
            } else {
                response = await adminApi.getAllOrders({ ...baseParams, deliveryType: filters.deliveryType });
            }
            const data = response.data;
            setOrders(data?.orders || []);
            setPagination(prev => ({ ...prev, total: data?.pagination?.total || 0, pages: data?.pagination?.totalPages || 1 }));
        } catch (error) {
            console.error(error);
            toast.error("Failed to sync orders");
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedSearch, pagination.page, pagination.limit]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    useEffect(() => {
        const handleRiderAssignmentEvent = (e) => {
            const data = e.detail;
            if (!data) return;
            setRiderAssignModal({ show: true, orderData: { vendorOrderId: data.vendorOrderId, restaurantName: data.restaurantName, readyAt: data.readyAt, url: data.url } });
        };
        window.addEventListener('admin:open_rider_assignment', handleRiderAssignmentEvent);
        return () => window.removeEventListener('admin:open_rider_assignment', handleRiderAssignmentEvent);
    }, []);

    const handleClearFilters = () => {
        setSearch("");
        setFilters({ status: "", paymentStatus: "", deliveryType: "", startDate: "", endDate: "" });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRefresh = async () => {
        const t = toast.loading("Syncing latest data...");
        try {
            await Promise.all([fetchOrders(), fetchStats()]);
            toast.success("Orders synchronized", { id: t });
        } catch {
            toast.error("Sync failed", { id: t });
        }
    };

    const handleOverrideStatus = (order) => {
        setConfirmModal({
            show: true,
            title: "Override Order Status",
            message: "Reason required for manual status adjustment.",
            type: "prompt",
            confirmText: "Apply Change",
            placeholder: "Internal note (e.g. Manual payment verified)",
            inputValue: "",
            statusToOverride: order.orderStatus,
            onConfirm: async (reason) => {
                if (!reason?.trim()) { toast.error("Reason is required"); return; }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.adminOverrideOrderStatus(order._id, confirmModal.statusToOverride, reason);
                    toast.success("Order updated");
                    fetchOrders(); fetchStats();
                    setConfirmModal(prev => ({ ...prev, show: false }));
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const ordersNeedingRider = orders.filter(order =>
        order.deliveryType === 'platform_managed' &&
        !order.riderId &&
        ['ready_for_pickup', 'ready', 'preparing', 'accepted'].includes(order.orderStatus || order.status)
    );

    const hasActiveFilters = search || filters.status || filters.paymentStatus || filters.deliveryType || filters.startDate || filters.endDate;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-5">

                    {/* ── PAGE HEADER ─────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-200">
                                    <ShoppingBag size={16} className="text-white" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    Order Dashboard
                                </h1>
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 italic tracking-widest uppercase">
                                    <Flame size={9} />
                                    {pagination.total} Records
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-11">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium">Real-time platform activity &amp; transaction management</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={loading || statsLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold rounded-lg hover:from-orange-600 hover:to-amber-500 transition-all shadow-md shadow-orange-200 disabled:opacity-50 disabled:shadow-none shrink-0"
                        >
                            <RotateCcw size={14} className={(loading || statsLoading) ? "animate-spin" : ""} />
                            {loading || statsLoading ? "Syncing..." : "Refresh Data"}
                        </button>
                    </div>

                    {/* ── STATS GRID ──────────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            icon={Package}
                            label="Total Volume"
                            value={stats?.totalOrders ?? 0}
                            loading={statsLoading}
                            accent={{ bar: "bg-gradient-to-r from-orange-400 to-amber-400", bg: "bg-orange-50", icon: "text-orange-500" }}
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Gross Value"
                            value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
                            loading={statsLoading}
                            accent={{ bar: "bg-gradient-to-r from-emerald-400 to-teal-400", bg: "bg-emerald-50", icon: "text-emerald-500" }}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Platform Slice"
                            value={`₦${(stats?.totalCommission || 0).toLocaleString()}`}
                            loading={statsLoading}
                            accent={{ bar: "bg-gradient-to-r from-amber-400 to-orange-400", bg: "bg-amber-50", icon: "text-amber-500" }}
                        />
                        <StatCard
                            icon={Truck}
                            label="Logistics Rev."
                            value={`₦${(stats?.platformDeliveryRevenue || 0).toLocaleString()}`}
                            loading={statsLoading}
                            accent={{ bar: "bg-gradient-to-r from-indigo-400 to-violet-400", bg: "bg-indigo-50", icon: "text-indigo-500" }}
                        />
                    </div>

                    {/* ── OPERATIONAL SUMMARY ─────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                        {/* Funnel */}
                        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4">
                            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">
                                <span className="w-4 h-4 bg-orange-50 rounded flex items-center justify-center"><Clock size={10} className="text-orange-500" /></span>
                                Operational Funnel
                            </h3>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => {
                                    const cfg = statusConfig[status];
                                    return (
                                        <div key={status} className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center hover:border-orange-200 transition-colors">
                                            {cfg && <span className={`w-1.5 h-1.5 rounded-full mb-1 ${cfg.dot}`} />}
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center mb-1">{status.replace(/_/g, ' ')}</p>
                                            <p className="text-sm font-extrabold text-slate-900 leading-none">{count}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Settlement */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
                            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">
                                <span className="w-4 h-4 bg-emerald-50 rounded flex items-center justify-center"><CreditCard size={10} className="text-emerald-500" /></span>
                                Settlement
                            </h3>
                            <div className="flex gap-2 h-[calc(100%-2.5rem)]">
                                <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase mb-1">Settled</p>
                                        <p className="text-2xl font-extrabold text-emerald-700 leading-none">{stats?.ordersByPaymentStatus?.paid || 0}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>
                                </div>
                                <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-bold text-amber-600 uppercase mb-1">Pending</p>
                                        <p className="text-2xl font-extrabold text-amber-700 leading-none">{stats?.ordersByPaymentStatus?.pending || 0}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                        <AlertCircle size={16} className="text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── FILTER TOOLBAR ──────────────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                        <div className="flex flex-col md:flex-row gap-2">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search order ID, customer name…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all font-medium placeholder:text-slate-400"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Delivery type tabs */}
                            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 gap-0.5">
                                {[
                                    { id: "", label: "All", icon: ShoppingBag },
                                    { id: "platform_managed", label: "Managed", icon: Shield },
                                    { id: "vendor_managed", label: "Vendor", icon: Store },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setFilters(f => ({ ...f, deliveryType: tab.id })); setPagination(p => ({ ...p, page: 1 })); }}
                                        className={`h-7 px-3 rounded-md flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all ${filters.deliveryType === tab.id
                                            ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-sm shadow-orange-200"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-white"
                                        }`}
                                    >
                                        <tab.icon size={11} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Status filter */}
                            <div className="relative min-w-[140px]">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-tight outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 appearance-none cursor-pointer"
                                >
                                    <option value="">Status: All</option>
                                    {Object.entries(statusConfig).map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Payment status filter */}
                            <div className="relative min-w-[140px]">
                                <select
                                    value={filters.paymentStatus}
                                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                                    className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-tight outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 appearance-none cursor-pointer"
                                >
                                    <option value="">Payment: All</option>
                                    <option value="paid">Settled (Paid)</option>
                                    <option value="pending">Awaiting</option>
                                    <option value="failed">Failed</option>
                                </select>
                                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Date range */}
                            <div className="flex items-center gap-1">
                                <div className="relative">
                                    <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="h-9 pl-7 pr-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-orange-400 uppercase"
                                    />
                                </div>
                                <span className="text-slate-300 font-bold text-xs">—</span>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className="h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-orange-400 uppercase"
                                />
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearFilters}
                                    className="h-9 px-3.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                                >
                                    <X size={13} /> Clear Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── DISPATCH QUEUE ──────────────────────────────────── */}
                    <AnimatePresence>
                        {ordersNeedingRider.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                            <h2 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Dispatch Assignment Required</h2>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
                                            {ordersNeedingRider.length} Orders
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {ordersNeedingRider.map((order) => {
                                        const waitTime = Math.floor((Date.now() - new Date(order.updatedAt || order.createdAt)) / 60000);
                                        const isUrgent = waitTime >= 15;
                                        return (
                                            <div
                                                key={order._id}
                                                className={`min-w-[280px] bg-white border rounded-xl overflow-hidden shrink-0 ${isUrgent ? 'border-rose-200 shadow-md shadow-rose-100' : 'border-slate-200'}`}
                                            >
                                                {isUrgent && <div className="h-0.5 bg-gradient-to-r from-rose-500 to-orange-400" />}
                                                <div className="p-3.5">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-orange-500 uppercase leading-none mb-1">#{order.orderId}</p>
                                                            <p className="text-sm font-bold text-slate-900 leading-none">{order.userId?.firstname} {order.userId?.lastname}</p>
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${isUrgent ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            {waitTime}m idle
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 rounded bg-orange-50 border border-orange-100 flex items-center justify-center">
                                                            <Store size={12} className="text-orange-400" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-500 truncate">{order.items?.[0]?.restaurantId?.storeName || 'Partner Store'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const vendorOrderId = order.vendorOrders?.[0]?._id || order._id;
                                                            setRiderAssignModal({ show: true, orderData: { vendorOrderId, restaurantName: order.items?.[0]?.restaurantId?.storeName || 'Store', readyAt: order.updatedAt, url: `/admin/orders/${order.orderId}` } });
                                                        }}
                                                        className={`w-full py-2 rounded-lg font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${isUrgent
                                                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200 hover:shadow-rose-300'
                                                            : 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200 hover:shadow-orange-300'
                                                        }`}
                                                    >
                                                        <Bike size={14} /> Dispatch Rider
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── ORDERS GRID ─────────────────────────────────────── */}
                    <div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-52 bg-white border border-slate-200 rounded-xl animate-pulse">
                                        <div className="h-0.5 bg-gradient-to-r from-orange-200 to-amber-200 rounded-t-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {orders.map((order, idx) => {
                                    const statusKey = order.orderStatus || order.status;
                                    const status = statusConfig[statusKey] || { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: statusKey };
                                    const isPlatform = order.deliveryType === "platform_managed";
                                    return (
                                        <motion.div
                                            key={order._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03, duration: 0.25 }}
                                            className="bg-white border border-slate-200 rounded-xl overflow-hidden group hover:border-orange-300 hover:shadow-md hover:shadow-orange-50 transition-all"
                                        >
                                            {/* Brand accent strip */}
                                            <div className="h-0.5 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="p-3.5">
                                                {/* Row 1: ID + status + action */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-tighter">#{order.orderId}</span>
                                                            <StatusBadge status={statusKey} />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{order.userId?.firstname} {order.userId?.lastname}</h4>
                                                    </div>
                                                    <button
                                                        onClick={() => setActionMenu({ show: true, order })}
                                                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical size={15} />
                                                    </button>
                                                </div>

                                                {/* Row 2: Item preview */}
                                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                                                    <div className="w-11 h-11 rounded-lg bg-orange-50 border border-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {order.items?.[0]?.foodId?.image
                                                            ? <img src={order.items[0].foodId.image} className="w-full h-full object-cover" alt="" />
                                                            : <ShoppingBag size={18} className="text-orange-300" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase truncate leading-none mb-1">{order.items?.[0]?.foodId?.name || "Order"}</p>
                                                        <p className="text-sm font-extrabold text-slate-900">₦{order.total?.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                {/* Row 3: Items statement */}
                                                <div className="mb-3 px-2.5 py-2 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-lg border border-slate-100">
                                                    <p className="text-[9px] font-bold text-slate-500 leading-tight italic line-clamp-2">
                                                        {generateOrderItemsStatement(order, { includeCustomerName: true })}
                                                    </p>
                                                </div>

                                                {/* Row 4: Delivery type + CTA */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isPlatform ? (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md">
                                                                <Truck size={10} className="text-indigo-500" />
                                                                <span className="text-[9px] font-bold text-indigo-600 uppercase">Platform</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
                                                                <Store size={10} className="text-emerald-500" />
                                                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Vendor</span>
                                                            </div>
                                                        )}
                                                        {order.riderId && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded text-[9px] font-bold text-amber-700">
                                                                <Bike size={10} /> {order.riderId.firstname || "Rider"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600 uppercase group/btn"
                                                    >
                                                        Details <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-gradient-to-br from-slate-50 to-orange-50/20 border border-dashed border-orange-200 rounded-xl">
                                <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag size={28} className="text-orange-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">No records match your filters</p>
                                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
                                {hasActiveFilters && (
                                    <button onClick={handleClearFilters} className="mt-4 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors">
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── PAGINATION ──────────────────────────────────────── */}
                    {pagination.pages > 1 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {pagination.total} orders &middot; page {pagination.page} of {pagination.pages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={pagination.page <= 1 || loading}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors disabled:opacity-40"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <div className="px-3 h-8 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-400 rounded-lg text-xs font-bold text-white shadow-sm shadow-orange-200">
                                    {pagination.page} / {pagination.pages}
                                </div>
                                <button
                                    disabled={pagination.page >= pagination.pages || loading}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors disabled:opacity-40"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── CONFIRM / OVERRIDE MODAL ────────────────────────────── */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, show: false }))} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
                                <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Zap className="text-orange-500" size={22} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-900 uppercase mb-2 tracking-tight">{confirmModal.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium mb-6 leading-normal">{confirmModal.message}</p>
                                    {confirmModal.type === "prompt" && (
                                        <div className="space-y-3 mb-6 text-left">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 ml-0.5 block">Target Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={confirmModal.statusToOverride}
                                                        onChange={(e) => setConfirmModal(prev => ({ ...prev, statusToOverride: e.target.value }))}
                                                        className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold uppercase appearance-none focus:border-orange-400"
                                                    >
                                                        {Object.entries(statusConfig).map(([key, { label }]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 ml-0.5 block">Adjustment Reason</label>
                                                <textarea
                                                    autoFocus
                                                    value={confirmModal.inputValue}
                                                    onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                    placeholder={confirmModal.placeholder}
                                                    className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-semibold resize-none focus:border-orange-400"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button disabled={confirmModal.isLoading} onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-lg font-bold text-xs uppercase text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                                        <button disabled={confirmModal.isLoading} onClick={() => confirmModal.onConfirm(confirmModal.inputValue)} className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-lg font-bold text-xs uppercase hover:from-orange-600 hover:to-amber-500 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-200">
                                            {confirmModal.isLoading && <Loader2 size={13} className="animate-spin" />} {confirmModal.confirmText}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── ACTION MENU MODAL ───────────────────────────────────── */}
                <AnimatePresence>
                    {actionMenu.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionMenu({ show: false, order: null })} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
                                <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900">Order Action Hub</h3>
                                        <p className="text-[10px] font-bold text-orange-500 uppercase mt-0.5 tracking-widest">#{actionMenu.order?.orderId}</p>
                                    </div>
                                    <button onClick={() => setActionMenu({ show: false, order: null })} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                        <X size={17} />
                                    </button>
                                </div>
                                <div className="p-3 grid grid-cols-1 gap-1">
                                    <button onClick={() => { router.push(`/admin/orders/${actionMenu.order.orderId}`); setActionMenu({ show: false, order: null }); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-all group border border-transparent hover:border-orange-100">
                                        <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 text-orange-400 flex items-center justify-center group-hover:bg-orange-100">
                                            <Eye size={16} />
                                        </div>
                                        <span className="text-sm font-semibold">View Case File</span>
                                    </button>
                                    <button onClick={() => { handleOverrideStatus(actionMenu.order); setActionMenu({ show: false, order: null }); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-all group border border-transparent hover:border-amber-100">
                                        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-400 flex items-center justify-center group-hover:bg-amber-100">
                                            <Settings size={16} />
                                        </div>
                                        <span className="text-sm font-semibold">Override Status</span>
                                    </button>
                                    {actionMenu.order?.deliveryType === 'platform_managed' && !actionMenu.order?.riderId && (
                                        <button
                                            onClick={() => {
                                                const vendorOrderId = actionMenu.order?.vendorOrders?.[0]?._id || actionMenu.order?._id;
                                                setRiderAssignModal({ show: true, orderData: { vendorOrderId, restaurantName: actionMenu.order?.items?.[0]?.restaurantId?.storeName || 'Store', readyAt: actionMenu.order?.updatedAt, url: `/admin/orders/${actionMenu.order?.orderId}` } });
                                                setActionMenu({ show: false, order: null });
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 hover:border-indigo-200 transition-all group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Bike size={16} />
                                            </div>
                                            <span className="text-sm font-bold uppercase tracking-wider">Assign Dispatch</span>
                                        </button>
                                    )}
                                </div>
                                <div className="h-3" />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AdminRiderAssignmentModal
                    isOpen={riderAssignModal.show}
                    onClose={() => setRiderAssignModal({ show: false, orderData: null })}
                    orderData={riderAssignModal.orderData}
                    onAssigned={() => { fetchOrders(); fetchStats(); setRiderAssignModal({ show: false, orderData: null }); }}
                />
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
