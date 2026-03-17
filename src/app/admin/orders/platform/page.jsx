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
    ArrowRight
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">Platform Deliveries</h1>
                            <p className="text-gray-500 font-medium italic">Orders where GrubDash manages the rider logistics</p>
                        </div>
                        <div className="px-6 py-3 bg-blue-500 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100">
                            <Truck size={20} />
                            <span className="font-black text-xs uppercase tracking-widest">Active Fleet Support</span>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Address..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full h-14 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 outline-none font-semibold transition-all"
                            />
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="h-14 px-8 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all"
                        >
                            <option value="">Operational: All</option>
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
                                className="h-14 px-8 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-gray-100"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Table Container */}
                    <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Order ID</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Customer</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Delivery Address</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Rider</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Items</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Total</th>
                                        <th className="px-6 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="8" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32} /></td></tr>
                                    ) : orders.length > 0 ? (
                                        orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-orange-600 font-black">{order.orderId}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{order.userId?.firstname} {order.userId?.lastname}</div>
                                                </td>
                                                <td className="px-6 py-4 overflow-hidden max-w-[200px]">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 truncate">
                                                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                                                        {order.deliveryAddress?.addressLine}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.riderId ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><User size={16} /></div>
                                                            <div>
                                                                <p className="font-black text-gray-900 text-xs tracking-tight">{order.riderId.name}</p>
                                                                <p className="text-[10px] font-bold text-gray-400">{order.riderId.phone}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setRiderAssignModal({
                                                                show: true,
                                                                orderData: {
                                                                    vendorOrderId: order.vendorOrders?.[0]?._id || order._id,
                                                                    restaurantName: order.items?.[0]?.restaurantId?.storeName 
                                                                        || 'Restaurant',
                                                                    readyAt: order.updatedAt,
                                                                    url: `/admin/orders/${order.orderId}`
                                                                }
                                                            })}
                                                            className="inline-flex items-center gap-2 px-4 py-2 
                                                                bg-red-50 hover:bg-orange-500 text-red-600 
                                                                hover:text-white rounded-xl text-[10px] font-black 
                                                                uppercase tracking-widest transition-all border 
                                                                border-red-100 hover:border-orange-500 
                                                                hover:shadow-lg hover:shadow-orange-500/20 
                                                                active:scale-95 group"
                                                        >
                                                            <Truck size={12} className="group-hover:animate-bounce" />
                                                            Assign Rider
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig[order.status]?.color}`}>
                                                        {statusConfig[order.status]?.label || order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                        <ShoppingBag size={12} /> {order.items?.length}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-gray-900">₦{order.total?.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                                                        className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-white hover:text-blue-600 hover:shadow-lg transition-all border border-transparent hover:border-blue-100"
                                                    >
                                                        <Eye size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="8" className="p-20 text-center text-gray-400 font-medium">No platform-managed deliveries found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
