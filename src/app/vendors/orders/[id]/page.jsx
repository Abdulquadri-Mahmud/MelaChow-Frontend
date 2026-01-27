"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    MapPin,
    Phone,
    User,
    ShoppingBag,
    CreditCard,
    Truck,
    AlertOctagon,
    Clock,
    CheckCircle2,
    Receipt,
    AlertCircle,
    Check,
    X,
    Package
} from "lucide-react";
import { getVendorOrderById, updateOrderStatus } from "@/app/lib/vendorApi";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

export default function VendorOrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const { vendorDetails } = useVendorStorage();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (!id) return;
                setIsLoading(true);
                const res = await getVendorOrderById(id);
                const data = res.data || res;
                setOrder(data);
            } catch (err) {
                console.error("Failed to fetch order details:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    // Handle status update
    const handleStatusUpdate = async (newStatus) => {
        try {
            setIsUpdating(true);
            await updateOrderStatus(order.userOrderId.orderId, newStatus);
            // Refresh order data
            const res = await getVendorOrderById(id);
            const data = res.data || res;
            setOrder(data);

            // Show success toast
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            console.error("Failed to update order status:", err);
            alert("Failed to update order status. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Get available next statuses based on current status
    const getAvailableStatuses = (currentStatus) => {
        const statusFlow = {
            'pending': ['accepted', 'cancelled'],
            'accepted': ['preparing', 'cancelled'],
            'preparing': ['ready_for_pickup', 'cancelled'],
            'ready_for_pickup': ['rider_assigned'],
            'rider_assigned': ['out_for_delivery'],
            'out_for_delivery': ['delivered'],
            'delivered': ['completed'],
            'completed': [],
            'cancelled': [],
            'failed': ['refunded'],
            'refunded': []
        };
        return statusFlow[currentStatus] || [];
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-[#0F172A] gap-4">
                <AlertOctagon size={64} className="text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Order Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400">This order doesn't exist or you don't have access to it.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-6 py-3 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                    Go Back to Orders
                </button>
            </div>
        );
    }

    const { userOrderId, restaurantId } = order;
    const user = userOrderId?.userId;
    const address = userOrderId?.deliveryAddress;

    // Format Date
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Filter items for this vendor
    const detailedItems = userOrderId?.items?.filter(item => item.restaurantId === restaurantId) || [];

    // Progress Steps logic
    const steps = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'out_for_delivery', 'delivered', 'completed'];
    const currentStatusIndex = steps.indexOf(order.orderStatus?.toLowerCase()) === -1 ? 0 : steps.indexOf(order.orderStatus?.toLowerCase());

    // Status Badge Logic
    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: Clock, label: "Pending Confirmation" };
            case 'accepted':
                return { color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", icon: CheckCircle2, label: "Order Accepted" };
            case 'preparing':
                return { color: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400", icon: ShoppingBag, label: "Preparing Order" };
            case 'ready_for_pickup':
                return { color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", icon: CheckCircle2, label: "Ready for Pickup" };
            case 'rider_assigned':
                return { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400", icon: User, label: "Rider Assigned" };
            case 'out_for_delivery':
                return { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400", icon: Truck, label: "Out for Delivery" };
            case 'delivered':
                return { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", icon: CheckCircle2, label: "Delivered" };
            case 'completed':
                return { color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400", icon: CheckCircle2, label: "Completed" };
            case 'cancelled':
                return { color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", icon: AlertCircle, label: "Cancelled" };
            case 'failed':
                return { color: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400", icon: AlertOctagon, label: "Failed" };
            case 'refunded':
                return { color: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400", icon: CreditCard, label: "Refunded" };
            default:
                return { color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: Clock, label: status || "Unknown" };
        }
    };

    const statusConfig = getStatusConfig(order.orderStatus);
    const StatusIcon = statusConfig.icon;
    const availableActions = getAvailableStatuses(order.orderStatus);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] font-sans">

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
                    >
                        <Check size={24} />
                        <div>
                            <p className="font-bold">Status Updated!</p>
                            <p className="text-sm opacity-90">Order status has been successfully updated.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Navigation Bar */}
            <div className="rounded-full sticky top-0 z-10 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-medium group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Back to Orders</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400 hidden sm:inline">Order ID:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                            {order.userOrderId?.orderId || `#${order._id.slice(-8).toUpperCase()}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

                {/* Header Section with Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800"
                >
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Order Details</h1>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusConfig.color}`}
                                >
                                    <StatusIcon size={18} />
                                    <span className="uppercase tracking-wide">{statusConfig.label}</span>
                                </motion.div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span className="text-sm">{dateStr} at {timeStr}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Package size={16} />
                                    <span className="text-sm font-medium">{detailedItems.length} Items</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {availableActions.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableActions.map((status) => {
                                        const statusLabels = {
                                            'accepted': { label: 'Accept Order', icon: Check },
                                            'preparing': { label: 'Start Preparing', icon: ShoppingBag },
                                            'ready_for_pickup': { label: 'Mark Ready', icon: CheckCircle2 },
                                            'rider_assigned': { label: 'Assign Rider', icon: User },
                                            'out_for_delivery': { label: 'Out for Delivery', icon: Truck },
                                            'delivered': { label: 'Mark Delivered', icon: CheckCircle2 },
                                            'completed': { label: 'Complete', icon: Check },
                                            'cancelled': { label: 'Cancel Order', icon: X },
                                            'refunded': { label: 'Process Refund', icon: CreditCard }
                                        };

                                        const actionConfig = statusLabels[status];
                                        const ActionIcon = actionConfig.icon;
                                        const isCancelAction = status === 'cancelled';

                                        return (
                                            <motion.button
                                                key={status}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleStatusUpdate(status)}
                                                disabled={isUpdating}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isCancelAction
                                                    ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400'
                                                    : 'bg-[#FF6B00] text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                                                    }`}
                                            >
                                                {isUpdating ? (
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <ActionIcon size={18} />
                                                )}
                                                {isUpdating ? 'Updating...' : actionConfig.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Timeline */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between overflow-x-auto pb-2">
                            {['Pending', 'Accepted', 'Preparing', 'Ready', 'In Transit', 'Delivered'].map((step, idx) => {
                                const isCompleted = idx <= Math.min(currentStatusIndex, 5);
                                const isCurrent = idx === Math.min(currentStatusIndex, 5);

                                return (
                                    <div key={step} className="flex items-center">
                                        <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{
                                                    scale: isCurrent ? [1, 1.1, 1] : 1,
                                                    backgroundColor: isCompleted ? '#FF6B00' : '#E2E8F0'
                                                }}
                                                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                                    ? 'border-[#FF6B00] bg-[#FF6B00] text-white shadow-lg shadow-orange-500/30'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
                                                    }`}
                                            >
                                                {isCompleted ? <Check size={20} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                            </motion.div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${isCurrent ? 'text-[#FF6B00]' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                                                }`}>
                                                {step}
                                            </span>
                                        </div>
                                        {idx < 5 && (
                                            <div className={`h-0.5 w-12 mx-2 transition-all ${idx < Math.min(currentStatusIndex, 5) ? 'bg-[#FF6B00]' : 'bg-slate-200 dark:bg-slate-700'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* MAIN CONTENT - LEFT COL */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Items Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl text-[#FF6B00]">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Order Items</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Items prepared for this order</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-full">
                                    {detailedItems.length} Items
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:border-slate-800">
                                {detailedItems.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-6 flex flex-col sm:flex-row gap-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <div className="w-full sm:w-28 h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 relative">
                                            {item.variant?.image ? (
                                                <img
                                                    src={item.variant.image}
                                                    alt={item.variant.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full text-slate-400">
                                                    <ShoppingBag size={32} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{item.variant?.name}</h4>
                                                    <p className="font-bold text-lg text-slate-900 dark:text-white whitespace-nowrap">₦{item.price?.toLocaleString()}</p>
                                                </div>
                                                {item.note && (
                                                    <div className="mt-2 inline-flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-800/30 max-w-md">
                                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                                        <p className="italic">"{item.note}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                                    <span className="text-sm">Qty:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                                                </div>
                                                <div className="text-slate-400 text-xs">
                                                    Unit Price: ₦{(item.price / item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Financial Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/5">
                                <div className="p-3 bg-green-100 dark:bg-green-500/10 rounded-xl text-green-600">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Earnings Breakdown</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Your payout for this order</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span className="text-sm">Subtotal (Items)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">₦{(order.vendorTotal + (order.commission || 0)).toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2 cursor-help group relative">
                                        <span className="text-sm border-b border-dotted border-slate-400">Platform Commission</span>
                                        <AlertCircle size={14} className="text-slate-400" />
                                        <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            Service fee for platform usage, payment processing, and customer support.
                                        </div>
                                    </div>
                                    <span className="font-semibold text-red-500">- ₦{order.commission?.toLocaleString() || '0'}</span>
                                </div>

                                {order.deliveryShare > 0 && (
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span className="text-sm">Delivery Reimbursement</span>
                                        <span className="font-semibold text-green-600">+ ₦{order.deliveryShare?.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="my-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700" />

                                <div className="flex justify-between items-end bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Payout</span>
                                        <span className="text-xs text-slate-400 mt-0.5">Estimated deposit amount</span>
                                    </div>
                                    <span className="text-3xl font-bold text-[#FF6B00]">
                                        ₦{((order.vendorTotal || 0) + (order.deliveryShare || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-500/5 px-6 py-4 border-t border-green-100 dark:border-green-900/20 flex items-center gap-3 text-sm text-green-800 dark:text-green-400">
                                <CheckCircle2 size={18} />
                                <p className="font-medium">Payout scheduled for next processing cycle (within 24-48 hours)</p>
                            </div>
                        </motion.div>

                    </div>


                    {/* CONTEXT - RIGHT COL */}
                    <div className="space-y-6">

                        {/* Customer Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-800/30">
                                <div className="relative mb-4">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.firstname} className="size-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg" />
                                    ) : (
                                        <div className="size-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 flex items-center justify-center text-slate-400 border-4 border-white dark:border-slate-800 shadow-lg">
                                            <User size={40} />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full border-4 border-white dark:border-[#1E293B]">
                                        <User size={14} />
                                    </div>
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">{user ? `${user.firstname} ${user.lastname}` : "Guest Customer"}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Valued Customer</p>
                            </div>

                            <div className="p-4">
                                <a
                                    href={`tel:${user?.phone || userOrderId?.phone}`}
                                    className="w-full bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 hover:to-[#FF6B00] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30"
                                >
                                    <Phone size={20} />
                                    <span>Call Customer</span>
                                </a>
                            </div>
                        </motion.div>

                        {/* Delivery Context */}
                        {address && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                            >
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/5 flex items-center gap-2">
                                    <MapPin size={18} className="text-blue-500" />
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Delivery Location</h4>
                                </div>
                                <div className="p-5">
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 mx-auto mt-2" />
                                        </div>
                                        <div className="pb-4 flex-1">
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-2">{address.label || "Delivery Address"}</p>
                                            <p className="font-semibold text-slate-900 dark:text-white leading-snug mb-1">
                                                {address.addressLine}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{address.city}, {address.state}</p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 flex items-start gap-3 mt-4 border border-blue-100 dark:border-blue-900/20">
                                        <Truck size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400">GrubDash Delivery</p>
                                            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/70 mt-1 leading-tight">
                                                Professional courier assigned. Track via dashboard.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Payment Status */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Payment Status</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-lg mt-0.5">
                                            {userOrderId?.paymentStatus === 'paid' ? 'Payment Verified' : 'Pending Payment'}
                                        </p>
                                    </div>
                                </div>
                                {userOrderId?.paymentStatus === 'paid' && (
                                    <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <Check size={14} />
                                        PAID
                                    </div>
                                )}
                            </div>
                        </motion.div>

                    </div>
                </div>

            </div>
        </div>
    );
}
