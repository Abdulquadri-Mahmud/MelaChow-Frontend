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

            console.log(data);
            
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

    console.log(activeOrder);
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
                    <h1 className="text-3xl font-black text-white">
                        Hey, {rider?.name?.split(" ")[0] || "Rider"} 👋
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        {isOnline ? "You're online. Ready for deliveries!" : "Switch online to start earning."}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                    <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Link
                    href="/rider/wallet"
                    className="bg-[#1A1D23] border border-white/5 rounded-3xl md:p-5 p-3 shadow-lg cursor-pointer hover:border-orange-500/30 transition-all group block"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <Wallet size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Earnings</span>
                    </div>
                    <div className="text-2xl font-black text-white flex items-center justify-between">
                        ₦{Number(rider?.totalEarnings ?? 0).toLocaleString()}
                        <ArrowUpRight size={16} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">lifetime total</div>
                </Link>

                <div className="bg-[#1A1D23] border border-white/5 rounded-3xl md:p-5 p-3 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                            <Star size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                        {rider?.rating ? Number(rider.rating).toFixed(1) : "New"}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">
                        {rider?.ratingCount ? `${rider.ratingCount} reviews` : "No reviews yet"}
                    </div>
                </div>

                <div className="bg-[#1A1D23] border border-white/5 rounded-3xl md:p-5 p-3 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Activity size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deliveries</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                        {rider?.totalDeliveries ?? 0}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">lifetime</div>
                </div>

                <div className="bg-[#1A1D23] border border-white/5 rounded-3xl md:p-5 p-3 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isOnline ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                            <Bike size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                    </div>
                    <div className={`text-xl font-black ${isOnline ? "text-green-400" : "text-red-400"}`}>
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-orange-600 rounded-[32px] p-6 shadow-2xl shadow-orange-600/20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[60px] flex items-center justify-center">
                            <Bike size={48} className="text-white/20" />
                        </div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-6">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                Active Delivery
                            </div>

                            <h2 className="text-3xl font-black text-white mb-2 leading-tight">
                                {activeOrder.status === "assigned" ? "Pickup from Restaurant" : "Deliver to Customer"}
                            </h2>
                            <p className="text-white/80 text-sm font-medium mb-8">
                                Order #{String(activeOrder._id || "").slice(-6).toUpperCase()} • {activeOrder.items?.length ?? 0} items
                            </p>

                            <div className="space-y-6 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                        <MapPin size={20} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">
                                            Pickup Location
                                        </div>
                                        <div className="text-white font-bold truncate">
                                            {activeOrder.restaurantName || activeOrder.restaurantId?.name || "GrubDash Kitchen"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                        <Navigation size={20} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">
                                            Drop-off Location
                                        </div>
                                        <div className="text-white font-bold truncate">
                                            {activeOrder.deliveryAddress?.address ||
                                                activeOrder.userOrderId?.deliveryAddress?.addressLine ||
                                                "Customer Address"}
                                        </div>
                                    </div>
                                </div>

                                {(activeOrder.userPhone || activeOrder.userOrderId?.phone) && (

                                    <a href={`tel:${activeOrder.userPhone || activeOrder.userOrderId?.phone}`}
                                        className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 hover:bg-white/20 transition-colors">
                                        <Phone size={18} className="text-white" />
                                        <span className="text-white font-bold text-sm">Call Customer</span>
                                    </a>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="bg-white/10 hover:bg-white/20 h-14 rounded-2xl flex items-center justify-center text-white transition-all font-bold">
                                    <Navigation size={20} className="mr-2" />
                                    Maps
                                </button>
                                {activeOrder.status === "assigned" ? (
                                    <button
                                        onClick={() => handleAction("pickup")}
                                        className="bg-white text-orange-600 h-14 rounded-2xl flex items-center justify-center font-black shadow-xl transition-all active:scale-95"
                                    >
                                        <Package size={20} className="mr-2" />
                                        Picked Up
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAction("deliver")}
                                        className="bg-green-500 text-white h-14 rounded-2xl flex items-center justify-center font-black shadow-xl transition-all active:scale-95"
                                    >
                                        <CheckCircle2 size={20} className="mr-2" />
                                        Delivered
                                    </button>
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
                            ? "bg-orange-600/5 border-orange-500/20"
                            : "bg-red-500/5 border-red-500/20 opacity-60"
                            }`}
                    >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isOnline ? "bg-orange-500/10 text-orange-500" : "bg-red-500/10 text-red-500"
                            }`}>
                            <Bike size={40} className={isOnline ? "animate-bounce" : ""} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">
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
                    <div className="text-sm text-red-100/80 leading-relaxed">
                        <span className="font-bold text-red-400">Notice:</span> You won't
                        receive any delivery requests while offline. Switch online whenever
                        you're ready to earn.
                    </div>
                </div>
            )}

        </div>
    );
}