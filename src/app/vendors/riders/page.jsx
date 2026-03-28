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
    Activity,
    EyeOff
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
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">My Rider Fleet</h1>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Manage your delivery personnel and track their availability.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRiders}
                        disabled={loading}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-none transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-none transition-all active:scale-95"
                    >
                        <UserPlus size={16} />
                        <span className="hidden sm:inline">Add New Rider</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Total Riders</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{safeRiders.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 leading-none">Online Now</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {safeRiders.filter(r => r.status === 'available').length}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1.5 leading-none">Active Tasks</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {safeRiders.filter(r => r.currentOrderId).length}
                    </div>
                </div>
            </div>

            {/* Search and Filters placeholder */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Search riders by name or phone..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md py-3 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-orange-600 outline-none transition-all dark:text-white"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-orange-600" size={32} />
                </div>
            ) : safeRiders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center mx-auto mb-4">
                        <Bike size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">No Riders Found</h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto uppercase tracking-widest leading-relaxed">You haven't added any riders to your fleet yet. Start by adding your first delivery person.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {safeRiders.map((rider) => {
                        const style = getStatusStyles(rider.status);
                        return (
                            <motion.div
                                key={rider._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 transition-all relative group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 rounded-md bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                                            {rider.avatar ? <img src={rider.avatar} alt="" className="w-full h-full object-cover" /> : <Bike size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight truncate">{rider.name}</h3>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                                                <Phone size={10} />
                                                {rider.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === rider._id ? null : rider._id)}
                                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {activeDropdown === rider._id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 rounded-md shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden z-20 py-1"
                                                >
                                                    <a
                                                        href={`tel:${rider.phone}`}
                                                        className="flex items-center gap-3 w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <PhoneCall size={14} className="text-emerald-500" />
                                                        Call Rider
                                                    </a>
                                                    <button
                                                        className="flex items-center gap-3 w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                                        onClick={() => {
                                                            setSelectedRiderProfile(rider);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        <UserPlus size={14} />
                                                        Profile
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                    <div className={`px-2 py-1 rounded-md flex items-center gap-1.5 ${style.bg} ${style.text} text-[9px] font-black uppercase tracking-widest`}>
                                        <span className={`w-1 h-1 rounded-full ${style.dot} ${rider.status === 'available' ? 'animate-pulse' : ''}`} />
                                        {rider.status || 'Offline'}
                                    </div>

                                    {rider.currentOrderId && (
                                        <div className="text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1">
                                            <Clock size={10} />
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
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-md overflow-hidden relative shadow-none border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-5 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Add New Rider</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRider} className="p-5 space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                            <input
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                type="text"
                                                placeholder="Enter rider's name"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-md py-3 px-4 text-xs font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                                            <input
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                type="tel"
                                                placeholder="080 000 0000"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-md py-3 px-4 text-xs font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                                        <div className="relative">
                                            <input
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-md py-3 pl-4 pr-10 text-xs font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes (Optional)</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={2}
                                            placeholder="Any special notes?"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-md py-3 px-4 text-xs font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all dark:text-white resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-md py-3.5 font-black uppercase text-[10px] tracking-widest transition-all shadow-none active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={16} /> : "Complete Registration"}
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
                            className="w-full max-w-sm bg-white dark:bg-slate-950 h-full relative shadow-none border-l border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-950 z-10">
                                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Rider Profile</h2>
                                <button
                                    onClick={() => setSelectedRiderProfile(null)}
                                    className="w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {/* Profile Header */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-md bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                                        {selectedRiderProfile.avatar ? <img src={selectedRiderProfile.avatar} alt="" className="w-full h-full object-cover" /> : <Bike size={24} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{selectedRiderProfile.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${getStatusStyles(selectedRiderProfile.status).bg} ${getStatusStyles(selectedRiderProfile.status).text}`}>
                                                {selectedRiderProfile.status || 'Offline'}
                                            </div>
                                            {selectedRiderProfile.currentOrderId && (
                                                <div className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-orange-100">
                                                    <Clock size={10} /> On Task
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1.5 leading-none">
                                            <Activity size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Deliveries</span>
                                        </div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            {selectedRiderProfile.totalDeliveries || 0}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-yellow-500 mb-1.5 leading-none">
                                            <Star size={12} className="fill-current" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rating</span>
                                        </div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            {selectedRiderProfile.rating ? selectedRiderProfile.rating.toFixed(1) : 'New'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1.5 leading-none">
                                            <CreditCard size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Total Earnings</span>
                                        </div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            ₦{(selectedRiderProfile.totalEarnings || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Notes */}
                                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 leading-none">Phone Number</label>
                                        <div className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-100 dark:border-slate-800">
                                            {selectedRiderProfile.phone}
                                            <a href={`tel:${selectedRiderProfile.phone}`} className="p-1.5 bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-800 text-emerald-500 hover:scale-105 transition-transform">
                                                <PhoneCall size={14} />
                                            </a>
                                        </div>
                                    </div>
                                    
                                    {selectedRiderProfile.notes && (
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 leading-none">Notes</label>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-100 dark:border-slate-800 leading-relaxed">
                                                {selectedRiderProfile.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-5 border-t border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-950 space-y-2 shrink-0">
                                <button
                                    onClick={handleDeactivateRider}
                                    disabled={isDeactivating}
                                    className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 py-3.5 rounded-md font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isDeactivating ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
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
