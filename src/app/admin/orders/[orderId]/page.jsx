"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    DollarSign,
    Store,
    Truck,
    AlertCircle,
    Info,
    Calendar,
    ChevronRight,
    MessageSquare,
    ShoppingBag,
    Wallet,
    Star,
    Hash,
    Map,
    Activity,
    TrendingUp,
    Bike,
    ExternalLink,
    MoreHorizontal,
    Navigation,
    ShieldCheck,
    Navigation2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import AdminRiderAssignmentModal from '@/app/components/admin/AdminRiderAssignmentModal';
import { generateOrderItemsStatement } from "@/app/lib/utils";

const statusConfig = {
    pending: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", label: "Pending Activation" },
    accepted: { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", label: "Accepted by Store" },
    preparing: { color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", label: "Kitchen Preparing" },
    ready_for_pickup: { color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", label: "Ready for Pickup" },
    rider_assigned: { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", label: "Driver Dispatched" },
    out_for_delivery: { color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100", label: "En Route" },
    delivered: { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", label: "Delivered" },
    completed: { color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Order Fulfilled" },
    cancelled: { color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", label: "Cancelled" },
    failed: { color: "text-red-500", bg: "bg-red-50", border: "border-red-100", label: "Delivery Failed" },
    refunded: { color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", label: "Refunded" },
};

const ContentCard = ({ title, children, icon: Icon, action, className = "" }) => (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {Icon && <Icon size={16} className="text-slate-500" />}
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            </div>
            {action && action}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

export default function OrderDetailsPage() {
    const { orderId } = useParams();
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "confirm",
        statusToOverride: "",
        inputValue: "",
        isLoading: false
    });

    const [riderAssignModal, setRiderAssignModal] = useState({
        show: false,
        orderData: null
    });

    const fetchOrderDetails = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSingleOrder(orderId);
            setOrder(data.data?.order);
        } catch (err) {
            setError(err.message || "Failed to load order");
            toast.error("Error fetching order details");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

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

    const handleOverrideStatus = () => {
        setConfirmModal({
            show: true,
            title: "Override Order Status",
            message: "This will manually update the system state for this order.",
            type: "prompt",
            statusToOverride: order.orderStatus,
            inputValue: "",
            onConfirm: async (reason) => {
                if (!reason?.trim()) {
                    toast.error("Please provide a reason");
                    return;
                }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.adminOverrideOrderStatus(order._id, confirmModal.statusToOverride, reason);
                    toast.success("Order status overridden");
                    fetchOrderDetails();
                    setConfirmModal(prev => ({ ...prev, show: false }));
                } catch (err) {
                    toast.error(err.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    if (loading) {
        return (
            <AdminProtectedRoute>
                <AdminDashboardLayout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4">
                        <Loader2 className="animate-spin text-slate-400 mb-4" size={40} />
                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">Syncing Order Intelligence...</p>
                    </div>
                </AdminDashboardLayout>
            </AdminProtectedRoute>
        );
    }

    if (error || !order) {
        return (
            <AdminProtectedRoute>
                <AdminDashboardLayout>
                    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Order Sync Failed</h2>
                        <p className="text-slate-500 font-bold mb-8">The requested order synchronization could not be completed. The resource might be unavailable or removed.</p>
                        <button onClick={() => router.push("/admin/orders")} className="bg-slate-900 text-white px-8 h-14 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto">
                            <ArrowLeft size={16} /> Return to Registry
                        </button>
                    </div>
                </AdminDashboardLayout>
            </AdminProtectedRoute>
        );
    }

    const currentStatus = statusConfig[order.orderStatus || order.status] || { color: "text-slate-500", bg: "bg-slate-50", label: order.orderStatus };

    // Calculate Financials
    const subtotal = order.financialSummary?.subtotal || order.subtotal || 0;
    const deliveryFee = order.financialSummary?.totalDeliveryFee || order.deliveryFee || 0;
    
    const isPlatformManaged = order.deliveryType === "platform_managed";
    
    // MelaChow System now uses a Fixed Rider Payout strategy (₦600) rather than a rigid 80/20 percentage split.
    const riderShare = isPlatformManaged ? Math.min(600, deliveryFee) : 0; 
    
    // Platform Revenue = Sale Commission + Platform Logistics (Remaining Delivery Fee)
    const saleCommission = order.financialSummary?.totalCommission || 0;
    const deliveryCommission = isPlatformManaged ? Math.max(0, deliveryFee - riderShare) : 0;
    const totalPlatformRevenue = saleCommission + deliveryCommission;
    
    // Vendor Gross Earnings: 
    // Subtotal - Sale Commission + Delivery Fee (ONLY if they handle delivery themselves)
    const vendorDeliveryEarnings = isPlatformManaged ? 0 : deliveryFee;
    const vendorOrderFoodEarnings = order.financialSummary?.totalVendorEarnings || (subtotal - saleCommission);
    const vendorEarnings = vendorOrderFoodEarnings + vendorDeliveryEarnings;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1500px] mx-auto pb-20">

                    {/* SYSTEM LOGISTICS HEADER */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={() => router.push("/admin/orders")}
                                className="mt-1 w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <div className="px-2 py-1 bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                                        {order.orderId}
                                    </div>
                                    <div className={`px-2 py-1 rounded border ${currentStatus.border} ${currentStatus.bg} ${currentStatus.color} text-xs font-semibold`}>
                                        {currentStatus.label}
                                    </div>
                                    <div className={`px-2 py-1 rounded border ${order.deliveryType === "platform_managed" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"} text-xs font-medium flex items-center gap-1`}>
                                        <Truck size={12} /> {order.deliveryType === "platform_managed" ? "Platform Managed" : "Vendor Managed"}
                                    </div>
                                </div>
                                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    Order Details
                                    <span className="text-slate-300 font-normal">|</span>
                                    <span className="text-slate-500 font-medium text-sm">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleOverrideStatus}
                                className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <ShieldCheck size={16} /> Override Status
                            </button>
                        </div>
                    </div>

                    {/* DESCRIPTIVE NARRATIVE SUMMARY */}
                    <div className="mb-8">
                        <div className="bg-slate-900 rounded-2xl p-3 border border-slate-700 shadow-xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full -translate-y-32 translate-x-32 opacity-20" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Intelligent Order Narrative</p>
                                </div>
                                <h2 className="text-lg md:text-xl font-black text-white leading-relaxed uppercase italic tracking-tight">
                                    {generateOrderItemsStatement(order, { includeCustomerName: true })}
                                </h2>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        System Processed
                                    </div>
                                    <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Fulfillment Ready
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3-COLUMN LOGISTICS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">

                        {/* COLUMN 1: ORDER & CUSTOMER DETAILS */}
                        <div className="space-y-6">
                            <ContentCard title="Order Basket" icon={ShoppingBag}>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 hover:shadow-sm transition-shadow">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden relative flex-shrink-0">
                                                    <img
                                                        src={item.image_url || item.foodId?.image || order.items[0]?.restaurantId?.logo}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-0 right-0 bg-slate-900 text-white px-1.5 py-0.5 rounded-bl-lg text-[10px] font-bold">
                                                        x{item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 text-sm truncate">
                                                        {item.name || item.foodId?.name}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {item.portion_label && (
                                                            <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 rounded-md border border-orange-100">
                                                                {item.portion_label} {item.portion_quantity > 1 ? `(x${item.portion_quantity})` : ''}
                                                            </span>
                                                        )}
                                                        {item.item_type && (
                                                            <span className="text-[10px] font-medium text-slate-500 border border-slate-200 px-2 rounded-md bg-slate-50">
                                                                {item.item_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Selected Options */}
                                                    {item.selected_options?.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {item.selected_options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center justify-between text-[11px]">
                                                                    <span className="text-slate-600 flex items-center gap-1.5 capitalize">
                                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                        {opt.label} {opt.quantity > 1 ? `(x${opt.quantity})` : ''}
                                                                    </span>
                                                                    {opt.price_modifier_naira > 0 && (
                                                                        <span className="text-slate-500 font-medium">+₦{opt.price_modifier_naira}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        ₦{item.price.toLocaleString()} ea
                                                    </p>
                                                </div>
                                            </div>
                                            {item.note && (
                                                <div className="mt-3 pl-4 border-l-2 border-orange-200">
                                                    <p className="text-[10px] font-medium text-slate-500 italic">Note: {item.note}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ContentCard>

                            <ContentCard title="Customer Information" icon={User}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                        {order.userId?.firstname?.[0]}{order.userId?.lastname?.[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{order.userId?.firstname} {order.userId?.lastname}</h4>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Platform Buyer
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                                        <Mail size={14} className="text-slate-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500">Email</p>
                                            <p className="text-sm font-medium text-slate-900 truncate">{order.userId?.email}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                                        <Phone size={14} className="text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">Phone</p>
                                            <p className="text-sm font-medium text-slate-900">{order.userId?.phone || order.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="bg-slate-50 text-slate-900 p-3 rounded-lg border border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Destination Address</p>
                                        <p className="text-sm font-medium mb-2 leading-tight">{order.deliveryAddress?.addressLine}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-slate-500">{order.deliveryAddress?.city}, {order.deliveryAddress?.state}</div>
                                        </div>
                                    </div>
                                </div>
                            </ContentCard>
                        </div>

                        {/* COLUMN 2: LOGISTICS & RIDER TIMELINE */}
                        <div className="space-y-6">
                            <ContentCard title="Fulfillment Rider" icon={Bike}>
                                {order.riderId ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                                {order.riderId?.firstname?.[0]}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-900">{order.riderId?.firstname} {order.riderId?.lastname}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Activity size={12} className="text-emerald-500" /> Active
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Navigation2 size={12} className="text-blue-500" /> {order.riderId?.vehicleType || "Motorbike"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button className="h-9 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                                                <Phone size={14} /> Contact
                                            </button>
                                            <button className="h-9 bg-slate-900 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
                                                <Map size={14} /> Map
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-sm border border-slate-200">
                                            <Bike size={18} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 mb-3">Awaiting Dispatch</p>
                                        
                                        {/* Assign Button for Platform Managed Orders */}
                                        {order.deliveryType === 'platform_managed' && (
                                            <button
                                              onClick={() => setRiderAssignModal({
                                                show: true,
                                                orderData: {
                                                  vendorOrderId: order.vendorOrders?.[0]?._id || order._id,
                                                  restaurantName: order.items?.[0]?.restaurantId?.storeName || 'Restaurant',
                                                  readyAt: order.updatedAt,
                                                  url: `/admin/orders/${order.orderId}`
                                                }
                                              })}
                                              className="h-9 px-4 bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 mx-auto hover:bg-slate-800"
                                            >
                                              <Truck size={14} /> Assign Rider
                                            </button>
                                        )}
                                    </div>
                                )}
                            </ContentCard>

                            <ContentCard title="Order Logs" icon={Activity}>
                                <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                                    {(order.statusLog || []).map((log, idx) => (
                                        <div key={idx} className="relative pl-8">
                                            <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 border-white z-10 ${statusConfig[log.status]?.bg || 'bg-slate-200'}`} />
                                            <div>
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className={`text-xs font-semibold ${statusConfig[log.status]?.color || 'text-slate-600'}`}>
                                                        {statusConfig[log.status]?.label || log.status}
                                                    </p>
                                                    <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {log.reason && (
                                                    <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-1 mb-1 text-xs text-slate-600">
                                                        &quot;{log.reason}&quot;
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    By: {log.changedBy || 'System'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ContentCard>
                        </div>

                        {/* COLUMN 3: FINANCIAL SETTLEMENT */}
                        <div className="space-y-6">
                            <ContentCard title="Financial Settlement" icon={Wallet}>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-sm text-slate-500">Subtotal</span>
                                        <span className="text-sm font-semibold text-slate-900">₦{subtotal?.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-sm text-slate-500">Delivery Fee</span>
                                        <span className="text-sm font-semibold text-slate-900">₦{(order.financialSummary?.totalDeliveryFee || order.deliveryFee || 0).toLocaleString()}</span>
                                    </div>

                                    {order.appliedDiscount && (
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-sm font-medium text-emerald-600">Platform Promo</span>
                                            <span className="text-sm font-semibold text-emerald-600">-₦{(order.appliedDiscount.amount_saved || 0).toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-slate-200 my-2" />

                                    <div className="flex justify-between items-center px-2 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Gross Total</p>
                                            <p className="text-xs text-slate-400">{order.paymentStatus} (Paystack)</p>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">₦{order.total?.toLocaleString()}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 mt-4">
                                        <div className="p-4 bg-white border border-orange-200 rounded-lg">
                                            <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Platform Revenue</p>
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-lg font-bold text-slate-900">₦{totalPlatformRevenue?.toLocaleString()}</h4>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                <span>Sale: ₦{saleCommission.toLocaleString()}</span>
                                                {deliveryCommission > 0 && <span>| Logistics: ₦{deliveryCommission.toLocaleString()}</span>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Vendor Payout</p>
                                                <h4 className="text-base font-bold text-slate-900">₦{vendorEarnings?.toLocaleString()}</h4>
                                            </div>
                                            <div className="p-3 bg-white border border-blue-200 rounded-lg">
                                                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Rider Share</p>
                                                <h4 className="text-base font-bold text-slate-900">₦{riderShare?.toLocaleString()}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ContentCard>
                        </div>
                    </div>
                </div>

                {/* OVERRIDE MODAL */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, show: false }))}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                            >
                                <div className="p-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 border border-slate-200">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-sm mb-6">{confirmModal.message}</p>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">New Status</label>
                                            <select
                                                value={confirmModal.statusToOverride}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, statusToOverride: e.target.value }))}
                                                className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                            >
                                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                                    <option key={key} value={key}>{cfg.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Reason</label>
                                            <textarea
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                placeholder="Reason for manual override..."
                                                className="w-full h-24 bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="h-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="h-10 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {confirmModal.isLoading && <Loader2 size={16} className="animate-spin" />}
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    <AdminRiderAssignmentModal
                        isOpen={riderAssignModal.show}
                        onClose={() => setRiderAssignModal({ show: false, orderData: null })}
                        orderData={riderAssignModal.orderData}
                        onAssigned={() => {
                            fetchOrderDetails();
                            setRiderAssignModal({ show: false, orderData: null });
                        }}
                    />
                </AnimatePresence>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

const Percent = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="19" x2="5" y1="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
);
