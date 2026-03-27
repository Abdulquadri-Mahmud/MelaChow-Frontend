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
    Plus,
    Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import AdminRiderAssignmentModal from '@/app/components/admin/AdminRiderAssignmentModal';

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

export default function PlatformDeliveriesPage() {
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [riderAssignModal, setRiderAssignModal] = useState({
        show: false,
        orderData: null
    });
    
    // Default to 'ready_for_pickup' as requested
    const [filters, setFilters] = useState({
        status: "ready_for_pickup",
        search: ""
    });
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
            toast.success("Logistics synchronized", { id: 'logistics-sync' });
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPlatformOrders();
    }, [fetchPlatformOrders]);

    // Handle global rider assignment events
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

    const actionableCount = orders.filter(o => o.status === 'ready_for_pickup').length;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-4">
                    {/* Mission Control Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white border border-slate-700">
                                    <Truck size={16} strokeWidth={2.5} />
                                </div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">Logistics Hub</h1>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Monitoring platform-managed fleet across active operational zones.</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {actionableCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">{actionableCount} Action Required</span>
                                </div>
                            )}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="h-9 w-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-all"
                            >
                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Operational Filters */}
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="flex-1 relative w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Restaurant, or Customer..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer min-w-[180px]"
                            >
                                <option value="">Filter: All Orders</option>
                                <option value="ready_for_pickup">Ready for Dispatch</option>
                                <option value="accepted">Accepted (New)</option>
                                <option value="preparing">In Kitchen</option>
                                <option value="rider_assigned">Assigned to Rider</option>
                                <option value="out_for_delivery">In Transit</option>
                                <option value="delivered">Completed</option>
                            </select>
                            {(filters.search || filters.status) && (
                                <button
                                    onClick={() => setFilters({ search: "", status: "" })}
                                    className="h-10 px-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors border border-slate-200"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Logistics Grid */}
                    <div className="min-h-[400px]">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse h-[260px]" />
                                ))}
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <AnimatePresence mode="popLayout">
                                    {orders.map((order) => {
                                        const isActionable = order.status === 'ready_for_pickup' && !order.riderId;
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={order._id}
                                                className={`group bg-white rounded-xl border transition-all flex flex-col h-full relative overflow-hidden ${isActionable ? 'border-rose-200 ring-4 ring-rose-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                {/* Urgency Overlay */}
                                                {isActionable && (
                                                    <div className="bg-rose-500 text-white p-2.5 flex items-center justify-between gap-2 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                                                                <AlertCircle size={12} strokeWidth={3} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.05em] italic">Needs a rider immediately</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold opacity-80">{formatTimeAgo(order.updatedAt)}</span>
                                                    </div>
                                                )}

                                                <div className="p-4 flex-1 space-y-4">
                                                    {/* Header Section */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50">
                                                                <img 
                                                                    src={order.vendorOrders?.[0]?.restaurantId?.logo || "https://ui-avatars.com/api/?name=" + (order.vendorOrders?.[0]?.restaurantId?.storeName || "R") + "&background=f1f5f9&color=64748b"} 
                                                                    alt="" 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold text-slate-400 tracking-tighter leading-none mb-1">#{order.orderId}</p>
                                                                <h2 className="font-bold text-slate-900 truncate text-[15px] leading-tight">
                                                                    {order.vendorOrders?.[0]?.restaurantId?.storeName || 'External Vendor'}
                                                                </h2>
                                                            </div>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded text-[9px] font-black border uppercase tracking-tighter ${statusConfig[order.status]?.color || 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                            {statusConfig[order.status]?.label || order.status}
                                                        </div>
                                                    </div>

                                                    {/* Stakeholders Section */}
                                                    <div className="space-y-3">
                                                        {/* Customer */}
                                                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                                            <div className="flex items-center gap-2.5 mb-2">
                                                                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                                                    <User size={12} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-slate-800 text-xs truncate leading-none mb-0.5">{order.userId?.firstname} {order.userId?.lastname}</p>
                                                                    <p className="text-[10px] text-slate-500 font-medium">{order.phone}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60">
                                                                <MapPin size={10} className="text-slate-400 mt-0.5" />
                                                                <p className="text-[10px] text-slate-600 font-medium leading-relaxed line-clamp-2">
                                                                    {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.cityName}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Rider Assignment Info */}
                                                        <div className="flex flex-col gap-2">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Fleet Logistics</p>
                                                            {order.riderId ? (
                                                                <div className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded-lg">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white shadow-slate-200">
                                                                            <Bike size={14} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-900 text-xs leading-none mb-0.5">{order.riderId.name}</p>
                                                                            <p className="text-[9px] text-slate-500 font-bold">{order.riderId.phone}</p>
                                                                        </div>
                                                                    </div>
                                                                    <a href={`tel:${order.riderId.phone}`} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors group">
                                                                        <Phone size={14} className="group-hover:scale-110 transition-transform" />
                                                                    </a>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setRiderAssignModal({
                                                                        show: true,
                                                                        orderData: {
                                                                            vendorOrderId: order.vendorOrders?.[0]?._id || order._id,
                                                                            restaurantName: order.vendorOrders?.[0]?.restaurantId?.storeName || 'Vendor',
                                                                            readyAt: order.updatedAt,
                                                                            url: `/admin/orders/${order.orderId}`
                                                                        }
                                                                    })}
                                                                    className={`w-full h-10 rounded-lg text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${isActionable ? 'bg-rose-600 border-rose-700 text-white hover:bg-rose-700 hover:shadow-rose-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                                                >
                                                                    <Bike size={14} className={isActionable ? "animate-bounce" : "text-slate-400"} />
                                                                    {isActionable ? "🚨 Dispatch Rider Now" : "Assign Logistics Partner"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Stats Row */}
                                                <div className={`px-4 py-3 border-t flex items-center justify-between ${isActionable ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Revenue</span>
                                                        <span className="text-base font-black text-slate-900 leading-none mt-0.5">₦{order.total?.toLocaleString()}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                                                        className="px-3 h-8 bg-white text-slate-700 border border-slate-200 rounded text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-1.5 group/btn"
                                                    >
                                                        Details <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-dotted border-slate-300 py-20 px-6 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 mb-6 border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                    <Inbox size={40} strokeWidth={1} />
                                </div>
                                <div className="max-w-xs mx-auto">
                                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Operations Clear</h3>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed">No orders at this state require manual logistics intervention right now.</p>
                                    <button
                                        onClick={() => setFilters({ search: "", status: "" })}
                                        className="mt-6 text-[10px] font-black uppercase text-blue-600 hover:underline tracking-[0.1em]"
                                    >
                                        View All Master Records
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

// Helper for formatting time
function formatTimeAgo(dateString) {
    if (!dateString) return "Active";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

