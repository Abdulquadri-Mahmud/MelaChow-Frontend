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
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const statusConfig = {
    pending: { color: "bg-yellow-50 text-yellow-600", label: "Pending" },
    accepted: { color: "bg-blue-50 text-blue-600", label: "Accepted" },
    preparing: { color: "bg-orange-50 text-orange-600", label: "Preparing" },
    ready_for_pickup: { color: "bg-purple-50 text-purple-600", label: "Ready" },
    rider_assigned: { color: "bg-indigo-50 text-indigo-600", label: "Rider Assigned" },
    out_for_delivery: { color: "bg-cyan-50 text-cyan-600", label: "Out for Delivery" },
    delivered: { color: "bg-teal-50 text-teal-600", label: "Delivered" },
    completed: { color: "bg-green-50 text-green-600", label: "Completed" },
    cancelled: { color: "bg-red-50 text-red-600", label: "Cancelled" },
    failed: { color: "bg-rose-50 text-rose-600", label: "Failed" },
    refunded: { color: "bg-slate-50 text-slate-600", label: "Refunded" },
};

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {label}
                </p>
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                ) : (
                    <h3 className="text-3xl font-black text-gray-900">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" strokeWidth={2.5} />
            </div>
        </div>
    </motion.div>
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

    // Debounce search
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
                // Specialized Logistics Endpoint (returns rider & sub-order status)
                response = await adminApi.getPlatformManagedOrders(baseParams);
            } else {
                // General List Endpoint
                response = await adminApi.getAllOrders({
                    ...baseParams,
                    deliveryType: filters.deliveryType // "" (All) or "vendor_managed"
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

    const handleOverrideStatus = (order) => {
        setConfirmModal({
            show: true,
            title: "Override Order Status",
            message: "Reason for status override is required.",
            type: "prompt",
            confirmText: "Update Status",
            placeholder: "Enter reason for override...",
            inputValue: "",
            statusToOverride: order.orderStatus,
            onConfirm: async (reason) => {
                if (!reason?.trim()) {
                    toast.error("Please provide a reason");
                    return;
                }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.adminOverrideOrderStatus(order._id, confirmModal.statusToOverride, reason);
                    toast.success("Order status updated");
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

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Order Management</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Monitor and manage platform transactions</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={ShoppingBag}
                            label="Total Orders"
                            value={stats?.totalOrders || 0}
                            loading={statsLoading}
                            color="bg-orange-500"
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Total Revenue"
                            value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
                            loading={statsLoading}
                            color="bg-emerald-500"
                        />
                        <StatCard
                            icon={Percent}
                            label="Commission"
                            value={`₦${(stats?.totalCommission || 0).toLocaleString()}`}
                            loading={statsLoading}
                            color="bg-purple-500"
                        />
                        <StatCard
                            icon={Truck}
                            label="Platform Fee Revenue"
                            value={`₦${(stats?.platformDeliveryRevenue || 0).toLocaleString()}`}
                            loading={statsLoading}
                            color="bg-blue-500"
                        />
                    </div>

                    {/* Operational & Payment Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100">
                            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Clock size={14} className="text-orange-500" /> Operational Status
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                                {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
                                    <div key={status} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50 flex flex-col items-center">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{status.replace('_', ' ')}</p>
                                        <h4 className="text-xl font-black text-gray-900">{count}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-gray-100">
                            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                                <CreditCard size={14} className="text-emerald-500" /> Payment Summary
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
                                        <h4 className="text-2xl font-black text-emerald-700">{stats?.ordersByPaymentStatus?.paid || 0}</h4>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                                <div className="flex-1 bg-amber-50/50 p-5 rounded-3xl border border-amber-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending</p>
                                        <h4 className="text-2xl font-black text-amber-700">{stats?.ordersByPaymentStatus?.pending || 0}</h4>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500">
                                        <AlertCircle size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Management Tabs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[32px] border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none pt-0.5">Manage Delivery By</h3>
                            </div>
                        </div>

                        <div className="flex p-1.5 bg-slate-50 rounded-[20px] border border-slate-100 w-fit">
                            {[
                                { id: "", label: "All Logistics", icon: ShoppingBag },
                                { id: "platform_managed", label: "Platform Managed", icon: Shield },
                                { id: "vendor_managed", label: "Vendor Managed", icon: Store },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setFilters(f => ({ ...f, deliveryType: tab.id }));
                                        setPagination(p => ({ ...p, page: 1 }));
                                    }}
                                    className={`h-11 px-6 rounded-2xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${filters.deliveryType === tab.id
                                        ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-100"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                        }`}
                                >
                                    <tab.icon size={14} className={filters.deliveryType === tab.id ? "text-orange-500" : "text-slate-400"} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            <div className="relative xl:col-span-2">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-14 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold transition-all"
                                />
                            </div>

                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="h-14 px-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold cursor-pointer transition-all"
                            >
                                <option value="">All Statuses</option>
                                {Object.entries(statusConfig).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>

                            <select
                                value={filters.paymentStatus}
                                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                                className="h-14 px-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold cursor-pointer transition-all"
                            >
                                <option value="">All Payments</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>


                            <div className="flex gap-2 xl:col-span-2">
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="w-full h-14 pl-11 pr-4 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold transition-all text-xs"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="w-full h-14 pl-11 pr-4 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold transition-all text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {(search || filters.status || filters.paymentStatus || filters.deliveryType || filters.startDate || filters.endDate) && (
                            <button
                                onClick={handleClearFilters}
                                className="h-14 px-8 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-gray-100 flex items-center gap-2"
                            >
                                <X size={14} /> Clear All Filters
                            </button>
                        )}
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Order ID</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Customer</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Items</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Total</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Logistics / Rider</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Payment</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Date</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="9" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32} /></td></tr>
                                    ) : orders.length > 0 ? (
                                        orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-orange-600 font-black tracking-tighter">{order.orderId}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{order.userId?.firstname} {order.userId?.lastname}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">{order.userId?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 animate-pulse-slow">
                                                            {order.items?.[0]?.variant?.image || order.items?.[0]?.foodId?.image ? (
                                                                <img
                                                                    src={order.items[0].variant?.image || order.items[0].foodId?.image}
                                                                    className="w-full h-full object-cover shadow-sm transition-transform hover:scale-110"
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                    <ShoppingBag size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-gray-900 truncate max-w-[160px] leading-tight">
                                                                {order.items?.[0]?.foodId?.name || "Multiple Items"}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tight mt-1">
                                                                {order.items?.length > 1 ? `+${order.items.length - 1} other items` : order.items?.[0]?.restaurantId?.storeName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black">₦{order.total?.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    {order.deliveryType === "platform_managed" ? (
                                                        <div className="space-y-2">
                                                            {order.riderId ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                                                                        <Bike size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] font-black text-gray-900 truncate tracking-tight">{order.riderId.firstname || order.riderId.name}</p>
                                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">{order.riderId.vehicleType || "Rider"}</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-red-100 shadow-sm w-fit">
                                                                    🚨 Unassigned
                                                                </div>
                                                            )}

                                                            {/* Vendor Sub-Statuses for Logistics View */}
                                                            {filters.deliveryType === "platform_managed" && order.vendorOrders?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {order.vendorOrders.map((vo, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            title={`${vo.restaurantId?.storeName}: ${vo.status}`}
                                                                            className={`w-2 h-2 rounded-full border border-white shadow-sm ${vo.status === 'ready_for_pickup' ? 'bg-emerald-500' :
                                                                                    vo.status === 'preparing' ? 'bg-orange-400' : 'bg-slate-300'
                                                                                }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                                            <Store size={10} /> Vendor Fulfilled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.paymentStatus === "paid" ? "bg-green-50 text-green-600" :
                                                        order.paymentStatus === "failed" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"
                                                        }`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusConfig[order.orderStatus || order.status]?.color}`}>
                                                        {statusConfig[order.orderStatus || order.status]?.label || order.orderStatus || order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                                                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-orange-500 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setActionMenu({ show: true, order })}
                                                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="9" className="p-20 text-center text-gray-400 font-medium">No orders found matching your criteria.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Area */}
                        <div className="p-6 border-t border-gray-50 flex items-center justify-between flex-wrap gap-4">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                {pagination.total} orders found
                            </span>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-500 uppercase">Page {pagination.page} of {pagination.pages}</span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={pagination.page <= 1 || loading}
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-50"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        disabled={pagination.page >= pagination.pages || loading}
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-50"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirm/Prompt Modal */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, show: false }))}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden"
                            >
                                <div className="p-10 text-center">
                                    <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                        <AlertCircle className="text-orange-500" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 tracking-tight">{confirmModal.title}</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed mb-8">{confirmModal.message}</p>

                                    {confirmModal.type === "prompt" && (
                                        <div className="space-y-4 mb-8">
                                            <div className="text-left">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">New Status</label>
                                                <select
                                                    value={confirmModal.statusToOverride}
                                                    onChange={(e) => setConfirmModal(prev => ({ ...prev, statusToOverride: e.target.value }))}
                                                    className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold appearance-none"
                                                >
                                                    {Object.entries(statusConfig).map(([key, { label }]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="text-left">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Reason for Override</label>
                                                <textarea
                                                    autoFocus
                                                    value={confirmModal.inputValue}
                                                    onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                    placeholder={confirmModal.placeholder}
                                                    className="w-full min-h-[120px] p-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-3xl outline-none font-semibold transition-all resize-none text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="h-16 rounded-3xl bg-gray-100 text-gray-500 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {confirmModal.cancelText || "Cancel"}
                                        </button>
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="h-16 rounded-3xl bg-orange-600 text-white font-black text-sm uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {confirmModal.isLoading && <Loader2 size={16} className="animate-spin" />}
                                            {confirmModal.confirmText || "Confirm"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Action Menu Modal */}
                <AnimatePresence>
                    {actionMenu.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActionMenu({ show: false, order: null })}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase">Order Options</h3>
                                        <p className="text-xs font-bold text-gray-400">{actionMenu.order?.orderId}</p>
                                    </div>
                                    <button
                                        onClick={() => setActionMenu({ show: false, order: null })}
                                        className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => {
                                            router.push(`/admin/orders/${actionMenu.order.orderId}`);
                                            setActionMenu({ show: false, order: null });
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-all text-gray-400 group-hover:text-emerald-500">
                                            <Eye size={20} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">View Full Details</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleOverrideStatus(actionMenu.order);
                                            setActionMenu({ show: false, order: null });
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-50 text-gray-600 hover:text-orange-600 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-all text-gray-400 group-hover:text-orange-500">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">Override Status</span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
