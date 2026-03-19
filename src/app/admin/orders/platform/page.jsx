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
    Plus
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
    const [filters, setFilters] = useState({
        status: "",
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
            toast.success("Deliveries synchronized", { id: 'refresh' });
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPlatformOrders();
    }, [fetchPlatformOrders]);

    // Handle global rider assignment events (e.g. from toast clicks)
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

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tighter">
                                Platform <span className="text-orange-600 italic">Logistics</span>
                            </h1>
                            <p className="text-gray-500 font-medium max-w-xl">
                                Real-time command center for GrubDash-managed deliveries. Monitor, dispatch, and support your active fleet.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-14 h-14 bg-white border border-gray-200 rounded-3xl flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-200 transition-all active:scale-90 disabled:opacity-50"
                                title="Refresh data"
                            >
                                <RefreshCw size={24} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                            <div className="px-8 py-4 bg-orange-600 text-white rounded-[32px] flex items-center gap-3 border-b-4 border-orange-800 active:translate-y-1 transition-all">
                                <Truck size={24} strokeWidth={2.5} />
                                <span className="font-black text-xs uppercase tracking-[0.2em]">Active Logistics</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[32px] border border-gray-100">
                        <div className="flex-1 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full h-16 pl-16 pr-6 bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300"
                            />
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="h-16 px-8 bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 rounded-2xl outline-none font-black text-[11px] uppercase tracking-widest cursor-pointer transition-all text-gray-600"
                        >
                            <option value="">Operational Status: All</option>
                            <option value="accepted">Accepted</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="rider_assigned">Rider Assigned</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                        </select>
                        {(filters.search || filters.status) && (
                            <button
                                onClick={() => setFilters({ search: "", status: "" })}
                                className="h-16 px-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border border-rose-100 flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Orders Grid */}
                    <div className="min-h-[400px]">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-[40px] p-3 border border-gray-100 animate-pulse h-[360px]" />
                                ))}
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <AnimatePresence mode="popLayout">
                                    {orders.map((order) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={order._id}
                                            className="bg-white rounded-[32px] border border-gray-200 overflow-hidden transition-all group flex flex-col h-full relative"
                                        >
                                            {/* Status Badges Overlay */}
                                            <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
                                                <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                                                    {statusConfig[order.status]?.label || order.status}
                                                </span>
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </div>

                                            <div className="p-3 flex-1 space-y-3 text-left">
                                                {/* Restaurant Header */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                        {order.vendorOrders?.[0]?.restaurantId?.logo ? (
                                                            <img 
                                                                src={order.vendorOrders[0].restaurantId.logo} 
                                                                alt="Logo" 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + (order.vendorOrders[0].restaurantId.storeName || "R"); }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <ShoppingBag size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] tracking-widest uppercase mb-1">
                                                            #{order.orderId}
                                                        </div>
                                                        <h2 className="font-black text-gray-900 truncate text-lg leading-tight uppercase italic">
                                                            {order.vendorOrders?.[0]?.restaurantId?.storeName || 'External Vendor'}
                                                        </h2>
                                                    </div>
                                                </div>

                                                {/* Customer Section */}
                                                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200/50">
                                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100">
                                                            <User size={24} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-black text-gray-900 truncate leading-none mb-1.5">
                                                                {order.userId?.firstname} {order.userId?.lastname}
                                                            </h3>
                                                            <a href={`tel:${order.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors">
                                                                <Phone size={12} className="stroke-[3]" />
                                                                {order.phone}
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Delivery Address */}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-orange-100">
                                                            <MapPin size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                                                                {order.deliveryAddress?.addressLine}
                                                            </p>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                                {order.deliveryAddress?.cityName || order.deliveryAddress?.city}, {order.deliveryAddress?.stateName || order.deliveryAddress?.state}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rider Profile / Assignment */}
                                                <div className="pt-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 ml-1">Logistics Partner</p>
                                                    {order.riderId ? (
                                                        <div className="flex items-center justify-between bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100/50 transition-all hover:bg-indigo-50/50">
                                                            <div className="flex items-center gap-4 text-left">
                                                                <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm shadow-indigo-100/50">
                                                                    <Truck size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-gray-900 text-sm leading-none mb-1.5">{order.riderId.name}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.riderId.phone}</p>
                                                                </div>
                                                            </div>
                                                            <a href={`tel:${order.riderId.phone}`} className="w-10 h-10 bg-white border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all">
                                                                <Phone size={18} />
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
                                                            className="w-full h-16 bg-rose-50 hover:bg-orange-600 text-rose-600 hover:text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-rose-100 hover:border-orange-600 flex items-center justify-center gap-3 animate-pulse hover:animate-none"
                                                        >
                                                            <Plus size={18} className="stroke-[3]" />
                                                            Dispatch Rider
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                                <div className="flex flex-col text-left">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                                                    <span className="text-xl font-black text-gray-900 tracking-tighter">₦{order.total?.toLocaleString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                                                    className="px-6 h-12 bg-white text-gray-900 border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all flex items-center gap-2"
                                                >
                                                    Explore <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[40px] border border-gray-100 p-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <Truck size={40} />
                                </div>
                                <div className="max-w-xs mx-auto">
                                    <h3 className="text-xl font-black text-gray-900">Quiet Fleet</h3>
                                    <p className="text-gray-500 font-medium">No platform-managed deliveries are currently active on the radar.</p>
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
