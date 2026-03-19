"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, Navigation, MapPin, Package, CheckCircle2, AlertCircle,
    Wallet, Star, Phone, Loader2, Activity,
    ArrowUpRight, RefreshCcw
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { getActiveRiderOrder, riderPickedUpOrder, riderDeliveredOrder } from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import socketService from "@/app/lib/socketService";
import { useSocket } from "@/app/context/SocketContext";
import { toggleRiderAvailability } from "@/app/lib/riderApi";

export default function RiderDashboard() {
    const { rider, isOnline, refreshProfile } = useRider();
    const { socket } = useSocket();
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const riderId = rider?._id || rider?.id;

    const fetchActiveOrder = async () => {
        if (!riderId) return;
        try {
            const data = await getActiveRiderOrder(riderId);

            // console.log(data);

            const order = data?.data?.order || data?.order || (data?._id ? data : null);
            setActiveOrder(order);
        } catch (error) {
            if (error?.response?.status !== 404) {
                console.error("Failed to fetch active order:", error);
            }
            setActiveOrder(null);
        } finally {
            setLoading(false);
        }
    };

    // console.log(activeOrder);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchActiveOrder(),
                refreshProfile()
            ]);
            toast.success("Dashboard refreshed");
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!riderId) {
            setLoading(false);
            return;
        }

        fetchActiveOrder();

        const handleNewAssignment = () => {
            fetchActiveOrder();
            toast.success("New delivery assigned! 🛵", { duration: 8000 });
        };

        window.addEventListener("rider:new_assignment", handleNewAssignment);
        return () => window.removeEventListener("rider:new_assignment", handleNewAssignment);
    }, [riderId]);

    useEffect(() => {
        if (!socket) return;

        socket.on("order_assigned", (payload) => {
            console.log("🛵 Order assigned via dashboard listener:", payload);
            toast.success("New order assigned to you!");
            fetchActiveOrder();
        });

        return () => {
            socket.off("order_assigned");
        };
    }, [socket]);

    useEffect(() => {
        if (activeOrder?._id) {
            socketService.subscribeToRiderOrder?.(activeOrder._id);
        }
    }, [activeOrder?._id]);

    const handleAction = async (action) => {
        if (!activeOrder || !riderId) return;
        const orderId = activeOrder._id;
        try {
            if (action === "pickup") {
                await riderPickedUpOrder(riderId, orderId);
                toast.success("Order picked up! Head to the customer.");
            } else if (action === "deliver") {
                await riderDeliveredOrder(riderId, orderId);
                toast.success("Order delivered! Well done. 🎉");
            } else if (action === "accept") {
                await toggleRiderAvailability(riderId, "on_delivery");
                toast.success("Delivery Accepted! 🛵");
                await refreshProfile();
            } else if (action === "reject") {
                await toggleRiderAvailability(riderId, "available");
                toast.success("Order rejected");
                setActiveOrder(null);
                await refreshProfile();
            }
            fetchActiveOrder();
        } catch (error) {
            toast.error(error?.response?.data?.message || `Failed to ${action} order`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Greeting */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                        Hey, {rider?.name?.split(" ")[0] || "Rider"} 👋
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        {isOnline ? "You're online. Ready for deliveries!" : "Switch online to start earning."}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                    <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Link
                    href="/rider/wallet"
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-3xl md:p-5 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none cursor-pointer hover:border-orange-500/30 transition-all group block"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Wallet size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Earnings</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-between">
                        ₦{Number(rider?.totalEarnings ?? 0).toLocaleString()}
                        <ArrowUpRight size={16} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">lifetime total</div>
                </Link>

                <div className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-3xl md:p-5 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-lg">
                            <Star size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {rider?.rating ? Number(rider.rating).toFixed(1) : "New"}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">
                        {rider?.ratingCount ? `${rider.ratingCount} reviews` : "No reviews yet"}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-3xl md:p-5 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-lg">
                            <Activity size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deliveries</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {rider?.totalDeliveries ?? 0}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">lifetime</div>
                </div>

                <div className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-3xl md:p-5 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isOnline ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-red-500/10 text-red-600 dark:text-red-500"}`}>
                            <Bike size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                    </div>
                    <div className={`text-xl font-black ${isOnline ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                        {isOnline ? "Online" : "Offline"}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">
                        {isOnline ? "Accepting orders" : "Not accepting orders"}
                    </div>
                </div>
            </div>

            {/* Active Order */}
            <AnimatePresence mode="wait">
                {activeOrder ? (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative overflow-hidden group"
                    >
                        {/* Premium Background with Glow */}
                        <div className="absolute inset-0 bg-orange-50/50 dark:bg-gradient-to-br dark:from-orange-800 dark:to-orange-950 rounded-[20px] border border-orange-100 dark:border-white/5 shadow-sm dark:shadow-none transition-all" />
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-200/20 dark:bg-white/10 rounded-full blur-3xl opacity-50 transition-all" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-100/20 dark:bg-orange-300/10 rounded-full blur-3xl opacity-30 transition-all" />

                        <div className="relative z-10 md:p-6 p-3 md:p-8">
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-white/20 backdrop-blur-md rounded-full border border-orange-200 dark:border-white/20 text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-white">
                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                                        Live Job
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                        {rider?.status === "pending_assignment" ? "New Request" :
                                            activeOrder.status === "assigned" ? "Head to Store" : "Out for Delivery"}
                                    </h2>
                                    <p className="text-gray-500 dark:text-white/70 text-xs font-bold uppercase tracking-tighter">
                                        Order #{String(activeOrder.orderId || activeOrder._id || "").toUpperCase().slice(-8)}
                                    </p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-orange-600 dark:bg-white/10 backdrop-blur-md border border-orange-500 dark:border-white/10 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Bike size={32} className="text-white animate-pulse" />
                                </div>
                            </div>

                            {/* Route Visualization */}
                            <div className="relative space-y-8 mb-8">
                                {/* Vertical Path Line */}
                                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-orange-200 dark:bg-white/20 border-dashed border-l" />

                                {/* Pickup */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 z-10 border border-orange-100 dark:border-white/20 shadow-sm">
                                        <Package size={20} className="text-orange-600 dark:text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black text-orange-600/60 dark:text-white/50 uppercase tracking-widest mb-0.5">Pickup Point</div>
                                        <h4 className="text-gray-900 dark:text-white font-black text-base truncate">
                                            {activeOrder.restaurantName || activeOrder.restaurantId?.storeName || activeOrder.restaurantId?.name || "Restaurant"}
                                        </h4>
                                        <p className="text-gray-500 dark:text-white/70 text-xs font-medium truncate">
                                            {activeOrder.restaurantId?.fullAddress ||
                                                (activeOrder.restaurantId?.address ? `${activeOrder.restaurantId.address.street}, ${activeOrder.restaurantId.address.city}, ${activeOrder.restaurantId.address.state}` : "") ||
                                                activeOrder.restaurantName || "Restaurant Address"}
                                        </p>
                                    </div>
                                </div>

                                {/* Drop-off */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-600 dark:bg-white flex items-center justify-center shrink-0 z-10 shadow-lg shadow-orange-600/20">
                                        <MapPin size={20} className="text-white dark:text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black text-orange-600/60 dark:text-white/50 uppercase tracking-widest mb-0.5">Delivery Point</div>
                                        <h4 className="text-gray-900 dark:text-white font-black text-base truncate">
                                            {activeOrder.userName || (activeOrder.userId?.firstname ? `${activeOrder.userId.firstname} ${activeOrder.userId.lastname || ''}` : "Customer")}
                                        </h4>
                                        <p className="text-gray-500 dark:text-white/70 text-xs font-medium line-clamp-2">
                                            {activeOrder.deliveryFullAddress ||
                                                (activeOrder.deliveryAddress?.addressLine
                                                    ? `${activeOrder.deliveryAddress.addressLine}, ${activeOrder.deliveryAddress.city || ''}, ${activeOrder.deliveryAddress.state || ''}`.replace(/,,/g, ',').trim()
                                                    : activeOrder.deliveryAddress?.address ||
                                                    activeOrder.userOrderId?.deliveryAddress?.addressLine ||
                                                    "Customer Address")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer & Call Section */}
                            <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-3xl p-4 mb-8 flex items-center justify-between border border-orange-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                                        <Star size={18} className="text-orange-600 dark:text-orange-300" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest leading-none mb-1">Customer</p>
                                        <p className="text-gray-900 dark:text-white font-bold text-sm leading-none">
                                            {activeOrder.userName || activeOrder.userId?.firstname || "Guest"}
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={`tel:${activeOrder.userPhone || activeOrder.userId?.phone || activeOrder.userOrderId?.phone || ''}`}
                                    className="h-10 px-4 rounded-xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center gap-2 font-black text-xs hover:bg-orange-700 dark:hover:bg-orange-50 transition-colors shadow-lg active:scale-95"
                                >
                                    <Phone size={14} />
                                    CALL
                                </a>
                            </div>

                            {/* Actions Zone */}
                            <div className="grid grid-cols-2 gap-4">
                                {rider?.status === "pending_assignment" || activeOrder.status === "assigned" ? (
                                    <>
                                        <button
                                            onClick={() => handleAction("reject")}
                                            className="h-16 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-gray-600 dark:text-white font-black text-sm transition-all border border-gray-200 dark:border-white/10"
                                        >
                                            REJECT
                                        </button>
                                        <button
                                            onClick={() => handleAction("accept")}
                                            className="h-16 rounded-2xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center justify-center font-black text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                        >
                                            <CheckCircle2 size={20} className="mr-2" />
                                            ACCEPT
                                        </button>
                                    </>
                                ) : activeOrder.status === "out_for_delivery" || rider?.status === "on_delivery" ? (
                                    <>
                                        <button
                                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeOrder.deliveryAddress?.address || activeOrder.userOrderId?.deliveryAddress?.addressLine)}`)}
                                            className="h-16 rounded-2xl bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-900 dark:text-white font-black text-sm flex items-center justify-center transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                                        >
                                            <Navigation size={20} className="mr-2 text-orange-600 dark:text-orange-300" />
                                            OPEN MAPS
                                        </button>
                                        {activeOrder.orderStatus === "rider_assigned" || activeOrder.status === "assigned" ? (
                                            <button
                                                onClick={() => handleAction("pickup")}
                                                className="h-16 rounded-2xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center justify-center font-black text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                            >
                                                <Package size={20} className="mr-2" />
                                                PICKED UP
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction("deliver")}
                                                className="h-16 rounded-2xl bg-orange-600 dark:bg-orange-400 text-white dark:text-orange-900 flex items-center justify-center font-black text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                            >
                                                <CheckCircle2 size={20} className="mr-2" />
                                                DELIVERED
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="col-span-2 text-center text-gray-400 dark:text-white/60 text-xs font-bold py-4">Order status: {activeOrder.status}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-10 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${isOnline
                            ? "bg-orange-50 dark:bg-orange-600/5 border-orange-200 dark:border-orange-500/20"
                            : "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 opacity-60"
                            }`}
                    >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isOnline ? "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500" : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500"
                            }`}>
                            <Bike size={40} className={isOnline ? "animate-bounce" : ""} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                            {isOnline ? "Waiting for Orders..." : "You are Offline"}
                        </h3>
                        <p className="text-gray-500 text-sm font-medium max-w-[220px]">
                            {isOnline
                                ? "Stay active in the area for faster assignments."
                                : "Hit the power button in the header to start receiving jobs."}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offline reminder */}
            {!isOnline && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-red-500 leading-relaxed">
                        <span className="font-bold text-red-400">Notice:</span> You won't
                        receive any delivery requests while offline. Switch online whenever
                        you're ready to earn.
                    </div>
                </div>
            )}

        </div>
    );
}
