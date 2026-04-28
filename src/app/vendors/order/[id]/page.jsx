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

export default function VendorOrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(true);
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
        } else {
            performStatusUpdate(newStatus);
        }
    };

    // Get available next statuses based on current status
    const getAvailableStatuses = (currentStatus) => {
        const status = currentStatus?.toLowerCase();
        const isVendorManaged = vendorDetails?.vendor?.deliveryManagedBy === 'vendor' || vendorDetails?.deliveryManagedBy === 'vendor';
        
        const statusFlow = {
            'pending': ['accepted', 'cancelled'],
            'accepted': ['preparing', 'cancelled'],
            'preparing': ['ready_for_pickup', 'cancelled'],
            'ready_for_pickup': ['cancelled'],
            'ready': ['cancelled'],
            'delivered': [],
            'completed': [],
            'cancelled': [],
            'failed': ['refunded'],
            'refunded': []
        };
        return statusFlow[status] || [];
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Syncing Transaction Records...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 border-dashed">
                    <AlertOctagon size={48} className="text-zinc-300" />
                </div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Record Access Denied</h2>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest max-w-[280px] text-center">Unauthorized entry or non-existent log entry detected.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-all active:scale-95 shadow-none"
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
    const effectiveRestaurantId = order.restaurantId?._id || order.restaurantId?.$oid || order.restaurantId || order.items?.[0]?.restaurantId?._id || order.items?.[0]?.restaurantId?.$oid || order.items?.[0]?.restaurantId;

    // Format Date
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Filter items for this vendor
    const itemsToFilter = order.userOrderId?.items || order.items || [];
    const detailedItems = itemsToFilter.filter(item => {
        const itemRestId = item.restaurantId?._id || item.restaurantId?.$oid || item.restaurantId;
        return String(itemRestId) === String(effectiveRestaurantId);
    });

    // Progress Timeline Mapping (Maps to 6 visual steps)
    const statusToIndex = {
        'pending': 0,
        'accepted': 1,
        'preparing': 2,
        'ready': 3,
        'ready_for_pickup': 3,
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
                return { color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", icon: Clock, label: status || "Unknown" };
        }
    };

    const statusConfig = getStatusConfig(order.orderStatus);
    const StatusIcon = statusConfig.icon;
    const availableActions = getAvailableStatuses(order.orderStatus);

    const isPlatformDelivery = true; // All vendors are now platform managed
    const lockedPlatformStatuses = ["out_for_delivery", "delivered", "completed"];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">

            {/* Global Executive Summary Modal */}
            <AnimatePresence>
                {isSummaryModalOpen && order && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-md w-full max-w-lg border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-600/10 rounded-md text-orange-600 border border-orange-600/20">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-[14px]">Executive Order Summary</h3>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Automated Directive Briefing</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsSummaryModalOpen(false)}
                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                                {/* Status Sentence */}
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-md border border-blue-100 dark:border-blue-900/30 flex gap-3 items-start">
                                    <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-[12px] font-bold text-blue-800 dark:text-blue-300 leading-relaxed">
                                        The current status of this order is <span className="font-black uppercase tracking-wide">{statusConfig.label}</span>. 
                                        {order.orderStatus === 'pending' && " Please review and accept the order immediately to begin preparation."}
                                        {order.orderStatus === 'accepted' && " The customer has been notified that you accepted the order."}
                                        {order.orderStatus === 'preparing' && " The kitchen is currently enlisted to prepare these items."}
                                        {order.orderStatus === 'ready' && " The items have been parked and are awaiting extraction."}
                                        {order.orderStatus === 'ready_for_pickup' && " The items are securely packaged and awaiting the courier."}
                                        {order.orderStatus === 'delivered' && " This order has successfully reached the destination."}
                                    </p>
                                </div>

                                {/* Directives */}
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Kitchen Directives ({detailedItems.length})</p>
                                    <div className="space-y-3">
                                        {detailedItems.map((item, idx) => {
                                            const itemName = item.name || item.variant?.name || "Unknown Item";
                                            const quantity = Number(item.quantity) || 1;
                                            const portionQuantity = Number(item.portion_quantity) || 1;
                                            const totalPortions = portionQuantity * quantity;
                                            const options = item.selected_options || item.metadata?.selected_options || [];
                                            const cleanPortionLabel = (item.portion_label || item.metadata?.portion_label || "")?.trim();
                                            
                                            let portionText = cleanPortionLabel || (totalPortions > 1 ? "portions" : "portion");

                                            // "X unit(s) of [Item] (Y portions total)"
                                            let fullSentence = `${quantity} ${quantity > 1 ? "units" : "unit"} of ${itemName}`;
                                            if (portionQuantity > 0) {
                                                fullSentence += ` (${totalPortions} ${portionText})`;
                                            }
                                            if (options.length > 0) {
                                                const optionsTextList = options.map((opt) => `${opt.quantity || 1} ${opt.label}`);
                                                const optionsSentence = optionsTextList.length === 1
                                                    ? optionsTextList[0]
                                                    : optionsTextList.length === 2
                                                        ? optionsTextList.join(" and ")
                                                        : optionsTextList.slice(0, -1).join(", ") + ", and " + optionsTextList.slice(-1);
                                                fullSentence += `, each with ${optionsSentence}`;
                                            }
                                            fullSentence += ".";

                                            return (
                                                <div key={idx} className="flex gap-3 bg-zinc-900 text-white p-3.5 rounded-md border border-zinc-800 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 rounded-full blur-2xl -mr-12 -mt-12" />
                                                    <div className="p-2 bg-zinc-800 rounded-md shrink-0 relative z-10 self-start">
                                                        <Hash size={12} className="text-orange-500" />
                                                    </div>
                                                    <p className="text-[12px] font-black uppercase tracking-wide leading-tight relative z-10 mt-0.5">{fullSentence}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                <button 
                                    onClick={() => setIsSummaryModalOpen(false)}
                                    className="w-full py-3 bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity active:scale-95 shadow-none"
                                >
                                    Acknowledge & Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className="fixed top-6 right-6 z-[100] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md shadow-2xl flex items-center gap-4 min-w-[320px]"
                    >
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
                            <Check size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">STATUS SYNCHRONIZED</p>
                            <p className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest mt-0.5">Manifest updated successfully.</p>
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
                        className="fixed top-6 right-6 z-[100] bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-900/30 p-4 rounded-md shadow-2xl flex items-center gap-4 max-w-md min-w-[320px]"
                    >
                         <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-md">
                            <X size={20} className="text-rose-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white leading-none mb-1">OPERATION FAILED</p>
                            <p className="text-[9px] font-bold uppercase text-rose-500 tracking-widest line-clamp-2">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <X size={14} className="text-zinc-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-4">

                {/* Header Section with Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-md p-4 border border-zinc-100 dark:border-zinc-800 shadow-none"
                >
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <button onClick={() => router.back()}
                                    className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 border border-zinc-100 dark:border-zinc-700">
                                    <ChevronLeft size={16} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-2">Order Manifest</h1>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${statusConfig.color}`}>
                                            <StatusIcon size={12} strokeWidth={3} />
                                            <span>{statusConfig.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-100 dark:border-zinc-800 h-[22px]">
                                            <Hash size={10} className="text-zinc-400" />
                                            <span className="text-[9px] font-black text-zinc-400 leading-none">{(order._id?.$oid || order._id || "").toString().slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 text-zinc-400 py-1.5 px-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-md border border-zinc-100/50 dark:border-zinc-800/50">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{dateStr} — {timeStr}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400 py-1.5 px-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-md border border-zinc-100/50 dark:border-zinc-800/50">
                                    <ShoppingBag size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{detailedItems.length} SKU POSITIONS</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {availableActions.length > 0 && (
                            <div className="flex flex-col gap-3 min-w-[280px]">
                                <div className="flex items-center gap-2 leading-none border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-1">
                                    <div className="p-1 bg-orange-600/10 rounded-md">
                                        <Layers size={10} className="text-orange-600" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Lifecycle Control</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableActions.map((status) => {
                                        const statusLabels = {
                                            'accepted': { label: 'Accept Order', icon: Check },
                                            'preparing': { label: 'Start Preparing', icon: ShoppingBag },
                                            'ready': { label: 'Mark as Ready', icon: CheckCircle2 },
                                            'ready_for_pickup': { label: 'Mark as Ready', icon: CheckCircle2 },
                                            'delivered': { label: 'Mark as Delivered', icon: CheckCircle2 },
                                            'completed': { label: 'Complete Order', icon: Check },
                                            'cancelled': { label: 'Cancel Order', icon: X },
                                            'refunded': { label: 'Refund Customer', icon: CreditCard }
                                        };

                                        const actionConfig = statusLabels[status];
                                        if (!actionConfig) return null;
                                        
                                        const ActionIcon = actionConfig.icon;
                                        const isCancelAction = status === 'cancelled';
                                        
                                        const isLockedPlatformAction = isPlatformDelivery && lockedPlatformStatuses.includes(status);

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(status)}
                                                disabled={isUpdating || isLockedPlatformAction}
                                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex-1 min-w-[130px] border shadow-none ${isCancelAction
                                                    ? 'bg-white dark:bg-zinc-900 text-rose-600 border-rose-100 dark:border-rose-900/40 hover:bg-rose-50'
                                                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent hover:opacity-90'
                                                    } ${status === 'accepted' || status === 'preparing' || status === 'ready' || status === 'ready_for_pickup' ? 'bg-orange-600 text-white border-transparent' : ''}`}
                                            >
                                                {isUpdating ? (
                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <ActionIcon size={12} strokeWidth={3} />
                                                )}
                                                {isUpdating ? 'SYNCING...' : actionConfig.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Timeline */}
                    <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                        {isPlatformDelivery && (order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'ready') && (
                            <div className="mb-6 bg-blue-50/50 dark:bg-blue-600/10 border border-blue-100 dark:border-blue-700/30 p-4 rounded-md flex items-start sm:items-center gap-3 text-blue-800 dark:text-blue-300 shadow-none">
                                <AlertCircle className="shrink-0 text-blue-500" size={16} strokeWidth={3} />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                    Status: <span className="text-blue-700 dark:text-blue-200">READY FOR EXTRACTION.</span> Platform auto-assignment in progress. Awaiting courier engagement.
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-between overflow-x-auto pb-4 no-scrollbar gap-2">
                            {['Pending', 'Accepted', 'Preparing', 'Ready', 'In Transit', 'Delivered'].map((step, idx) => {
                                const isCompleted = idx <= Math.min(currentStatusIndex, 5);
                                const isCurrent = idx === Math.min(currentStatusIndex, 5);

                                return (
                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                        <div className="flex flex-col items-center gap-2 min-w-[70px]">
                                            <div
                                                className={`w-8 h-8 rounded-md flex items-center justify-center border transition-all ${isCompleted
                                                    ? 'border-transparent bg-orange-600 text-white'
                                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-300'
                                                    } ${isCurrent ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-zinc-950 scale-110' : ''}`}
                                            >
                                                {isCompleted ? <Check size={14} strokeWidth={4} /> : <span className="text-[9px] font-black">{idx + 1}</span>}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
                                                }`}>
                                                {step}
                                            </span>
                                        </div>
                                        {idx < 5 && (
                                            <div className={`h-[1px] flex-1 min-w-[20px] mx-2 transition-all ${idx < Math.min(currentStatusIndex, 5) ? 'bg-orange-600' : 'bg-zinc-100 dark:bg-zinc-800'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">

                        {/* Items Manifest */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-none"
                        >
                            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md text-zinc-400">
                                        <ShoppingBag size={14} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[12px] text-zinc-900 dark:text-white uppercase tracking-widest">Items Manifest</h3>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Extraction Protocol: Preparation Required</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md border-none">
                                        {detailedItems.length} POSITIONS
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/10">
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
                                    
                                    const cleanPortionLabel = portionLabel?.trim() || "";
                                    let portionText = cleanPortionLabel || (totalPortions > 1 ? "portions" : "portion");

                                    // "X unit(s) of [Item] (Y portions total)"
                                    let fullSentence = `${quantity} ${quantity > 1 ? "units" : "unit"} of ${itemName}`;
                                    if (portionQuantity > 0) {
                                        fullSentence += ` (${totalPortions} ${portionText})`;
                                    }
                                    if (options.length > 0) {
                                        const optionsTextList = options.map((opt) => `${opt.quantity || 1} ${opt.label}`);
                                        const optionsSentence = optionsTextList.length === 1
                                            ? optionsTextList[0]
                                            : optionsTextList.length === 2
                                                ? optionsTextList.join(" and ")
                                                : optionsTextList.slice(0, -1).join(", ") + ", and " + optionsTextList.slice(-1);
                                        fullSentence += `, each with ${optionsSentence}`;
                                    }
                                    fullSentence += ".";

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 + 0.2 }}
                                            className="p-4 flex flex-col gap-4 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-all group"
                                        >
                                            <div className="flex flex-col sm:flex-row gap-5">
                                                {/* Image & Quantity */}
                                                <div className="w-20 h-20 rounded-md bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex-shrink-0 relative border border-zinc-100 dark:border-zinc-800">
                                                    {itemImage ? (
                                                        <img src={itemImage} alt={itemName} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-zinc-100">
                                                            <ShoppingBag size={20} />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-1 left-1 bg-zinc-900 border border-zinc-800 text-white min-w-[20px] h-5 px-1.5 rounded-md flex items-center justify-center font-black text-[9px] uppercase tracking-tighter">
                                                        {quantity}X
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Header & Pricing */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                                        <div>
                                                            <h4 className="font-black text-zinc-900 dark:text-white text-[13px] uppercase tracking-tight leading-none mb-1.5 group-hover:text-orange-600 transition-colors">
                                                                {itemName}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {itemType && (
                                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">{itemType}</span>
                                                                )}
                                                                {dietaryType && (
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${
                                                                        dietaryType.toLowerCase().includes('halal') ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                                        dietaryType.toLowerCase().includes('veg') ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 
                                                                        dietaryType.toLowerCase().includes('non') ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 
                                                                        'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                                                    }`}>{dietaryType}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-tight">₦{lineTotal.toLocaleString()}</p>
                                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">₦{unitPrice.toLocaleString()} / UNIT</p>
                                                        </div>
                                                    </div>

                                                    {/* Instruction Manifest */}
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-950/30 rounded-md p-3 border border-zinc-100 dark:border-zinc-800/50">
                                                        <div className="flex items-center gap-2 mb-2 leading-none">
                                                            <Package size={10} className="text-zinc-400" />
                                                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">PREPARATION MANIFEST</p>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black text-zinc-700 dark:text-zinc-200 flex items-center gap-2 uppercase tracking-wide leading-none">
                                                                <span className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
                                                                EXTRACT {totalPortions} {portionText.toUpperCase()}
                                                            </p>
                                                            
                                                            {options.length > 0 && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-3.5 border-l border-zinc-200 dark:border-zinc-800">
                                                                    {options.map((opt, oIdx) => (
                                                                        <p key={oIdx} className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 leading-none">
                                                                            <span className="text-orange-600">{(Number(opt.quantity) || 1) * quantity}X</span> {opt.label}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {portionQuantity > 1 && quantity > 1 && (
                                                                <div className="mt-2 text-center py-1.5 bg-orange-600/5 rounded-md border border-orange-600/10">
                                                                    <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest leading-none">CALCULATION: {portionQuantity} PORTIONS × {quantity} ORDERS = {totalPortions} TOTAL UNITS</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Kitchen Note */}
                                                    {note && (
                                                        <div className="mt-3 flex items-start gap-3 bg-amber-50/30 dark:bg-amber-900/10 p-3 rounded-md border border-dashed border-amber-200 dark:border-amber-800">
                                                            <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-md text-amber-600">
                                                                <AlertCircle size={12} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-0.5">KITCHEN NOTE</p>
                                                                <p className="text-[11px] font-bold italic text-zinc-700 dark:text-zinc-300">"{note}"</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Summary Banner */}
                                            <div className="flex items-center gap-3 bg-zinc-900 text-white p-3 rounded-md border border-zinc-800 overflow-hidden relative">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 rounded-full blur-2xl -mr-12 -mt-12" />
                                                <div className="p-2 bg-zinc-800 rounded-md relative z-10 shrink-0">
                                                    <Hash size={14} className="text-orange-600" />
                                                </div>
                                                <div className="flex-1 relative z-10">
                                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">DIRECTIVE SUMMARY</p>
                                                    <p className="text-[11px] font-black uppercase tracking-wide leading-tight">{fullSentence}</p>
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
                            className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-none"
                        >
                            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md text-emerald-600">
                                    <Receipt size={14} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="font-black text-[12px] text-zinc-900 dark:text-white uppercase tracking-widest">Earnings Breakdown</h3>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Escrow Payout Reconciliation</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Food Subtotal</span>
                                        <span className="text-[12px] font-black text-zinc-900 dark:text-white">₦{(order.vendorTotal + (order.commission || 0)).toLocaleString()}</span>
                                    </div>

                                    {order.commission > 0 && (
                                        <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Platform Commission</span>
                                                <div className="p-1 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                                                    <Info size={10} className="text-zinc-400" />
                                                </div>
                                            </div>
                                            <span className="text-[12px] font-black text-rose-600">- ₦{order.commission.toLocaleString()}</span>
                                        </div>
                                    )}

                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex justify-between items-end bg-zinc-50 dark:bg-zinc-950 p-4 rounded-md border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Projected Net Payout</span>
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Released to wallet on delivery</span>
                                        </div>
                                        <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                            ₦{((order.vendorTotal || 0) + (order.deliveryShare || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-emerald-600/5 rounded-md border border-emerald-600/10">
                                    <Wallet size={14} className="text-emerald-600 shrink-0" />
                                    <p className="text-[9px] font-black text-emerald-600/80 uppercase tracking-widest leading-none">
                                        Escrow Protection: Funds released to wallet upon verified delivery.
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
                            className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-none"
                        >
                            <div className="p-5 flex flex-col items-center text-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                                <div className="relative mb-3">
                                    <div className="w-20 h-20 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.firstname} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                <User size={32} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-md border-2 border-white dark:border-zinc-900">
                                        <CheckCircle2 size={12} />
                                    </div>
                                </div>
                                <h3 className="font-black text-[14px] text-zinc-900 dark:text-white uppercase tracking-tight">{user ? `${user.firstname} ${user.lastname}` : "SECURE GUEST"}</h3>
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mt-1">Verified Logistics Client</p>
                            </div>

                            <div className="p-4">
                                <a
                                    href={`tel:${user?.phone || userOrderId?.phone}`}
                                    className="w-full bg-zinc-900 dark:bg-zinc-800 text-white py-3 rounded-md flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border border-zinc-800"
                                >
                                    <Phone size={14} />
                                    <span>Initiate Communication</span>
                                </a>
                            </div>
                        </motion.div>

                        {/* Logistics Context */}
                        {address && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-none"
                            >
                                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                                    <MapPin size={14} className="text-blue-600" strokeWidth={3} />
                                    <h4 className="font-black text-[11px] text-zinc-900 dark:text-white uppercase tracking-widest">Drop-Off Point</h4>
                                </div>
                                <div className="p-5">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-md bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20">
                                                <Navigation size={14} />
                                            </div>
                                            <div className="w-px flex-1 bg-zinc-100 dark:bg-zinc-800 my-2" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">{address.label || "TARGET DESTINATION"}</p>
                                            <p className="text-[12px] font-black text-zinc-900 dark:text-white leading-tight uppercase tracking-tight truncate">
                                                {address.addressLine}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{address.city}, {address.state}</p>
                                        </div>
                                    </div>

                                    <div className="bg-orange-600/5 rounded-md p-3 border border-orange-600/10 mt-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Truck size={12} className="text-orange-600" />
                                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Chain of Custody</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                            MelaChow logistics will execute pickup at designated loading zone.
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
                            className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-none p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20">
                                        <CreditCard size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Transaction State</p>
                                        <p className="font-black text-zinc-900 dark:text-white text-[13px] uppercase tracking-tight mt-0.5">
                                            {userOrderId?.paymentStatus === 'paid' ? 'Asset Secured' : 'Pending Verification'}
                                        </p>
                                    </div>
                                </div>
                                {userOrderId?.paymentStatus === 'paid' && (
                                    <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                                        PAID
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Termination Protocol Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-md max-w-sm w-full border border-zinc-100 dark:border-zinc-800 shadow-none"
                        >
                            <div className="flex flex-col items-center text-center gap-5">
                                <div className="p-3 bg-rose-600/10 rounded-md text-rose-600 border border-rose-600/20">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-black text-zinc-900 dark:text-white uppercase tracking-tight">Terminate Order?</h3>
                                    
                                    {['accepted', 'preparing', 'ready_for_pickup'].includes(order?.orderStatus) ? (
                                        <div className="text-zinc-600 dark:text-zinc-400 mt-4 text-[11px] font-bold text-left bg-rose-600/5 p-4 rounded-md border border-rose-600/10 uppercase tracking-widest space-y-2">
                                            <p className="text-rose-600 font-black">ALERT: Active Protocol Interruption</p>
                                            <div className="space-y-1 mt-2">
                                                <p>• Automated customer refund will initiate.</p>
                                                <p>• Vendor payout authorization revoked.</p>
                                                <p>• Reliability metrics will be impacted.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-[11px] font-bold uppercase tracking-widest">
                                            Authorize order declination? Refund will be processed immediately.
                                        </p>
                                    )}
                                    <p className="text-rose-600 text-[10px] font-black mt-5 uppercase tracking-widest border border-rose-600/20 py-2 rounded-md">PROTOCOL IRREVERSIBLE</p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="flex-1 py-3 rounded-md font-black text-[11px] uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 active:scale-95 transition-all"
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

        </div>
    );
}
