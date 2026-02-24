"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Bike,
    MoreVertical,
    Search,
    Phone,
    MapPin,
    UserPlus,
    Clock,
    X,
    Loader2,
    Eye,
    RefreshCw,
    PhoneCall,
    Trash2,
    Edit3,
    CreditCard,
    Star,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getVendorRiders, createVendorRider, updateVendorRider, deactivateVendorRider } from "@/app/lib/vendorApi";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { useSocket } from "@/app/context/SocketContext";
import toast from "react-hot-toast";

export default function RiderManagementPage() {
    const { vendorDetails } = useVendorStorage();
    const vendorId = vendorDetails?.vendor?._id || vendorDetails?.vendor?.id;

    const { socket } = useSocket();

    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedRiderProfile, setSelectedRiderProfile] = useState(null);
    const [isEditingRider, setIsEditingRider] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        password: "",
        notes: "",
        avatar: ""
    });

    const fetchRiders = async () => {
        if (!vendorId) return;
        try {
            const data = await getVendorRiders(vendorId);
            console.log("Riders response:", data);
            const ridersArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.riders) ? data.riders : (Array.isArray(data) ? data : []));
            setRiders(ridersArray);
        } catch (error) {
            console.error("Failed to fetch riders:", error);
            // toast.error("Failed to load riders list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiders();
    }, [vendorId]);

    useEffect(() => {
        if (!socket) return;
        const handleStatusChange = (data) => {
            if (data?.riderId && data?.status) {
                setRiders((prev) =>
                    prev.map(r => r._id === data.riderId ? { ...r, status: data.status, currentOrderId: data.currentOrderId || r.currentOrderId } : r)
                );
            }
        };

        socket.on('rider_status_changed', handleStatusChange);
        socket.on('rider_assigned', handleStatusChange);

        return () => {
            socket.off('rider_status_changed', handleStatusChange);
            socket.off('rider_assigned', handleStatusChange);
        };
    }, [socket]);

    // Fast-Refresh Safe Guard: Ensure riders is ALWAYS an array during render, 
    // even if a faulty state object was preserved by previously broken hot-reloads.
    const safeRiders = Array.isArray(riders) ? riders : [];

    const handleCreateRider = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createVendorRider(vendorId, formData);
            toast.success("Rider created successfully!");
            setIsModalOpen(false);
            setFormData({ name: "", phone: "", password: "", notes: "", avatar: "" });
            fetchRiders();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create rider");
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateRider = async (e) => {
        e.preventDefault();
        setIsEditingRider(true);
        try {
            await updateVendorRider(vendorId, selectedRiderProfile._id, formData);
            toast.success("Rider profile updated!");
            setSelectedRiderProfile(null);
            fetchRiders();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update rider");
        } finally {
            setIsEditingRider(false);
        }
    };

    const handleDeactivateRider = async () => {
        if (!confirm("Are you sure you want to deactivate this rider?")) return;
        setIsDeactivating(true);
        try {
            await deactivateVendorRider(vendorId, selectedRiderProfile._id);
            toast.success("Rider deactivated successfully!");
            setSelectedRiderProfile(null);
            fetchRiders();
        } catch (error) {
            toast.error(error.response?.data?.message || "Cannot deactivate a rider while they are on an active delivery.");
        } finally {
            setIsDeactivating(false);
        }
    };


    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return { bg: 'bg-green-100 dark:bg-green-500/10', text: 'text-green-600', dot: 'bg-green-500' };
            case 'on delivery':
            case 'busy':
                return { bg: 'bg-orange-100 dark:bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' };
            default:
                return { bg: 'bg-gray-100 dark:bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' };
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">My Rider Fleet</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your delivery personnel and track their availability.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRiders}
                        disabled={loading}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all active:scale-95"
                    >
                        <UserPlus size={20} />
                        <span className="hidden sm:inline">Add New Rider</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Riders</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{safeRiders.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <div className="text-green-500 text-sm font-bold uppercase tracking-wider mb-2">Online Now</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">
                        {safeRiders.filter(r => r.status === 'available').length}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <div className="text-orange-500 text-sm font-bold uppercase tracking-wider mb-2">Active Deliveries</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">
                        {safeRiders.filter(r => r.currentOrderId).length}
                    </div>
                </div>
            </div>

            {/* Search and Filters placeholder */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search riders by name or phone..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                />
            </div>

            {/* Riders List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-orange-500" size={40} />
                </div>
            ) : safeRiders.length === 0 ? (
                <div className="text-center py-20 bg-slate-100 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bike size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Riders Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8">You haven't added any riders to your fleet yet. Start by adding your first delivery person.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {safeRiders.map((rider) => {
                        const style = getStatusStyles(rider.status);
                        return (
                            <motion.div
                                key={rider._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all relative group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                                            {rider.avatar ? <img src={rider.avatar} alt="" className="w-full h-full object-cover" /> : <Bike size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{rider.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <Phone size={12} />
                                                {rider.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === rider._id ? null : rider._id)}
                                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {activeDropdown === rider._id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden z-20 py-1"
                                                >
                                                    <a
                                                        href={`tel:${rider.phone}`}
                                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                                    >
                                                        <PhoneCall size={16} className="text-green-500" />
                                                        Call Rider
                                                    </a>
                                                    <button
                                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                                                        onClick={() => {
                                                            setSelectedRiderProfile(rider);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        <UserPlus size={16} />
                                                        View Profile
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${style.bg} ${style.text} text-[10px] font-black uppercase tracking-wider`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${rider.status === 'available' ? 'animate-pulse' : ''}`} />
                                        {rider.status || 'Offline'}
                                    </div>

                                    {rider.currentOrderId && (
                                        <div className="text-[10px] font-bold text-orange-500 flex items-center gap-1">
                                            <Clock size={12} />
                                            ON TASK
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Add Rider Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-2xl font-black dark:text-white">Add New Rider</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRider} className="p-8 space-y-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 ml-1">Full Name</label>
                                            <input
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                type="text"
                                                placeholder="Enter rider's name"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 outline-none ring-2 ring-transparent focus:ring-orange-500 transition-all dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 ml-1">Phone Number</label>
                                            <input
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                type="tel"
                                                placeholder="080 000 0000"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 outline-none ring-2 ring-transparent focus:ring-orange-500 transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-sm font-bold text-slate-500 ml-1">Initial Password</label>
                                        <div className="relative">
                                            <input
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-6 pr-12 outline-none ring-2 ring-transparent focus:ring-orange-500 transition-all dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 ml-1">Notes (Optional)</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={2}
                                            placeholder="Any special notes?"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 outline-none ring-2 ring-transparent focus:ring-orange-500 transition-all dark:text-white resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-5 font-black transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={20} /> : "Complete Registration"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rider Profile Side Drawer */}
            <AnimatePresence>
                {selectedRiderProfile && (
                    <div className="fixed inset-0 z-[110] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRiderProfile(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 h-full relative shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                                <h2 className="text-2xl font-black dark:text-white">Rider Profile</h2>
                                <button
                                    onClick={() => setSelectedRiderProfile(null)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Profile Header */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                                        {selectedRiderProfile.avatar ? <img src={selectedRiderProfile.avatar} alt="" className="w-full h-full object-cover" /> : <Bike size={32} />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedRiderProfile.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusStyles(selectedRiderProfile.status).bg} ${getStatusStyles(selectedRiderProfile.status).text}`}>
                                                {selectedRiderProfile.status || 'Offline'}
                                            </div>
                                            {selectedRiderProfile.currentOrderId && (
                                                <div className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <Clock size={12} /> On Task
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                            <Activity size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Deliveries</span>
                                        </div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white">
                                            {selectedRiderProfile.totalDeliveries || 0}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                                            <Star size={16} className="fill-current" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rating</span>
                                        </div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white">
                                            {selectedRiderProfile.rating ? selectedRiderProfile.rating.toFixed(1) : 'New'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                            <CreditCard size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Total Earnings</span>
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                            ₦{(selectedRiderProfile.totalEarnings || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Notes */}
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Phone Number</label>
                                        <div className="text-slate-900 dark:text-white font-medium flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                            {selectedRiderProfile.phone}
                                            <a href={`tel:${selectedRiderProfile.phone}`} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-green-500 hover:scale-105 transition-transform">
                                                <PhoneCall size={16} />
                                            </a>
                                        </div>
                                    </div>
                                    
                                    {selectedRiderProfile.notes && (
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Notes</label>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl leading-relaxed">
                                                {selectedRiderProfile.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
                                {/* Normally Edit would toggle an inline form, leaving it simple for UI showcase */}
                                {/* Deactivate Button */}
                                <button
                                    onClick={handleDeactivateRider}
                                    disabled={isDeactivating}
                                    className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isDeactivating ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                    Deactivate Rider
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
