"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bike, Check, Loader2, Search, Phone, Star } from "lucide-react";
import { getAvailableRiders, assignRiderToOrder } from "@/app/lib/vendorApi";
import toast from "react-hot-toast";

export default function RiderAssignmentModal({ isOpen, onClose, orderId, vendorId, onAssigned }) {
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAvailableRiders = async () => {
        if (!vendorId) return;
        setLoading(true);
        try {
            const response = await getAvailableRiders(vendorId);
            const ridersData = response.data || response.riders || (Array.isArray(response) ? response : []);
            // console.log(ridersData);
            setRiders(ridersData);
        } catch (error) {
            console.error("Failed to fetch available riders:", error);
            // toast.error("Failed to load available riders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAvailableRiders();
        }
    }, [isOpen, vendorId]);

    const handleAssign = async (riderId) => {
        setAssigning(riderId);
        // Normalize IDs to handle potential MongoDB object formats
        const normalizedOrderId = orderId?.$oid || orderId;
        const normalizedRiderId = riderId?.$oid || riderId;

        if (!normalizedOrderId) {
            toast.error("Invalid order. Please close and try again.");
            setAssigning(null);
            return;
        }

        // console.log(normalizedRiderId, normalizedOrderId)
        try {
            await assignRiderToOrder(vendorId, normalizedOrderId, normalizedRiderId);
            toast.success("Rider assigned successfully!");
            onAssigned(normalizedRiderId);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign rider");
        } finally {
            setAssigning(null);
        }
    };

    const filteredRiders = Array.isArray(riders) ? riders.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone?.includes(searchTerm)
    ) : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const SkeletonLoader = () => (
        <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 animate-pulse border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                </div>
            ))}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ y: "100%", scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: "100%", scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] border-t sm:border border-slate-200 dark:border-slate-800"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-8 pt-6 pb-4 flex items-center justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dispatch Rider</h2>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        Live Dispatch
                                    </span>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                                        Order #{(orderId?.$oid || orderId || "").toString().slice(-6).toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all hover:scale-110 active:scale-95 border border-slate-100 dark:border-slate-700 shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search Bar - Premium Styled */}
                        <div className="px-8 py-4 shrink-0">
                            <div className="relative group">
                                <motion.div
                                    animate={{
                                        opacity: searchTerm ? 1 : 0.5,
                                        scale: searchTerm ? 1.02 : 1
                                    }}
                                    className="absolute inset-0 bg-orange-500/5 rounded-2xl -m-0.5 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Find riders by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500/50 transition-all text-sm font-medium dark:text-white placeholder:text-slate-400"
                                />
                                <AnimatePresence>
                                    {searchTerm && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500"
                                        >
                                            <X size={14} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Riders List Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 custom-scrollbar min-h-[400px]">
                            {loading ? (
                                <SkeletonLoader />
                            ) : filteredRiders.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-20 px-8"
                                >
                                    <div className="w-24 h-24 bg-orange-50 dark:bg-orange-950/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 relative">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute inset-0 bg-orange-500/10 rounded-[32px] blur-xl"
                                        />
                                        <Bike size={48} className="text-orange-500 relative z-10" />
                                    </div>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mb-2">No Riders Nearby</p>
                                    <p className="text-sm text-slate-500 font-medium max-w-[240px] mx-auto leading-relaxed">
                                        We couldn't find any available riders right now. Try expanding your search.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4 pb-12"
                                >
                                    {filteredRiders.map((rider) => {
                                        const rId = rider._id?.$oid || rider._id || rider.id;
                                        const isSelected = assigning === rId;

                                        return (
                                            <motion.div
                                                key={rId}
                                                variants={itemVariants}
                                                whileHover={{ y: -4, scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => !assigning && handleAssign(rId)}
                                                className={`
                                                    group relative p-4 rounded-3xl border transition-all cursor-pointer overflow-hidden
                                                    ${isSelected
                                                        ? 'bg-orange-500 border-orange-500 shadow-[0_20px_40px_-12px_rgba(249,115,22,0.4)]'
                                                        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-orange-500/30 shadow-sm'
                                                    }
                                                `}
                                            >
                                                {/* Background Grain/Texture Effect */}
                                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />

                                                <div className="relative z-10 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`
                                                            w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-transform group-hover:rotate-3
                                                            ${isSelected ? 'bg-white/20' : 'bg-orange-50 dark:bg-orange-500/10'}
                                                        `}>
                                                            {rider.avatar ? (
                                                                <img src={rider.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Bike size={28} className={isSelected ? 'text-white' : 'text-orange-600'} />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-lg font-black truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                                    {rider.name}
                                                                </h4>
                                                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'} animate-pulse`} />
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                                <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                                    <Phone size={12} className={isSelected ? 'text-white/60' : 'text-orange-500'} />
                                                                    {rider.phone}
                                                                </div>
                                                                <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                                    <Star size={12} className={isSelected ? 'text-white' : 'text-yellow-500 fill-yellow-500'} />
                                                                    {rider.rating ? Number(rider.rating).toFixed(1) : "5.0"}
                                                                </div>
                                                                <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                                    <Check size={12} className={isSelected ? 'text-white' : 'text-blue-500'} />
                                                                    {rider.totalDeliveries || 0} Jobs
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`
                                                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner
                                                        ${isSelected
                                                            ? 'bg-white text-orange-600'
                                                            : 'bg-slate-100 dark:bg-slate-900 dark:text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600'
                                                        }
                                                    `}>
                                                        {isSelected ? (
                                                            <Loader2 size={24} className="animate-spin" />
                                                        ) : (
                                                            <motion.div whileHover={{ scale: 1.2 }}>
                                                                <Check size={24} />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
