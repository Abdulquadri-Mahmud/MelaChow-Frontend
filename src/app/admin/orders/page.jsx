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
    ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import AdminRiderAssignmentModal from '@/app/components/admin/AdminRiderAssignmentModal';

const statusConfig = {
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
    accepted: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Accepted" },
    preparing: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Preparing" },
    ready_for_pickup: { color: "bg-purple-50 text-purple-700 border-purple-200", label: "Ready" },
    rider_assigned: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Rider Assigned" },
    out_for_delivery: { color: "bg-cyan-50 text-cyan-700 border-cyan-200", label: "Out for Delivery" },
    delivered: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Delivered" },
    completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed" },
    cancelled: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled" },
    failed: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Failed" },
    refunded: { color: "bg-slate-50 text-slate-600 border-slate-200", label: "Refunded" },
};

const CompactStat = ({ icon: Icon, label, value, colorClass, loading }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${colorClass} bg-opacity-10 shrink-0`}>
            <Icon size={20} className={colorClass.split(' ')[1]} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            {loading ? (
                <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
                <p className="text-base font-bold text-slate-900 leading-none">{value}</p>
            )}
        </div>
    </div>
);

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

    const [actionMenu, setActionMenu] = useState({
        show: false,
        order: null
    });

    const [riderAssignModal, setRiderAssignModal] = useState({
        show: false,
        orderData: null
    });

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "confirm", // 'confirm', 'prompt'
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
        inputValue: "",
        placeholder: "",
        isLoading: false,
        statusToOverride: ""
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
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
                response = await adminApi.getAllOrders({
                    ...baseParams,
                    deliveryType: filters.deliveryType
                });
            }

            const data = response.data;
            setOrders(data?.orders || []);
            setPagination(prev => ({
                ...prev,
                total: data?.pagination?.total || 0,
                pages: data?.pagination?.totalPages || 1
            }));
        } catch (error) {
            console.error(error);
            toast.error("Failed to sync orders");
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedSearch, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const handleRiderAssignmentEvent = (e) => {
            const data = e.detail;
            if (!data) return;
            setRiderAssignModal({
                show: true,
                orderData: {
                    vendorOrderId: data.vendorOrderId,
                    restaurantName: data.restaurantName,
                    readyAt: data.readyAt,
                    url: data.url
                }
            });
        };

        window.addEventListener('admin:open_rider_assignment', handleRiderAssignmentEvent);
        return () => window.removeEventListener('admin:open_rider_assignment', handleRiderAssignmentEvent);
    }, []);

    const handleClearFilters = () => {
        setSearch("");
        setFilters({
            status: "",
            paymentStatus: "",
            deliveryType: "",
            startDate: "",
            endDate: ""
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRefresh = async () => {
        const refreshToast = toast.loading("Syncing latest data...");
        try {
            await Promise.all([fetchOrders(), fetchStats()]);
            toast.success("Orders synchronized", { id: refreshToast });
        } catch (error) {
            toast.error("Sync failed", { id: refreshToast });
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
                if (!reason?.trim()) {
                    toast.error("Reason is required");
                    return;
                }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.adminOverrideOrderStatus(order._id, confirmModal.statusToOverride, reason);
                    toast.success("Order updated");
                    fetchOrders();
                    fetchStats();
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

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                Order Dashboard
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 italic tracking-widest uppercase">{pagination.total} Records</span>
                            </h1>
                            <div className="h-0.5 w-6 bg-orange-500 rounded-full mt-1" />
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Real-time platform activity and transaction management.</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={loading || statsLoading}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            <RotateCcw size={15} className={(loading || statsLoading) ? "animate-spin" : ""} />
                            {loading || statsLoading ? "Syncing..." : "Update Dashboard"}
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <CompactStat icon={ShoppingBag} label="Volume" value={stats?.totalOrders || 0} loading={statsLoading} colorClass="bg-blue-100 text-blue-600" />
                        <CompactStat icon={DollarSign} label="Gross Value" value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`} loading={statsLoading} colorClass="bg-emerald-100 text-emerald-600" />
                        <CompactStat icon={Percent} label="Platform Slice" value={`₦${(stats?.totalCommission || 0).toLocaleString()}`} loading={statsLoading} colorClass="bg-orange-100 text-orange-600" />
                        <CompactStat icon={Truck} label="Logistics Revenue" value={`₦${(stats?.platformDeliveryRevenue || 0).toLocaleString()}`} loading={statsLoading} colorClass="bg-indigo-100 text-indigo-600" />
                    </div>

                    {/* Operational Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-3">
                            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={12} className="text-orange-500" /> Operational Funnel
                            </h3>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
                                    <div key={status} className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col items-center">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{status.replace('_', ' ')}</p>
                                        <p className="text-sm font-bold text-slate-900 leading-none">{count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-3">
                            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                                <CreditCard size={12} className="text-emerald-500" /> Settlement
                            </h3>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-emerald-50 border border-emerald-100 p-2 rounded flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase mb-0.5">Paid</p>
                                        <p className="text-lg font-bold text-emerald-700 leading-none">{stats?.ordersByPaymentStatus?.paid || 0}</p>
                                    </div>
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 bg-amber-50 border border-amber-100 p-2 rounded flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-bold text-amber-600 uppercase mb-0.5">Unsettled</p>
                                        <p className="text-lg font-bold text-amber-700 leading-none">{stats?.ordersByPaymentStatus?.pending || 0}</p>
                                    </div>
                                    <AlertCircle size={16} className="text-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Context Toolbar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search order ID, Customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                                />
                            </div>
                            <div className="flex bg-white border border-slate-200 p-1 rounded-md shrink-0">
                                {[
                                    { id: "", label: "All Logistics", icon: ShoppingBag },
                                    { id: "platform_managed", label: "Managed", icon: Shield },
                                    { id: "vendor_managed", label: "Self-Fulfilling", icon: Store },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setFilters(f => ({ ...f, deliveryType: tab.id }));
                                            setPagination(p => ({ ...p, page: 1 }));
                                        }}
                                        className={`h-7 px-3 rounded-sm flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${filters.deliveryType === tab.id
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-500 hover:bg-slate-50"
                                            }`}
                                    >
                                        <tab.icon size={12} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="relative min-w-[140px]">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-md text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-slate-900 appearance-none cursor-pointer"
                                >
                                    <option value="">Status: All</option>
                                    {Object.entries(statusConfig).map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative min-w-[140px]">
                                <select
                                    value={filters.paymentStatus}
                                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-md text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-slate-900 appearance-none cursor-pointer"
                                >
                                    <option value="">Payment: All</option>
                                    <option value="paid">Settled (Paid)</option>
                                    <option value="pending">Awaiting (Pending)</option>
                                    <option value="failed">Failed Transaction</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="flex gap-1">
                                <div className="relative min-w-[130px]">
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="w-full h-9 pl-3 pr-3 bg-white border border-slate-200 rounded-md text-[10px] font-bold outline-none uppercase"
                                    />
                                </div>
                                <div className="w-4 h-9 flex items-center justify-center text-slate-300 font-bold">−</div>
                                <div className="relative min-w-[130px]">
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="w-full h-9 pl-3 pr-3 bg-white border border-slate-200 rounded-md text-[10px] font-bold outline-none uppercase"
                                    />
                                </div>
                            </div>

                            {(search || filters.status || filters.paymentStatus || filters.deliveryType || filters.startDate || filters.endDate) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="h-9 px-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                                >
                                    <X size={14} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Dispatch Queue (Priority) */}
                    <AnimatePresence>
                        {ordersNeedingRider.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Dispatch Assignment Required</h2>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded">{ordersNeedingRider.length} Orders</span>
                                    </div>
                                    <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">View Logistics Map</button>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {ordersNeedingRider.map((order) => {
                                        const waitTime = Math.floor((Date.now() - new Date(order.updatedAt || order.createdAt)) / 60000);
                                        const isUrgent = waitTime >= 15;
                                        return (
                                            <div
                                                key={order._id}
                                                className={`min-w-[280px] bg-white border ${isUrgent ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'} rounded-lg overflow-hidden shrink-0`}
                                            >
                                                <div className="p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">#{order.orderId}</p>
                                                            <p className="text-xs font-bold text-slate-900 leading-none">{order.userId?.firstname} {order.userId?.lastname}</p>
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${isUrgent ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            {waitTime}m Idle
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                                                            <Store size={12} className="text-slate-400" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-500 truncate">{order.items?.[0]?.restaurantId?.storeName || 'Partner Store'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const vendorOrderId = order.vendorOrders?.[0]?._id || order._id;
                                                            setRiderAssignModal({
                                                                show: true,
                                                                orderData: {
                                                                    vendorOrderId,
                                                                    restaurantName: order.items?.[0]?.restaurantId?.storeName || 'Store',
                                                                    readyAt: order.updatedAt,
                                                                    url: `/admin/orders/${order.orderId}`
                                                                }
                                                            });
                                                        }}
                                                        className={`w-full py-2 rounded-md font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 ${isUrgent ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                                    >
                                                        <Bike size={14} /> Dispatch Rider
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Orders Grid */}
                    <div className="pt-2">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-48 bg-slate-100 border border-slate-200 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {orders.map((order) => {
                                    const status = statusConfig[order.orderStatus || order.status] || { color: "bg-slate-100 text-slate-600 border-slate-200", label: order.status };
                                    return (
                                        <div key={order._id} className="bg-white border border-slate-200 rounded-lg overflow-hidden group hover:border-slate-400 transition-colors">
                                            <div className="p-3">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">#{order.orderId}</span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide ${status.color}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{order.userId?.firstname} {order.userId?.lastname}</h4>
                                                    </div>
                                                    <button onClick={() => setActionMenu({ show: true, order })} className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                                                    <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {order.items?.[0]?.foodId?.image ? <img src={order.items[0].foodId.image} className="w-full h-full object-cover" alt="" /> : <ShoppingBag size={18} className="text-slate-300" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase truncate leading-none mb-1">{order.items?.[0]?.foodId?.name || "Order"}</p>
                                                        <p className="text-xs font-bold text-slate-900">₦{order.total?.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {order.deliveryType === "platform_managed" ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                                    <Truck size={10} />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Platform</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                                    <Store size={10} />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Vendor</span>
                                                            </div>
                                                        )}
                                                        {order.riderId && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-600">
                                                                <Bike size={10} /> {order.riderId.firstname || "Rider"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => router.push(`/admin/orders/${order.orderId}`)} className="text-[10px] font-bold text-slate-500 uppercase hover:text-slate-900 flex items-center gap-1 group/btn">
                                                        Details <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                                <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2 opacity-30" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">No records found matching your filters</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{pagination.total} Orders tracked</p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={pagination.page <= 1 || loading}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="px-3 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-xs font-bold text-slate-700">
                                    {pagination.page} / {pagination.pages}
                                </div>
                                <button
                                    disabled={pagination.page >= pagination.pages || loading}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals Refactored to Standard */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, show: false }))} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden border border-slate-200">
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100"><AlertCircle className="text-slate-400" size={24} /></div>
                                    <h3 className="text-base font-bold text-slate-900 uppercase mb-2 tracking-tight">{confirmModal.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium mb-6 leading-normal">{confirmModal.message}</p>
                                    {confirmModal.type === "prompt" && (
                                        <div className="space-y-3 mb-6">
                                            <div className="text-left">
                                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 ml-1">Target Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={confirmModal.statusToOverride}
                                                        onChange={(e) => setConfirmModal(prev => ({ ...prev, statusToOverride: e.target.value }))}
                                                        className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-md outline-none text-xs font-bold uppercase appearance-none"
                                                    >
                                                        {Object.entries(statusConfig).map(([key, { label }]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 ml-1">Adjustment Reason</label>
                                                <textarea
                                                    autoFocus
                                                    value={confirmModal.inputValue}
                                                    onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                    placeholder={confirmModal.placeholder}
                                                    className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-xs font-semibold resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button disabled={confirmModal.isLoading} onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} className="flex-1 py-2 bg-white border border-slate-200 rounded-md font-bold text-xs uppercase text-slate-600 hover:bg-slate-50">Cancel</button>
                                        <button disabled={confirmModal.isLoading} onClick={() => confirmModal.onConfirm(confirmModal.inputValue)} className="flex-1 py-2 bg-slate-900 text-white rounded-md font-bold text-xs uppercase hover:bg-slate-800 flex items-center justify-center gap-2">
                                            {confirmModal.isLoading && <Loader2 size={14} className="animate-spin" />} {confirmModal.confirmText}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {actionMenu.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionMenu({ show: false, order: null })} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Order Action Hub</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">{actionMenu.order?.orderId}</p>
                                    </div>
                                    <button onClick={() => setActionMenu({ show: false, order: null })} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"><X size={18} /></button>
                                </div>
                                <div className="p-2 grid grid-cols-1 gap-1">
                                    <button onClick={() => { router.push(`/admin/orders/${actionMenu.order.orderId}`); setActionMenu({ show: false, order: null }); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 transition-all group">
                                        <div className="w-8 h-8 rounded bg-slate-100 text-slate-400 flex items-center justify-center group-hover:text-slate-900"><Eye size={16} /></div>
                                        <span className="text-sm font-semibold">View Case File</span>
                                    </button>
                                    <button onClick={() => { handleOverrideStatus(actionMenu.order); setActionMenu({ show: false, order: null }); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 transition-all group">
                                        <div className="w-8 h-8 rounded bg-orange-50 text-orange-400 flex items-center justify-center group-hover:text-orange-600"><Settings size={16} /></div>
                                        <span className="text-sm font-semibold">Override Status</span>
                                    </button>
                                    {actionMenu.order?.deliveryType === 'platform_managed' && !actionMenu.order?.riderId && (
                                        <button 
                                            onClick={() => {
                                                const vendorOrderId = actionMenu.order?.vendorOrders?.[0]?._id || actionMenu.order?._id;
                                                setRiderAssignModal({
                                                    show: true,
                                                    orderData: {
                                                        vendorOrderId,
                                                        restaurantName: actionMenu.order?.items?.[0]?.restaurantId?.storeName || 'Store',
                                                        readyAt: actionMenu.order?.updatedAt,
                                                        url: `/admin/orders/${actionMenu.order?.orderId}`
                                                    }
                                                });
                                                setActionMenu({ show: false, order: null });
                                            }}
                                            className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all group border border-blue-100"
                                        >
                                            <div className="w-8 h-8 rounded bg-white text-blue-600 flex items-center justify-center"><Bike size={16} /></div>
                                            <span className="text-sm font-bold uppercase tracking-widest">Assign Dispatch</span>
                                        </button>
                                    )}
                                </div>
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
