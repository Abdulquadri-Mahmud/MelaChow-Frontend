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
    Package,
    Maximize2,
    Layers,
    Printer,
    Wallet,
    AlertTriangle,
    Hash,
    Info,
    Navigation
} from "lucide-react";
import { getVendorOrderById, updateOrderStatus, completeOrder } from "@/app/lib/vendorApi";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import RiderAssignmentModal from "../../riders/RiderAssignmentModal";

export default function VendorOrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, orderId: null });
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(true);
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

    // Debug: Log order data structure for ID troubleshooting
    useEffect(() => {
        if (order) {
            console.log('📊 Order Data Structure:', {
                _id: order._id,
                _idType: typeof order._id,
                hasOidProperty: !!order._id?.$oid,
                urlParamId: id,
                urlParamIdType: typeof id,
                isValidMongoId: typeof order._id === 'string' && order._id.match(/^[0-9a-fA-F]{24}$/)
            });
        }
    }, [order, id]);

    const performStatusUpdate = async (newStatus) => {
        const normalizedStatus = newStatus === 'ready' ? 'ready_for_pickup' : newStatus;

        try {
            setIsUpdating(true);

            // ✅ CRITICAL FIX: Properly extract MongoDB _id from order object
            let vendorOrderId;

            // Handle different formats the API might return (Standard String or Mongo Extended JSON)
            if (typeof order._id === 'string') {
                vendorOrderId = order._id;
            } else if (order._id?.$oid) {
                vendorOrderId = order._id.$oid;
            } else if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
                // Last resort: use URL param only if it's a valid MongoDB ObjectId
                console.warn('⚠️ Using URL param as vendorOrderId - order._id was unavailable');
                vendorOrderId = id;
            } else {
                throw new Error('Unable to determine valid vendor order ID from order object');
            }

            // Validate format locally before sending
            if (!vendorOrderId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error(`Invalid MongoDB ObjectId format: ${vendorOrderId}`);
            }

            console.log(`📝 Updating order status:`, {
                vendorOrderId, // MongoDB _id being sent to backend
                vendorOrderIdSource: typeof order._id === 'string' ? 'order._id (string)' : order._id?.$oid ? 'order._id.$oid' : 'url param',
                newStatus: normalizedStatus,
                userFacingOrderId: order.userOrderId?.orderId || order.orderId
            });

            // ✅ Call appropriate endpoint
            if (normalizedStatus === 'completed') {
                await completeOrder(vendorOrderId);
            } else {
                await updateOrderStatus(vendorOrderId, normalizedStatus);
            }

            // ✅ Refresh order data
            const res = await getVendorOrderById(id);
            const data = res.data || res;
            setOrder(data);

            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);

        } catch (err) {
            console.error("❌ Failed to update order status:", err);

            // ✅ ENHANCED ERROR LOGGING (Using new backend fields)
            const backendError = err.response?.data;
            console.error("❌ Backend Error Details:", {
                attemptedVendorOrderId: vendorOrderId || 'undefined',
                receivedByBackend: backendError?.received,
                backendHint: backendError?.hint,
                message: backendError?.message
            });

            // ✅ Set user-friendly error message
            const errorMsg = backendError?.message || err.message || "Failed to update order status.";
            const displayMsg = backendError?.hint ? `${errorMsg} (${backendError.hint})` : errorMsg;

            setErrorMessage(displayMsg);
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setIsUpdating(false);
            setIsCancelModalOpen(false);
        }
    };

    // Handle button click
    const handleStatusUpdate = (newStatus) => {
        if (newStatus === 'cancelled') {
            setIsCancelModalOpen(true);
        } else if (newStatus === 'rider_assigned') {
            let vendorOrderId;
            if (typeof order._id === 'string') {
                vendorOrderId = order._id;
            } else if (order._id?.$oid) {
                vendorOrderId = order._id.$oid;
            } else {
                vendorOrderId = id;
            }
            setAssignmentModal({ isOpen: true, orderId: vendorOrderId });
        } else {
            performStatusUpdate(newStatus);
        }
    };

    // Get available next statuses based on current status
    const getAvailableStatuses = (currentStatus) => {
        const status = currentStatus?.toLowerCase();
        const statusFlow = {
            'pending': ['accepted', 'cancelled'],
            'accepted': ['preparing', 'cancelled'],
            'preparing': ['ready_for_pickup', 'cancelled'],
            'ready_for_pickup': ['rider_assigned', 'out_for_delivery'],
            'ready': ['rider_assigned', 'out_for_delivery'],
            'rider_assigned': ['out_for_delivery'],
            'out_for_delivery': ['delivered'],
            'delivered': ['completed'],
            'completed': [],
            'cancelled': [],
            'failed': ['refunded'],
            'refunded': []
        };
        return statusFlow[status] || [];
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Transaction Records...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
                <div className="p-5 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 border-dashed">
                    <AlertOctagon size={48} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Access Denied</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] text-center">Unauthorized entry or non-existent log entry detected.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-all active:scale-95 shadow-none"
                >
                    RETURN TO LOGS
                </button>
            </div>
        );
    }

    // Handle both VendorOrder (nested userOrderId) and UserOrder (direct properties)
    const userOrderId = order.userOrderId || (order.userId ? order : null);
    const user = order.userOrderId?.userId || order.userId;
    const address = order.userOrderId?.deliveryAddress || order.deliveryAddress;

    // Extract restaurantId (could be at root or inside first item)
    const effectiveRestaurantId = order.restaurantId || (order.items?.[0]?.restaurantId?.$oid || order.items?.[0]?.restaurantId);

    // Format Date
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Filter items for this vendor
    const itemsToFilter = order.userOrderId?.items || order.items || [];
    const detailedItems = itemsToFilter.filter(item => {
        const itemRestId = item.restaurantId?.$oid || item.restaurantId;
        return itemRestId === effectiveRestaurantId;
    });

    // Progress Timeline Mapping (Maps to 6 visual steps)
    const statusToIndex = {
        'pending': 0,
        'accepted': 1,
        'preparing': 2,
        'ready': 3,
        'ready_for_pickup': 3,
        'rider_assigned': 4,
        'out_for_delivery': 4,
        'delivered': 5,
        'completed': 5
    };
    const currentStatusIndex = statusToIndex[order.orderStatus?.toLowerCase()] ?? 0;

    // Status Badge Logic
    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: Clock, label: "Pending Confirmation" };
            case 'accepted':
                return { color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", icon: CheckCircle2, label: "Order Accepted" };
            case 'preparing':
                return { color: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400", icon: ShoppingBag, label: "Preparing Order" };
            case 'ready':
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

    const isPlatformDelivery = vendorDetails?.vendor?.deliveryManagedBy === "admin" || vendorDetails?.deliveryManagedBy === "admin";
    const lockedPlatformStatuses = ["rider_assigned", "out_for_delivery", "delivered", "completed"];

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans">

            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className="fixed top-6 right-6 z-[100] bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow flex items-center gap-3 min-w-[320px]"
                    >
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                            <Check size={20} className="text-emerald-600" strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">Done! Status updated</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Your order's on track.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Toast */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className="fixed top-6 right-6 z-100 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 p-4 rounded-lg shadow flex items-center gap-3 max-w-md min-w-[320px]"
                    >
                        <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                            <X size={20} className="text-rose-600" strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">Something went wrong</p>
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-2">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-4">

                {/* Header Section with Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => router.back()}
                                    className="p-3 bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-90 border-2 border-slate-300 dark:border-slate-600 shadow-md">
                                    <ChevronLeft size={20} strokeWidth={3} />
                                </motion.button>
                                <div>
                                <motion.h1 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-none mb-2">
                                        📦 Order
                                    </motion.h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 ${statusConfig.color} shadow-lg`}>
                                            <StatusIcon size={16} strokeWidth={3} />
                                            <span>{statusConfig.label}</span>
                                        </motion.div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl border-2 border-orange-300 dark:border-orange-700/50 h-8">
                                            <Hash size={12} className="text-orange-600 dark:text-orange-400" strokeWidth={3} />
                                            <span className="text-[11px] font-black text-orange-700 dark:text-orange-300 leading-none uppercase tracking-widest">{(order._id?.$oid || order._id || "").toString().slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-3 py-2 px-4 bg-linear-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-xl border-2 border-blue-300 dark:border-blue-700/50">
                                    <Clock size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">{dateStr} — {timeStr}</span>
                                </motion.div>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-3 py-2 px-4 bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl border-2 border-purple-300 dark:border-purple-700/50">
                                    <ShoppingBag size={14} className="text-purple-600 dark:text-purple-400" strokeWidth={3} />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300">{detailedItems.length} SKU POSITIONS</span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {availableActions.length > 0 && (
                            <div className="flex flex-col gap-4 lg:min-w-[320px]">
                                <div className="flex items-center gap-3 leading-none border-b-2 border-slate-300 dark:border-slate-700 pb-3 mb-2">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <Layers size={12} className="text-orange-600 dark:text-orange-400" strokeWidth={3} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">⚙️ Lifecycle Control</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableActions.map((status) => {
                                        const statusLabels = {
                                            'accepted': { label: 'Accept Order', icon: Check },
                                            'preparing': { label: 'Start Prep', icon: ShoppingBag },
                                            'ready': { label: 'Ready for Pickup', icon: CheckCircle2 },
                                            'ready_for_pickup': { label: 'Ready for Pickup', icon: CheckCircle2 },
                                            'rider_assigned': { label: 'Assign Courier', icon: User },
                                            'out_for_delivery': { label: 'Dispatch', icon: Truck },
                                            'delivered': { label: 'Delivered', icon: CheckCircle2 },
                                            'completed': { label: 'Finish Order', icon: Check },
                                            'cancelled': { label: 'Cancel Order', icon: X },
                                            'refunded': { label: 'Refund', icon: CreditCard }
                                        };

                                        const actionConfig = statusLabels[status];
                                        if (!actionConfig) return null;
                                        
                                        const ActionIcon = actionConfig.icon;
                                        const isCancelAction = status === 'cancelled';
                                        
                                        const isLockedPlatformAction = isPlatformDelivery && lockedPlatformStatuses.includes(status);

                                        return (
                                            <motion.button
                                                key={status}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleStatusUpdate(status)}
                                                disabled={isUpdating || isLockedPlatformAction}
                                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded font-bold text-[11px] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-1 min-w-[120px] border ${isCancelAction
                                                    ? 'bg-white dark:bg-slate-900 text-rose-600 border-rose-300 dark:border-rose-700/50 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                                                    : 'bg-orange-600 text-white border-transparent hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800'
                                                    }`}
                                            >
                                                {isUpdating ? (
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <ActionIcon size={14} strokeWidth={3} />
                                                )}
                                                {isUpdating ? 'SYNCING...' : actionConfig.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Timeline */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        {isPlatformDelivery && (order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'ready') && (
                            <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700 p-4 rounded flex items-start sm:items-center gap-3 text-blue-700 dark:text-blue-300">
                                <AlertCircle className="shrink-0 text-blue-600 dark:text-blue-400" size={18} strokeWidth={2} />
                                <p className="text-[11px] font-bold leading-relaxed">
                                    Order is ready! Platform is looking for a courier.
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-between overflow-x-auto pb-6 no-scrollbar gap-2">
                            {['Pending', 'Accepted', 'Preparing', 'Ready', 'In Transit', 'Delivered'].map((step, idx) => {
                                const isCompleted = idx <= Math.min(currentStatusIndex, 5);
                                const isCurrent = idx === Math.min(currentStatusIndex, 5);

                                return (
                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                        <div className="flex flex-col items-center gap-3 min-w-[85px]">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all font-bold text-[10px] ${isCompleted
                                                    ? 'border-transparent bg-orange-600 text-white'
                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-400'
                                                    } ${isCurrent ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : ''}`}
                                            >
                                                {isCompleted ? <Check size={16} strokeWidth={4} /> : <span>{idx + 1}</span>}
                                            </motion.div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest text-center ${isCurrent ? 'text-orange-600 font-black' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                                                }`}>
                                                {step}
                                            </span>
                                        </div>
                                        {idx < 5 && (
                                            <div className={`h-[3px] flex-1 min-w-5 mx-3 transition-all rounded-full ${idx < Math.min(currentStatusIndex, 5) ? 'bg-linear-to-r from-orange-600 to-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">

                        {/* Items Manifest */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl"
                        >
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-linear-to-br from-slate-100 to-blue-100 dark:from-slate-800 dark:to-blue-900/40 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                        <ShoppingBag size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[16px] text-slate-900 dark:text-white uppercase tracking-widest">Items Manifest</h3>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Extraction Protocol: Preparation Required</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <motion.div 
                                        whileHover={{ scale: 1.1 }}
                                        className="px-4 py-2 bg-linear-to-r from-orange-600 to-orange-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg border-transparent shadow-lg">
                                        {detailedItems.length} POSITIONS
                                    </motion.div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                {detailedItems.map((item, idx) => {
                                    const itemName = item.name || item.variant?.name || "Unknown Item";
                                    const itemImage = item.image_url || item.variant?.image || null;
                                    const portionLabel = item.portion_label || item.metadata?.portion_label || null;
                                    const quantity = Number(item.quantity) || 1;
                                    const portionQuantity = Number(item.portion_quantity) || 1;
                                    const dietaryType = item.dietary_type || item.metadata?.dietary_type || null;
                                    const itemType = item.item_type || null;
                                    const originalPrice = Number(item.originalPrice) || Number(item.variant?.price) || 0;
                                    const options = item.selected_options || item.metadata?.selected_options || [];
                                    const note = item.note || "";
                                    const pricing = item.metadata?.pricing || null;
                                    const basePrice = pricing?.base_naira || (options.length === 0 ? originalPrice : (originalPrice || 0));
                                    const optionsTotal = options.reduce((sum, opt) => sum + ((Number(opt.price_modifier_naira) || 0) * (Number(opt.quantity) || 1)), 0);
                                    const unitPrice = pricing?.final_unit_naira || (basePrice + optionsTotal);
                                    const lineTotal = unitPrice * quantity;
                                    const totalPortions = portionQuantity * quantity;
                                    
                                    let fullSentence = `Prepare ${totalPortions} ${portionLabel ? portionLabel + ' ' : ''}portion${totalPortions > 1 ? 's' : ''} of ${itemName}`;
                                    if (options.length > 0) {
                                        const optionsTextList = options.map((opt) => `${(Number(opt.quantity) || 1) * quantity} ${opt.label}`);
                                        fullSentence += `, with ${optionsTextList.length === 1 ? optionsTextList[0] : optionsTextList.length === 2 ? optionsTextList.join(' and ') : optionsTextList.slice(0, -1).join(', ') + ', and ' + optionsTextList.slice(-1)}`;
                                    }
                                    fullSentence += ".";

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 + 0.2 }}
                                            className="p-6 flex flex-col gap-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                                        >
                                            <div className="flex flex-col sm:flex-row gap-6">
                                                {/* Image & Quantity */}
                                                <div className="w-24 h-24 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-hidden shrink-0 relative border-3 border-slate-300 dark:border-slate-700 shadow-lg">
                                                    {itemImage ? (
                                                        <img src={itemImage} alt={itemName} className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-slate-300 dark:text-slate-600">
                                                            <ShoppingBag size={28} />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 left-2 bg-linear-to-r from-orange-600 to-orange-700 text-white min-w-7 h-7 px-2 rounded-lg flex items-center justify-center font-black text-[11px] uppercase tracking-tighter shadow-lg border-2 border-white dark:border-slate-900">
                                                        {quantity}X
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Header & Pricing */}
                                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                                        <div>
                                                            <h4 className="font-black text-slate-900 dark:text-white text-[15px] uppercase tracking-tight leading-none mb-2 group-hover:text-orange-600 transition-colors">
                                                                {itemName}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {itemType && (
                                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-2 border-slate-300 dark:border-slate-700/50">{itemType}</span>
                                                                )}
                                                                {dietaryType && (
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-2 ${
                                                                        dietaryType.toLowerCase().includes('halal') ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-600/50' :
                                                                        dietaryType.toLowerCase().includes('veg') ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-600/50' : 
                                                                        dietaryType.toLowerCase().includes('non') ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-600/50' : 
                                                                        'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                                    }`}>{dietaryType}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight">₦{lineTotal.toLocaleString()}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">₦{unitPrice.toLocaleString()} / UNIT</p>
                                                        </div>
                                                    </div>

                                                    {/* Instruction Manifest */}
                                                    <div className="bg-linear-to-br from-slate-100 to-blue-100 dark:from-slate-950/50 dark:to-slate-900/50 rounded-xl p-4 border-2 border-slate-300 dark:border-slate-700/50 shadow-md">
                                                        <div className="flex items-center gap-2 mb-3 leading-none">
                                                            <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                                <Package size={12} className="text-orange-600 dark:text-orange-400" />
                                                            </div>
                                                            <p className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">PREPARATION MANIFEST</p>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wide leading-none">
                                                                <span className="w-2 h-2 bg-orange-600 rounded-full" />
                                                                EXTRACT {totalPortions} {portionLabel || 'DEFAULT'} PORTION{totalPortions !== 1 ? 'S' : ''}
                                                            </p>
                                                            
                                                            {options.length > 0 && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pl-4 border-l-3 border-orange-400 dark:border-orange-600/50">
                                                                    {options.map((opt, oIdx) => (
                                                                        <p key={oIdx} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 leading-none">
                                                                            <span className="text-orange-600 font-black">{(Number(opt.quantity) || 1) * quantity}X</span> {opt.label}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {portionQuantity > 1 && quantity > 1 && (
                                                                <div className="mt-3 text-center py-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg border-2 border-orange-300 dark:border-orange-700/50">
                                                                    <p className="text-[9px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest leading-none">CALC: {portionQuantity} PORTIONS × {quantity} ORDERS = {totalPortions} UNITS</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Kitchen Note */}
                                                    {note && (
                                                        <div className="mt-4 flex items-start gap-4 bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/50">
                                                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                                                                <AlertCircle size={16} strokeWidth={2.5} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">⚠️ KITCHEN NOTE</p>
                                                                <p className="text-[12px] font-bold italic text-slate-800 dark:text-slate-200">"{note}"</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Summary Banner */}
                                            <div className="flex items-center gap-4 bg-linear-to-r from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-800 text-white p-5 rounded-xl border-2 border-slate-700 dark:border-slate-700 overflow-hidden relative shadow-lg">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/15 rounded-full blur-3xl -mr-16 -mt-16" />
                                                <div className="p-3 bg-slate-700 dark:bg-slate-800 rounded-lg relative z-10 shrink-0 border border-slate-600">
                                                    <Hash size={16} className="text-orange-500" strokeWidth={3} />
                                                </div>
                                                <div className="flex-1 relative z-10">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">📝 DIRECTIVE SUMMARY</p>
                                                    <p className="text-[12px] font-black uppercase tracking-wide leading-tight">{fullSentence}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Financial Reconciliation */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl"
                        >
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
                                <div className="p-3 bg-linear-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                                    <Receipt size={20} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="font-black text-[16px] text-slate-900 dark:text-white uppercase tracking-widest">Earnings Breakdown</h3>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Asset Payout Reconciliation Protocol</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Gross Merchandise Value</span>
                                        <span className="text-[14px] font-black text-slate-900 dark:text-white">₦{(order.vendorTotal + (order.commission || 0)).toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Escrow Commission</span>
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
                                                <Info size={12} className="text-slate-500 dark:text-slate-400" />
                                            </div>
                                        </div>
                                        <span className="text-[14px] font-black text-rose-600 dark:text-rose-400">- ₦{order.commission?.toLocaleString() || '0'}</span>
                                    </div>

                                    {order.deliveryShare > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Logistics Offset</span>
                                            <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">+ ₦{order.deliveryShare?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-end bg-orange-600 dark:bg-orange-700 p-6 rounded border border-orange-500 dark:border-orange-600 text-white">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-orange-100 uppercase tracking-widest">🎯 Projected Net Payout</span>
                                            <span className="text-[9px] font-bold text-orange-100/80 uppercase tracking-widest mt-1">Automated Settlement Pending</span>
                                        </div>
                                        <span className="text-4xl font-black text-white tracking-tighter">
                                            ₦{((order.vendorTotal || 0) + (order.deliveryShare || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-300 dark:border-emerald-700/50">
                                    <Wallet size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
                                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                                        🔒 Escrow Protection: Funds released to wallet upon verified delivery.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* CONTEXT SIDEBAR - RIGHT COL */}
                    <div className="space-y-4">
                        {/* Customer Interface */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl"
                        >
                            <div className="p-6 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <div className="relative mb-4">
                                    <motion.div 
                                        className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.firstname} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <User size={40} strokeWidth={2} />
                                            </div>
                                        )}
                                    </motion.div>
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-lg border-4 border-white dark:border-slate-900 shadow-lg">
                                        <CheckCircle2 size={16} strokeWidth={3} />
                                    </motion.div>
                                </div>
                                <h3 className="font-black text-[16px] text-slate-900 dark:text-white uppercase tracking-tight mb-1">{user ? `${user.firstname} ${user.lastname}` : "SECURE GUEST"}</h3>
                                <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">✓ Verified Logistics Client</p>
                            </div>

                            <div className="p-6">
                                <motion.a
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    href={`tel:${user?.phone || userOrderId?.phone}`}
                                    className="w-full bg-linear-to-r from-orange-600 to-orange-700 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 border border-transparent shadow-lg hover:opacity-90"
                                >
                                    <Phone size={16} strokeWidth={3} />
                                    <span>📞 Initiate Communication</span>
                                </motion.a>
                            </div>
                        </motion.div>

                        {/* Logistics Context */}
                        {address && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl"
                            >
                                <div className="px-8 py-6 border-b-2 border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700">
                                        <MapPin size={18} strokeWidth={3} />
                                    </div>
                                    <h4 className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-widest">Drop-Off Point</h4>
                                </div>
                                <div className="p-8">
                                    <div className="flex gap-6">
                                        <div className="flex flex-col items-center">
                                            <motion.div 
                                                whileHover={{ scale: 1.1 }}
                                                className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700">
                                                <Navigation size={20} strokeWidth={2.5} />
                                            </motion.div>
                                            <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-3 min-h-10" />
                                        </div>
                                        <div className="flex-1 min-w-0 pb-4">
                                            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">{address.label || "TARGET DESTINATION"}</p>
                                            <p className="text-[13px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight wrap">
                                                {address.addressLine}
                                            </p>
                                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-2">{address.city}, {address.state}</p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800/50 mt-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                                <Truck size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                                            </div>
                                            <p className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">⛓️ Chain of Custody</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-snug">
                                            Assigned courier will execute pickup at designated loading zone.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Transaction Verification */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl p-8"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${userOrderId?.paymentStatus === 'paid' 
                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' 
                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'}`}>
                                        <CreditCard size={20} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${userOrderId?.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            💳 Payment Status
                                        </p>
                                        <p className="font-black text-slate-900 dark:text-white text-[14px] uppercase tracking-tight">
                                            {userOrderId?.paymentStatus === 'paid' ? '✓ Asset Secured' : '⏳ Pending Verification'}
                                        </p>
                                    </div>
                                </div>
                                {userOrderId?.paymentStatus === 'paid' && (
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500 shadow-lg">
                                        ✓ PAID
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Order Summary Modal - What To Prepare */}
            <AnimatePresence>
                {showSummaryModal && order && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={() => setShowSummaryModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, type: "spring" }}
                            className="bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full border border-slate-200 dark:border-slate-700 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-orange-600 dark:bg-orange-700 p-4 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-xl font-bold text-white">📋 What to Prepare</h2>
                                </div>
                            </div>

                            {/* Modal Content - Show all directive summaries */}
                            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                                {detailedItems.length === 0 ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-300">No items to prepare</p>
                                ) : (
                                    detailedItems.map((item, idx) => {
                                        const quantity = Number(item.quantity) || 1;
                                        const portionLabel = item.portion_label || item.metadata?.portion_label || null;
                                        const portionQuantity = Number(item.portion_quantity) || 1;
                                        const itemName = item.name || item.variant?.name || "Unknown Item";
                                        const options = item.selected_options || item.metadata?.selected_options || [];
                                        const totalPortions = portionQuantity * quantity;
                                        
                                        let fullSentence = `Prepare ${totalPortions} ${portionLabel ? portionLabel + ' ' : ''}portion${totalPortions > 1 ? 's' : ''} of ${itemName}`;
                                        if (options.length > 0) {
                                            const optionsTextList = options.map((opt) => `${(Number(opt.quantity) || 1) * quantity} ${opt.label}`);
                                            fullSentence += `, with ${optionsTextList.length === 1 ? optionsTextList[0] : optionsTextList.length === 2 ? optionsTextList.join(' and ') : optionsTextList.slice(0, -1).join(', ') + ', and ' + optionsTextList.slice(-1)}`;
                                        }
                                        fullSentence += ".";

                                        return (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm text-slate-900 dark:text-white">{fullSentence}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setShowSummaryModal(false)}
                                    className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded transition-colors"
                                >
                                    Ready to Cook
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Termination Protocol Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-md max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-none"
                        >
                            <div className="flex flex-col items-center text-center gap-5">
                                <div className="p-3 bg-rose-600/10 rounded-md text-rose-600 border border-rose-600/20">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Terminate Order?</h3>
                                    
                                    {['accepted', 'preparing', 'ready_for_pickup'].includes(order?.orderStatus) ? (
                                        <div className="text-slate-600 dark:text-slate-400 mt-4 text-[11px] font-bold text-left bg-rose-600/5 p-4 rounded-md border border-rose-600/10 uppercase tracking-widest space-y-2">
                                            <p className="text-rose-600 font-black">ALERT: Active Protocol Interruption</p>
                                            <div className="space-y-1 mt-2">
                                                <p>• Automated customer refund will initiate.</p>
                                                <p>• Vendor payout authorization revoked.</p>
                                                <p>• Reliability metrics will be impacted.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 dark:text-slate-400 mt-3 text-[11px] font-bold uppercase tracking-widest">
                                            Authorize order declination? Refund will be processed immediately.
                                        </p>
                                    )}
                                    <p className="text-rose-600 text-[10px] font-black mt-5 uppercase tracking-widest border border-rose-600/20 py-2 rounded-md">PROTOCOL IRREVERSIBLE</p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="flex-1 py-3 rounded-md font-black text-[11px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                                    >
                                        ABORT
                                    </button>
                                    <button
                                        onClick={() => performStatusUpdate('cancelled')}
                                        className="flex-1 py-3 rounded-md font-black text-[11px] uppercase tracking-widest bg-rose-600 text-white active:scale-95 transition-all"
                                    >
                                        CONFIRM
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <RiderAssignmentModal
                isOpen={assignmentModal.isOpen}
                onClose={() => setAssignmentModal({ isOpen: false, orderId: null })}
                orderId={assignmentModal.orderId}
                vendorId={vendorDetails?.vendor?._id || vendorDetails?.vendor?.id}
                onAssigned={() => {
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
                }}
            />
        </div>
    );
}
