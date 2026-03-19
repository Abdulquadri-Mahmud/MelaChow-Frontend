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
    <div className={`bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
                {Icon && <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100"><Icon size={16} /></div>}
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none pt-0.5">{title}</h3>
            </div>
            {action && action}
        </div>
        <div className="p-6">{children}</div>
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
    
    // Platform Revenue = Sale Commission + 20% Delivery Fee (if platform managed)
    const saleCommission = order.financialSummary?.totalCommission || 0;
    const deliveryCommission = order.deliveryType === "platform_managed" ? (deliveryFee * 0.2) : 0;
    const totalPlatformRevenue = saleCommission + deliveryCommission;
    
    // Vendor Gross Earnings = Subtotal - Sale Commission
    const vendorEarnings = subtotal - saleCommission;
    
    // Rider Share = 80% of Delivery Fee (if platform managed)
    const riderShare = order.deliveryType === "platform_managed" ? (deliveryFee * 0.8) : deliveryFee;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1500px] mx-auto pb-20 px-4">

                    {/* SYSTEM LOGISTICS HEADER */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={() => router.push("/admin/orders")}
                                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-slate-200">
                                        <Hash size={12} className="text-slate-500" /> {order.orderId}
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg border ${currentStatus.border} ${currentStatus.bg} ${currentStatus.color} text-[10px] font-black uppercase tracking-widest`}>
                                        {currentStatus.label}
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg border ${order.deliveryType === "platform_managed" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"} text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                                        <Truck size={12} /> {order.deliveryType === "platform_managed" ? "Platform Managed" : "Vendor Managed"}
                                    </div>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Logistics Fulfillment Profile
                                    <span className="text-slate-200">/</span>
                                    <span className="text-slate-400 font-bold text-lg">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleOverrideStatus}
                                className="h-12 px-6 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-orange-100 flex items-center gap-2"
                            >
                                <ShieldCheck size={18} /> Update Status
                            </button>
                            <button className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 3-COLUMN LOGISTICS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">

                        {/* COLUMN 1: ORDER & CUSTOMER DETAILS */}
                        <div className="space-y-8">
                            <ContentCard title="Order Basket" icon={ShoppingBag}>
                                <div className="space-y-5">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="bg-slate-50/50 rounded-3xl p-4 border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                            <div className="flex gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden relative border border-slate-100 flex-shrink-0 shadow-sm">
                                                    <img
                                                        src={item.image_url || item.foodId?.image || order.items[0]?.restaurantId?.logo}
                                                        alt=""
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute -top-1 -right-1 bg-slate-900 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md">
                                                        {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-slate-900 text-sm tracking-tight truncate">
                                                        {item.name || item.foodId?.name}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                                        {item.portion_label && (
                                                            <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                                                {item.portion_label} {item.portion_quantity > 1 ? `(x${item.portion_quantity})` : ''}
                                                            </span>
                                                        )}
                                                        {item.item_type && (
                                                            <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest border border-slate-200 px-1.5 py-0.5 rounded bg-white">
                                                                {item.item_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Selected Options */}
                                                    {item.selected_options?.length > 0 && (
                                                        <div className="mt-3 space-y-1.5">
                                                            {item.selected_options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center justify-between text-[10px]">
                                                                    <span className="font-bold text-slate-500 flex items-center gap-1.5 capitalize">
                                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                        {opt.label} {opt.quantity > 1 ? `(x${opt.quantity})` : ''}
                                                                    </span>
                                                                    {opt.price_modifier_naira > 0 && (
                                                                        <span className="text-slate-400 font-medium">+₦{opt.price_modifier_naira}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900 tracking-tighter">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">
                                                        ₦{item.price.toLocaleString()} unit
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
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center text-white text-lg font-black shadow-xl shadow-slate-200 ring-4 ring-slate-50">
                                        {order.userId?.firstname?.[0]}{order.userId?.lastname?.[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight mb-1">{order.userId?.firstname} {order.userId?.lastname}</h4>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Platform Buyer
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center gap-3">
                                        <Mail size={16} className="text-slate-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">Registered Email</p>
                                            <p className="text-xs font-bold text-slate-700 truncate">{order.userId?.email}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center gap-3">
                                        <Phone size={16} className="text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">Contact Protocol</p>
                                            <p className="text-xs font-bold text-slate-700">{order.userId?.phone || order.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-50">
                                    <div className="bg-slate-900 text-white p-5 rounded-[28px] shadow-2xl shadow-slate-200 relative overflow-hidden group">
                                        <MapPin className="absolute -top-4 -right-4 w-20 h-20 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 leading-none">Destination Coordinates</p>
                                        <p className="text-sm font-black tracking-tight leading-tight mb-4 relative z-10">{order.deliveryAddress?.addressLine}</p>
                                        <div className="flex items-center gap-2 relative z-10">
                                            <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-black uppercase tracking-widest">{order.deliveryAddress?.city}</div>
                                            <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-black uppercase tracking-widest">{order.deliveryAddress?.state}</div>
                                        </div>
                                    </div>
                                </div>
                            </ContentCard>
                        </div>

                        {/* COLUMN 2: LOGISTICS & RIDER TIMELINE */}
                        <div className="space-y-8">
                            <ContentCard title="Fulfillment Rider" icon={Bike}>
                                {order.riderId ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-orange-100 rounded-[24px] flex items-center justify-center text-orange-600 font-black text-xl border-4 border-orange-50">
                                                {order.riderId?.firstname?.[0]}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-black text-slate-900 tracking-tight">{order.riderId?.firstname} {order.riderId?.lastname}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Activity size={12} className="text-emerald-500" /> Verified Rider
                                                    </span>
                                                    <span className="text-slate-200">|</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Navigation2 size={12} className="text-blue-500" /> {order.riderId?.vehicleType || "Motorbike"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100">
                                                <Phone size={14} /> Contact
                                            </button>
                                            <button className="h-12 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                                                <Map size={14} /> Live View
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <User size={24} />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Awaiting Rider Dispatch</p>
                                        
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
                                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white 
                                                rounded-2xl text-[10px] font-black uppercase tracking-widest 
                                                transition-all shadow-lg shadow-red-100 flex items-center 
                                                gap-2 mx-auto active:scale-95"
                                            >
                                              <Truck size={14} />
                                              Assign Rider Now
                                            </button>
                                        )}
                                    </div>
                                )}
                            </ContentCard>

                            <ContentCard title="Operations Audit Log" icon={Activity}>
                                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                                    {(order.statusLog || []).map((log, idx) => (
                                        <div key={idx} className="relative pl-9 group">
                                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-lg border-[3px] border-white z-10 shadow-sm transition-transform group-hover:scale-110 ${statusConfig[log.status]?.bg || 'bg-slate-200'}`} />
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${statusConfig[log.status]?.color || 'text-slate-600'}`}>
                                                        {statusConfig[log.status]?.label || log.status}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {log.reason && (
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2 mt-1.5 ring-4 ring-white">
                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">&quot;{log.reason}&quot;</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    <User size={10} /> <span className="opacity-80">By:</span> <span className="text-slate-900">{log.changedBy || 'System'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ContentCard>
                        </div>

                        {/* COLUMN 3: FINANCIAL SETTLEMENT */}
                        <div className="space-y-8">
                            <ContentCard title="Financial Settlement" icon={Wallet} className="border-slate-200 shadow-2xl shadow-slate-200">
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><ShoppingBag size={16} /></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-0.5">Subtotal</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-900 tracking-tighter">₦{subtotal?.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-blue-500 border border-slate-100 shadow-sm"><Truck size={16} /></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-0.5">Delivery Fee</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-900 tracking-tighter">₦{(order.financialSummary?.totalDeliveryFee || order.deliveryFee || 0).toLocaleString()}</span>
                                    </div>

                                    {order.appliedDiscount && (
                                        <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><AlertCircle size={16} /></div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pt-0.5">Platform Promo</span>
                                            </div>
                                            <span className="text-lg font-black text-emerald-700 tracking-tighter">-₦{(order.appliedDiscount.amount_saved || 0).toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="h-px bg-slate-100 my-4 shadow-[0_1px_0_0_rgba(255,255,255,1)]" />

                                    <div className="flex flex-col items-center py-8 bg-slate-950 rounded-[40px] text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[80px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-orange-500/20 transition-all duration-700" />
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 leading-none opacity-80">Final Gross Total</p>
                                        <h2 className="text-6xl font-black tracking-tighter leading-none mb-6 relative z-10">₦{order.total?.toLocaleString()}</h2>
                                        <div className="px-6 py-2 bg-white/5 backdrop-blur-md rounded-2xl flex items-center gap-3 border border-white/10 group-hover:border-white/20 transition-all">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none pt-0.5 opacity-90">{order.paymentStatus} via Paystack</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mt-4">
                                        <div className="p-5 bg-orange-50 rounded-[32px] border border-orange-100 group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full translate-x-4 -translate-y-4" />
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1.5 leading-none">Total Platform Revenue</p>
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-2xl font-black text-orange-700 tracking-tighter">₦{totalPlatformRevenue?.toLocaleString()}</h4>
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-orange-100 flex items-center justify-center text-orange-500"><Percent size={18} /></div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-orange-600/60">
                                                <span>Sale: ₦{saleCommission.toLocaleString()}</span>
                                                {deliveryCommission > 0 && <span>Logistics: ₦{deliveryCommission.toLocaleString()}</span>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 group relative overflow-hidden">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Vendor Payout</p>
                                                <h4 className="text-xl font-black text-slate-900 tracking-tighter">₦{vendorEarnings?.toLocaleString()}</h4>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Sale Profit</p>
                                            </div>
                                            <div className="p-5 bg-blue-50/50 rounded-[32px] border border-blue-100/50 group relative overflow-hidden">
                                                <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mb-1.5 leading-none">Rider Share</p>
                                                <h4 className="text-xl font-black text-blue-900 tracking-tighter">₦{riderShare?.toLocaleString()}</h4>
                                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">
                                                    {order.deliveryType === 'platform_managed' ? '80% Delivery' : '100% Delivery'}
                                                </p>
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
                                className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{confirmModal.title}</h3>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Administrative Protocol Active</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">{confirmModal.message}</p>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol: New System Status</label>
                                            <select
                                                value={confirmModal.statusToOverride}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, statusToOverride: e.target.value }))}
                                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-sm appearance-none cursor-pointer"
                                            >
                                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                                    <option key={key} value={key}>{cfg.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mandatory Audit Trail Reason</label>
                                            <textarea
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                placeholder="Please document the justification for this manual override..."
                                                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-[24px] p-6 font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-sm resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-10">
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="h-14 rounded-[20px] border border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                                        >
                                            Abort Operation
                                        </button>
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="h-14 rounded-[20px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                                        >
                                            {confirmModal.isLoading && <Loader2 size={16} className="animate-spin" />}
                                            Commit Protocol
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
