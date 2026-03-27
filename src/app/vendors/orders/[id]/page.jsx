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
    Wallet
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
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
                <AlertOctagon size={64} className="text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Order Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400">This order doesn't exist or you don't have access to it.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                    Go Back to Orders
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl flex items-center gap-3"
                    >
                        <Check size={24} />
                        <div>
                            <p className="font-bold">Status Updated!</p>
                            <p className="text-sm opacity-90">Order status has been successfully updated.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Toast */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl flex items-center gap-3 max-w-md"
                    >
                        <X size={24} />
                        <div>
                            <p className="font-bold">Update Failed</p>
                            <p className="text-sm opacity-90">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="ml-auto p-1 hover:bg-red-600 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-4 ">

                {/* Header Section with Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-3 md:p-4 border border-slate-200 dark:border-slate-700"
                >
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <button onClick={() => router.back()}
                                    className="bg-slate-200 dark:bg-orange-500 p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-100 dark:hover:text-slate-200 transition-colors font-medium group">
                                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                </button>
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
                                            'ready': { label: 'Mark Ready', icon: CheckCircle2 },
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
                                        
                                        const isLockedPlatformAction = isPlatformDelivery && lockedPlatformStatuses.includes(status);

                                        return (
                                            <motion.button
                                                key={status}
                                                whileHover={!(isUpdating || isLockedPlatformAction) ? { scale: 1.02 } : {}}
                                                whileTap={!(isUpdating || isLockedPlatformAction) ? { scale: 0.98 } : {}}
                                                onClick={() => handleStatusUpdate(status)}
                                                disabled={isUpdating || isLockedPlatformAction}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isCancelAction
                                                    ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400'
                                                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'
                                                    }`}
                                                title={isLockedPlatformAction ? "Platform delivery handles this step automatically." : ""}
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
                        {isPlatformDelivery && (order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'ready') && (
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex items-start sm:items-center gap-3 text-blue-800 dark:text-blue-300 shadow-sm">
                                <AlertCircle className="shrink-0 text-blue-500 dark:text-blue-400" size={20} />
                                <p className="text-sm leading-snug">
                                    You have marked this order as <strong>Ready for Pickup</strong>. The platform is currently assigning a delivery rider. Once assigned, the rider will arrive to collect the order.
                                </p>
                            </div>
                        )}
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
                                                    backgroundColor: isCompleted ? '#f97316' : '#E2E8F0'
                                                }}
                                                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                                    ? 'border-orange-500 bg-orange-500 text-white shadow-orange-500/30'
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
                                            <div className={`h-0.5 w-12 mx-2 transition-all ${idx < Math.min(currentStatusIndex, 5) ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
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
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl text-orange-500">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">Order Items</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Review customer selection and start preparation</p>
                                    </div>
                                </div>
                                {/* <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => window.print()}
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <Printer size={16} />
                                        <span>Print Ticket</span>
                                    </button>
                                    <span className="text-sm font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-full border border-orange-100 dark:border-orange-500/20">
                                        {detailedItems.length} Items
                                    </span>
                                </div> */}
                            </div>

                            <div className="divide-y divide-slate-100 dark:border-slate-800">
                                {detailedItems.map((item, idx) => {
                                    // Handle missing/null fields
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
                                        const optionsTextList = options.map((opt) => {
                                            const optQty = (Number(opt.quantity) || 1) * quantity;
                                            return `${optQty} ${opt.label}`;
                                        });
                                        
                                        let optionsClause = "";
                                        if (optionsTextList.length === 1) {
                                            optionsClause = optionsTextList[0];
                                        } else if (optionsTextList.length === 2) {
                                            optionsClause = `${optionsTextList[0]} and ${optionsTextList[1]}`;
                                        } else {
                                            const last = optionsTextList.pop();
                                            optionsClause = `${optionsTextList.join(', ')}, and ${last}`;
                                        }
                                        fullSentence += `, with ${optionsClause}.`;
                                    } else {
                                        fullSentence += `.`;
                                    }

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-6 flex flex-col gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group relative border-b border-slate-100 dark:border-slate-800 last:border-0"
                                        >
                                            {/* Top Section */}
                                            <div className="flex flex-col sm:flex-row gap-6">
                                                {/* 1. ITEM HEADER & IMAGE */}
                                                <div className="w-full sm:w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 relative shadow-inner">
                                                {itemImage ? (
                                                    <img
                                                        src={itemImage}
                                                        alt={itemName}
                                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full text-slate-400">
                                                        <ShoppingBag size={32} />
                                                    </div>
                                                )}
                                                {/* Outer Quantity Overlay */}
                                                <div className="absolute top-2 left-2 bg-slate-900 border-2 border-slate-50 dark:border-slate-700 text-white min-w-[2.25rem] h-9 px-2 rounded-xl flex items-center justify-center font-black text-sm shadow-black/20">
                                                    {quantity}x
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col md:flex-row gap-6">
                                                {/* Left Column: Details & Add-ons */}
                                                <div className="flex-1 min-w-0 flex flex-col gap-4">
                                                    {/* Title & Badges */}
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white text-2xl leading-tight transition-all group-hover:text-orange-500 break-words uppercase italic tracking-tighter">
                                                            {itemName}
                                                        </h4>
                                                        
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {/* Item Type Badge */}
                                                            {itemType && (
                                                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                    {itemType}
                                                                </span>
                                                            )}
                                                            
                                                            {/* Dietary Badge */}
                                                            {dietaryType && (
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                                                    dietaryType.toLowerCase() === 'halal' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                                                    dietaryType.toLowerCase() === 'veg' || dietaryType.toLowerCase() === 'vegetarian' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                                                                    dietaryType.toLowerCase() === 'non-veg' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 
                                                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                }`}>
                                                                    {dietaryType}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 2. PORTION & QUANTITY */}
                                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 inline-block w-full sm:w-auto">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                            <Package size={12}/> WHAT TO PREPARE
                                                        </p>
                                                        
                                                        <div className="flex flex-col gap-1.5 text-slate-800 dark:text-slate-200">
                                                            <span className="font-bold text-lg">
                                                                Prepare {portionQuantity} {portionLabel || 'Default'} portion{portionQuantity > 1 ? 's' : ''} of {itemName}
                                                            </span>
                                                            
                                                            {options.length > 0 && (
                                                                <div className="pl-3 border-l-2 border-orange-200 dark:border-orange-800/50 flex flex-col gap-1 my-1">
                                                                    {options.map((opt, idx) => {
                                                                        const totalOptQty = (Number(opt.quantity) || 1) * quantity;
                                                                        return (
                                                                            <span key={idx} className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                                                + <span className="text-orange-500">{totalOptQty}×</span> {opt.label}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            
                                                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
                                                                Qty Ordered: <span className="text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 ml-1">{quantity}</span>
                                                            </div>

                                                            {(portionQuantity > 1 && quantity > 1) && (
                                                                <div className="mt-2 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 tracking-wide inline-flex items-center gap-2">
                                                                    <AlertCircle size={14} />
                                                                    {portionQuantity} portions × {quantity} orders = {portionQuantity * quantity} portions total
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 5. SPECIAL NOTE */}
                                                    {note && (
                                                        <div className="flex items-start gap-3 text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-2xl border-2 border-dashed border-yellow-300 dark:border-yellow-600/50 relative">
                                                            <div className="p-2 bg-yellow-200 dark:bg-yellow-600/40 rounded-xl relative z-10 flex-shrink-0 mt-0.5">
                                                                <AlertCircle size={18} className="text-yellow-700 dark:text-yellow-400" />
                                                            </div>
                                                            <div className="relative z-10 w-full">
                                                                <p className="font-black uppercase text-[10px] tracking-widest mb-1 text-yellow-700 dark:text-yellow-500 flex items-center gap-1">
                                                                    Kitchen Note
                                                                </p>
                                                                <p className="text-base font-bold italic leading-tight text-yellow-900 dark:text-yellow-100">"{note}"</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 3. ADD-ONS / SELECTED OPTIONS */}
                                                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 w-full">
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                                            <Layers size={14} className="text-slate-400" />
                                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                CUSTOMER EXTRAS
                                                            </p>
                                                        </div>

                                                        {options.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {options.map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex flex-col gap-0.5 py-1">
                                                                        {opt.group_name && (
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{opt.group_name}</span>
                                                                        )}
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-4 h-4 rounded-md border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                                                                    <Check size={10} className="text-slate-600 dark:text-slate-300" />
                                                                                </div>
                                                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                                                    {opt.label}
                                                                                    {Number(opt.quantity) > 1 && (
                                                                                        <span className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                                                                            ×{opt.quantity}
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            {(Number(opt.price_modifier_naira) || 0) > 0 && (
                                                                                <span className="text-xs font-black text-slate-400 dark:text-slate-500">
                                                                                    +₦{(Number(opt.price_modifier_naira) * Number(opt.quantity || 1)).toLocaleString()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">No add-ons</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column: 4. PRICING BREAKDOWN */}
                                                <div className="flex flex-col items-end gap-3 w-full md:w-[220px] md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-6">
                                                    
                                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 w-full">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                                                            <Receipt size={12}/> Price Breakdown
                                                        </div>
                                                        
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1.5">
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="font-medium truncate">{portionLabel || 'Default'} × {portionQuantity} portion{portionQuantity > 1 ? 's' : ''} {portionQuantity > 1 ? `— ₦${(basePrice / portionQuantity).toLocaleString()} each` : ''}</span>
                                                                <b className="text-slate-700 dark:text-slate-200">₦{basePrice.toLocaleString()}</b>
                                                            </div>
                                                            
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="font-medium text-slate-500/80 truncate">Extras Total</span>
                                                                <b className="text-slate-500">₦{optionsTotal.toLocaleString()}</b>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-100 dark:border-slate-700 flex justify-between items-center flex-wrap gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-700 dark:text-slate-300">Total per order</span>
                                                                <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">(all portions + extras combined)</span>
                                                            </div>
                                                            <span className="font-black text-sm text-slate-800 dark:text-slate-100">₦{unitPrice.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Final Line Total Card */}
                                                    <div className="w-full mt-auto flex flex-col bg-slate-50 dark:bg-zinc-950 px-5 py-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-left">
                                                        <span className="text-sm font-black text-slate-500 mb-1 leading-none">You are charging:</span>
                                                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₦{lineTotal.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            </div>

                                            {/* SUMMARY FOR KITCHEN */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-amber-100 dark:bg-amber-900/40 p-5 rounded-2xl border border-amber-300 dark:border-amber-700/80 w-full relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                                <div className="p-3 bg-amber-500 text-white rounded-xl shrink-0 relative z-10">
                                                    <AlertCircle size={28} />
                                                </div>
                                                <div className="flex-1 relative z-10">
                                                    <p className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                        SUMMARY FOR KITCHEN
                                                    </p>
                                                    <p className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100 leading-snug">
                                                        {fullSentence}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Financial Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden"
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
                                        <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                                    <span className="text-3xl font-bold text-orange-500">
                                        ₦{((order.vendorTotal || 0) + (order.deliveryShare || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-500/5 px-6 py-4 border-t border-indigo-100 dark:border-indigo-900/20 flex flex-col sm:flex-row items-center gap-3 text-sm text-indigo-800 dark:text-indigo-400">
                                <Wallet size={18} className="flex-shrink-0" />
                                <p className="font-medium">Funds are securely held in Escrow by GrubDash and instantly released to your Wallet upon Delivery.</p>
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
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-800/30">
                                <div className="relative mb-4">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.firstname} className="size-24 rounded-full object-cover border-4 border-white dark:border-slate-800" />
                                    ) : (
                                        <div className="size-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 flex items-center justify-center text-slate-400 border-4 border-white dark:border-slate-800">
                                            <User size={40} />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-800">
                                        <User size={14} />
                                    </div>
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">{user ? `${user.firstname} ${user.lastname}` : "Guest Customer"}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Valued Customer</p>
                            </div>

                            <div className="p-4">
                                <a
                                    href={`tel:${user?.phone || userOrderId?.phone}`}
                                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-orange-500/20 hover hover:shadow-orange-500/30"
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
                                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden"
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
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6"
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
            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600">
                                    <AlertCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cancel Order?</h3>
                                    
                                    {['accepted', 'preparing', 'ready_for_pickup'].includes(order?.orderStatus) ? (
                                        <div className="text-slate-600 dark:text-slate-300 mt-3 text-sm flex flex-col gap-2 text-left bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                            <p className="font-bold text-red-600 dark:text-red-400">Warning: Cancelling an already {order.orderStatus.replace(/_/g, ' ')} order.</p>
                                            <ul className="list-disc pl-4 space-y-1.5 mt-1 text-[13px] text-red-800/80 dark:text-red-300">
                                                <li><strong className="text-red-800 dark:text-red-200">Instant Refund:</strong> The customer gets fully refunded automatically.</li>
                                                <li><strong className="text-red-800 dark:text-red-200">Forfeited Payout:</strong> Your Escrow hold is reversed. You will not receive any payout for food already prepared.</li>
                                                <li><strong className="text-red-800 dark:text-red-200">Platform Record:</strong> Routine cancellations post-acceptance negatively impact store reliability scores.</li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                                            Are you sure you want to decline and cancel this pending order? The customer will be immediately refunded.
                                        </p>
                                    )}
                                    <p className="text-slate-500 dark:text-slate-500 text-xs font-bold mt-4 uppercase tracking-wider">This action cannot be undone.</p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                    >
                                        No, Keep
                                    </button>
                                    <button
                                        onClick={() => performStatusUpdate('cancelled')}
                                        className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-red-600/20"
                                    >
                                        Yes, Cancel
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
